/* SCR-08 · Hành động khắc phục (SV3 – Đỗ Hồng Nhung)
   Quản lý theo dõi hạn xử lý, cập nhật tiến độ, xác nhận hoàn thành và
   đóng nguy cơ sau khi toàn bộ hành động của báo cáo đã xong. */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;
  var C = window.SiteSafeCharts;

  var ACT = store.read().statuses.action;
  var NEXT = {
    'Chưa bắt đầu': ['Đang thực hiện', 'Chờ xác nhận'],
    'Đang thực hiện': ['Chờ xác nhận', 'Chưa bắt đầu'],
    'Chờ xác nhận': ['Hoàn thành', 'Đang thực hiện'],
    'Hoàn thành': []
  };
  var f = { q: '', status: '', owner: '', zone: '', overdue: false, hideDone: true, sort: 'due', group: 'none' };
  var focusId = A.qs('focus');

  function list() {
    var rows = store.where('actions', function (a) {
      if (f.hideDone && a.status === 'Hoàn thành') return false;
      if (f.status && a.status !== f.status) return false;
      if (f.owner && a.ownerId !== f.owner) return false;
      if (f.zone && a.zoneId !== f.zone) return false;
      if (f.overdue && !store.isOverdue(a)) return false;
      if (f.q) {
        var h = store.hazard(a.hazardId);
        var hay = (a.code + ' ' + a.title + ' ' + (a.note || '') + ' ' + store.userName(a.ownerId) + ' ' +
          store.zoneName(a.zoneId) + ' ' + (h ? h.code + ' ' + h.title : '')).toLowerCase();
        if (hay.indexOf(f.q.toLowerCase()) === -1) return false;
      }
      return true;
    });
    rows.sort(function (a, b) {
      if (f.sort === 'late') return a.dueDate.localeCompare(b.dueDate);
      if (f.sort === 'progress') return a.progress - b.progress;
      if (f.sort === 'level') {
        var ha = store.hazard(a.hazardId), hb = store.hazard(b.hazardId);
        return (store.LEVEL_WEIGHT[hb ? hb.level : ''] || 0) - (store.LEVEL_WEIGHT[ha ? ha.level : ''] || 0) || a.dueDate.localeCompare(b.dueDate);
      }
      return a.dueDate.localeCompare(b.dueDate);
    });
    return rows;
  }

  function isoDay(offset) {
    var d = new Date(Date.now() + (offset || 0) * 864e5);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  /* ---------- KPI ---------- */
  function kpis() {
    var all = store.list('actions');
    var open = all.filter(function (a) { return a.status !== 'Hoàn thành'; });
    var late = open.filter(store.isOverdue);
    var wait = all.filter(function (a) { return a.status === 'Chờ xác nhận'; });
    var doneRate = all.length ? Math.round(all.filter(function (a) { return a.status === 'Hoàn thành'; }).length / all.length * 100) : 0;
    var avg = open.length ? Math.round(open.reduce(function (t, a) { return t + a.progress; }, 0) / open.length) : 0;
    var cards = [
      { v: all.length, l: 'Tổng hành động', i: 'list-task', c: 'var(--ss-teal-700)' },
      { v: open.length, l: 'Chưa hoàn thành', i: 'hourglass-split', c: '#2b5da8' },
      { v: late.length, l: 'Quá hạn', i: 'alarm', c: '#a82d3b' },
      { v: wait.length, l: 'Chờ tôi xác nhận', i: 'hand-thumbs-up', c: '#92670a' },
      { v: avg + '%', l: 'Tiến độ trung bình', i: 'graph-up-arrow', c: '#b0521b' },
      { v: doneRate + '%', l: 'Tỷ lệ đóng việc', i: 'patch-check', c: '#1d7a4c' }
    ];
    document.getElementById('kpis').innerHTML = cards.map(function (c) {
      return '<div class="col-6 col-xl-2"><div class="card h-100"><div class="card-body ss-kpi">' +
        '<div class="d-flex justify-content-between align-items-start"><span class="ss-kpi-value" style="color:' + c.c + '">' + c.v + '</span>' +
        '<span class="ss-kpi-icon"><i class="bi bi-' + c.i + '"></i></span></div><div class="ss-kpi-label">' + c.l + '</div></div></div></div>';
    }).join('');
  }

  /* ---------- hàng mục ---------- */
  function row(a) {
    var h = store.hazard(a.hazardId);
    var late = store.isOverdue(a);
    var left = A.daysTo(a.dueDate);
    var statusOpts = [a.status].concat(NEXT[a.status] || []).map(function (x) {
      return '<option value="' + A.esc(x) + '"' + (x === a.status ? ' selected' : '') + '>' + A.esc(x) + '</option>';
    }).join('');
    return '<tr data-row="' + a.id + '"' + (a.id === focusId ? ' class="table-warning"' : '') + '>' +
      '<td><span class="ss-row-code">' + A.esc(a.code) + '</span>' + (a.id === focusId ? ' <span class="ss-badge ss-st-Chờxemxét">Đang xem</span>' : '') +
      '<div class="ss-row-title">' + A.esc(a.title) + '</div>' +
      (h ? '<div class="ss-row-meta"><a href="manager-safety-report.html?zone=' + A.esc(a.zoneId) + '">' + A.esc(h.code) + '</a> · ' +
        A.levelBadge(h.level) + ' ' + A.statusBadge(h.status) + '</div>' : '<div class="ss-row-meta text-muted-soft">nguy cơ gốc đã bị xoá</div>') +
      (a.note ? '<div class="small text-muted-soft mt-1"><i class="bi bi-chat-left-text me-1"></i>' + A.esc(a.note) + '</div>' : '') + '</td>' +
      '<td class="small"><span class="d-flex align-items-center gap-2"><span class="ss-avatar">' + A.esc(A.initials(store.userName(a.ownerId))) + '</span>' +
      A.esc(store.userName(a.ownerId)) + '</span><div class="ss-row-meta">' + A.esc((store.user(a.ownerId) || {}).unit || '') + '</div></td>' +
      '<td class="small">' + A.esc(store.zoneName(a.zoneId)) + '</td>' +
      '<td class="small">' + A.date(a.dueDate) +
      (late ? '<div><span class="ss-badge ss-overdue">Trễ ' + Math.abs(left) + ' ngày</span></div>'
        : left <= 2 && a.status !== 'Hoàn thành' ? '<div><span class="ss-badge ss-st-Cầnbổsungthôngtin">Còn ' + left + ' ngày</span></div>'
          : '<div class="ss-row-meta">' + (a.status === 'Hoàn thành' ? 'đã xong' : 'còn ' + left + ' ngày') + '</div>') + '</td>' +
      '<td style="min-width:150px"><label class="visually-hidden" for="p_' + a.id + '">Tiến độ ' + A.esc(a.code) + '</label>' +
      '<div class="progress" style="height:8px"><div class="progress-bar" style="width:' + a.progress + '%"></div></div>' +
      '<div class="d-flex justify-content-between ss-row-meta"><span>' + a.progress + '%</span><span>' + A.timeAgo(a.updatedAt) + '</span></div>' +
      '<input type="range" class="form-range" min="0" max="100" step="5" value="' + a.progress + '" id="p_' + a.id + '" data-prog="' + a.id + '"></td>' +
      '<td><label class="visually-hidden" for="s_' + a.id + '">Trạng thái ' + A.esc(a.code) + '</label>' +
      '<select class="form-select form-select-sm" id="s_' + a.id + '" data-status="' + a.id + '">' + statusOpts + '</select></td>' +
      '<td class="text-end"><div class="ss-steps justify-content-end">' +
      (a.status === 'Chờ xác nhận' ? '<button class="btn btn-soft btn-sm py-0" data-verify="' + a.id + '"><i class="bi bi-patch-check me-1"></i>Xác nhận hoàn thành</button>' : '') +
      '<button class="btn btn-ghost btn-sm py-0" data-edit="' + a.id + '" aria-label="Sửa ' + A.esc(a.code) + '"><i class="bi bi-pencil"></i></button>' +
      '</div></td></tr>';
  }

  function render() {
    var host = document.getElementById('listHost');
    var rows = list();
    document.getElementById('rowCount').textContent = rows.length + '/' + store.list('actions').length + ' việc';
    if (!rows.length) {
      host.innerHTML = A.empty('check2-all', 'Không còn việc nào khớp bộ lọc',
        'Thử bỏ bớt điều kiện lọc, hoặc tắt chế độ ẩn việc đã hoàn thành.',
        '<button class="btn btn-ghost btn-sm mt-1" data-clear>Xóa bộ lọc</button>');
      var b = host.querySelector('[data-clear]');
      if (b) b.addEventListener('click', clearFilters);
      return;
    }

    var head = '<thead><tr><th scope="col">Việc cần làm</th><th scope="col">Phụ trách</th>' +
      '<th scope="col d-none d-lg-table-cell">Khu vực</th><th scope="col">Hạn</th><th scope="col">Tiến độ</th>' +
      '<th scope="col">Trạng thái</th><th scope="col" class="text-end">Thao tác</th></tr></thead>';

    var body;
    if (f.group === 'none') {
      body = '<tbody>' + rows.map(row).join('') + '</tbody>';
    } else {
      var keyFn = f.group === 'owner' ? function (a) { return a.ownerId; } : function (a) { return a.zoneId; };
      var groups = {};
      rows.forEach(function (a) { var k = keyFn(a); (groups[k] = groups[k] || []).push(a); });
      body = Object.keys(groups).map(function (k) {
        var g = groups[k];
        var late = g.filter(store.isOverdue).length;
        var label = f.group === 'owner' ? store.userName(k) : store.zoneName(k);
        return '<tbody><tr><th colspan="7" scope="colgroup" style="background:var(--ss-teal-50);text-align:left;font-size:.82rem">' +
          '<i class="bi bi-' + (f.group === 'owner' ? 'person-workspace' : 'geo-alt') + ' me-1"></i>' + A.esc(label) +
          ' <span class="ss-row-meta">· ' + g.length + ' việc' + (late ? ' · <span class="text-danger">' + late + ' quá hạn</span>' : '') + '</span></th></tr>' +
          g.map(row).join('') + '</tbody>';
      }).join('');
    }
    host.innerHTML = '<div class="table-responsive"><table class="table table-hover align-middle mb-0">' + head + body + '</table></div>';
    wireRows();

    if (focusId) {
      var el = host.querySelector('[data-row="' + focusId + '"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    charts();
  }

  function wireRows() {
    document.querySelectorAll('#listHost [data-prog]').forEach(function (el) {
      el.addEventListener('input', function () {
        var box = el.parentNode.querySelector('.progress-bar');
        box.style.width = el.value + '%';
        box.parentNode.parentNode.querySelector('span').textContent = el.value + '%';
      });
      el.addEventListener('change', function () {
        var a = store.find('actions', el.getAttribute('data-prog'));
        var patch = { progress: +el.value, updatedAt: new Date().toISOString() };
        if (+el.value === 100 && a.status !== 'Hoàn thành') patch.status = 'Chờ xác nhận';
        else if (+el.value > 0 && a.status === 'Chưa bắt đầu') patch.status = 'Đang thực hiện';
        store.update('actions', a.id, patch);
        noteHazard(a, 'Tiến độ ' + patch.progress + '%' + (patch.status ? ' · trạng thái → ' + patch.status : ''));
        A.toast(a.code + ' · tiến độ ' + el.value + '%' + (patch.status === 'Chờ xác nhận' ? ' → chờ nghiệm thu' : ''), 'info');
        render(); kpis();
      });
    });
    document.querySelectorAll('#listHost [data-status]').forEach(function (el) {
      el.addEventListener('change', function () {
        var a = store.find('actions', el.getAttribute('data-status'));
        if (el.value === 'Hoàn thành') { openEdit(a, 'Hoàn thành'); return; }
        store.update('actions', a.id, { status: el.value, updatedAt: new Date().toISOString(), progress: el.value === 'Chưa bắt đầu' ? 0 : a.progress });
        noteHazard(a, 'Trạng thái → ' + el.value);
        A.toast(a.code + ' → ' + el.value, 'success');
        render(); kpis();
      });
    });
    document.querySelectorAll('#listHost [data-verify]').forEach(function (el) {
      el.addEventListener('click', function () { openEdit(store.find('actions', el.getAttribute('data-verify')), 'Hoàn thành'); });
    });
    document.querySelectorAll('#listHost [data-edit]').forEach(function (el) {
      el.addEventListener('click', function () { openEdit(store.find('actions', el.getAttribute('data-edit')), null); });
    });
  }

  function noteHazard(a, text) {
    var h = store.hazard(a.hazardId);
    if (!h) return;
    store.addHistory(h.id, { actor: (store.sessionUser() || {}).name || 'Quản lý', action: 'Theo dõi ' + a.code, note: text });
  }

  /* ---------- xác nhận hoàn thành + đóng nguy cơ ---------- */
  function afterComplete(a) {
    var siblings = store.actionsOfHazard(a.hazardId);
    var remain = siblings.filter(function (x) { return x.status !== 'Hoàn thành'; });
    var h = store.hazard(a.hazardId);
    if (!h || !store.isOpenHazard(h)) { render(); return; }
    if (remain.length) {
      A.toast('Còn ' + remain.length + ' hành động chưa xong (' + remain.map(function (x) { return x.code; }).join(', ') + ') nên nguy cơ ' + h.code + ' vẫn đang mở.', 'warn');
      return;
    }
    A.confirm({
      title: 'Đóng nguy cơ ' + h.code + '?',
      body: 'Toàn bộ ' + siblings.length + ' hành động khắc phục đã hoàn thành. Đề xuất chuyển báo cáo sang “Đã đóng”.',
      detail: 'Người báo cáo sẽ nhận được thông báo xác nhận nghiệm thu.',
      okText: 'Đóng báo cáo'
    }, function () {
      store.update('hazards', h.id, { status: 'Đã đóng', updatedAt: new Date().toISOString() });
      store.addHistory(h.id, {
        actor: (store.sessionUser() || {}).name || 'Quản lý công trường',
        action: 'Đã đóng', note: 'Nghiệm thu đủ ' + siblings.length + ' hành động khắc phục'
      });
      push('worker', 'Báo cáo ' + h.code + ' đã được nghiệm thu và đóng.', 'thông tin');
      push('safety', 'Bạn đã đóng ' + h.code + ' sau khi hoàn thành hành động khắc phục.', 'thông tin');
      A.toast('Đã đóng ' + h.code + '.', 'success', 'Hoàn tất quy trình');
      render(); kpis();
    });
  }

  function push(role, text, kind) {
    var db = store.read();
    db.notifications.unshift({ id: 'N-' + Date.now(), at: new Date().toISOString(), role: role, text: text, kind: kind || 'thông tin' });
    db.notifications = db.notifications.slice(0, 30);
    store.write(db);
  }

  /* ---------- modal ---------- */
  var modal = null;

  function openEdit(a, toStatus) {
    document.getElementById('editTitle').textContent = toStatus === 'Hoàn thành'
      ? 'Xác nhận hoàn thành ' + a.code : 'Cập nhật hành động ' + a.code;
    document.getElementById('eId').value = a.id;
    document.getElementById('eTitle').value = a.title;
    var sel = document.getElementById('eOwner');
    if (!sel.options.length) {
      sel.innerHTML = '<option value="">— Chọn người —</option>' +
        store.where('users', function (u) { return u.active && u.role !== 'admin'; }).map(function (u) {
          return '<option value="' + u.id + '">' + A.esc(u.name) + ' · ' + A.esc(u.unit) + '</option>';
        }).join('');
    }
    sel.value = a.ownerId;
    document.getElementById('eDue').value = a.dueDate;
    var st = document.getElementById('eStatus');
    var allowed = toStatus === 'Hoàn thành' ? ['Hoàn thành'] : [a.status].concat(NEXT[a.status] || []);
    st.innerHTML = allowed.map(function (x) {
      return '<option value="' + A.esc(x) + '"' + (x === (toStatus || a.status) ? ' selected' : '') + '>' + A.esc(x) + '</option>';
    }).join('');
    document.getElementById('eProgress').value = toStatus === 'Hoàn thành' ? 100 : a.progress;
    document.getElementById('eNote').value = a.note || '';
    ['eTitle', 'eOwner', 'eDue', 'eNote'].forEach(function (k) { document.getElementById(k).classList.remove('is-invalid'); });
    if (!modal) modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
    if (toStatus === 'Hoàn thành') {
      setTimeout(function () {
        document.getElementById('eNote').focus();
        A.toast('Việc xác nhận hoàn thành cần ghi chú nghiệm thu (tối thiểu 5 ký tự).', 'info');
      }, 320);
    }
  }

  function saveEdit(e) {
    e.preventDefault();
    var id = document.getElementById('eId').value;
    var a = store.find('actions', id);
    var title = document.getElementById('eTitle');
    var owner = document.getElementById('eOwner');
    var due = document.getElementById('eDue');
    var note = document.getElementById('eNote');
    var status = document.getElementById('eStatus').value;
    var prog = Math.max(0, Math.min(100, +document.getElementById('eProgress').value || 0));
    var ok = true;
    [title, owner, due, note].forEach(function (el) { el.classList.remove('is-invalid'); });

    if (title.value.trim().length < 10) { title.classList.add('is-invalid'); ok = false; }
    if (!owner.value) { owner.classList.add('is-invalid'); ok = false; }
    if (!due.value) { due.classList.add('is-invalid'); ok = false; }
    if (status === 'Hoàn thành') {
      if (note.value.trim().length < 5) { note.classList.add('is-invalid'); ok = false; }
      prog = 100;
    }
    if (!ok) { A.toast('Chưa lưu: biểu mẫu còn thiếu.', 'error', 'Kiểm tra lại dữ liệu'); return; }

    var reassigned = owner.value !== a.ownerId;
    store.update('actions', id, {
      title: title.value.trim(), ownerId: owner.value, dueDate: due.value,
      status: status, progress: prog, note: note.value.trim(), updatedAt: new Date().toISOString()
    });
    noteHazard(a, reassigned ? 'Giao lại cho ' + store.userName(owner.value) : 'Cập nhật ' + id + ' → ' + status);
    if (reassigned) push('worker', 'Bạn vừa được giao lại ' + a.code + ': ' + title.value.trim() + ' (hạn ' + A.date(due.value) + ').', 'cảnh báo');
    modal.hide();
    A.toast(a.code + ' → ' + status + ' · ' + prog + '%', 'success', 'Đã lưu');
    kpis(); render();
    if (status === 'Hoàn thành') afterComplete(store.find('actions', id));
  }

  /* ---------- biểu đồ thành phần ---------- */
  function charts() {
    var open = store.where('actions', function (a) { return a.status !== 'Hoàn thành'; });
    var byOwner = store.tally(open, 'ownerId');
    C.bars(document.getElementById('chartOwner'), Object.keys(byOwner).map(function (k) {
      return { label: store.userName(k), value: byOwner[k] };
    }).sort(function (a, b) { return b.value - a.value; }).slice(0, 6), { aria: 'Số việc đang mở theo người phụ trách' });

    var byZone = store.tally(open, 'zoneId');
    C.bars(document.getElementById('chartZone'), Object.keys(byZone).map(function (k) {
      return { label: store.zoneName(k), value: byZone[k], color: C.LEVEL_COLOR[(store.zoneRisk(k).band || {}).level] || '#1ba99c' };
    }).sort(function (a, b) { return b.value - a.value; }).slice(0, 6), { aria: 'Số việc đang mở theo khu vực' });
  }

  /* ---------- bộ lọc ---------- */
  function fillFilters() {
    document.getElementById('fStatus').innerHTML = '<option value="">Mọi trạng thái</option>' + ACT.map(function (x) { return '<option>' + A.esc(x) + '</option>'; }).join('');
    document.getElementById('fOwner').innerHTML = '<option value="">Mọi người</option>' + store.list('users').map(function (u) {
      return '<option value="' + u.id + '">' + A.esc(u.name) + '</option>';
    }).join('');
    document.getElementById('fZone').innerHTML = '<option value="">Mọi khu vực</option>' + store.list('zones').map(function (z) {
      return '<option value="' + z.id + '">' + A.esc(z.name) + '</option>';
    }).join('');
    var zq = A.qs('zone');
    if (zq && store.zone(zq)) f.zone = zq;
    document.getElementById('fZone').value = f.zone;
    // liên kết từ bản đồ rủi ro: ?hazard=HZ-004 -> tìm theo mã nguy cơ gốc
    var hq = A.qs('hazard');
    if (hq && store.hazard(hq)) {
      f.q = store.hazard(hq).code;
      document.getElementById('q').value = f.q;
      f.hideDone = false;
      document.getElementById('fOpen').checked = false;
    }
  }

  function clearFilters() {
    f = { q: '', status: '', owner: '', zone: '', overdue: false, hideDone: true, sort: f.sort, group: f.group };
    document.getElementById('q').value = '';
    ['fStatus', 'fOwner', 'fZone'].forEach(function (k) { document.getElementById(k).value = ''; });
    document.getElementById('fOverdue').checked = false;
    document.getElementById('fOpen').checked = true;
    render();
  }

  function wire() {
    document.getElementById('q').addEventListener('input', A.debounce(function (e) { f.q = e.target.value; render(); }, 220));
    document.getElementById('fStatus').addEventListener('change', function (e) { f.status = e.target.value; render(); });
    document.getElementById('fOwner').addEventListener('change', function (e) { f.owner = e.target.value; render(); });
    document.getElementById('fZone').addEventListener('change', function (e) { f.zone = e.target.value; render(); });
    document.getElementById('fSort').addEventListener('change', function (e) { f.sort = e.target.value; render(); });
    document.getElementById('fOverdue').addEventListener('change', function (e) { f.overdue = e.target.checked; render(); });
    document.getElementById('fOpen').addEventListener('change', function (e) { f.hideDone = e.target.checked; render(); });
    document.getElementById('clearFilter').addEventListener('click', clearFilters);
    document.querySelectorAll('[name="group"]').forEach(function (r) {
      r.addEventListener('change', function (e) { f.group = e.target.value; render(); });
    });
    document.getElementById('editForm').addEventListener('submit', saveEdit);
  }

  fillFilters();
  wire();
  kpis();
  render();
  if (f.zone) A.toast('Danh sách đang thu hẹp theo khu vực ' + store.zoneName(f.zone) + '.', 'info');
  if (focusId && !store.find('actions', focusId)) A.toast('Không tìm thấy hành động được liên kết trong dữ liệu hiện tại.', 'warn');
})();
