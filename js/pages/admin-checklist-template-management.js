/* SCR-10 · Quản lý mẫu checklist (SV3 – Đỗ Hồng Nhung)
   C/R/U trên danh mục mẫu: tạo – sửa – lưu trữ/kích hoạt lại, kèm AI-02 Checklist
   Generator (mô phỏng) để soạn bản nháp. Không xóa cứng mẫu: dữ liệu lịch sử
   (runs/inspections) vẫn tham chiếu templateId nên chỉ chuyển trạng thái active. */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;
  var AI = window.SiteSafeAI;

  var MIN_ITEMS = 1;
  var MAX_ITEMS = 25;
  var DB = store.read();
  var STAT = DB.statuses;
  var CODE_RE = /^MCL-[A-Z0-9]{3,6}$/;

  /* Loại công việc cho bộ lọc và form: thư viện mục của bộ luật + nhãn đã dùng trong dữ liệu mẫu. */
  var WORK_TYPES = (function () {
    var out = [];
    Object.keys((AI && AI.CHECK_LIBRARY) || {}).forEach(function (k) { out.push(k); });
    DB.templates.forEach(function (t) { if (out.indexOf(t.workType) === -1) out.push(t.workType); });
    DB.zones.forEach(function (z) { if (out.indexOf(z.type) === -1) out.push(z.type); });
    DB.hazards.forEach(function (h) { if (h.workType && out.indexOf(h.workType) === -1) out.push(h.workType); });
    return out;
  })();

  /* AI-02 chỉ liệt kê loại công việc mà bộ luật thật sự có thư viện mục. */
  var AI_WORKS = Object.keys((AI && AI.CHECK_LIBRARY) || { 'Kiểm tra chung': [] });

  /* Danh mục mục kiểm tra: dùng từ vựng chuẩn statuses.categories, nhưng giữ thêm
     nhãn đã tồn tại trong mẫu (vd "Bảo hộ cá nhân") để sửa mẫu cũ không bị đổi nhãn. */
  var CATS = (function () {
    var out = STAT.categories.slice();
    DB.templates.forEach(function (t) {
      (t.items || []).forEach(function (i) {
        if (i.category && out.indexOf(i.category) === -1) out.push(i.category);
      });
    });
    return out;
  })();

  var ZONE_TYPES = (function () {
    var out = ['Toàn công trường'];
    DB.zones.forEach(function (z) { if (out.indexOf(z.type) === -1) out.push(z.type); });
    DB.templates.forEach(function (t) { if (t.zoneType && out.indexOf(t.zoneType) === -1) out.push(t.zoneType); });
    return out;
  })();

  var f = { q: '', work: '', active: '' };
  var aiDraft = null;
  var formModal = null, previewModal = null;
  var formVisible = false, lastPreviewId = null;

  /* ---------- tra cứu ---------- */
  function runsOf(id) {
    return store.where('runs', function (r) { return r.templateId === id; });
  }
  function openRunsOf(id) {
    return runsOf(id).filter(function (r) { return r.status !== 'Hoàn tất'; });
  }
  function itemsOf(t) { return t && t.items ? t.items : []; }

  /* ---------- lọc ---------- */
  function rows() {
    return store.where('templates', function (t) {
      if (f.work && t.workType !== f.work) return false;
      if (f.active === '1' && !t.active) return false;
      if (f.active === '0' && t.active) return false;
      if (f.q) {
        var hay = (t.code + ' ' + t.name + ' ' + t.workType + ' ' + (t.zoneType || '') + ' ' +
          itemsOf(t).map(function (i) { return i.text; }).join(' ')).toLowerCase();
        if (hay.indexOf(f.q.toLowerCase()) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
  }

  /* ---------- KPI ---------- */
  function kpis() {
    var all = store.list('templates');
    var active = all.filter(function (t) { return t.active; });
    var items = all.reduce(function (s, t) { return s + itemsOf(t).length; }, 0);
    var openRunCount = store.list('runs').filter(function (r) { return r.status !== 'Hoàn tất'; }).length;
    var cards = [
      { v: all.length, l: 'Tổng số mẫu', i: 'clipboard2-pulse', c: 'var(--ss-teal-700)' },
      { v: active.length, l: 'Đang dùng', i: 'check2-circle', c: '#2fa36b' },
      { v: all.length - active.length, l: 'Đã lưu trữ', i: 'archive', c: '#6a6f78' },
      { v: items, l: 'Tổng mục kiểm tra', i: 'list-ol', c: '#2b5da8' },
      { v: openRunCount, l: 'Lượt kiểm tra đang mở', i: 'hourglass-split', c: '#b0521b' }
    ];
    document.getElementById('kpis').innerHTML = cards.map(function (c) {
      return '<div class="col-6 col-xl-2"><div class="card h-100"><div class="card-body ss-kpi">' +
        '<div class="d-flex justify-content-between align-items-start"><span class="ss-kpi-value" style="color:' + c.c + '">' + c.v + '</span>' +
        '<span class="ss-kpi-icon"><i class="bi bi-' + c.i + '"></i></span></div>' +
        '<div class="ss-kpi-label">' + c.l + '</div></div></div></div>';
    }).join('');
  }

  /* ---------- danh sách ---------- */
  function renderList() {
    var host = document.getElementById('listHost');
    var data = rows();
    document.getElementById('rowCount').textContent = data.length + '/' + store.list('templates').length + ' mẫu';

    if (!data.length) {
      host.innerHTML = A.empty('clipboard2-x', store.list('templates').length ? 'Không có mẫu nào khớp bộ lọc' : 'Chưa có mẫu checklist nào',
        store.list('templates').length
          ? 'Thử xóa bớt điều kiện lọc, hoặc đổi từ khóa tìm kiếm sang tên mẫu / nội dung mục kiểm tra.'
          : 'Hãy tạo mẫu đầu tiên, hoặc dùng Checklist Generator (mô phỏng) để có bản nháp rồi rà lại.',
        '<button class="btn btn-primary btn-sm mt-1" data-new><i class="bi bi-plus-lg me-1"></i>Tạo mẫu checklist</button>' +
        '<button class="btn btn-ghost btn-sm mt-1" data-reset-filter>Xóa bộ lọc</button>');
      var nb = host.querySelector('[data-new]');
      if (nb) nb.addEventListener('click', function () { openForm(null); });
      var rb = host.querySelector('[data-reset-filter]');
      if (rb) rb.addEventListener('click', clearFilters);
      return;
    }

    host.innerHTML = '<div class="table-responsive"><table class="table table-hover align-middle mb-0">' +
      '<thead><tr><th scope="col">Mẫu checklist</th>' +
      '<th scope="col" class="d-none d-md-table-cell">Loại công việc</th>' +
      '<th scope="col" class="d-none d-lg-table-cell">Khu vực áp dụng</th>' +
      '<th scope="col" class="text-center">Số mục</th>' +
      '<th scope="col" class="text-center d-none d-xl-table-cell">Lượt kiểm tra</th>' +
      '<th scope="col">Trạng thái</th>' +
      '<th scope="col" class="d-none d-lg-table-cell">Người cập nhật</th>' +
      '<th scope="col" class="text-end">Thao tác</th></tr></thead><tbody>' +
      data.map(rowHtml).join('') + '</tbody></table></div>';
    wireRows();
  }

  function rowHtml(t) {
    var open = openRunsOf(t.id).length, used = runsOf(t.id).length;
    return '<tr data-id="' + t.id + '">' +
      '<td><span class="ss-row-code">' + A.esc(t.code) + '</span>' +
      '<div class="ss-row-title">' + A.esc(t.name) + '</div>' +
      '<div class="ss-row-meta d-md-none"><span class="ss-chip" style="font-size:.74rem">' + A.esc(t.workType) + '</span></div></td>' +
      '<td class="d-none d-md-table-cell"><span class="ss-chip" style="font-size:.78rem">' + A.esc(t.workType) + '</span></td>' +
      '<td class="small d-none d-lg-table-cell">' + A.esc(t.zoneType || '—') + '</td>' +
      '<td class="text-center"><strong>' + itemsOf(t).length + '</strong>' +
      '<div class="ss-row-meta">mục</div></td>' +
      '<td class="text-center small d-none d-xl-table-cell">' + used +
      (open ? '<div class="ss-row-meta"><span class="ss-badge ss-overdue">' + open + ' đang mở</span></div>' : '<div class="ss-row-meta text-muted-soft">không có lượt mở</div>') + '</td>' +
      '<td>' + (t.active
        ? '<span class="badge text-bg-success">Đang dùng</span>'
        : '<span class="badge text-bg-secondary">Đã lưu trữ</span>') + '</td>' +
      '<td class="small d-none d-lg-table-cell">' + A.esc(t.updatedBy || '—') +
      '<div class="ss-row-meta">' + A.date(t.createdAt) + ' · ' + A.timeAgo(t.createdAt) + '</div></td>' +
      '<td class="text-end"><div class="ss-steps justify-content-end">' +
      '<button class="btn btn-ghost btn-sm py-0" data-preview="' + t.id + '" title="Xem trước mẫu" aria-label="Xem trước mẫu ' + A.esc(t.code) + '"><i class="bi bi-eye"></i></button>' +
      '<button class="btn btn-ghost btn-sm py-0" data-edit="' + t.id + '" title="Sửa mẫu" aria-label="Sửa mẫu ' + A.esc(t.code) + '"><i class="bi bi-pencil"></i></button>' +
      (t.active
        ? '<button class="btn btn-ghost btn-sm py-0 text-danger" data-archive="' + t.id + '" title="Lưu trữ mẫu" aria-label="Lưu trữ mẫu ' + A.esc(t.code) + '"><i class="bi bi-archive"></i> Lưu trữ</button>'
        : '<button class="btn btn-soft btn-sm py-0" data-restore="' + t.id + '" title="Kích hoạt lại mẫu" aria-label="Kích hoạt lại mẫu ' + A.esc(t.code) + '"><i class="bi bi-arrow-clockwise"></i> Kích hoạt lại</button>') +
      '</div></td></tr>';
  }

  function wireRows() {
    bindAll('#listHost [data-preview]', function (el) { openPreview(el.getAttribute('data-preview')); });
    bindAll('#listHost [data-edit]', function (el) { openForm(el.getAttribute('data-edit')); });
    bindAll('#listHost [data-archive]', function (el) { archive(el.getAttribute('data-archive')); });
    bindAll('#listHost [data-restore]', function (el) { setActive(el.getAttribute('data-restore'), true); });
  }
  function bindAll(sel, fn) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) (function (el) { el.addEventListener('click', function () { fn(el); }); })(els[i]);
  }

  /* ---------- lưu trữ / kích hoạt lại ---------- */
  function archive(id) {
    var t = store.find('templates', id);
    if (!t) return;
    var open = openRunsOf(id);
    if (open.length) {
      A.confirm({
        title: 'Mẫu đang có lượt kiểm tra chưa đóng',
        body: 'Lưu trữ “' + t.name + '” khi còn ' + open.length + ' lượt kiểm tra đang mở (' +
          open.slice(0, 3).map(function (r) { return r.code; }).join(', ') + (open.length > 3 ? '…' : '') + ').',
        detail: 'Nhân sự đang làm dở vẫn thấy mẫu này, nhưng đợt kiểm tra mới sẽ không chọn được nữa. Cân nhắc chờ đóng hết lượt.',
        okText: 'Vẫn lưu trữ'
      }, function () { setActive(id, false); });
      return;
    }
    A.confirm({
      title: 'Lưu trữ mẫu ' + t.code + '?',
      body: 'Mẫu “' + t.name + '” sẽ chuyển sang trạng thái Đã lưu trữ và không còn xuất hiện khi phát checklist.',
      detail: 'Dữ liệu lượt kiểm tra cũ vẫn được giữ; có thể kích hoạt lại bất cứ lúc nào.',
      okText: 'Lưu trữ mẫu'
    }, function () { setActive(id, false); });
  }

  function setActive(id, active) {
    var t = store.find('templates', id);
    if (!t) { A.toast('Không tìm thấy mẫu cần cập nhật.', 'error'); return; }
    var me = store.sessionUser();
    store.update('templates', id, { active: active, updatedBy: me ? me.name : 'Quản trị viên' });
    A.toast(t.code + ' · ' + t.name + (active ? ' đã được kích hoạt lại.' : ' đã chuyển sang trạng thái lưu trữ.'), 'success', active ? 'Đã kích hoạt' : 'Đã lưu trữ');
    renderList(); kpis();
  }

  /* ---------- xem trước ---------- */
  function openPreview(id) {
    var t = store.find('templates', id);
    if (!t) return;
    lastPreviewId = id;
    var used = runsOf(id), open = openRunsOf(id);
    var insp = store.where('inspections', function (x) { return x.templateId === id; });
    document.getElementById('previewTitle').innerHTML = '<span class="ss-row-code">' + A.esc(t.code) + '</span> ' + A.esc(t.name);
    document.getElementById('previewBody').innerHTML =
      '<div class="d-flex flex-wrap gap-2 mb-3">' +
      '<span class="ss-chip" style="font-size:.78rem"><i class="bi bi-briefcase me-1"></i>' + A.esc(t.workType) + '</span>' +
      '<span class="ss-chip" style="font-size:.78rem"><i class="bi bi-geo-alt me-1"></i>' + A.esc(t.zoneType || '—') + '</span>' +
      (t.active ? '<span class="badge text-bg-success">Đang dùng</span>' : '<span class="badge text-bg-secondary">Đã lưu trữ</span>') + '</div>' +
      '<div class="small text-muted-soft mb-3">' + itemsOf(t).length + ' mục kiểm tra · cập nhật bởi ' + A.esc(t.updatedBy || '—') + ' · ' +
      A.datetime(t.createdAt) + ' · ' + used.length + ' lượt kiểm tra (' + open.length + ' đang mở) · ' + insp.length + ' đợt kiểm tra tham chiếu</div>' +
      (itemsOf(t).length
        ? itemsOf(t).map(function (it, i) {
          return '<div class="ss-item"><div class="d-flex gap-2 align-items-start">' +
            '<span class="ss-item-num">' + (i + 1) + '</span>' +
            '<div class="flex-grow-1"><div class="fw-semibold small">' + A.esc(it.text) + '</div>' +
            '<span class="ss-badge mt-1" style="background:var(--ss-teal-50);color:var(--ss-teal-800);border:1px solid var(--ss-teal-100)">' + A.esc(it.category || 'chưa phân nhóm') + '</span></div></div></div>';
        }).join('')
        : '<div class="small text-muted-soft">Mẫu chưa có mục nào — hãy thêm ít nhất một mục kiểm tra.</div>');
    if (!previewModal) previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
    previewModal.show();
  }

  /* ---------- biểu mẫu tạo / sửa ---------- */
  function optionList(values, selected, blankLabel) {
    var out = blankLabel ? '<option value="">' + blankLabel + '</option>' : '';
    return out + values.map(function (v) {
      return '<option value="' + A.esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + A.esc(v) + '</option>';
    }).join('');
  }

  function itemRowHtml(it, index) {
    it = it || {};
    var cat = it.category || CATS[0];
    var cats = CATS.indexOf(cat) === -1 ? CATS.concat([cat]) : CATS;
    return '<div class="ss-item d-flex flex-wrap gap-2 align-items-start" data-irow>' +
      '<span class="ss-item-num" data-num>' + (index + 1) + '</span>' +
      '<div class="flex-grow-1" style="min-width:220px">' +
      '<input class="form-control form-control-sm" data-otext maxlength="170" value="' + A.esc(it.text || '') + '" ' +
      'placeholder="Ví dụ: Lan can + gối chắn quanh sàn thao tác tầng">' +
      '<div class="invalid-feedback">Nội dung mục phải từ 5 ký tự trở lên.</div></div>' +
      '<select class="form-select form-select-sm" data-ocat style="max-width:230px" aria-label="Nhóm nguy cơ của mục">' +
      optionList(cats, cat, null) + '</select>' +
      '<button class="btn btn-ghost btn-sm text-danger" data-orem type="button" aria-label="Xóa mục khỏi biểu mẫu"><i class="bi bi-trash"></i></button>' +
      '</div>';
  }

  function itemHost() { return document.getElementById('itemsHost'); }

  function renumber() {
    var rowsEls = itemHost().querySelectorAll('[data-irow]');
    for (var i = 0; i < rowsEls.length; i++) {
      var num = rowsEls[i].querySelector('[data-num]');
      if (num) num.textContent = i + 1;
    }
    document.getElementById('itemCount').textContent = rowsEls.length + '/' + MAX_ITEMS + ' mục';
  }

  function addItemRow(it) {
    if (itemHost().querySelectorAll('[data-irow]').length >= MAX_ITEMS) {
      A.toast('Một mẫu chỉ tối đa ' + MAX_ITEMS + ' mục. Hãy gộp các mục trùng ý.', 'warn', 'Vượt giới hạn');
      return false;
    }
    var wrap = document.createElement('div');
    wrap.innerHTML = itemRowHtml(it, itemHost().querySelectorAll('[data-irow]').length);
    var el = wrap.firstElementChild;
    itemHost().appendChild(el);
    el.querySelector('[data-orem]').addEventListener('click', function () { removeItemRow(el); });
    el.querySelector('[data-otext]').addEventListener('input', function () { el.querySelector('[data-otext]').classList.remove('is-invalid'); });
    renumber();
    return true;
  }

  function removeItemRow(el) {
    if (itemHost().querySelectorAll('[data-irow]').length <= MIN_ITEMS) {
      A.toast('Mẫu phải giữ ít nhất ' + MIN_ITEMS + ' mục kiểm tra.', 'warn', 'Không thể xóa');
      return;
    }
    el.parentNode.removeChild(el);
    renumber();
  }

  function readItems() {
    var out = [];
    var els = itemHost().querySelectorAll('[data-irow]');
    for (var i = 0; i < els.length; i++) {
      out.push({
        id: (els[i].getAttribute('data-iid')) || ('i' + (i + 1)),
        text: els[i].querySelector('[data-otext]').value.trim(),
        category: els[i].querySelector('[data-ocat]').value
      });
    }
    return out;
  }

  function preserveIds(items, existing) {
    // Giữ id cũ theo thứ tự để kết quả đã nhập trong run.results không bị mất liên kết
    var used = {};
    items.forEach(function (it, i) {
      var old = existing[i];
      if (old && !used[old.id]) { it.id = old.id; used[old.id] = 1; return; }
      var n = i + 1;
      while (used['i' + n] || indexOfId(existing, 'i' + n)) n++;
      it.id = 'i' + n;
      used[it.id] = 1;
    });
    return items;
  }
  function indexOfId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return true;
    return false;
  }

  /* mã MCL-XXX: viết tắt 3 chữ cái đầu của tên, tự đẩy ký tự nếu trùng */
  function genCode(name) {
    var clean = String(name || '').normalize('NFD') /* bỏ dấu: khoảng mã U+0300–U+036F */.replace(/[̀-ͯ]/g, '')
      .toUpperCase().replace(/[^A-Z]+/g, ' ').replace(/^\s+|\s+$/g, '');
    var words = clean ? clean.split(' ') : [];
    var arr = [], i;
    for (i = 0; i < words.length && arr.length < 3; i++) if (words[i]) arr.push(words[i].charAt(0));
    var first = words[0] || '';
    for (i = 1; arr.length < 3 && i < first.length; i++) arr.push(first.charAt(i));
    while (arr.length < 3) arr.push('X');
    return uniqueCode(arr);
  }

  function uniqueCode(arr) {
    var L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var cand = 'MCL-' + arr.join(''), guard = 0;
    while (codeTaken(cand) && guard++ < 800) {
      var k = arr.length - 1;
      while (k >= 0) {
        arr[k] = L.charAt((L.indexOf(arr[k]) + 1) % 26);
        if (arr[k] !== 'A') break;
        k--;
      }
      cand = 'MCL-' + arr.join('');
    }
    return cand;
  }

  function codeTaken(code, exceptId) {
    var hit = store.where('templates', function (t) {
      return t.code === code && t.id !== exceptId;
    })[0];
    return !!hit;
  }

  function openForm(id, preset) {
    var t = id ? store.find('templates', id) : null;
    if (id && !t) { A.toast('Mẫu không còn tồn tại trong dữ liệu.', 'error'); return; }
    document.getElementById('formTitle').textContent = t ? 'Sửa mẫu ' + t.code : 'Tạo mẫu checklist';
    document.getElementById('fId').value = t ? t.id : '';
    document.getElementById('fName').value = t ? t.name : '';
    document.getElementById('fCode').value = t ? t.code : genCode('');
    document.getElementById('fWorkInput').value = t ? t.workType : (preset && preset.workType) || WORK_TYPES[0];
    document.getElementById('fZoneType').value = t ? (t.zoneType || ZONE_TYPES[0]) : (preset && preset.zoneType) || ZONE_TYPES[0];
    document.getElementById('formHint').textContent = t
      ? 'Mã ' + t.code + ' · ' + runsOf(t.id).length + ' lượt kiểm tra đã dùng mẫu này.'
      : 'Mẫu mới ở trạng thái Đang dùng ngay sau khi lưu.';
    ['fName', 'fCode', 'fWorkInput'].forEach(function (k) { document.getElementById(k).classList.remove('is-invalid'); });
    var err = document.getElementById('itemsErr');
    err.hidden = true;

    itemHost().innerHTML = '';
    var items = t ? itemsOf(t) : [];
    if (!items.length) addItemRow(null);
    for (var i = 0; i < items.length; i++) {
      if (!addItemRow(items[i])) break;
      var last = itemHost().lastElementChild;
      if (last) last.setAttribute('data-iid', items[i].id || ('i' + (i + 1)));
    }
    renumber();
    formModal.show();
  }

  function save(e) {
    e.preventDefault();
    var id = document.getElementById('fId').value;
    var nameEl = document.getElementById('fName');
    var codeEl = document.getElementById('fCode');
    var workEl = document.getElementById('fWorkInput');
    var ok = true;
    var code = codeEl.value.trim().toUpperCase();
    codeEl.value = code;
    [nameEl, codeEl, workEl].forEach(function (el) { el.classList.remove('is-invalid'); });

    if (nameEl.value.trim().length < 6) { nameEl.classList.add('is-invalid'); ok = false; }
    if (!CODE_RE.test(code)) {
      codeEl.classList.add('is-invalid');
      document.getElementById('fCodeErr').textContent = 'Mã phải dạng MCL-XXX, ví dụ MCL-GSG (chữ in hoa, 3–6 ký tự sau gạch nối).';
      ok = false;
    } else if (codeTaken(code, id)) {
      codeEl.classList.add('is-invalid');
      document.getElementById('fCodeErr').textContent = 'Mã ' + code + ' đã có mẫu khác dùng. Hãy chọn mã khác hoặc bấm “Tạo lại mã”.';
      ok = false;
    }
    if (!workEl.value) { workEl.classList.add('is-invalid'); ok = false; }

    var items = readItems();
    var err = document.getElementById('itemsErr');
    var bad = 0;
    items.forEach(function (it, i) {
      var rowEl = itemHost().querySelectorAll('[data-irow]')[i];
      var textEl = rowEl.querySelector('[data-otext]');
      if (it.text.length < 5) { textEl.classList.add('is-invalid'); bad++; ok = false; }
      else textEl.classList.remove('is-invalid');
    });
    if (items.length < MIN_ITEMS || items.length > MAX_ITEMS) ok = false;
    if (!ok) {
      err.hidden = false;
      err.textContent = items.length < MIN_ITEMS ? 'Cần ít nhất ' + MIN_ITEMS + ' mục kiểm tra.'
        : bad ? 'Còn ' + bad + ' mục có nội dung dưới 5 ký tự — hãy mô tả rõ thứ cần nhìn thấy.'
        : 'Số mục phải trong khoảng ' + MIN_ITEMS + '–' + MAX_ITEMS + '.';
    } else err.hidden = true;

    if (!ok) { A.toast('Chưa lưu: kiểm tra lại các trường tô đỏ.', 'error', 'Biểu mẫu chưa hợp lệ'); return; }

    var me = store.sessionUser();
    var existing = id ? itemsOf(store.find('templates', id)) : [];
    var patch = {
      name: nameEl.value.trim(),
      code: code,
      workType: workEl.value,
      zoneType: document.getElementById('fZoneType').value,
      items: preserveIds(items, existing),
      updatedBy: me ? me.name : 'Quản trị viên'
    };
    if (id) {
      store.update('templates', id, patch);
      A.toast('Đã lưu mẫu ' + code + ' (' + patch.items.length + ' mục).', 'success', 'Cập nhật mẫu');
    } else {
      patch.id = nextTemplateId();
      patch.active = true;
      patch.createdAt = new Date().toISOString();
      store.insert('templates', patch);
      A.toast('Đã tạo ' + code + ' với ' + patch.items.length + ' mục. Mẫu sẵn sàng để phát checklist.', 'success', 'Tạo mẫu mới');
    }
    formModal.hide();
    renderList(); kpis();
  }

  function nextTemplateId() {
    var max = 0;
    store.list('templates').forEach(function (t) {
      var m = /^CT-(\d+)/.exec(t.id);
      if (m) max = Math.max(max, +m[1]);
    });
    return 'CT-' + ('00' + (max + 1)).slice(-3);
  }

  /* ---------- AI-02 Checklist Generator (mô phỏng) ---------- */
  function renderAiIdle() {
    document.getElementById('aiOut').innerHTML =
      '<div class="small text-muted-soft"><i class="bi bi-cursor me-1"></i>Chưa có bản nháp. Bấm “Sinh bản nháp bằng AI”, chọn loại công việc và điều kiện công trường;' +
      ' bộ luật JavaScript sẽ đề xuất các mục để bạn chọn lọc.</div>';
  }

  function renderAiLoading() {
    document.getElementById('aiOut').innerHTML =
      '<div class="ss-loading"><div class="spinner-border spinner-border-sm" style="color:var(--ss-plum)" role="status" aria-label="Đang sinh bản nháp"></div>' +
      'Đang đối chiếu thư viện mục chuẩn với điều kiện bạn nhập…</div>';
  }

  function renderAiResult() {
    var pct = Math.round((aiDraft.confidence || 0) * 100);
    if (!aiDraft.items.length) {
      document.getElementById('aiOut').innerHTML = A.empty('inbox-tray', 'Bộ luật không trả về mục nào hợp lệ',
        'Loại công việc “' + aiDraft.workType + '” không có mục nào trong thư viện. Hãy chọn loại khác (vd. Kiểm tra chung) rồi sinh lại.',
        '<button class="btn btn-ghost btn-sm mt-1" data-ai="dismiss">Đóng bảng</button>');
      wireAiResult();
      return;
    }
    document.getElementById('aiOut').innerHTML =
      '<div class="d-flex flex-wrap gap-2 align-items-center mb-2">' +
      '<span class="ss-ai-badge"><i class="bi bi-flask"></i>Mô phỏng</span>' +
      '<strong class="small">' + A.esc(aiDraft.engine) + '</strong>' +
      '<span class="ss-row-meta">loại công việc: ' + A.esc(aiDraft.workType) + '</span></div>' +
      '<div class="ss-ai-conf mb-2" style="max-width:420px">' +
      '<span class="small fw-semibold text-nowrap">Độ khớp đề xuất</span>' +
      '<div class="ss-ai-bar"><span style="width:' + pct + '%"></span></div>' +
      '<span class="small">' + pct + '%</span></div>' +
      '<ul class="ss-ai-reason ps-3 mb-2">' + aiDraft.reasons.map(function (r) { return '<li>' + A.esc(r) + '</li>'; }).join('') + '</ul>' +
      '<div class="alert small mb-3" style="background:#f7f3ff;border:1px solid #e2d7f5;color:#4a3f5c">' +
      '<i class="bi bi-exclamation-triangle me-1"></i>' + A.esc(aiDraft.disclaimer) +
      ' Bản nháp <strong>chưa phải mẫu chính thức</strong>: bỏ chọn mục không phù hợp, sửa câu chữ rồi hãy lưu.</div>' +
      '<div class="d-flex flex-wrap gap-2 align-items-center mb-2">' +
      '<span class="ss-section-title">' + aiDraft.items.length + ' mục đề xuất</span>' +
      '<button class="btn btn-ghost btn-sm py-0" data-ai="all" type="button">Chọn tất cả</button>' +
      '<button class="btn btn-ghost btn-sm py-0" data-ai="none" type="button">Bỏ chọn hết</button></div>' +
      '<div id="aiItems">' + aiDraft.items.map(function (it, i) {
        return '<div class="ss-item"><div class="form-check d-flex gap-2 align-items-start">' +
          '<input class="form-check-input mt-1" type="checkbox" checked data-gid="' + A.esc(it.id) + '" id="gk_' + A.esc(it.id) + '">' +
          '<label class="form-check-label small" for="gk_' + A.esc(it.id) + '">' +
          '<span class="text-muted-soft me-1">' + (i + 1) + '.</span>' + A.esc(it.text) +
          '<br><span class="ss-badge mt-1" style="background:var(--ss-teal-50);color:var(--ss-teal-800);border:1px solid var(--ss-teal-100)">' + A.esc(it.category) + '</span>' +
          '</label></div></div>';
      }).join('') + '</div>' +
      '<div class="ss-ai-actions mt-3">' +
      '<button class="btn btn-primary btn-sm" data-ai="append" type="button"><i class="bi bi-plus-slash-minus me-1"></i>Thêm vào biểu mẫu</button>' +
      '<button class="btn btn-ghost btn-sm" data-ai="dismiss" type="button">Bỏ qua</button></div>';
    wireAiResult();
  }

  function wireAiResult() {
    var out = document.getElementById('aiOut');
    var all = out.querySelectorAll('[data-ai]');
    for (var i = 0; i < all.length; i++) (function (el) {
      el.addEventListener('click', function () { aiAction(el.getAttribute('data-ai')); });
    })(all[i]);
  }

  function chosenGenerated() {
    var boxes = document.querySelectorAll('#aiOut [data-gid]');
    var picked = [];
    for (var i = 0; i < boxes.length; i++) {
      if (!boxes[i].checked) continue;
      var gid = boxes[i].getAttribute('data-gid');
      for (var j = 0; j < aiDraft.items.length; j++) if (aiDraft.items[j].id === gid) picked.push(aiDraft.items[j]);
    }
    return picked;
  }

  function aiAction(kind) {
    if (kind === 'all' || kind === 'none') {
      var boxes = document.querySelectorAll('#aiOut [data-gid]');
      for (var i = 0; i < boxes.length; i++) boxes[i].checked = kind === 'all';
      return;
    }
    if (kind === 'dismiss') {
      aiDraft = null;
      renderAiIdle();
      A.toast('Đã bỏ qua bản nháp. Không có dữ liệu nào được lưu.', 'info');
      return;
    }
    // append: đưa mục được chọn vào biểu mẫu đang mở (hoặc mở biểu mẫu tạo mẫu mới)
    if (!aiDraft) return;
    var picked = chosenGenerated();
    if (!picked.length) {
      A.toast('Chưa chọn mục nào trong bản nháp để thêm.', 'warn', 'Cần chọn mục');
      return;
    }
    if (!formVisible) {
      openForm(null, { workType: aiDraft.workType, zoneType: zoneTypeOfPreset() });
      itemHost().innerHTML = '';
    }
    var added = 0, skipped = 0;
    var current = readItems().map(function (x) { return x.text.toLowerCase(); });
    picked.forEach(function (it) {
      if (current.indexOf(it.text.toLowerCase()) !== -1) { skipped++; return; }
      if (addItemRow({ text: it.text, category: it.category })) added++;
    });
    renumber();
    A.toast('Đã thêm ' + added + ' mục bản nháp vào biểu mẫu' + (skipped ? ' (bỏ ' + skipped + ' mục trùng)' : '') +
      '. Hãy sửa câu chữ cho sát hiện trường rồi hãy lưu.', 'info', 'Bản nháp cần người rà soát');
  }

  function zoneTypeOfPreset() {
    var z = store.zone(document.getElementById('aiZone').value);
    return z ? z.type : ZONE_TYPES[0];
  }

  function normalizeGenerated(raw) {
    var seen = {}, out = [];
    (raw || []).forEach(function (it) {
      if (!it) return;
      var text = String(it.text || '').trim();
      var cat = String(it.category || '').trim();
      if (!text || seen[text.toLowerCase()]) return;
      seen[text.toLowerCase()] = 1;
      out.push({ id: 'g' + (out.length + 1), text: text, category: cat || CATS[0] });
    });
    return out;
  }

  function runGenerator(e) {
    if (e) e.preventDefault();
    var conds = [];
    ['aiC1', 'aiC2', 'aiC3', 'aiC4', 'aiC5'].forEach(function (k) {
      var el = document.getElementById(k);
      if (el.checked) conds.push(el.value);
    });
    var extra = document.getElementById('aiCondText').value.trim();
    if (extra) conds.push(extra);
    renderAiLoading();
    // giả lập độ trễ xử lý để có trạng thái "đang chạy" như sản phẩm thật
    setTimeout(function () {
      var res = AI.generateChecklist({
        workType: document.getElementById('aiWork').value,
        conditions: conds,
        zoneId: document.getElementById('aiZone').value || null
      });
      var items = normalizeGenerated(res.items).slice(0, MAX_ITEMS);
      aiDraft = {
        engine: res.engine, disclaimer: res.disclaimer, workType: res.workType,
        confidence: res.confidence, reasons: res.reasons, needHumanReview: res.needHumanReview,
        items: items
      };
      renderAiResult();
    }, 520);
  }

  /* ---------- bộ lọc ---------- */
  function clearFilters() {
    f = { q: '', work: '', active: '' };
    document.getElementById('q').value = '';
    document.getElementById('fWork').value = '';
    document.getElementById('fActive').value = '';
    renderList();
  }

  /* ---------- khởi tạo ---------- */
  document.getElementById('fWork').innerHTML = optionList(WORK_TYPES, null, 'Mọi loại công việc');
  document.getElementById('fWorkInput').innerHTML = optionList(WORK_TYPES, null, null);
  document.getElementById('fZoneType').innerHTML = optionList(ZONE_TYPES, null, null);
  document.getElementById('aiWork').innerHTML = AI_WORKS.map(function (w) { return '<option>' + A.esc(w) + '</option>'; }).join('');
  document.getElementById('aiZone').innerHTML = '<option value="">— Chưa gắn khu vực —</option>' +
    store.where('zones', function (z) { return z.active; }).map(function (z) {
      return '<option value="' + z.id + '">' + A.esc(z.name) + ' · ' + A.esc(z.type) + '</option>';
    }).join('');

  formModal = new bootstrap.Modal(document.getElementById('formModal'));
  var fmEl = document.getElementById('formModal');
  fmEl.addEventListener('shown.bs.modal', function () { formVisible = true; });
  fmEl.addEventListener('hidden.bs.modal', function () { formVisible = false; });

  kpis();
  renderList();
  renderAiIdle();

  document.getElementById('q').addEventListener('input', A.debounce(function (e) { f.q = e.target.value; renderList(); }, 220));
  document.getElementById('fWork').addEventListener('change', function (e) { f.work = e.target.value; renderList(); });
  document.getElementById('fActive').addEventListener('change', function (e) { f.active = e.target.value; renderList(); });
  document.getElementById('clearFilter').addEventListener('click', clearFilters);
  document.getElementById('newBtn').addEventListener('click', function () { openForm(null); });
  document.getElementById('addItem').addEventListener('click', function () { addItemRow(null); });
  document.getElementById('tplForm').addEventListener('submit', save);
  document.getElementById('regenCode').addEventListener('click', function () {
    document.getElementById('fCode').value = genCode(document.getElementById('fName').value);
    document.getElementById('fCode').classList.remove('is-invalid');
    A.toast('Đã gợi lại mã theo tên mẫu.', 'info');
  });
  document.getElementById('fName').addEventListener('input', function (e) {
    // chỉ tự sinh mã khi đang tạo mẫu mới để không phá mã đã dùng trong dữ liệu
    if (!document.getElementById('fId').value) document.getElementById('fCode').value = genCode(e.target.value);
  });
  document.getElementById('previewEdit').addEventListener('click', function () {
    var id = lastPreviewId;
    if (previewModal) previewModal.hide();
    if (id) setTimeout(function () { openForm(id); }, 260);
  });

  document.getElementById('aiToggle').addEventListener('click', function () {
    var form = document.getElementById('aiForm');
    form.hidden = !form.hidden;
    if (!form.hidden) document.getElementById('aiWork').focus();
  });
  document.getElementById('aiCancel').addEventListener('click', function () { document.getElementById('aiForm').hidden = true; });
  document.getElementById('aiForm').addEventListener('submit', runGenerator);
})();
