/* SCR-02 · Tạo báo cáo nguy cơ (luồng SV1 – Lê Thị Mai Ngọc)
   Điểm nhấn: bộ luật Hazard Classifier chạy realtime khi gõ + ảnh minh chứng
   + kiểm tra dữ liệu + phát hiện báo cáo trùng lặp + bản nháp tự lưu. */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;
  var AI = window.SiteSafeAI;

  var DRAFT_KEY = 'worker-hazard-create';
  var PREFILL_KEY = 'hazard-prefill';
  var MAX_PHOTOS = 4;

  var state = {
    evidence: [],
    ai: null,
    aiApplied: false,
    aiDismissed: false,
    category: null,
    forceDuplicate: false,
    submitted: null
  };

  var el = {};
  function $(id) { return document.getElementById(id); }

  function cache() {
    el.form = $('hazardForm');
    el.title = $('hzTitle');
    el.desc = $('hzDesc');
    el.zone = $('hzZone');
    el.work = $('hzWork');
    el.levels = $('levelPills');
    el.drop = $('drop');
    el.file = $('fileInput');
    el.thumbs = $('thumbs');
    el.evErr = $('evidenceError');
    el.aiBody = $('aiBody');
    el.summary = $('summaryBox');
    el.result = $('resultBox');
    el.stop = $('hzStop');
    el.notified = $('hzNotified');
  }

  /* ---------- khởi tạo các ô chọn ---------- */
  function fillSelects() {
    var zones = store.list('zones').filter(function (z) { return z.active; });
    el.zone.innerHTML = '<option value="">— Chọn khu vực —</option>' + zones.map(function (z) {
      var r = store.zoneRisk(z.id);
      return '<option value="' + z.id + '">' + A.esc(z.name) + ' (rủi ro ' + r.score + ')</option>';
    }).join('');

    var works = [];
    store.list('templates').filter(function (t) { return t.active; }).forEach(function (t) {
      if (works.indexOf(t.workType) === -1) works.push(t.workType);
    });
    ['Thi công thân', 'Xưởng', 'Giao thông nội bộ', 'Kiểm tra chung'].forEach(function (w) {
      if (works.indexOf(w) === -1) works.push(w);
    });
    el.work.innerHTML = works.map(function (w) { return '<option value="' + A.esc(w) + '">' + A.esc(w) + '</option>'; }).join('');

    el.levels.innerHTML = store.read().statuses.level.map(function (lv, i) {
      return '<div class="form-check"><input class="form-check-input" type="radio" name="level" id="lv' + i + '" value="' + lv + '">' +
        '<label class="form-check-label ss-badge ss-lv-' + A.cls(lv) + '" for="lv' + i + '" style="cursor:pointer">' + lv + '</label></div>';
    }).join('');
  }

  function fillReporter() {
    var u = store.sessionUser();
    if (!u) return;
    $('repAvatar').textContent = A.initials(u.name);
    $('repName').textContent = u.name;
    $('repUnit').textContent = u.unit || A.ROLE_LABEL[u.role];
    $('nextCode').textContent = store.nextHazardCode();
  }

  /* ---------- phân vùng lỗi biểu mẫu ---------- */
  function setFieldError(name, msg) {
    var input = el.form.querySelector('[name="' + name + '"]');
    var box = el.form.querySelector('[data-err="' + name + '"]');
    if (input) {
      input.classList.toggle('is-invalid', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    if (box) {
      box.textContent = msg || '';
      box.classList.toggle('d-none', !msg);
    }
  }

  function validate(opts) {
    opts = opts || {};
    var errors = [];
    var title = el.title.value.trim();
    var desc = el.desc.value.trim();
    var zone = el.zone.value;
    var level = checkedLevel();

    if (title.length < 6) errors.push(['title', 'Tiêu đề cần tối thiểu 6 ký tự, nêu rõ đối tượng và vị trí.']);
    else if (title.length > 90) errors.push(['title', 'Tiêu đề tối đa 90 ký tự.']);
    else setFieldError('title', '');

    if (desc.length < 25) errors.push(['description', 'Mô tả cần tối thiểu 25 ký tự để cán bộ an toàn hiểu bối cảnh.']);
    else setFieldError('description', '');

    if (!zone) errors.push(['zoneId', 'Hãy chọn khu vực xảy ra nguy cơ.']);
    else setFieldError('zoneId', '');

    if (!level) {
      errors.push(['level', 'Chọn mức độ bạn nhận định (có thể khác đề xuất).']);      el.levels.parentElement.querySelector('[data-err="level"]').classList.remove('d-none');
    } else {
      el.levels.parentElement.querySelector('[data-err="level"]').classList.add('d-none');
    }

    if (!opts.silent) {
      errors.forEach(function (e) { setFieldError(e[0], e[1]); });
    }
    return errors;
  }

  function checkedLevel() {
    var r = el.form.querySelector('input[name="level"]:checked');
    return r ? r.value : null;
  }
  function setLevel(lv) {
    var r = el.form.querySelector('input[name="level"][value="' + lv + '"]');
    if (r) { r.checked = true; el.levels.parentElement.querySelector('[data-err="level"]').classList.add('d-none'); }
  }

  /* ---------- AI-01: Hazard Classifier chạy realtime ---------- */
  function aiInput() {
    return { title: el.title.value, description: el.desc.value, zoneId: el.zone.value, workType: el.work.value };
  }

  function renderAiIdle() {
    state.ai = null;
    el.aiBody.innerHTML = '<div class="ss-ai-reason"><i class="bi bi-hourglass-split me-1"></i>Hãy nhập thêm ' +
      (25 - el.desc.value.trim().length > 0 ? (25 - el.desc.value.trim().length) + ' ký tự nữa' : 'tiêu đề và mô tả') +
      ' để bộ luật có đủ dữ liệu phân loại.</div>';
  }

  function renderAiLoading() {
    el.aiBody.innerHTML = '<div class="ss-loading"><span class="spinner-border spinner-border-sm text-primary"></span>' +
      'Đang đối chiếu từ khóa với ' + AI.CAT_RULES.length + ' nhóm nguy cơ…</div>';
  }

  function renderAi() {
    var r = state.ai;
    if (!r) return;
    var conf = Math.round(r.confidence * 100);
    var alts = r.alternatives.map(function (a) {
      return '<button type="button" class="btn btn-ghost btn-sm" data-alt="' + A.esc(a.category) + '">' +
        A.esc(a.category) + ' <span class="text-muted-soft">(' + Math.round(a.confidence * 100) + '%)</span></button>';
    }).join('');

    el.aiBody.innerHTML =
      '<div class="d-flex flex-wrap gap-2 align-items-center mb-2">' +
      '<span class="ss-badge" style="background:#f2edfb;color:#5a3fa0;border:1px solid #d3caf6"><i class="bi bi-tag-fill me-1"></i>' + A.esc(r.category) + '</span>' +
      A.levelBadge(r.level) + A.priBadge(r.priority) +
      (r.needHumanReview ? '<span class="ss-badge ss-overdue"><i class="bi bi-exclamation-triangle me-1"></i>Cần người xem xét</span>' : '') +
      '</div>' +
      '<div class="ss-ai-conf mb-2"><span class="small text-muted-soft">Độ tin cậy</span>' +
      '<div class="ss-ai-bar"><span style="width:' + conf + '%"></span></div><strong class="small">' + conf + '%</strong></div>' +
      '<ul class="ss-ai-reason ps-3 mb-3">' + r.reasons.map(function (x) { return '<li>' + A.esc(x) + '</li>'; }).join('') + '</ul>' +
      (alts ? '<div class="mb-3"><div class="ss-section-title mb-1">Nhóm thứ yếu</div><div class="d-flex flex-wrap gap-2">' + alts + '</div></div>' : '') +
      '<div class="mb-3"><div class="ss-section-title mb-1">Biện pháp gợi ý</div><ul class="small mb-0 ps-3">' +
      r.suggestedActions.map(function (x) { return '<li>' + A.esc(x) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="ss-ai-actions">' +
      '<button type="button" class="btn btn-primary btn-sm" data-ai-apply><i class="bi bi-check2 me-1"></i>Áp dụng đề xuất</button>' +
      '<button type="button" class="btn btn-soft btn-sm" data-ai-edit><i class="bi bi-pencil me-1"></i>Sửa nhóm nguy cơ</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-ai-skip><i class="bi bi-x-lg me-1"></i>Không dùng</button>' +
      '</div>' +
      '<div class="ss-ai-note mt-2"><i class="bi bi-cpu me-1"></i>' + A.esc(r.engine) + '. ' + A.esc(AI.DISCLAIMER) + '</div>' +
      (state.aiApplied ? '<div class="alert alert-success py-2 px-3 small mt-2 mb-0"><i class="bi bi-check-circle me-1"></i>Đã áp dụng: nhóm “' + A.esc(state.category) + '”, mức ' + A.esc(r.level) + '.</div>' : '') +
      (state.aiDismissed ? '<div class="alert alert-warning py-2 px-3 small mt-2 mb-0"><i class="bi bi-eye-slash me-1"></i>Bạn đã bỏ qua đề xuất. Báo cáo sẽ được cán bộ an toàn tự phân loại.</div>' : '');
    goStep(state.aiApplied || state.category ? 2 : 1);
  }

  function analyze() {
    var text = (el.title.value + ' ' + el.desc.value).trim();
    if (text.length < 20) { renderAiIdle(); return; }
    renderAiLoading();
    clearTimeout(analyze.t);
    analyze.t = setTimeout(function () {
      state.ai = AI.classify(aiInput());
      if (!state.category || !state.aiApplied) state.category = state.ai.category;
      state.aiDismissed = false;
      renderAi();
      renderSummary();
      saveDraft(true);
    }, 420);
  }

  function wireAiPanel() {
    el.aiBody.addEventListener('click', function (e) {
      if (!state.ai) return;
      var alt = e.target.closest('[data-alt]');
      if (alt) {
        state.category = alt.getAttribute('data-alt');
        state.aiApplied = false;
        el.aiBody.querySelectorAll('[data-alt]').forEach(function (b) { b.classList.remove('btn-primary'); });
        alt.classList.add('btn-soft');
        renderSummary();
        A.toast('Đã chọn nhóm nguy cơ “' + state.category + '” làm suy đoán của bạn.', 'info', 'Phân loại');
        return;
      }
      if (e.target.closest('[data-ai-apply]')) {
        state.category = state.category || state.ai.category;
        setLevel(state.ai.level);
        state.aiApplied = true;
        state.aiDismissed = false;
        renderAi();
        renderSummary();
        goStep(2);
        A.toast('Đã áp dụng đề xuất vào biểu mẫu. Bạn vẫn có thể sửa.', 'success', 'Đã áp dụng');
        return;
      }
      if (e.target.closest('[data-ai-edit]')) {
        var cats = store.read().statuses.categories;
        el.aiBody.querySelector('.ss-ai-actions').innerHTML =
          '<select class="form-select form-select-sm" id="aiCatPick" aria-label="Chọn nhóm nguy cơ thủ công">' +
          cats.map(function (c) { return '<option' + (c === state.category ? ' selected' : '') + '>' + A.esc(c) + '</option>'; }).join('') + '</select>' +
          '<button type="button" class="btn btn-primary btn-sm" data-ai-edit-save>Lưu lựa chọn</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-ai-edit-cancel>Hủy</button>';
        return;
      }
      if (e.target.closest('[data-ai-edit-save]')) {
        state.category = $('aiCatPick').value;
        state.aiApplied = false;
        renderAi();
        renderSummary();
        A.toast('Đã ghi nhận nhóm nguy cơ bạn tự chọn.', 'success');
        return;
      }
      if (e.target.closest('[data-ai-edit-cancel]')) { renderAi(); return; }
      if (e.target.closest('[data-ai-skip]')) {
        state.aiDismissed = true;
        state.aiApplied = false;
        renderAi();
        A.toast('Đã bỏ qua đề xuất.', 'warn', 'Không dùng AI');
      }
    });
  }

  /* ---------- ảnh minh chứng ---------- */
  function wireEvidence() {
    el.drop.addEventListener('click', function () { el.file.click(); });
    el.drop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.file.click(); }
    });
    ['dragenter', 'dragover'].forEach(function (t) {
      el.drop.addEventListener(t, function (e) { e.preventDefault(); el.drop.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (t) {
      el.drop.addEventListener(t, function (e) { e.preventDefault(); el.drop.classList.remove('is-over'); });
    });
    el.drop.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });
    el.file.addEventListener('change', function () { addFiles(el.file.files); el.file.value = ''; });

    el.thumbs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-remove]');
      if (!b) return;
      state.evidence.splice(+b.getAttribute('data-remove'), 1);
      renderThumbs();
      saveDraft(true);
    });
  }

  function evError(msg) {
    el.evErr.textContent = msg || '';
    el.evErr.classList.toggle('d-none', !msg);
  }

  function addFiles(files) {
    var arr = Array.prototype.slice.call(files || []);
    if (!arr.length) return;
    if (state.evidence.length + arr.length > MAX_PHOTOS) {
      evError('Chỉ đính kèm tối đa ' + MAX_PHOTOS + ' ảnh cho một báo cáo.');
      arr = arr.slice(0, Math.max(0, MAX_PHOTOS - state.evidence.length));
    } else evError('');

    var pending = arr.length;
    if (!pending) return;
    arr.forEach(function (f, i) {
      if (!/^image\//.test(f.type)) {
        evError('Tệp “' + f.name + '” không phải ảnh. Hãy chọn tệp định dạng .jpg hoặc .png.');
        if (!--pending) renderThumbs();
        return;
      }
      A.shrinkImage(f, 900, function (err, dataUrl) {
        if (err) { evError('Không đọc được ảnh “' + f.name + '”.'); }
        else {
          state.evidence.push({ name: f.name.replace(/\.[^.]+$/, '') + '.jpg', dataUrl: dataUrl, at: new Date().toISOString(), size: Math.round(dataUrl.length / 1024) + ' KB' });
        }
        if (!--pending) { renderThumbs(); saveDraft(true); renderSummary(); }
      });
    });
  }

  function renderThumbs() {
    if (!state.evidence.length) {
      el.thumbs.innerHTML = '<div class="col-12"><div class="small text-muted-soft"><i class="bi bi-camera-reels me-1"></i>Chưa có ảnh minh chứng nào được đính kèm.</div></div>';
      return;
    }
    el.thumbs.innerHTML = state.evidence.map(function (img, i) {
      return '<div class="col-6 col-md-4 col-xl-3"><figure class="ss-thumb mb-0">' +
        '<img src="' + img.dataUrl + '" alt="Ảnh minh chứng ' + (i + 1) + ': ' + A.esc(img.name) + '">' +
        '<button type="button" class="btn-remove" data-remove="' + i + '" aria-label="Bỏ ảnh ' + (i + 1) + '"><i class="bi bi-x-lg"></i></button>' +
        '<figcaption>' + A.esc(img.name) + ' · ' + A.esc(img.size) + '</figcaption></figure></div>';
    }).join('');
  }

  /* ---------- tóm tắt + bước ---------- */
  function renderSummary() {
    var lv = checkedLevel();
    var bits = [];
    if (el.zone.value) bits.push('<span class="ss-badge" style="background:var(--ss-teal-50);color:var(--ss-teal-800);border:1px solid var(--ss-teal-100)"><i class="bi bi-geo-alt me-1"></i>' + A.esc(store.zoneName(el.zone.value)) + '</span>');
    if (state.category) bits.push('<span class="ss-badge" style="background:#f2edfb;color:#5a3fa0;border:1px solid #d3caf6">' + A.esc(state.category) + '</span>');
    if (lv) bits.push(A.levelBadge(lv));
    if (state.evidence.length) bits.push('<span class="ss-badge" style="background:#eef4ff;color:#2b5da8;border:1px solid #cddffb"><i class="bi bi-image me-1"></i>' + state.evidence.length + ' ảnh</span>');
    el.summary.innerHTML = '<div class="ss-section-title mb-2">Tóm tắt nội dung sẽ gửi</div>' +
      (bits.length ? '<div class="d-flex flex-wrap gap-1">' + bits.join('') + '</div>' : '<div class="small text-muted-soft">Chưa có lựa chọn nào.</div>') +
      (el.stop.checked ? '<div class="small text-danger mt-2"><i class="bi bi-exclamation-octagon me-1"></i>Có đề xuất dừng việc tại khu vực này.</div>' : '');
  }

  function goStep(n) {
    document.querySelectorAll('[data-step]').forEach(function (s) {
      var i = +s.getAttribute('data-step');
      s.classList.toggle('is-current', i === n);
      s.classList.toggle('is-done', i < n);
    });
  }

  /* ---------- bản nháp tự lưu ---------- */
  function draftData() {
    return {
      title: el.title.value, description: el.desc.value, zoneId: el.zone.value, workType: el.work.value,
      level: checkedLevel(), stop: el.stop.checked, notified: el.notified.checked,
      category: state.category, evidence: state.evidence, savedAt: new Date().toISOString()
    };
  }
  function saveDraft(silent) {
    var d = draftData();
    if (!d.title && !d.description && !d.evidence.length) { store.clearDraft(DRAFT_KEY); $('draftBar').innerHTML = ''; return; }
    store.saveDraft(DRAFT_KEY, d);
    if (!silent) A.toast('Đã lưu bản nháp trong trình duyệt.', 'success', 'Bản nháp');
    renderDraftBar(d);
  }
  function renderDraftBar(d) {
    $('draftBar').innerHTML = '<div class="alert alert-sm d-flex flex-wrap gap-2 align-items-center py-2 mb-3" ' +
      'style="background:#fdf6e3;border:1px solid #f2dda3"><i class="bi bi-journal-text text-warning"></i>' +
      '<span class="small flex-grow-1">Có bản nháp lưu lúc <strong>' + A.datetime(d.savedAt) + '</strong>.</span>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-draft-restore>Khôi phục</button>' +
      '<button type="button" class="btn btn-ghost btn-sm text-danger" data-draft-drop>Bỏ bản nháp</button></div>';
  }
  function restoreDraft(d) {
    el.title.value = d.title || '';
    el.desc.value = d.description || '';
    el.zone.value = d.zoneId || '';
    el.work.value = d.workType || el.work.value;
    if (d.level) setLevel(d.level);
    el.stop.checked = !!d.stop;
    el.notified.checked = !!d.notified;
    state.evidence = d.evidence || [];
    state.category = d.category || null;
    renderThumbs(); renderSummary(); countChars(); analyze();
    $('draftBar').innerHTML = '';
  }

  /* ---------- trùng lặp ---------- */
  function tokens(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2; });
  }
  function findDuplicates() {
    var mine = tokens(el.title.value + ' ' + el.desc.value);
    var set = {};
    mine.forEach(function (w) { set[w] = 1; });
    return store.list('hazards').filter(function (h) {
      if (!store.isOpenHazard(h) || h.zoneId !== el.zone.value) return false;
      var other = tokens(h.title + ' ' + h.description);
      var shared = other.filter(function (w) { return set[w]; }).length;
      h._sim = shared / Math.max(6, Math.min(mine.length, other.length));
      return h._sim > 0.28;
    }).sort(function (a, b) { return b._sim - a._sim; }).slice(0, 3);
  }

  /* ---------- gửi báo cáo ---------- */
  function nextId() {
    var max = 0;
    store.list('hazards').forEach(function (h) {
      var m = /HZ-(\d+)/.exec(h.id);
      if (m) max = Math.max(max, +m[1]);
    });
    return 'HZ-' + ('00' + (max + 1)).slice(-3);
  }

  function submit(e) {
    e.preventDefault();
    var errors = validate();
    if (errors.length) {
      var first = el.form.querySelector('.is-invalid, input[name="level"]');
      if (first) first.focus();
      A.toast(errors[0][1], 'error', 'Biểu mẫu chưa hợp lệ');
      goStep(1);
      return;
    }

    var dups = state.forceDuplicate ? [] : findDuplicates();
    if (dups.length) {
      state.forceDuplicate = true;
      A.confirm({
        title: 'Có thể bạn đang báo trùng?',
        body: 'Đã tìm thấy ' + dups.length + ' báo cáo còn đang mở ở cùng khu vực có nội dung gần giống.',
        detail: dups.map(function (h) { return h.code + ' – ' + h.title; }).join(' · '),
        okText: 'Vẫn gửi báo cáo này'
      }, function () { submit(new Event('fake-submit-force')); });
      return;
    }

    var me = store.session();
    var now = new Date().toISOString();
    var level = checkedLevel();
    var rec = {
      id: nextId(), code: store.nextHazardCode(),
      title: el.title.value.trim(), description: el.desc.value.trim(),
      zoneId: el.zone.value, workType: el.work.value,
      category: state.category || (state.ai ? state.ai.category : 'Chưa xác định'),
      level: level,
      priority: state.ai && state.aiApplied ? state.ai.priority : (level === 'Nghiêm trọng' ? 'Khẩn cấp' : level === 'Cao' ? 'Cao' : level === 'Trung bình' ? 'Vừa' : 'Thấp'),
      status: 'Chờ xem xét', reporterId: me.userId, reviewerId: null,
      createdAt: now, updatedAt: now,
      evidence: state.evidence,
      aiSuggestion: state.ai ? {
        category: state.ai.category, level: state.ai.level, priority: state.ai.priority,
        confidence: state.ai.confidence, applied: state.aiApplied, dismissed: state.aiDismissed,
        engine: state.ai.engine
      } : null,
      stopWork: el.stop.checked,
      history: [
        { at: now, actor: me.name, action: 'Tạo báo cáo', note: 'Gửi từ màn hình hiện trường' + (state.evidence.length ? ' · kèm ' + state.evidence.length + ' ảnh' : '') },
        { at: now, actor: 'Hệ thống', action: 'Chuyển Chờ xem xét', note: el.stop.checked ? 'Có đề xuất dừng việc tại khu vực' : 'Chờ cán bộ an toàn xem xét' }
      ]
    };
    store.insert('hazards', rec);
    store.insert('notifications', {
      id: 'N-' + Date.now(), at: now, role: 'safety', kind: rec.level === 'Nghiêm trọng' ? 'cảnh báo' : 'thông tin',
      text: rec.code + ' · ' + rec.title + ' (' + store.zoneName(rec.zoneId) + ') đang chờ xem xét'
    });
    store.clearDraft(DRAFT_KEY);
    state.submitted = rec;
    renderResult(rec);
    A.toast('Đã gửi báo cáo ' + rec.code + ' tới cán bộ an toàn.', 'success', 'Thành công');
    goStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderResult(rec) {
    el.result.innerHTML =
      '<div class="card" style="border-color:var(--ss-teal-300)"><div class="card-body">' +
      '<div class="d-flex flex-wrap gap-2 align-items-start">' +
      '<span class="ss-kpi-icon" style="background:#e7f7ee;color:#1d7a4c"><i class="bi bi-check2-circle"></i></span>' +
      '<div class="flex-grow-1"><h2 class="h5 mb-1">Đã ghi nhận báo cáo ' + A.esc(rec.code) + '</h2>' +
      '<p class="small text-muted-soft mb-2">' + A.esc(rec.title) + ' · ' + A.esc(store.zoneName(rec.zoneId)) + '</p>' +
      '<div class="d-flex flex-wrap gap-1">' + A.levelBadge(rec.level) + A.statusBadge(rec.status) + A.priBadge(rec.priority) +
      (rec.evidence.length ? '<span class="ss-badge" style="background:#eef4ff;color:#2b5da8;border:1px solid #cddffb">' + rec.evidence.length + ' ảnh minh chứng</span>' : '') + '</div></div></div>' +
      '<div class="d-flex flex-wrap gap-2 mt-3">' +
      '<a class="btn btn-primary" href="worker-my-hazards.html?show=' + rec.id + '"><i class="bi bi-list-check me-1"></i>Theo dõi báo cáo của tôi</a>' +
      '<button type="button" class="btn btn-soft" id="btnAnother"><i class="bi bi-plus-lg me-1"></i>Báo nguy cơ khác</button>' +
      '<button type="button" class="btn btn-ghost" id="btnCopy" data-code="' + A.esc(rec.code) + '"><i class="bi bi-clipboard me-1"></i>Sao chép mã</button>' +
      '<a class="btn btn-ghost" href="../login.html?switch=1&next=' + encodeURIComponent('safety/safety-dashboard.html') + '" data-switch-safety><i class="bi bi-shield-check me-1"></i>Xem góc cán bộ an toàn</a>' +
      '</div></div></div>';
    el.result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    $('btnAnother').addEventListener('click', resetForm);
    $('btnCopy').addEventListener('click', function () {
      var code = this.getAttribute('data-code');
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(function () { A.toast('Đã sao chép ' + code, 'success'); });
      else A.toast('Trình duyệt không hỗ trợ sao chép tự động. Mã: ' + code, 'warn');
    });
    el.result.querySelector('[data-switch-safety]').addEventListener('click', function (e) {
      e.preventDefault();
      location.href = '../login.html?switch=1&next=' + encodeURIComponent('safety/safety-dashboard.html');
    });
  }

  function resetForm() {
    el.form.reset();
    state.evidence = [];
    state.ai = null;
    state.category = null;
    state.aiApplied = false;
    state.aiDismissed = false;
    state.forceDuplicate = false;
    renderThumbs(); renderSummary(); renderAiIdle(); countChars(); goStep(1);
    el.result.innerHTML = '';
    $('nextCode').textContent = store.nextHazardCode();
    store.clearDraft(DRAFT_KEY);
    $('draftBar').innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function countChars() {
    $('titleCount').textContent = el.title.value.length;
    $('descCount').textContent = el.desc.value.trim().length;
  }

  /* ---------- dữ liệu điền thử cho video demo ---------- */
  function fillDemo() {
    el.title.value = 'Lan can sàn thao tác tầng 8 bị tháo, mép sàn hở 3 m';
    el.desc.value = 'Khi kiểm tra đầu ca tại trục B tầng 8, phát hiện đoạn lan can dài khoảng 3 m bị tháo để vận chuyển cốp pha nhưng chưa lắp lại. Công nhân tổ 2 đang đi lại và khiêng vật liệu sát mép sàn, không có dây cứu sinh. Đề nghị lắp lại lan can và căng dây cảnh báo trước 11h hôm nay.';
    el.zone.value = store.list('zones').filter(function (z) { return z.active; })[0].id;
    el.work.value = 'Giàn giáo / cốp pha';
    state.forceDuplicate = false;
    countChars(); analyze(); renderSummary();
    A.toast('Đã điền nội dung ví dụ để trình diễn.', 'info', 'Demo');
  }

  /* ---------- prefill từ màn hình checklist ---------- */
  function applyPrefill() {
    var p = store.loadDraft(PREFILL_KEY);
    if (!p) return;
    store.clearDraft(PREFILL_KEY);
    el.title.value = p.title || '';
    el.desc.value = p.description || '';
    if (p.zoneId) el.zone.value = p.zoneId;
    if (p.workType) el.work.value = p.workType;
    if (p.level) setLevel(p.level);
    $('prefillBar').innerHTML = '<div class="alert py-2 mb-3" style="background:var(--ss-teal-50);border:1px solid var(--ss-teal-100)">' +
      '<i class="bi bi-clipboard2-check me-1" style="color:var(--ss-teal-700)"></i>' + A.esc(p.source || 'Mục checklist Không đạt') + ' — nội dung đã được điền sẵn, hãy bổ sung mô tả rồi gửi.</div>';
    countChars(); analyze(); renderSummary();
  }

  document.addEventListener('DOMContentLoaded', function () {
    cache();
    fillSelects();
    fillReporter();
    renderThumbs();
    renderSummary();
    wireAiPanel();
    wireEvidence();
    applyPrefill();

    var onType = A.debounce(function () { analyze(); }, 500);
    var onDraft = A.debounce(function () { saveDraft(true); }, 900);

    ['input', 'change'].forEach(function (evt) {
      el.form.addEventListener(evt, function (e) {
        if (e.target === el.title || e.target === el.desc) { countChars(); onType(); }
        if (e.target === el.zone) { onZoneChange(); onType(); }
        if (e.target.name === 'level' || e.target === el.stop) { renderSummary(); goStep(checkedLevel() ? 2 : 1); }
        onDraft();
      });
    });

    el.form.addEventListener('submit', submit);
    $('btnSaveDraft').addEventListener('click', function () { saveDraft(false); });
    $('btnDemo').addEventListener('click', fillDemo);

    $('draftBar').addEventListener('click', function (e) {
      if (e.target.closest('[data-draft-restore]')) {
        var d = store.loadDraft(DRAFT_KEY);
        if (d) restoreDraft(d);
      }
      if (e.target.closest('[data-draft-drop]')) {
        store.clearDraft(DRAFT_KEY);
        $('draftBar').innerHTML = '';
        A.toast('Đã bỏ bản nháp.', 'info');
      }
    });

    function onZoneChange() {
      var hint = $('zoneHint');
      if (!el.zone.value) { hint.textContent = 'Chọn khu vực để xem mức rủi ro hiện tại.'; return; }
      var r = store.zoneRisk(el.zone.value);
      hint.innerHTML = 'Hiện có <strong>' + r.open + '</strong> nguy cơ mở, <strong>' + r.critical + '</strong> mức Nghiêm trọng, ' +
        '<strong>' + r.overdue + '</strong> hành động quá hạn · điểm rủi ro <strong>' + r.score + '</strong> (' + r.band.label.toLowerCase() + ').';
    }

    var d = store.loadDraft(DRAFT_KEY);
    if (d && (d.title || d.description)) renderDraftBar(d);
    goStep(1);
  });
})();
