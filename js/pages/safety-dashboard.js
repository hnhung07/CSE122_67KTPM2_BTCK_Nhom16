/* SCR-04 · Dashboard an toàn (SV2 – Nguyễn Thị Thảo)
   Điểm nhấn: bảng xem xét kéo–thả đổi trạng thái nguy cơ, có kiểm tra nghiệp vụ
   trước khi đóng và ghi lịch sử cho mọi lần thay đổi. */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;
  var C = window.SiteSafeCharts;
  var AI = window.SiteSafeAI;

  var COLS = [
    { key: 'queue', label: 'Hàng đợi xem xét', statuses: ['Mới tạo', 'Chờ xem xét'], icon: 'inbox', target: 'Chờ xem xét' },
    { key: 'info', label: 'Cần bổ sung thông tin', statuses: ['Cần bổ sung thông tin'], icon: 'question-circle', target: 'Cần bổ sung thông tin' },
    { key: 'confirmed', label: 'Đã xác nhận', statuses: ['Đã xác nhận'], icon: 'patch-check', target: 'Đã xác nhận' },
    { key: 'fixing', label: 'Đang khắc phục', statuses: ['Đang khắc phục'], icon: 'tools', target: 'Đang khắc phục' },
    { key: 'closed', label: 'Đã đóng / từ chối', statuses: ['Đã đóng', 'Bị từ chối'], icon: 'archive', target: 'Đã đóng' }
  ];
  var f = { q: '', level: '', zone: '', critical: false };

  function filtered() {
    return store.list('hazards').filter(function (h) {
      if (f.q) {
        var hay = (h.code + ' ' + h.title + ' ' + h.category + ' ' + store.zoneName(h.zoneId)).toLowerCase();
        if (hay.indexOf(f.q.toLowerCase()) === -1) return false;
      }
      if (f.level && h.level !== f.level) return false;
      if (f.zone && h.zoneId !== f.zone) return false;
      if (f.critical && h.level !== 'Nghiêm trọng') return false;
      return true;
    });
  }

  function kpis() {
    var s = store.summary();
    var acts = store.list('actions');
    var done = s.closed;
    var total = s.hazards;
    var cards = [
      { v: s.open, l: 'Nguy cơ đang mở', i: 'exclamation-diamond', c: 'var(--ss-tint-orange-fg)' },
      { v: s.awaitingReview, l: 'Chờ tôi xem xét', i: 'inbox', c: 'var(--ss-tint-blue-fg)' },
      { v: s.criticalOpen, l: 'Mức Nghiêm trọng', i: 'fire', c: 'var(--ss-tint-red-fg)' },
      { v: s.actionsOverdue, l: 'Hành động quá hạn', i: 'alarm', c: 'var(--ss-tint-red-fg)' },
      { v: s.inspectionsOpen, l: 'Đợt kiểm tra đang mở', i: 'calendar2-check', c: 'var(--ss-teal-700)' },
      { v: (total ? Math.round(done / total * 100) : 0) + '%', l: 'Tỷ lệ đã đóng', i: 'patch-check', c: 'var(--ss-tint-green-fg)' }
    ];
    document.getElementById('kpis').innerHTML = cards.map(function (c) {
      return '<div class="col-6 col-lg-2"><div class="card h-100"><div class="card-body ss-kpi">' +
        '<div class="d-flex justify-content-between align-items-start"><span class="ss-kpi-value" style="color:' + c.c + '">' + c.v + '</span>' +
        '<span class="ss-kpi-icon"><i class="bi bi-' + c.i + '"></i></span></div><div class="ss-kpi-label">' + c.l + '</div></div></div></div>';
    }).join('');
  }

  function tile(h) {
    var age = Math.max(0, Math.round((Date.now() - new Date(h.createdAt)) / 864e5));
    return '<a class="ss-tile lv-' + A.cls(h.level) + ' text-decoration-none d-block" draggable="true" data-id="' + h.id + '"' +
      ' href="safety-hazard-detail.html?id=' + h.id + '" aria-label="' + A.esc(h.code + ' ' + h.title) + '">' +
      '<div class="d-flex justify-content-between align-items-start gap-2">' +
      '<span class="ss-row-code">' + A.esc(h.code) + '</span>' + A.levelBadge(h.level) + '</div>' +
      '<div class="ss-row-title small mt-1">' + A.esc(h.title) + '</div>' +
      '<div class="ss-row-meta mt-1"><i class="bi bi-geo-alt me-1"></i>' + A.esc(store.zoneName(h.zoneId).replace('Công trình ', '')) + '</div>' +
      '<div class="d-flex justify-content-between align-items-center ss-row-meta mt-1">' +
      '<span>' + age + ' ngày chờ</span>' +
      '<span>' + (h.evidence.length ? '<i class="bi bi-image"></i> ' + h.evidence.length + ' ' : '') +
      (h.stopWork ? '<span class="ss-badge ss-overdue" style="font-size:.65rem">Đề xuất dừng việc</span>' : '') + '</span></div></a>';
  }

  function board() {
    var rows = filtered();
    document.getElementById('boardCount').innerHTML = '<strong>' + rows.length + '</strong> báo cáo khớp bộ lọc';
    document.getElementById('board').innerHTML = COLS.map(function (c) {
      var items = rows.filter(function (h) { return c.statuses.indexOf(h.status) !== -1; })
        .sort(function (a, b) { return (store.LEVEL_WEIGHT[b.level] || 0) - (store.LEVEL_WEIGHT[a.level] || 0); });
      return '<section class="ss-col" data-col="' + c.key + '" aria-label="Cột ' + A.esc(c.label) + '">' +
        '<div class="ss-col-head"><i class="bi bi-' + c.icon + '"></i>' + A.esc(c.label) +
        '<span class="badge rounded-pill bg-secondary ms-auto">' + items.length + '</span></div>' +
        '<div class="ss-col-body">' +
        (items.length ? items.map(tile).join('') :
          '<div class="small text-muted-soft text-center py-3">' + (c.key === 'queue' ? 'Hàng đợi đang trống.' : 'Không có báo cáo nào ở đây.') + '</div>') +
        '</div></section>';
    }).join('');
    wireDnd();
  }

  function wireDnd() {
    var dragged = null;
    document.querySelectorAll('#board .ss-tile').forEach(function (t) {
      t.addEventListener('dragstart', function (e) {
        dragged = t.getAttribute('data-id');
        t.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', dragged); } catch (err) { /* IE */ }
      });
      t.addEventListener('dragend', function () {
        t.classList.remove('dragging');
        document.querySelectorAll('.ss-col.is-over').forEach(function (c) { c.classList.remove('is-over'); });
      });
    });
    document.querySelectorAll('#board .ss-col').forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('is-over'); e.dataTransfer.dropEffect = 'move'; });
      col.addEventListener('dragleave', function () { col.classList.remove('is-over'); });
      col.addEventListener('drop', function (e) {
        e.preventDefault();
        col.classList.remove('is-over');
        var id = dragged || e.dataTransfer.getData('text/plain');
        var target = COLS.filter(function (c) { return c.key === col.getAttribute('data-col'); })[0].target;
        if (id) move(id, target);
        dragged = null;
      });
    });
  }

  function move(id, status) {
    var h = store.hazard(id);
    if (!h) return;
    if (h.status === status) { A.toast('Báo cáo ' + h.code + ' đã ở cột này.', 'info'); return; }

    if (status === 'Đã đóng') {
      var acts = store.actionsOfHazard(id);
      var unfinished = acts.filter(function (a) { return a.status !== 'Hoàn thành'; });
      if (acts.length && unfinished.length) {
        A.toast('Chưa đóng được: ' + unfinished.length + ' hành động khắc phục chưa hoàn thành (' + unfinished[0].code + ').', 'error', 'Kiểm tra nghiệp vụ');
        return;
      }
      A.confirm({
        title: 'Đóng báo cáo ' + h.code + '?',
        body: 'Báo cáo sẽ chuyển sang “Đã đóng” và hiển thị cho người báo.',
        detail: acts.length ? 'Hành động liên quan: ' + acts.map(function (a) { return a.code; }).join(', ') : 'Không có hành động khắc phục nào được giao.',
        okText: 'Đóng báo cáo'
      }, function () { apply(h, 'Đã đóng'); });
      return;
    }
    apply(h, status);
  }

  function apply(h, status) {
    var me = store.sessionUser();
    store.update('hazards', h.id, { status: status, reviewerId: me.id });
    store.addHistory(h.id, { actor: me.name, action: 'Chuyển ' + status, note: 'Cập nhật từ bảng xem xét nhanh' });
    store.insert('notifications', {
      id: 'N-' + Date.now(), at: new Date().toISOString(), role: 'worker',
      kind: status === 'Đã đóng' ? 'thông tin' : 'nhắc việc',
      text: 'Báo cáo ' + h.code + ' của bạn vừa chuyển sang “' + status + '”'
    });
    if (status === 'Đã xác nhận') {
      A.toast(h.code + ' đã xác nhận. Hãy giao hành động khắc phục.', 'success', 'Đã xác nhận');
    } else {
      A.toast('Đã chuyển ' + h.code + ' sang “' + status + '”.', 'success', 'Trạng thái cập nhật');
    }
    refresh();
  }

  function charts() {
    var open = store.list('hazards').filter(store.isOpenHazard);
    C.donut(document.getElementById('chartLevel'),
      store.read().statuses.level.map(function (lv) {
        return { label: lv, value: open.filter(function (h) { return h.level === lv; }).length };
      }).filter(function (x) { return x.value; }), { centerLabel: 'đang mở' });

    var byCat = store.tally(open, 'category');
    var rows = Object.keys(byCat).map(function (k) { return { label: k, value: byCat[k] }; })
      .sort(function (a, b) { return b.value - a.value; }).slice(0, 6);
    C.bars(document.getElementById('chartCategory'), rows, { aria: 'Nhóm nguy cơ đang mở nhiều nhất' });
  }

  function overdue() {
    var rows = store.where('actions', function (a) { return store.isOverdue(a); })
      .sort(function (a, b) { return new Date(a.dueDate) - new Date(b.dueDate); });
    var host = document.getElementById('overdueList');
    if (!rows.length) {
      host.innerHTML = A.empty('check2-circle', 'Không có hành động quá hạn', 'Toàn bộ hành động khắc phục đang trong hạn xử lý.');
      return;
    }
    host.innerHTML = rows.slice(0, 6).map(function (a) {
      var late = -A.daysTo(a.dueDate);
      return '<div class="d-flex gap-2 align-items-start border-bottom py-2" style="border-color:var(--ss-line)">' +
        '<span class="ss-item-num ss-badge-red">' + late + '</span>' +
        '<div class="flex-grow-1"><div class="small fw-semibold">' + A.esc(a.title) + '</div>' +
        '<div class="ss-row-meta">' + A.esc(a.code) + ' · ' + A.esc(store.userName(a.ownerId)) + ' · hạn ' + A.date(a.dueDate) + '</div></div>' +
        '<a class="btn btn-ghost btn-sm" href="../manager/manager-corrective-actions.html?focus=' + a.id + '" title="Mở bảng hành động"><i class="bi bi-box-arrow-up-right"></i></a></div>';
    }).join('') + (rows.length > 6 ? '<div class="small text-muted-soft mt-2">Còn ' + (rows.length - 6) + ' hành động khác trong bảng khắc phục.</div>' : '');
  }

  function queue() {
    var rows = store.where('hazards', function (h) { return ['Mới tạo', 'Chờ xem xét'].indexOf(h.status) !== -1; })
      .sort(function (a, b) { return new Date(a.createdAt) - new Date(b.createdAt); }).slice(0, 6);
    var host = document.getElementById('queueList');
    if (!rows.length) {
      host.innerHTML = '<div class="card-body">' + A.empty('check2-all', 'Hàng đợi trống', 'Không còn báo cáo nào chờ xem xét.') + '</div>';
      return;
    }
    host.innerHTML = '<div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead><tr>' +
      '<th scope="col">Mã</th><th scope="col">Tiêu đề</th><th scope="col">Khu vực</th><th scope="col">Mức độ</th><th scope="col">Chờ</th><th scope="col"></th></tr></thead><tbody>' +
      rows.map(function (h) {
        var days = Math.floor((Date.now() - new Date(h.createdAt)) / 864e5);
        return '<tr><td class="ss-row-code">' + A.esc(h.code) + '</td>' +
          '<td class="ss-row-title">' + A.esc(h.title) + '</td>' +
          '<td class="small">' + A.esc(store.zoneName(h.zoneId)) + '</td>' +
          '<td>' + A.levelBadge(h.level) + '</td>' +
          '<td>' + (days > 2 ? '<span class="ss-badge ss-overdue">' + days + ' ngày</span>' : '<span class="small">' + days + ' ngày</span>') + '</td>' +
          '<td class="text-end"><a class="btn btn-soft btn-sm" href="safety-hazard-detail.html?id=' + h.id + '">Xem xét</a></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function hotspot() {
    var r = AI.hotspot({ days: 30 });
    var host = document.getElementById('hotspot');
    if (r.status === 'no-data') {
      host.innerHTML = '<div class="ss-empty"><i class="bi bi-graph-up-arrow"></i><div class="small mt-2">' + A.esc(r.message) + '</div></div>';
      return;
    }
    host.innerHTML = '<ul class="ss-ai-reason ps-3 mb-3">' + r.narrative.slice(0, 3).map(function (x) { return '<li>' + A.esc(x) + '</li>'; }).join('') + '</ul>' +
      '<div style="display:grid;gap:8px">' + r.hotspots.slice(0, 3).map(function (z, i) {
        return '<div><div class="d-flex justify-content-between small mb-1"><span>' + (i + 1) + '. ' + A.esc(z.name) + '</span><strong>' + z.score + '</strong></div>' +
          '<div class="progress" style="height:8px"><div class="progress-bar" style="width:' + Math.min(100, z.score * 5) + '%;background:' +
          C.LEVEL_COLOR[z.band.level] + '"></div></div></div>';
      }).join('') + '</div>' +
      '<div class="ss-ai-note mt-3"><i class="bi bi-cpu me-1"></i>' + A.esc(r.engine) + '.</div>' +
      '<a class="btn btn-soft btn-sm mt-2" href="../manager/manager-zone-risk-map.html"><i class="bi bi-geo-alt me-1"></i>Mở bản đồ rủi ro</a>';
  }

  function refresh() {
    kpis();
    board();
    charts();
    overdue();
    queue();
    hotspot();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var levels = store.read().statuses.level;
    document.getElementById('fLevel').innerHTML = '<option value="">Mọi mức độ</option>' + levels.map(function (l) { return '<option>' + l + '</option>'; }).join('');
    document.getElementById('fZone').innerHTML = '<option value="">Mọi khu vực</option>' + store.list('zones').filter(function (z) { return z.active; })
      .map(function (z) { return '<option value="' + z.id + '">' + A.esc(z.name) + '</option>'; }).join('');

    document.getElementById('q').addEventListener('input', A.debounce(function (e) { f.q = e.target.value; board(); }, 200));
    document.getElementById('fLevel').addEventListener('change', function (e) { f.level = e.target.value; board(); });
    document.getElementById('fZone').addEventListener('change', function (e) { f.zone = e.target.value; board(); });
    document.getElementById('fCritical').addEventListener('change', function (e) { f.critical = e.target.checked; board(); });

    refresh();
  });
})();
