/* SCR-06 · Quản lý đợt kiểm tra (SV2 – Nguyễn Thị Thảo)
   C/R/U trên danh sách inspection: lập kế hoạch, phát checklist cho tổ,
   cập nhật kết quả theo quy trình và hủy bản nháp. */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;
  var AI = window.SiteSafeAI;

  var TYPES = ['Định kỳ', 'Chuyên đề', 'Đột xuất', 'Nghiệm thu'];
  var TASK = store.read().statuses.task;
  var NEXT = {
    'Bản nháp': ['Đang thực hiện', 'Đã gửi'],
    'Đang thực hiện': ['Đã gửi', 'Bản nháp'],
    'Đã gửi': ['Đã xem xét', 'Đang thực hiện'],
    'Đã xem xét': ['Hoàn tất'],
    'Hoàn tất': []
  };

  var f = { q: '', status: '', zone: '', type: '' };
  var insight = null;

  /* ---------- lọc ---------- */
  function rows() {
    return store.where('inspections', function (i) {
      if (f.status && i.status !== f.status) return false;
      if (f.zone && i.zoneId !== f.zone) return false;
      if (f.type && i.type !== f.type) return false;
      if (f.q) {
        var hay = (i.code + ' ' + i.title + ' ' + (i.note || '') + ' ' + store.zoneName(i.zoneId) + ' ' + store.userName(i.inspectorId)).toLowerCase();
        if (hay.indexOf(f.q.toLowerCase()) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return b.date.localeCompare(a.date) || a.code.localeCompare(b.code); });
  }

  function isStale(i) {
    return i.date < isoDay(0) && ['Hoàn tất', 'Đã xem xét'].indexOf(i.status) === -1;
  }

  function isoDay(offset) {
    var d = new Date(Date.now() + (offset || 0) * 864e5);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  /* ---------- KPI ---------- */
  function kpis() {
    var all = store.list('inspections');
    var open = all.filter(function (i) { return ['Bản nháp', 'Đang thực hiện', 'Đã gửi'].indexOf(i.status) !== -1; });
    var today = all.filter(function (i) { return i.date === isoDay(0); });
    var stale = all.filter(isStale);
    var findings = all.reduce(function (s, i) { return s + (+i.findingsCount || 0); }, 0);
    var cards = [
      { v: all.length, l: 'Tổng đợt kiểm tra', i: 'calendar3', c: 'var(--ss-teal-700)' },
      { v: open.length, l: 'Đang mở', i: 'play-circle', c: 'var(--ss-tint-blue-fg)' },
      { v: today.length, l: 'Diễn ra hôm nay', i: 'sunrise', c: 'var(--ss-teal-800)' },
      { v: stale.length, l: 'Chưa đóng quá hạn', i: 'alarm', c: 'var(--ss-tint-red-fg)' },
      { v: findings, l: 'Mục ghi nhận', i: 'list-ol', c: 'var(--ss-tint-orange-fg)' }
    ];
    document.getElementById('kpis').innerHTML = cards.map(function (c) {
      return '<div class="col-6 col-xl-2"><div class="card h-100"><div class="card-body ss-kpi">' +
        '<div class="d-flex justify-content-between align-items-start"><span class="ss-kpi-value" style="color:' + c.c + '">' + c.v + '</span>' +
        '<span class="ss-kpi-icon"><i class="bi bi-' + c.i + '"></i></span></div><div class="ss-kpi-label">' + c.l + '</div></div></div></div>';
    }).join('');
  }

  /* ---------- AI-03 gợi ý trọng tâm ---------- */
  function renderInsight() {
    insight = AI.hotspot({ days: 30 });
    var host = document.getElementById('aiInsight');
    if (insight.status === 'no-data') {
      host.innerHTML = '<div class="small text-muted-soft"><i class="bi bi-cloud-slash me-1"></i>' + A.esc(insight.message) + '</div>';
      document.getElementById('aiPlan').disabled = true;
      return;
    }
    host.innerHTML = '<ul class="ss-ai-reason ps-3 mb-2">' + insight.narrative.map(function (t) { return '<li>' + A.esc(t) + '</li>'; }).join('') + '</ul>' +
      '<div class="d-flex flex-wrap gap-1 mb-2">' + insight.hotspots.slice(0, 4).map(function (h) {
        return '<span class="ss-badge ss-badge-orange">' + A.esc(h.name) + ' · ' + h.score + '</span>';
      }).join('') + '</div>' +
      '<div class="small text-muted-soft">' + A.esc(insight.suggestions[0]) + ' ' + A.esc(insight.disclaimer) + '</div>';
  }

  /* ---------- danh sách ---------- */
  function renderList() {
    var host = document.getElementById('listHost');
    var data = rows();
    document.getElementById('rowCount').textContent = data.length + '/' + store.list('inspections').length + ' đợt';
    if (!data.length) {
      host.innerHTML = A.empty('calendar2-x', 'Không có đợt kiểm tra nào khớp bộ lọc',
        'Thử bỏ bớt điều kiện lọc, hoặc tạo mới một đợt kiểm tra cho khu vực cần chú ý.',
        '<button class="btn btn-primary btn-sm mt-1" data-new><i class="bi bi-plus-lg me-1"></i>Tạo đợt kiểm tra</button>' +
        '<button class="btn btn-ghost btn-sm mt-1" data-reset-filter>Xóa bộ lọc</button>');
      wireEmpty();
      return;
    }

    host.innerHTML = '<div class="table-responsive"><table class="table table-hover align-middle mb-0">' +
      '<thead><tr><th scope="col">Đợt kiểm tra</th><th scope="col">Khu vực</th><th scope="col">Ngày</th>' +
      '<th scope="col">Người phụ trách</th><th scope="col">Mẫu</th><th scope="col">Trạng thái</th>' +
      '<th scope="col" class="text-center">Ghi nhận</th><th scope="col" class="text-end">Thao tác</th></tr></thead><tbody>' +
      data.map(row).join('') + '</tbody></table></div>';
    wireRows();
  }

  function row(i) {
    var t = store.template(i.templateId);
    var openHaz = store.where('hazards', function (h) {
      return h.zoneId === i.zoneId && store.isOpenHazard(h);
    });
    var latest = openHaz.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })[0];
    var statusOpts = [i.status].concat(NEXT[i.status] || []).map(function (s) {
      return '<option value="' + A.esc(s) + '"' + (s === i.status ? ' selected' : '') + '>' + A.esc(s) + '</option>';
    }).join('');
    var editable = i.status === 'Bản nháp' || i.status === 'Đang thực hiện';

    return '<tr data-id="' + i.id + '">' +
      '<td><span class="ss-row-code">' + A.esc(i.code) + '</span>' +
      '<div class="ss-row-title">' + A.esc(i.title) + '</div>' +
      '<div class="ss-row-meta"><i class="bi bi-clipboard-check"></i> ' + A.esc(i.type) +
      (i.note ? ' · <span class="d-inline-block text-truncate" style="max-width:190px">' + A.esc(i.note) + '</span>' : '') + '</div></td>' +
      '<td class="small">' + A.esc(store.zoneName(i.zoneId)) +
      (openHaz.length ? '<div class="ss-row-meta"><a href="safety-hazard-detail.html?id=' + latest.id + '">' + openHaz.length + ' nguy cơ đang mở</a></div>' : '<div class="ss-row-meta text-muted-soft">không có nguy cơ mở</div>') + '</td>' +
      '<td class="small">' + A.date(i.date) + (i.date === isoDay(0) ? ' <span class="ss-badge ss-st-Đãxácnhận">Hôm nay</span>' : '') +
      (isStale(i) ? ' <span class="ss-badge ss-overdue">Chưa đóng</span>' : '') + '</td>' +
      '<td class="small">' + A.esc(store.userName(i.inspectorId)) + '</td>' +
      '<td class="small">' + A.esc(t ? t.name : '—') + '<div class="ss-row-meta">' + (t ? t.items.length : 0) + ' mục</div></td>' +
      '<td><label class="visually-hidden" for="st_' + i.id + '">Trạng thái đợt ' + A.esc(i.code) + '</label>' +
      '<select class="form-select form-select-sm" id="st_' + i.id + '" data-status="' + i.id + '">' + statusOpts + '</select></td>' +
      '<td class="text-center"><div class="d-flex align-items-center justify-content-center gap-1">' +
      '<button class="btn btn-ghost btn-sm py-0" data-dec="' + i.id + '" aria-label="Giảm số mục ghi nhận">−</button>' +
      '<strong>' + (i.findingsCount || 0) + '</strong>' +
      '<button class="btn btn-ghost btn-sm py-0" data-inc="' + i.id + '" aria-label="Tăng số mục ghi nhận">+</button></div></td>' +
      '<td class="text-end">' +
      '<div class="ss-steps">' +
      (editable ? '<button class="btn btn-ghost btn-sm py-0" data-edit="' + i.id + '" aria-label="Sửa đợt ' + A.esc(i.code) + '"><i class="bi bi-pencil"></i></button>' : '') +
      (['Bản nháp', 'Đang thực hiện'].indexOf(i.status) !== -1 && t ? '<button class="btn btn-soft btn-sm py-0" data-dispatch="' + i.id + '" title="Gửi checklist cho tổ"><i class="bi bi-send"></i> Phát checklist</button>' : '') +
      (i.status === 'Bản nháp' ? '<button class="btn btn-ghost btn-sm py-0 text-danger" data-del="' + i.id + '" aria-label="Hủy bản nháp ' + A.esc(i.code) + '"><i class="bi bi-trash"></i></button>' : '') +
      '</div></td></tr>';
  }

  /* ---------- wire ---------- */
  function wireEmpty() {
    var nb = host_btn('[data-new]'); if (nb) nb.addEventListener('click', function () { openForm(null); });
    var rb = host_btn('[data-reset-filter]'); if (rb) rb.addEventListener('click', clearFilters);
  }
  function host_btn(sel) { return document.querySelector('#listHost ' + sel); }

  function wireRows() {
    document.querySelectorAll('#listHost [data-status]').forEach(function (el) {
      el.addEventListener('change', function () { changeStatus(el.getAttribute('data-status'), el.value); });
    });
    document.querySelectorAll('#listHost [data-inc], #listHost [data-dec]').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.getAttribute('data-inc') || el.getAttribute('data-dec');
        var i = store.find('inspections', id);
        var d = el.hasAttribute('data-inc') ? 1 : -1;
        var v = Math.max(0, Math.min(99, (+i.findingsCount || 0) + d));
        store.update('inspections', id, { findingsCount: v });
        renderList(); kpis();
        if (d > 0 && v === 1) A.toast('Ghi nhận phát hiện đầu tiên – hãy tạo báo cáo nguy cơ nếu vượt ngưỡng cho phép.', 'warn', 'Cần xử lý');
      });
    });
    document.querySelectorAll('#listHost [data-edit]').forEach(function (el) {
      el.addEventListener('click', function () { openForm(el.getAttribute('data-edit')); });
    });
    document.querySelectorAll('#listHost [data-dispatch]').forEach(function (el) {
      el.addEventListener('click', function () { dispatch(el.getAttribute('data-dispatch')); });
    });
    document.querySelectorAll('#listHost [data-del]').forEach(function (el) {
      el.addEventListener('click', function () { removeDraft(el.getAttribute('data-del')); });
    });
  }

  function changeStatus(id, to) {
    var i = store.find('inspections', id);
    if (!i || i.status === to) return;
    if (to === 'Hoàn tất' && (+i.findingsCount || 0) > 0) {
      var openHaz = store.where('hazards', function (h) { return h.zoneId === i.zoneId && store.isOpenHazard(h); });
      if (!openHaz.length) {
        A.toast('Đợt kiểm tra có ' + i.findingsCount + ' mục ghi nhận nhưng khu vực không còn nguy cơ mở nào — hãy kiểm tra lại trước khi hoàn tất.', 'warn');
      }
    }
    store.update('inspections', id, { status: to });
    A.toast(i.code + ' → ' + to, 'success', 'Đã cập nhật tiến trình');
    if (to === 'Đã gửi') pushNotification('worker', 'Kết quả kiểm tra ' + i.code + ' (' + store.zoneName(i.zoneId) + ') đã gửi, chờ cán bộ an toàn xem xét.', 'thông tin');
    if (to === 'Hoàn tất') pushNotification('manager', 'Đợt kiểm tra ' + i.code + ' tại ' + store.zoneName(i.zoneId) + ' đã hoàn tất.', 'thông tin');
    renderList(); kpis();
  }

  function dispatch(id) {
    var i = store.find('inspections', id);
    var t = store.template(i.templateId);
    if (!t || !t.active) { A.toast('Mẫu checklist của đợt này không còn hiệu lực.', 'error'); return; }
    var workers = store.where('users', function (u) { return u.active && u.role === 'worker'; });
    if (!workers.length) { A.toast('Chưa có nhân sự hiện trường nào còn hoạt động để giao checklist.', 'error'); return; }
    var runN = 0;
    store.list('runs').forEach(function (r) { var m = /CR-(\d+)/.exec(r.id); if (m) runN = Math.max(runN, +m[1]); });
    // ưu tiên người từng làm tại khu vực này, nếu không thì lấy nhân sự đầu còn hoạt động
    var prior = store.where('runs', function (r) { return r.zoneId === i.zoneId; })[0];
    var assignee = prior && store.user(prior.assigneeId) && store.user(prior.assigneeId).active
      ? prior.assigneeId : workers[0].id;
    var run = {
      id: 'CR-' + ('0' + (runN + 1)).slice(-2),
      code: 'PK-' + i.date.slice(0, 4) + '-' + i.date.slice(5).replace(/-/g, '') + '-' + String.fromCharCode(65 + (runN % 3)),
      templateId: t.id, zoneId: i.zoneId, assigneeId: assignee,
      date: i.date, status: 'Bản nháp', results: {}, notes: 'Phát từ đợt kiểm tra ' + i.code
    };
    store.insert('runs', run);
    store.update('inspections', id, { status: 'Đang thực hiện' });
    pushNotification('worker', 'Bạn có checklist mới "' + t.name + '" tại ' + store.zoneName(i.zoneId) + ' (' + A.date(i.date) + ').', 'cảnh báo');
    A.toast('Đã gửi ' + t.name + ' (' + t.items.length + ' mục) tới ' + store.userName(assignee) + '.', 'success', 'Phát checklist thành công');
    renderList(); kpis();
  }

  function removeDraft(id) {
    var i = store.find('inspections', id);
    A.confirm({
      title: 'Hủy bản nháp ' + i.code + '?',
      body: 'Đợt kiểm tra “' + i.title + '” sẽ bị gỡ khỏi danh sách kế hoạch.',
      detail: 'Chỉ bản nháp chưa phát checklist mới hủy được.',
      okText: 'Hủy bản nháp'
    }, function () {
      var db = store.read();
      db.inspections = db.inspections.filter(function (x) { return x.id !== id; });
      store.write(db);
      A.toast(i.code + ' đã được gỡ khỏi kế hoạch.', 'success');
      renderList(); kpis();
    });
  }

  function pushNotification(role, text, kind) {
    var db = store.read();
    db.notifications.unshift({ id: 'N-' + Date.now(), at: new Date().toISOString(), role: role, text: text, kind: kind || 'thông tin' });
    db.notifications = db.notifications.slice(0, 30);
    store.write(db);
  }

  /* ---------- biểu mẫu tạo / sửa ---------- */
  var modal = null;

  function fillSelects() {
    var zones = store.where('zones', function (z) { return z.active; });
    document.getElementById('fZoneInput').innerHTML = '<option value="">— Chọn khu vực —</option>' +
      zones.map(function (z) { return '<option value="' + z.id + '">' + A.esc(z.name) + '</option>'; }).join('');
    document.getElementById('fTypeInput').innerHTML = TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join('');
    document.getElementById('fInspector').innerHTML = '<option value="">— Chọn cán bộ —</option>' +
      store.where('users', function (u) { return u.active && (u.role === 'safety' || u.role === 'manager'); })
        .map(function (u) { return '<option value="' + u.id + '">' + A.esc(u.name) + ' · ' + A.esc(u.unit) + '</option>'; }).join('');
    var tpls = store.where('templates', function (t) { return t.active; });
    document.getElementById('fTemplate').innerHTML = '<option value="">— Chọn mẫu —</option>' +
      tpls.map(function (t) { return '<option value="' + t.id + '">' + A.esc(t.name) + ' (' + t.items.length + ' mục)</option>'; }).join('');

    // bộ lọc
    document.getElementById('fStatus').innerHTML = '<option value="">Mọi trạng thái</option>' + TASK.map(function (s) { return '<option>' + A.esc(s) + '</option>'; }).join('');
    document.getElementById('fZone').innerHTML = '<option value="">Mọi khu vực</option>' +
      store.list('zones').map(function (z) { return '<option value="' + z.id + '">' + A.esc(z.name) + '</option>'; }).join('');
    document.getElementById('fType').innerHTML = '<option value="">Mọi hình thức</option>' + TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join('');
  }

  function openForm(id) {
    var i = id ? store.find('inspections', id) : null;
    document.getElementById('formTitle').textContent = i ? 'Sửa đợt kiểm tra ' + i.code : 'Tạo đợt kiểm tra';
    document.getElementById('fId').value = i ? i.id : '';
    document.getElementById('fName').value = i ? i.title : '';
    document.getElementById('fZoneInput').value = i ? i.zoneId : '';
    document.getElementById('fDate').value = i ? i.date : isoDay(0);
    document.getElementById('fDate').min = isoDay(-7);
    document.getElementById('fTypeInput').value = i ? i.type : 'Định kỳ';
    document.getElementById('fInspector').value = i ? i.inspectorId : (store.sessionUser() || {}).id || '';
    document.getElementById('fTemplate').value = i ? i.templateId : '';
    document.getElementById('fFindings').value = i ? (i.findingsCount || 0) : 0;
    document.getElementById('fNote').value = i ? (i.note || '') : '';
    ['fName', 'fZoneInput', 'fDate', 'fInspector', 'fTemplate'].forEach(function (k) {
      document.getElementById(k).classList.remove('is-invalid');
    });
    previewTemplate();
    if (!modal) modal = new bootstrap.Modal(document.getElementById('formModal'));
    modal.show();
  }

  function previewTemplate() {
    var t = store.template(document.getElementById('fTemplate').value);
    var zoneId = document.getElementById('fZoneInput').value;
    document.getElementById('tplPreview').innerHTML = t
      ? '<i class="bi bi-clipboard2-check me-1"></i>' + A.esc(t.name) + ' · ' + t.items.length + ' mục: ' +
      A.esc(t.items.slice(0, 3).map(function (x) { return x.text; }).join(' · ')) + (t.items.length > 3 ? '…' : '')
      : '<i class="bi bi-dash-circle me-1"></i>Chọn mẫu để xem trước nội dung sẽ kiểm tra.';
    var hint = document.getElementById('zoneRiskHint');
    if (zoneId) {
      var zr = store.zoneRisk(zoneId);
      hint.innerHTML = '<i class="bi bi-geo-alt me-1"></i>' + A.esc(store.zoneName(zoneId)) + ': ' + zr.open +
        ' nguy cơ mở, điểm rủi ro ' + zr.score + (zr.overdue ? ' · ' + zr.overdue + ' hành động quá hạn' : '');
    } else hint.textContent = '';
  }

  function save(e) {
    e.preventDefault();
    var id = document.getElementById('fId').value;
    var name = document.getElementById('fName');
    var zone = document.getElementById('fZoneInput');
    var date = document.getElementById('fDate');
    var insp = document.getElementById('fInspector');
    var tpl = document.getElementById('fTemplate');
    var ok = true;
    [name, zone, date, insp, tpl].forEach(function (el) { el.classList.remove('is-invalid'); });

    if (name.value.trim().length < 8) { name.classList.add('is-invalid'); ok = false; }
    if (!zone.value) { zone.classList.add('is-invalid'); ok = false; }
    if (!date.value || date.value < isoDay(-7) || date.value > isoDay(60)) {
      date.classList.add('is-invalid');
      document.getElementById('fDateErr').textContent = 'Ngày kiểm tra phải trong khoảng 7 ngày trước đến 60 ngày tới.';
      ok = false;
    }
    if (!insp.value) { insp.classList.add('is-invalid'); ok = false; }
    if (!tpl.value) { tpl.classList.add('is-invalid'); ok = false; }

    // trùng lịch: cùng khu vực, cùng ngày, đang mở
    if (ok) {
      var dup = store.where('inspections', function (x) {
        return x.id !== id && x.zoneId === zone.value && x.date === date.value && ['Hoàn tất', 'Đã xem xét'].indexOf(x.status) === -1;
      })[0];
      if (dup) {
        A.confirm({
          title: 'Khu vực này đã có đợt kiểm tra trong ngày',
          body: 'Đợt ' + dup.code + ' (“' + dup.title + '”) đang mở tại cùng khu vực và ngày.',
          detail: 'Bạn vẫn có thể lưu nếu cần hai lượt kiểm tra riêng (sáng/chiều).',
          okText: 'Vẫn lưu'
        }, function () { writeRecord(id); });
        return;
      }
    }
    if (ok) writeRecord(id);
    if (!ok) A.toast('Chưa lưu: kiểm tra lại các trường tô đỏ.', 'error', 'Biểu mẫu chưa hợp lệ');
  }

  function writeRecord(id) {
    var rec = {
      title: document.getElementById('fName').value.trim(),
      zoneId: document.getElementById('fZoneInput').value,
      date: document.getElementById('fDate').value,
      type: document.getElementById('fTypeInput').value,
      inspectorId: document.getElementById('fInspector').value,
      templateId: document.getElementById('fTemplate').value,
      findingsCount: Math.max(0, Math.min(99, +document.getElementById('fFindings').value || 0)),
      note: document.getElementById('fNote').value.trim()
    };
    if (id) {
      store.update('inspections', id, rec);
      A.toast('Đã cập nhật đợt kiểm tra.', 'success');
    } else {
      rec.id = 'IN-' + Date.now().toString().slice(-6);
      rec.code = store.nextInspectionCode();
      rec.status = 'Bản nháp';
      store.insert('inspections', rec);
      A.toast('Đã tạo ' + rec.code + ' (trạng thái Bản nháp).', 'success', 'Tạo đợt kiểm tra');
      pushNotification('worker', 'Kế hoạch kiểm tra mới ' + rec.code + ' tại ' + store.zoneName(rec.zoneId) + ' ngày ' + A.date(rec.date) + '.', 'thông tin');
    }
    modal.hide();
    renderList(); kpis();
  }

  /* ---------- bộ lọc ---------- */
  function clearFilters() {
    f = { q: '', status: '', zone: '', type: '' };
    document.getElementById('q').value = '';
    document.getElementById('fStatus').value = '';
    document.getElementById('fZone').value = '';
    document.getElementById('fType').value = '';
    renderList();
  }

  /* ---------- khởi tạo ---------- */
  fillSelects();
  kpis();
  renderInsight();
  renderList();

  document.getElementById('q').addEventListener('input', A.debounce(function (e) { f.q = e.target.value; renderList(); }, 220));
  ['fStatus', 'fZone', 'fType'].forEach(function (k) {
    document.getElementById(k).addEventListener('change', function (e) {
      f[k.slice(1).toLowerCase()] = e.target.value;
      renderList();
    });
  });
  document.getElementById('clearFilter').addEventListener('click', clearFilters);
  document.getElementById('newBtn').addEventListener('click', function () { openForm(null); });
  document.getElementById('aiPlan').addEventListener('click', function () {
    if (!insight || insight.status === 'no-data') return;
    var top = insight.hotspots[0];
    openForm(null);
    document.getElementById('fName').value = 'Kiểm tra chuyên đề ' + top.name;
    document.getElementById('fZoneInput').value = top.zoneId;
    document.getElementById('fTypeInput').value = 'Chuyên đề';
    document.getElementById('fDate').value = isoDay(1);
    document.getElementById('fNote').value = insight.suggestions.slice(0, 2).join(' ');
    previewTemplate();
    A.toast('Đã nạp gợi ý từ AI-03 (mô phỏng). Bạn cần kiểm tra và lưu lại.', 'info', 'Đề xuất chỉ để tham khảo');
  });
  document.getElementById('fTemplate').addEventListener('change', previewTemplate);
  document.getElementById('fZoneInput').addEventListener('change', previewTemplate);
  document.getElementById('inspForm').addEventListener('submit', save);
})();
