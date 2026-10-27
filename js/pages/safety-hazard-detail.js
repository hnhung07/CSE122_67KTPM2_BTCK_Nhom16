/* SCR-05 · Chi tiết & xem xét nguy cơ (SV2 – Nguyễn Thị Thảo)
  Luồng review: xác minh nội dung → chạy lại bộ luật phân loại → cập nhật
   trạng thái/mức độ theo quy trình đã chốt → giao hành động khắc phục. */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;
  var AI = window.SiteSafeAI;

  var LEVELS = ['Thấp', 'Trung bình', 'Cao', 'Nghiêm trọng'];
  var PRIORITIES = ['Thấp', 'Vừa', 'Cao', 'Khẩn cấp'];
  var CATEGORIES = store.read().statuses.categories;

  // quy tắc chuyển trạng thái theo docs/roles-and-features.md
  var FLOW = {
    'Mới tạo': ['Chờ xem xét', 'Cần bổ sung thông tin', 'Bị từ chối'],
    'Chờ xem xét': ['Đã xác nhận', 'Cần bổ sung thông tin', 'Bị từ chối'],
    'Cần bổ sung thông tin': ['Chờ xem xét', 'Đã xác nhận', 'Bị từ chối'],
    'Đã xác nhận': ['Đang khắc phục', 'Cần bổ sung thông tin', 'Bị từ chối'],
    'Đang khắc phục': ['Đã đóng', 'Cần bổ sung thông tin'],
    'Đã đóng': [],
    'Bị từ chối': []
  };
  var NEED_NOTE = ['Cần bổ sung thông tin', 'Bị từ chối', 'Đã đóng'];

  var state = { id: null, run: null, skipAi: false };

  /* ---------- chọn báo cáo đang xem ---------- */
  function queue() {
    return store.where('hazards', function (h) {
      return ['Mới tạo', 'Chờ xem xét', 'Cần bổ sung thông tin'].indexOf(h.status) !== -1;
    }).sort(function (a, b) {
      var w = (store.LEVEL_WEIGHT[b.level] || 0) - (store.LEVEL_WEIGHT[a.level] || 0);
      return w || (new Date(a.createdAt) - new Date(b.createdAt));
    });
  }

  function resolveId() {
    var want = A.qs('id');
    if (want && store.hazard(want)) return want;
    var q = queue();
    return q.length ? q[0].id : null;
  }

  function open(id) {
    state.id = id;
    state.run = null;
    state.skipAi = false;
    if (history.replaceState) {
      // file:// bị Chrome chặn ghi đè URL -> chỉ thử, lỗi sẽ bỏ qua
      try { history.replaceState(null, '', '?id=' + encodeURIComponent(id)); } catch (err) { /* bỏ qua */ }
    }
    render();
    var main = document.querySelector('.ss-content');
    if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- khối nội dung chính ---------- */
  function headCard(h) {
    var acts = store.actionsOfHazard(h.id);
    var overdue = acts.filter(store.isOverdue).length;
    var zr = store.zoneRisk(h.zoneId);
    return '<div class="card"><div class="card-body">' +
      '<div class="d-flex flex-wrap gap-2 align-items-center mb-2">' +
      '<span class="ss-row-code">' + A.esc(h.code) + '</span>' +
      A.statusBadge(h.status) + A.levelBadge(h.level) + A.priBadge(h.priority) +
      (overdue ? '<span class="ss-badge ss-overdue"><i class="bi bi-alarm"></i>' + overdue + ' hành động quá hạn</span>' : '') +
      (h.stopWork ? '<span class="ss-badge ss-overdue"><i class="bi bi-stop-circle"></i>Người báo đề xuất dừng việc</span>' : '') +
      '</div>' +
      '<h2 class="h5 mb-2">' + A.esc(h.title) + '</h2>' +
      '<p class="mb-3">' + A.esc(h.description) + '</p>' +
      '<div class="row g-2 small">' +
      cell('bi-geo-alt', 'Khu vực', A.esc(store.zoneName(h.zoneId)) + ' <span class="text-muted-soft">· điểm rủi ro ' + zr.score + '</span>') +
      cell('bi-tag', 'Nhóm nguy cơ', A.esc(h.category)) +
      cell('bi-tools', 'Loại công việc', A.esc(h.workType || '—')) +
      cell('bi-person-check', 'Người báo cáo', A.esc(store.userName(h.reporterId))) +
      cell('bi-clock-history', 'Gửi lúc', A.datetime(h.createdAt)) +
      cell('bi-arrow-repeat', 'Cập nhật gần nhất', A.datetime(h.updatedAt) + ' · ' + A.timeAgo(h.updatedAt)) +
      '</div>' +
      '<div class="d-flex flex-wrap gap-2 mt-3">' +
      '<a class="btn btn-soft btn-sm" href="../manager/manager-zone-risk-map.html?zone=' + A.esc(h.zoneId) + '"><i class="bi bi-geo-alt me-1"></i>Xem khu vực trên bản đồ rủi ro</a>' +
      '<a class="btn btn-ghost btn-sm" href="../worker/worker-my-hazards.html?show=' + A.esc(h.id) + '"><i class="bi bi-person me-1"></i>Góc nhìn người báo cáo</a>' +
      '<button class="btn btn-ghost btn-sm" data-copy-link><i class="bi bi-link-45deg me-1"></i>Sao chép liên kết</button>' +
      '</div></div></div>';
  }
  function cell(icon, label, value) {
    return '<div class="col-6 col-md-4"><div class="ss-row-meta"><i class="bi ' + icon + ' me-1"></i>' + label + '</div>' +
      '<div class="fw-semibold">' + value + '</div></div>';
  }

  function evidenceCard(h) {
    var imgs = h.evidence || [];
    return '<div class="card mt-3"><div class="card-header"><i class="bi bi-images me-2"></i>Minh chứng hiện trường' +
      '<span class="badge rounded-pill bg-secondary ms-2">' + imgs.length + '</span></div>' +
      '<div class="card-body">' +
      (imgs.length
        ? '<div class="row g-2">' + imgs.map(function (im, i) {
          return '<div class="col-6 col-md-3"><figure class="ss-thumb mb-0">' +
            '<img src="' + im.dataUrl + '" alt="Ảnh minh chứng ' + (i + 1) + ' của ' + A.esc(h.code) + '" loading="lazy" data-zoom="' + i + '" style="cursor:zoom-in">' +
            '<figcaption>' + A.esc(im.name) + '</figcaption></figure></div>';
        }).join('') + '</div>'
        : '<div class="small text-muted-soft"><i class="bi bi-info-circle me-1"></i>Người báo cáo không đính kèm ảnh. ' +
        'Khi cần, hãy yêu cầu bổ sung thông tin ở khung xem xét bên dưới.</div>') +
      '</div></div>';
  }

  /* ---------- AI-01: phân loại lại ---------- */
  function aiCard(h) {
    var saved = h.aiSuggestion;
    var body = state.run
      ? renderResult(state.run)
      : '<div class="d-flex flex-wrap gap-2 align-items-center">' +
      '<button class="btn btn-primary btn-sm" data-ai-run><i class="bi bi-cpu me-1"></i>Chạy lại bộ luật phân loại</button>' +
      (saved ? '<span class="small text-muted-soft">Đề xuất đã lưu khi tạo báo cáo: <strong>' + A.esc(saved.category) + '</strong> · ' +
        A.esc(saved.level) + ' · độ tin cậy ' + Math.round((saved.confidence || 0) * 100) + '%</span>' : '') +
      '</div>';
    return '<div class="ss-ai mt-3"><div class="ss-ai-head">' +
      '<i class="bi bi-stars ss-ai-spark"></i><div class="flex-grow-1"><strong>AI-01 · Hazard Classifier</strong>' +
      '<div class="ss-ai-note">Hazard Classifier (mô phỏng bằng bộ luật JavaScript)</div></div>' +
      '<span class="ss-ai-badge"><i class="bi bi-flask"></i>Mô phỏng</span></div>' +
      '<div class="ss-ai-body" id="aiBody">' + body + '</div></div>';
  }

  function renderResult(r) {
    if (r.loading) return '<div class="ss-loading"><div class="spinner-border spinner-border-sm text-primary"></div>Đang đối chiếu 12 nhóm quy tắc…</div>';
    var low = r.result.needHumanReview;
    return '<div class="d-flex flex-wrap gap-2 mb-2 align-items-center">' +
      '<span class="ss-badge ss-badge-violet">' + A.esc(r.result.category) + '</span>' +
      A.levelBadge(r.result.level) + A.priBadge(r.result.priority) +
      (low ? '<span class="ss-badge ss-st-Cầnbổsungthôngtin"><i class="bi bi-exclamation-triangle"></i>Cần người đánh giá</span>' : '') +
      '</div>' +
      '<div class="ss-ai-conf mb-2"><div class="ss-ai-bar"><span style="width:' + Math.round(r.result.confidence * 100) + '%"></span></div>' +
      '<strong class="small">' + Math.round(r.result.confidence * 100) + '%</strong></div>' +
      '<ul class="ss-ai-reason ps-3 mb-2">' + r.result.reasons.map(function (t) { return '<li>' + A.esc(t) + '</li>'; }).join('') + '</ul>' +
      (r.result.alternatives.length ? '<div class="small mb-2"><span class="text-muted-soft">Nhóm thay thế:</span> ' +
        r.result.alternatives.map(function (a) { return '<button class="btn btn-ghost btn-sm py-0 me-1 mb-1" data-ai-alt="' + A.esc(a.category) + '">' + A.esc(a.category) + ' · ' + Math.round(a.confidence * 100) + '%</button>'; }).join('') + '</div>' : '') +
      '<div class="small mb-3"><span class="text-muted-soft">Biện pháp gợi ý:</span> ' + A.esc(r.result.suggestedActions.join(' · ')) + '</div>' +
      '<div class="ss-ai-actions">' +
      '<button class="btn btn-primary btn-sm" data-ai-apply><i class="bi bi-check2 me-1"></i>Áp dụng vào khung review</button>' +
      '<button class="btn btn-soft btn-sm" data-ai-suggest><i class="bi bi-send me-1"></i>Dùng làm nội dung giao việc</button>' +
      '<button class="btn btn-ghost btn-sm" data-ai-skip>Bỏ qua đề xuất</button>' +
      '</div>' +
      '<div class="ss-ai-note mt-2">' + A.esc(r.result.disclaimer) + '</div>';
  }

  /* ---------- khung xem xét ---------- */
  function reviewCard(h) {
    var next = (FLOW[h.status] || []);
    var locked = !next.length;
    var options = [h.status].concat(next).map(function (s) {
      return '<option value="' + A.esc(s) + '"' + (s === h.status ? ' selected' : '') + '>' + A.esc(s) + '</option>';
    }).join('');
    var zoneOptions = store.where('zones', function (z) { return z.active; }).map(function (z) {
      return '<option value="' + z.id + '"' + (z.id === h.zoneId ? ' selected' : '') + '>' + A.esc(z.name) + '</option>';
    }).join('');
    return '<div class="card mt-3"><div class="card-header"><i class="bi bi-patch-check me-2"></i>Khung xem xét của cán bộ an toàn</div>' +
      '<div class="card-body">' +
      (locked
        ? '<div class="alert alert-success small py-2 mb-3"><i class="bi bi-lock me-1"></i>Báo cáo ở trạng thái <strong>' + A.esc(h.status) +
        '</strong> — đã kết thúc quy trình. Chỉ thông tin mô tả còn chỉnh sửa được khi có yêu cầu của quản lý.</div>'
        : '') +
      '<form id="reviewForm" novalidate>' +
      '<div class="row g-3">' +
      '<div class="col-md-4"><label class="form-label" for="rStatus">Trạng thái xử lý</label>' +
      '<select class="form-select" id="rStatus"' + (locked ? ' disabled' : '') + '>' + options + '</select>' +
      '<div class="form-text">Chỉ hiện các bước kế tiếp hợp lệ trong quy trình.</div></div>' +
      '<div class="col-md-4"><label class="form-label" for="rLevel">Mức độ rủi ro</label><select class="form-select" id="rLevel">' +
      LEVELS.map(function (l) { return '<option' + (l === h.level ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select></div>' +
      '<div class="col-md-4"><label class="form-label" for="rPri">Ưu tiên khắc phục</label><select class="form-select" id="rPri">' +
      PRIORITIES.map(function (p) { return '<option' + (p === h.priority ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></div>' +
      '<div class="col-md-6"><label class="form-label" for="rCat">Nhóm nguy cơ</label><select class="form-select" id="rCat">' +
      CATEGORIES.map(function (c) { return '<option' + (c === h.category ? ' selected' : '') + '>' + A.esc(c) + '</option>'; }).join('') + '</select></div>' +
      '<div class="col-md-6"><label class="form-label" for="rZone">Khu vực</label><select class="form-select" id="rZone">' + zoneOptions + '</select></div>' +
      '<div class="col-12"><label class="form-label" for="rNote">Ghi chú review <span class="text-danger" id="rNoteStar"></span></label>' +
      '<textarea class="form-control" id="rNote" rows="3" placeholder="Kết quả kiểm tra hiện trường, căn cứ nâng/hạ mức độ, yêu cầu với người báo cáo…"></textarea>' +
      '<div class="invalid-feedback" id="rNoteErr">Với trạng thái này, hệ thống yêu cầu ghi rõ lý do.</div></div>' +
      '</div>' +
      '<div class="d-flex flex-wrap gap-2 mt-3">' +
      '<button type="submit" class="btn btn-primary" id="rSave"' + (locked ? ' disabled' : '') + '><i class="bi bi-save me-1"></i>Lưu kết quả xem xét</button>' +
      '<button type="button" class="btn btn-soft" data-open-assign><i class="bi bi-person-plus me-1"></i>Giao hành động khắc phục</button>' +
      '<a class="btn btn-ghost" href="safety-dashboard.html"><i class="bi bi-arrow-left me-1"></i>Về bảng xem xét</a>' +
      '</div></form></div></div>';
  }

  /* ---------- danh sách hành động khắc phục ---------- */
  function actionList(h) {
    var acts = store.actionsOfHazard(h.id);
    var rows = acts.length ? acts.map(function (a) {
      var od = store.isOverdue(a);
      return '<div class="ss-item' + (od ? ' is-bad' : a.status === 'Hoàn thành' ? ' is-ok' : '') + '">' +
        '<div class="d-flex justify-content-between align-items-start gap-2">' +
        '<div><span class="ss-row-code">' + A.esc(a.code) + '</span> ' + A.statusBadge(a.status) +
        (od ? ' <span class="ss-badge ss-overdue">Quá hạn ' + Math.abs(A.daysTo(a.dueDate)) + ' ngày</span>' : '') +
        '<div class="fw-semibold mt-1">' + A.esc(a.title) + '</div>' +
        '<div class="ss-row-meta">' + A.esc(store.userName(a.ownerId)) + ' · hạn ' + A.date(a.dueDate) +
        (a.note ? ' · ' + A.esc(a.note) : '') + '</div></div>' +
        '<div style="min-width:150px">' +
        '<label class="ss-row-meta d-block" for="p_' + a.id + '">Tiến độ ' + a.progress + '%</label>' +
        '<input type="range" class="form-range" min="0" max="100" step="5" id="p_' + a.id + '" data-prog="' + a.id + '" value="' + a.progress + '">' +
        '<select class="form-select form-select-sm mt-1" data-astat="' + a.id + '">' +
        store.read().statuses.action.map(function (s) { return '<option' + (s === a.status ? ' selected' : '') + '>' + A.esc(s) + '</option>'; }).join('') +
        '</select></div></div></div>';
    }).join('') : '<div class="small text-muted-soft">Chưa có hành động khắc phục nào cho báo cáo này.</div>';

    return '<div class="card mt-3"><div class="card-header"><i class="bi bi-list-task me-2"></i>Hành động khắc phục liên quan' +
      '<button class="btn btn-soft btn-sm ms-auto" data-open-assign><i class="bi bi-plus-lg"></i> Giao mới</button></div>' +
      '<div class="card-body">' + rows + '</div></div>';
  }

  /* ---------- cột phải: hàng đợi + lịch sử ---------- */
  function sideQueue(h) {
    var q = queue();
    var idx = q.map(function (x) { return x.id; }).indexOf(h.id);
    return '<div class="card"><div class="card-header"><i class="bi bi-inbox me-2"></i>Hàng đợi xem xét' +
      '<span class="badge rounded-pill bg-secondary ms-2">' + q.length + '</span></div>' +
      '<div class="card-body p-0">' +
      (idx > -1 ? '<div class="px-3 py-2 small text-muted-soft border-bottom">Bạn đang ở vị trí ' + (idx + 1) + '/' + q.length + ' (ưu tiên theo mức độ, rồi thời gian chờ).</div>' : '') +
      (q.length ? q.map(function (x) {
        return '<a class="d-flex gap-2 px-3 py-2 border-bottom text-decoration-none' + (x.id === h.id ? ' bg-light' : '') + '" href="?id=' + x.id + '" data-nav="' + x.id + '">' +
          '<span class="ss-badge ss-lv-' + A.cls(x.level) + '" style="flex:0 0 auto">●</span>' +
          '<span class="min-w-0"><span class="d-block small fw-semibold text-truncate">' + A.esc(x.title) + '</span>' +
          '<span class="ss-row-code">' + A.esc(x.code) + '</span> <span class="ss-row-meta">· ' + A.timeAgo(x.createdAt) + '</span></span></a>';
      }).join('') : '<div class="p-3 small text-muted-soft">Hàng đợi trống — mọi báo cáo đã được xử lý.</div>') +
      '</div></div>';
  }

  function sideHistory(h) {
    return '<div class="card mt-3"><div class="card-header"><i class="bi bi-clock-history me-2"></i>Diễn biến xử lý</div>' +
      '<div class="card-body"><div class="ss-timeline">' +
      (h.history || []).slice().reverse().map(function (e, i) {
        return '<div class="ss-tl-item' + (i === 0 ? ' is-latest' : '') + '">' +
          '<div class="fw-semibold small">' + A.esc(e.action) + '</div>' +
          '<div class="ss-tl-when">' + A.datetime(e.at) + ' · ' + A.esc(e.actor) + '</div>' +
          (e.note ? '<div class="small">' + A.esc(e.note) + '</div>' : '') + '</div>';
      }).join('') + '</div></div></div>';
  }

  /* ---------- render ---------- */
  function render() {
    var host = document.getElementById('hazardView');
    var h = state.id ? store.hazard(state.id) : null;
    if (!h) {
      host.innerHTML = '<div class="card"><div class="card-body">' +
        A.empty('file-earmark-x', 'Không tìm thấy báo cáo nguy cơ',
          'Liên kết có thể đã cũ hoặc bản ghi đã bị xoá khi khôi phục dữ liệu mẫu.',
          '<a class="btn btn-primary btn-sm mt-1" href="safety-dashboard.html"><i class="bi bi-speedometer2 me-1"></i>Về dashboard an toàn</a>' +
          '<a class="btn btn-ghost btn-sm mt-1" href="safety-hazard-detail.html">Mở báo cáo cần xem xét gần nhất</a>') +
        '</div></div>';
      return;
    }
    host.innerHTML = '<div class="row g-3">' +
      '<div class="col-xl-8">' + headCard(h) + evidenceCard(h) + aiCard(h) + reviewCard(h) + actionList(h) + '</div>' +
      '<div class="col-xl-4">' + sideQueue(h) + sideHistory(h) + '</div></div>';
    wire(h);
  }

  /* ---------- tương tác ---------- */
  function wire(h) {
    host_on('[data-nav]', 'click', function (el, e) { e.preventDefault(); open(el.getAttribute('data-nav')); });
    host_on('[data-zoom]', 'click', function (el) {
      var im = (h.evidence || [])[+el.getAttribute('data-zoom')];
      if (!im) return;
      document.getElementById('imgModalSrc').src = im.dataUrl;
      document.getElementById('imgModalTitle').textContent = h.code + ' · ' + im.name;
      new bootstrap.Modal(document.getElementById('imgModal')).show();
    });
    host_on('[data-copy-link]', 'click', function () {
      var url = location.href;
      var done = function () { A.toast('Đã sao chép liên kết ' + h.code + '. Bạn có thể gửi cho cán bộ khác.', 'success'); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done);
      else done();
    });
    host_on('[data-open-assign]', 'click', function () {
      fillSuggest(state.run && state.run.result);
      openAssign();
    });
    wireAi(h);

    var form = document.getElementById('reviewForm');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); saveReview(h); });

    document.querySelectorAll('[data-prog]').forEach(function (el) {
      el.addEventListener('change', function () { updateAction(el.getAttribute('data-prog'), { progress: +el.value }, true); });
    });
    document.querySelectorAll('[data-astat]').forEach(function (el) {
      el.addEventListener('change', function () {
        var patch = { status: el.value };
        if (el.value === 'Hoàn thành') patch.progress = 100;
        if (el.value === 'Chưa bắt đầu') patch.progress = 0;
        updateAction(el.getAttribute('data-astat'), patch, false);
      });
    });
  }

  function host_on(sel, evt, fn) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.addEventListener(evt, function (e) { fn(el, e); });
    });
  }

  // chỉ gắn lại các nút của khung AI để không nhân đôi xử lý ở phần khác
  function wireAi(h) {
    var root = document.getElementById('aiBody');
    if (!root) return;
    root.querySelectorAll('[data-ai-run]').forEach(function (el) { el.addEventListener('click', function () { runClassify(h); }); });
    root.querySelectorAll('[data-ai-apply]').forEach(function (el) {
      el.addEventListener('click', function () { applyAi(state.run && state.run.result); });
    });
    root.querySelectorAll('[data-ai-alt]').forEach(function (el) {
      el.addEventListener('click', function () {
        var cat = el.getAttribute('data-ai-alt');
        setVal('rCat', cat);
        A.toast('Đã chọn nhóm “' + cat + '” từ danh sách thay thế — hãy kiểm tra lại mức độ.', 'info');
      });
    });
    root.querySelectorAll('[data-ai-skip]').forEach(function (el) {
      el.addEventListener('click', function () {
        state.skipAi = true;
        state.run = null;
        document.getElementById('aiBody').innerHTML = '<div class="small text-muted-soft"><i class="bi bi-eye-slash me-1"></i>Bạn đã bỏ qua đề xuất. ' +
          'Quyết định phân loại thuộc về cán bộ an toàn.<button class="btn btn-ghost btn-sm py-0 ms-2" data-ai-run>Chạy lại</button></div>';
        wireAi(h);
      });
    });
    root.querySelectorAll('[data-ai-suggest]').forEach(function (el) {
      el.addEventListener('click', function () {
        var r = state.run && state.run.result;
        if (!r) return;
        document.getElementById('aTitle').value = r.suggestedActions[0] || '';
        document.getElementById('aDue').value = r.priority === 'Khẩn cấp' ? isoDay(1) : isoDay(5);
        fillSuggest(r);
        openAssign();
      });
    });
  }
  function setVal(id, v) {
    var el = document.getElementById(id);
    if (!el) return;
    for (var i = 0; i < el.options.length; i++) if (el.options[i].value === v || el.options[i].text === v) { el.value = el.options[i].value; return; }
  }
  function isoDay(offset) {
    var d = new Date(Date.now() + offset * 864e5);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function runClassify(h) {
    h = h || store.hazard(state.id);
    state.run = { loading: true };
    document.getElementById('aiBody').innerHTML = renderResult(state.run);
    setTimeout(function () {
      state.run = { result: AI.classify({ title: h.title, description: h.description, zoneId: h.zoneId }) };
      state.skipAi = false;
      document.getElementById('aiBody').innerHTML = renderResult(state.run);
      wireAi(h);
    }, 420);
  }

  function applyAi(r) {
    if (!r) return;
    setVal('rCat', r.category);
    setVal('rLevel', r.level);
    setVal('rPri', r.priority);
    var note = document.getElementById('rNote');
    var was = note.value.trim();
    note.value = (was ? was + '\n' : '') + '[Áp dụng đề xuất bộ luật] ' + r.category + ' / ' + r.level + ' — ' + r.reasons[0];
    A.toast('Đã nạp đề xuất vào biểu mẫu. Kiểm tra lại rồi bấm Lưu.', 'info', 'Cần người xác nhận');
  }

  function saveReview(h) {
    var status = document.getElementById('rStatus');
    var noteEl = document.getElementById('rNote');
    if (status.disabled) return;
    var to = status.value;
    var note = noteEl.value.trim();

    if (NEED_NOTE.indexOf(to) !== -1 && note.length < 5) {
      noteEl.classList.add('is-invalid');
      document.getElementById('rNoteErr').textContent = to === 'Bị từ chối'
        ? 'Hãy nêu lý do từ chối để người báo cáo nắm được.'
        : 'Hãy ghi rõ thông tin cần bổ sung / căn cứ đóng báo cáo.';
      noteEl.focus();
      return;
    }
    noteEl.classList.remove('is-invalid');

    if (to === 'Đã đóng') {
      var openActs = store.actionsOfHazard(h.id).filter(function (a) { return a.status !== 'Hoàn thành'; });
      if (openActs.length) {
        A.confirm({
          title: 'Đóng báo cáo khi còn ' + openActs.length + ' hành động chưa hoàn thành?',
          body: 'Các hành động ' + openActs.map(function (a) { return a.code; }).join(', ') + ' vẫn đang mở.',
          detail: 'Nếu vẫn đồng ý, hệ thống ghi lịch sử “Đóng kèm hành động đang mở” để quản lý theo dõi tiếp.',
          okText: 'Vẫn đóng báo cáo'
        }, function () { writeReview(h, to, note, true); });
        return;
      }
    }
    writeReview(h, to, note, false);
  }

  function writeReview(h, to, note, forceClose) {
    var me = store.sessionUser();
    var patch = {
      status: to,
      level: document.getElementById('rLevel').value,
      priority: document.getElementById('rPri').value,
      category: document.getElementById('rCat').value,
      zoneId: document.getElementById('rZone').value,
      reviewerId: me ? me.id : h.reviewerId,
      updatedAt: new Date().toISOString()
    };
    if (state.run && state.run.result) {
      patch.aiSuggestion = {
        category: state.run.result.category, level: state.run.result.level,
        confidence: state.run.result.confidence, engine: state.run.result.engine
      };
    }
    store.update('hazards', h.id, patch);
    var changedLevel = patch.level !== h.level;
    store.addHistory(h.id, {
      actor: me ? me.name : 'Cán bộ an toàn',
      action: (changedLevel && to === h.status ? 'Cập nhật mức độ' : to === h.status ? 'Cập nhật hồ sơ' : to),
      note: (forceClose ? '[Đóng kèm hành động đang mở] ' : '') + note
    });

    // báo cho người báo cáo + cập nhật danh sách thông báo vai trò
    var msgs = {
      'Đã xác nhận': 'Báo cáo ' + h.code + ' đã được xác nhận, đang chờ bố trí khắc phục.',
      'Cần bổ sung thông tin': 'Báo cáo ' + h.code + ' cần bổ sung: ' + note,
      'Bị từ chối': 'Báo cáo ' + h.code + ' chưa đủ căn cứ: ' + note,
      'Đang khắc phục': 'Báo cáo ' + h.code + ' đang được khắc phục.',
      'Đã đóng': 'Báo cáo ' + h.code + ' đã đóng sau nghiệm thu.'
    };
    if (msgs[to]) pushNotification('worker', msgs[to], to === 'Cần bổ sung thông tin' ? 'cảnh báo' : 'thông tin');
    if (to === 'Đã xác nhận' || to === 'Đang khắc phục') {
      pushNotification('manager', h.code + ' (' + store.zoneName(patch.zoneId) + ') mức ' + patch.level + ' — cần theo dõi tiến độ khắc phục.', 'nhắc việc');
    }

    A.toast('Đã lưu kết quả xem xét cho ' + h.code + '.', 'success', 'Cập nhật thành công');
    render();
  }

  function pushNotification(role, text, kind) {
    var db = store.read();
    db.notifications.unshift({ id: 'N-' + Date.now(), at: new Date().toISOString(), role: role, text: text, kind: kind || 'thông tin' });
    db.notifications = db.notifications.slice(0, 30);
    store.write(db);
  }

  function updateAction(id, patch, silentProgress) {
    var db = store.read();
    var a = null;
    db.actions.forEach(function (x) { if (x.id === id) a = x; });
    if (!a) return;
    Object.keys(patch).forEach(function (k) { a[k] = patch[k]; });
    a.updatedAt = new Date().toISOString();
    store.write(db);
    var h = store.hazard(a.hazardId);
    if (h) {
      store.addHistory(h.id, {
        actor: store.sessionUser() ? store.sessionUser().name : 'Cán bộ an toàn',
        action: 'Cập nhật ' + a.code,
        note: patch.status ? 'Trạng thái → ' + patch.status : 'Tiến độ ' + patch.progress + '%'
      });
    }
    A.toast(a.code + (patch.status ? ' → ' + patch.status : ' · tiến độ ' + patch.progress + '%'), silentProgress ? 'info' : 'success');
    if (patch.status) render();
  }

  /* ---------- modal giao hành động ---------- */
  function fillSuggest(r) {
    var box = document.getElementById('assignSuggest');
    if (!box) return;
    box.innerHTML = r
      ? '<i class="bi bi-stars me-1"></i><strong>Đề xuất từ bộ luật (mô phỏng):</strong> ' + A.esc(r.suggestedActions.join(' · '))
      : '<i class="bi bi-info-circle me-1"></i>Chưa chạy AI-01 cho báo cáo này. Hãy nhập nội dung công việc theo kiểm tra thực tế của bạn.';
  }

  function openAssign() {
    var sel = document.getElementById('aOwner');
    if (!sel.options.length) {
      sel.innerHTML = '<option value="">— Chọn người phụ trách —</option>' +
        store.where('users', function (u) { return u.active && u.role !== 'admin'; }).map(function (u) {
          return '<option value="' + u.id + '">' + A.esc(u.name) + ' · ' + A.esc(u.unit) + '</option>';
        }).join('');
    }
    var due = document.getElementById('aDue');
    due.min = isoDay(0);
    if (!due.value) due.value = isoDay(state.run && state.run.result && state.run.result.priority === 'Khẩn cấp' ? 1 : 5);
    new bootstrap.Modal(document.getElementById('assignModal')).show();
  }

  function submitAssign(e) {
    e.preventDefault();
    var h = store.hazard(state.id);
    if (!h) return;
    var titleEl = document.getElementById('aTitle');
    var ownerEl = document.getElementById('aOwner');
    var dueEl = document.getElementById('aDue');
    var ok = true;

    if (titleEl.value.trim().length < 10) { titleEl.classList.add('is-invalid'); ok = false; } else titleEl.classList.remove('is-invalid');
    if (!ownerEl.value) { ownerEl.classList.add('is-invalid'); ok = false; } else ownerEl.classList.remove('is-invalid');
    if (!dueEl.value || dueEl.value < isoDay(0)) {
      dueEl.classList.add('is-invalid');
      document.getElementById('aDueErr').textContent = 'Hạn xử lý phải là ngày hôm nay (' + A.date(isoDay(0)) + ') hoặc muộn hơn.';
      ok = false;
    } else dueEl.classList.remove('is-invalid');
    if (!ok) return;

    var n = 0;
    store.list('actions').forEach(function (a) {
      var m = /CA-(\d+)/.exec(a.id);
      if (m) n = Math.max(n, +m[1]);
    });
    var me = store.sessionUser();
    var rec = {
      id: 'CA-' + ('00' + (n + 1)).slice(-3),
      code: store.nextActionCode(),
      hazardId: h.id,
      title: titleEl.value.trim(),
      ownerId: ownerEl.value,
      zoneId: h.zoneId,
      dueDate: dueEl.value,
      status: 'Chưa bắt đầu',
      progress: 0,
      updatedAt: new Date().toISOString(),
      note: document.getElementById('aNote').value.trim()
    };
    store.insert('actions', rec);

    if (['Mới tạo', 'Chờ xem xét', 'Đã xác nhận'].indexOf(h.status) !== -1) {
      store.update('hazards', h.id, { status: 'Đang khắc phục', reviewerId: me ? me.id : h.reviewerId, updatedAt: new Date().toISOString() });
    }
    store.addHistory(h.id, {
      actor: me ? me.name : 'Cán bộ an toàn', action: 'Giao hành động ' + rec.code,
      note: rec.title + ' – hạn ' + A.date(rec.dueDate)
    });
    pushNotification('worker', 'Bạn vừa được giao ' + rec.code + ': ' + rec.title + ' (hạn ' + A.date(rec.dueDate) + ').', 'cảnh báo');
    pushNotification('manager', 'Hành động ' + rec.code + ' tại ' + store.zoneName(h.zoneId) + ' đã được giao, hạn ' + A.date(rec.dueDate) + '.', 'nhắc việc');

    bootstrap.Modal.getInstance(document.getElementById('assignModal')).hide();
    e.target.reset();
    A.toast('Đã giao ' + rec.code + ' cho ' + store.userName(rec.ownerId) + '.', 'success', 'Giao việc thành công');
    render();
  }

  /* ---------- khởi tạo ---------- */
  document.getElementById('assignForm').addEventListener('submit', submitAssign);
  state.id = resolveId();
  render();
})();
