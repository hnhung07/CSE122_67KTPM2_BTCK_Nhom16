/* SCR-03 · Danh sách nguy cơ của tôi (SV1 – Lê Thị Mai Ngọc)
   Tìm kiếm, lọc, sắp xếp, theo dõi lịch sử xử lý và bổ sung thông tin khi được yêu cầu. */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;
  var EDITS = ['Mới tạo', 'Chờ xem xét', 'Cần bổ sung thông tin'];
  var expanded = {};
  var f = { q: '', status: '', level: '', zone: '', sort: 'new', quick: 'all' };

  function me() { return store.session(); }
  function mine() { return store.where('hazards', function (h) { return h.reporterId === me().userId; }); }

  function kpis() {
    var rows = mine();
    var open = rows.filter(store.isOpenHazard);
    var cards = [
      { v: rows.length, l: 'Báo cáo đã gửi', i: 'megaphone', c: 'var(--ss-teal-700)' },
      { v: open.length, l: 'Đang xử lý', i: 'arrow-repeat', c: '#2b5da8' },
      { v: open.filter(function (h) { return h.status === 'Chờ xem xét' || h.status === 'Mới tạo'; }).length, l: 'Chờ cán bộ an toàn', i: 'hourglass-split', c: '#92670a' },
      { v: rows.filter(function (h) { return h.status === 'Cần bổ sung thông tin'; }).length, l: 'Cần bạn bổ sung', i: 'exclamation-circle', c: '#a82d3b' },
      { v: rows.filter(function (h) { return h.status === 'Đã đóng'; }).length, l: 'Đã đóng', i: 'patch-check', c: '#1d7a4c' }
    ];
    document.getElementById('kpis').innerHTML = cards.map(function (c) {
      return '<div class="col-6 col-lg"><div class="card h-100"><div class="card-body ss-kpi">' +
        '<div class="ss-kpi-value" style="color:' + c.c + '">' + c.v + '</div><div class="ss-kpi-label"><i class="bi bi-' + c.i + ' me-1"></i>' + c.l + '</div>' +
        '</div></div></div>';
    }).join('');
  }

  function filtered() {
    var q = A.qs('show');
    return mine().filter(function (h) {
      if (f.q) {
        var hay = (h.code + ' ' + h.title + ' ' + h.description + ' ' + h.category).toLowerCase();
        if (hay.indexOf(f.q.toLowerCase()) === -1) return false;
      }
      if (f.status && h.status !== f.status) return false;
      if (f.level && h.level !== f.level) return false;
      if (f.zone && h.zoneId !== f.zone) return false;
      if (f.quick === 'open' && !store.isOpenHazard(h)) return false;
      if (f.quick === 'stuck' && !['Chờ xem xét', 'Mới tạo'].includes(h.status)) return false;
      if (f.quick === 'mine' && h.status !== 'Cần bổ sung thông tin') return false;
      return true;
    }).sort(function (a, b) {
      if (f.sort === 'old') return new Date(a.createdAt) - new Date(b.createdAt);
      if (f.sort === 'level') return (store.LEVEL_WEIGHT[b.level] || 0) - (store.LEVEL_WEIGHT[a.level] || 0);
      if (f.sort === 'zone') return store.zoneName(a.zoneId).localeCompare(store.zoneName(b.zoneId));
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function card(h) {
    var canEdit = EDITS.indexOf(h.status) !== -1;
    var acts = store.actionsOfHazard(h.id);
    var openAct = acts.filter(function (a) { return a.status !== 'Hoàn thành'; });
    var late = (h.history || []).filter(function (e) { return e.actor !== me().name && e.note; }).slice(-1)[0];
    var isExp = !!expanded[h.id];
    return '<div class="card mb-3" data-card="' + h.id + '"><div class="card-body">' +
      '<div class="d-flex flex-wrap justify-content-between gap-2 align-items-start">' +
      '<div class="flex-grow-1" style="min-width:220px">' +
      '<div class="d-flex flex-wrap gap-2 align-items-center mb-1"><span class="ss-row-code">' + A.esc(h.code) + '</span>' +
      A.statusBadge(h.status) + A.levelBadge(h.level) + '</div>' +
      '<h2 class="h6 mb-1">' + A.esc(h.title) + '</h2>' +
      '<div class="ss-row-meta"><i class="bi bi-geo-alt me-1"></i>' + A.esc(store.zoneName(h.zoneId)) +
      ' · gửi ' + A.date(h.createdAt) + ' · cập nhật ' + A.timeAgo(h.updatedAt) +
      (h.evidence.length ? ' · <i class="bi bi-image"></i> ' + h.evidence.length : '') + '</div></div>' +
      '<div class="d-flex flex-column gap-1 align-items-end">' +
      (canEdit ? '<button class="btn btn-soft btn-sm" data-edit="' + h.id + '"><i class="bi bi-pencil me-1"></i>Bổ sung thông tin</button>' :
        '<span class="ss-row-meta"><i class="bi bi-lock me-1"></i>Không còn chỉnh sửa</span>') +
      '<button class="btn btn-ghost btn-sm" data-toggle="' + h.id + '" aria-expanded="' + isExp + '">' +
      (isExp ? 'Thu gọn' : 'Xem lịch sử xử lý') + ' <i class="bi bi-chevron-' + (isExp ? 'up' : 'down') + '"></i></button>' +
      '</div></div>' +

      (late && !isExp ? '<div class="alert mt-3 mb-0 py-2 small" style="background:var(--ss-teal-50);border:1px solid var(--ss-teal-100)">' +
        '<i class="bi bi-chat-left-quote me-1" style="color:var(--ss-teal-700)"></i><strong>' + A.esc(late.actor) + ':</strong> ' + A.esc(late.note) + '</div>' : '') +

      '<div class="mt-3' + (isExp ? '' : ' d-none') + '" data-detail="' + h.id + '">' +
      '<hr>' +
      '<div class="row g-3">' +
      '<div class="col-lg-7"><div class="ss-section-title mb-2">Diễn biến xử lý</div>' +
      '<div class="ss-timeline">' + (h.history || []).slice().reverse().map(function (e, i) {
        return '<div class="ss-tl-item' + (i === 0 ? ' is-latest' : '') + '"><div class="fw-semibold small">' + A.esc(e.action) +
          '</div><div class="ss-tl-when">' + A.datetime(e.at) + ' · ' + A.esc(e.actor) + '</div>' +
          (e.note ? '<div class="small">' + A.esc(e.note) + '</div>' : '') + '</div>';
      }).join('') + '</div></div>' +
      '<div class="col-lg-5">' +
      '<div class="ss-section-title mb-2">Hành động khắc phục liên quan</div>' +
      (acts.length ? acts.map(function (a) {
        return '<div class="ss-item mb-2"><div class="d-flex justify-content-between gap-2"><div class="small fw-semibold">' + A.esc(a.title) + '</div>' +
          A.statusBadge(a.status) + '</div><div class="ss-row-meta">' + A.esc(store.userName(a.ownerId)) + ' · hạn ' + A.date(a.dueDate) +
          (store.isOverdue(a) ? ' <span class="ss-badge ss-overdue ms-1">Quá hạn</span>' : '') + '</div>' +
          '<div class="progress mt-2" style="height:6px"><div class="progress-bar" style="width:' + a.progress + '%"></div></div></div>';
      }).join('') : '<div class="small text-muted-soft">Chưa có hành động khắc phục nào được giao cho báo cáo này.</div>') +
      (h.evidence.length ? '<div class="ss-section-title mt-3 mb-2">Ảnh minh chứng bạn đã gửi</div><div class="row g-2">' +
        h.evidence.map(function (img, i) {
          return '<div class="col-4"><figure class="ss-thumb mb-0"><img src="' + img.dataUrl + '" alt="Ảnh minh chứng ' + (i + 1) + ' của ' + A.esc(h.code) + '"></figure></div>';
        }).join('') + '</div>' : '') +
      (h.aiSuggestion ? '<div class="ss-ai mt-3"><div class="ss-ai-head"><i class="bi bi-magic ss-ai-spark"></i><strong class="small">Đề xuất phân loại ban đầu</strong>' +
        '<span class="ss-ai-badge ms-auto">Mô phỏng</span></div><div class="ss-ai-body py-2">' +
        '<div class="small">' + A.esc(h.aiSuggestion.category) + ' · ' + A.esc(h.aiSuggestion.level) + ' · độ tin cậy ' + Math.round(h.aiSuggestion.confidence * 100) + '%</div>' +
        '<div class="ss-ai-note mt-1">' + (h.aiSuggestion.applied ? 'Bạn đã chấp nhận đề xuất.' : h.aiSuggestion.dismissed ? 'Bạn đã bỏ qua đề xuất này.' : 'Cán bộ an toàn có thể điều chỉnh.') + '</div>' +
        '</div></div>' : '') +
      '</div></div></div></div></div>';
  }

  function render() {
    var host = document.getElementById('list');
    var rows = filtered();
    document.getElementById('resultCount').innerHTML = 'Hiển thị <strong>' + rows.length + '</strong> / ' + mine().length + ' báo cáo của ' + A.esc(me().name);
    if (!mine().length) {
      host.innerHTML = '<div class="card"><div class="card-body">' +
        A.empty('megaphone', 'Bạn chưa gửi báo cáo nguy cơ nào', 'Khi phát hiện nguy cơ ở hiện trường, hãy tạo báo cáo kèm ảnh để cán bộ an toàn xử lý.',
          '<a class="btn btn-primary btn-sm" href="worker-hazard-create.html"><i class="bi bi-plus-lg me-1"></i>Tạo báo cáo đầu tiên</a>') + '</div></div>';
      return;
    }
    if (!rows.length) {
      host.innerHTML = '<div class="card"><div class="card-body">' +
        A.empty('search', 'Không có kết quả khớp bộ lọc', 'Thử đổi từ khóa, xóa bớt bộ lọc hoặc chọn “Tất cả”.',
          '<button class="btn btn-soft btn-sm" data-reset-from-empty><i class="bi bi-arrow-counterclockwise me-1"></i>Xóa bộ lọc</button>') + '</div></div>';
      return;
    }
    host.innerHTML = rows.map(card).join('');
  }

  function wireFilters() {
    var st = store.read().statuses;
    document.getElementById('fStatus').innerHTML = '<option value="">Tất cả trạng thái</option>' + st.hazard.map(function (s) { return '<option>' + s + '</option>'; }).join('');
    document.getElementById('fLevel').innerHTML = '<option value="">Tất cả mức độ</option>' + st.level.map(function (s) { return '<option>' + s + '</option>'; }).join('');
    var zones = store.list('zones').filter(function (z) { return z.active; });
    document.getElementById('fZone').innerHTML = '<option value="">Tất cả khu vực</option>' + zones.map(function (z) { return '<option value="' + z.id + '">' + A.esc(z.name) + '</option>'; }).join('');

    document.getElementById('q').addEventListener('input', A.debounce(function (e) { f.q = e.target.value; render(); }, 220));
    document.getElementById('clearQ').addEventListener('click', function () { document.getElementById('q').value = ''; f.q = ''; render(); });
    ['fStatus', 'fLevel', 'fZone', 'fSort'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function (e) {
        f[{ fStatus: 'status', fLevel: 'level', fZone: 'zone', fSort: 'sort' }[id]] = e.target.value;
        render();
      });
    });
    document.getElementById('quickFilters').addEventListener('click', function (e) {
      var b = e.target.closest('[data-quick]');
      if (!b) return;
      f.quick = b.getAttribute('data-quick');
      this.querySelectorAll('.nav-link').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      render();
    });
    document.getElementById('resetFilters').addEventListener('click', reset);
    document.getElementById('list').addEventListener('click', function (e) {
      if (e.target.closest('[data-reset-from-empty]')) return reset();
      var t = e.target.closest('[data-toggle]');
      if (t) {
        var id = t.getAttribute('data-toggle');
        expanded[id] = !expanded[id];
        render();
        return;
      }
      var ed = e.target.closest('[data-edit]');
      if (ed) openEdit(ed.getAttribute('data-edit'));
    });
  }

  function reset() {
    f = { q: '', status: '', level: '', zone: '', sort: 'new', quick: 'all' };
    document.getElementById('q').value = '';
    ['fStatus', 'fLevel', 'fZone'].forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('fSort').value = 'new';
    document.querySelectorAll('#quickFilters .nav-link').forEach(function (x, i) { x.classList.toggle('active', i === 0); });
    render();
    A.toast('Đã xóa toàn bộ bộ lọc.', 'info');
  }

  /* ---- bổ sung thông tin khi cán bộ an toàn yêu cầu ---- */
  var editing = null;
  var modal;

  function openEdit(id) {
    var h = store.hazard(id);
    editing = h;
    document.getElementById('eTitle').value = h.title;
    document.getElementById('eDesc').value = h.description;
    document.getElementById('eNote').value = '';
    document.getElementById('editWhy').innerHTML = h.status === 'Cần bổ sung thông tin' ?
      '<i class="bi bi-exclamation-triangle me-1"></i>Cán bộ an toàn yêu cầu bổ sung: ' +
      A.esc(((h.history || []).slice(-1)[0] || {}).note || 'hãy mô tả chi tiết hơn') :
      'Báo cáo còn ở giai đoạn chờ xem xét nên bạn được phép chỉnh sửa nội dung.';
    document.getElementById('editForm').classList.remove('was-validated');
    modal = modal || new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
  }

  function submitEdit(e) {
    e.preventDefault();
    var form = document.getElementById('editForm');
    var title = document.getElementById('eTitle');
    var desc = document.getElementById('eDesc');
    var note = document.getElementById('eNote').value.trim();
    var bad = false;
    [title, desc].forEach(function (i) {
      var ok = i.value.trim().length >= (i === title ? 6 : 25);
      i.classList.toggle('is-invalid', !ok);
      bad = bad || !ok;
    });
    if (bad) { A.toast('Kiểm tra lại các trường tô đỏ.', 'error', 'Chưa hợp lệ'); return; }

    var patch = { title: title.value.trim(), description: desc.value.trim() };
    if (editing.status === 'Cần bổ sung thông tin') patch.status = 'Chờ xem xét';
    store.update('hazards', editing.id, patch);
    store.addHistory(editing.id, {
      actor: me().name, action: editing.status === 'Cần bổ sung thông tin' ? 'Bổ sung thông tin' : 'Chỉnh sửa nội dung',
      note: note || 'Cập nhật mô tả từ màn hình hiện trường'
    });
    if (editing.status === 'Cần bổ sung thông tin') {
      store.insert('notifications', { id: 'N-' + Date.now(), at: new Date().toISOString(), role: 'safety', kind: 'thông tin', text: editing.code + ' đã được bổ sung thông tin, quay lại hàng đợi xem xét' });
    }
    modal.hide();
    render();
    kpis();
    A.toast('Đã gửi nội dung bổ sung.', 'success', 'Đã cập nhật');
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireFilters();
    kpis();
    document.getElementById('editForm').addEventListener('submit', submitEdit);

    var show = A.qs('show');
    if (show) expanded[show] = true;
    render();
    if (show) {
      var box = document.querySelector('[data-card="' + show + '"]');
      if (box) {
        box.style.outline = '2px solid var(--ss-teal-500)';
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function () { box.style.outline = ''; }, 2600);
      }
    }
  });
})();
