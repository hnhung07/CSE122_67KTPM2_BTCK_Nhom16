/* SCR-11 · Quản lý khu vực công trường (SV3 – Đỗ Hồng Nhung)
   C/R/U trên danh mục khu vực: mã trùng, tổ phụ trách, vùng chữ nhật cho bản đồ
   rủi ro (SCR-07) và quy tắc không ngừng hoạt động khi còn nguy cơ mở.
   Không xóa cứng: hazards/runs/inspections vẫn tham chiếu zoneId. */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;

  /* khung 1000 × 620 khớp với viewBox mà SCR-07 (bản đồ rủi ro) dùng để vẽ zone.map */
  var MAP_W = 1000, MAP_H = 620;
  var MIN_SIDE = 40;
  var CODE_RE = /^KQ-[A-Z0-9]{2,6}$/;
  var FILL = {
    'Nghiêm trọng': '#d94f5c', 'Cao': '#ef7b3d', 'Trung bình': '#e0a410',
    'Thấp': '#2fa36b', 'An toàn': '#1ba99c'
  };

  var DB = store.read();

  /* loại khu vực + đầu mối lấy từ dữ liệu hiện có để đồng bộ bộ lọc của trang khác */
  var TYPES = (function () {
    var out = [];
    DB.zones.forEach(function (z) { if (out.indexOf(z.type) === -1) out.push(z.type); });
    ['Toàn công trường', 'Khu phụ trợ'].forEach(function (t) { if (out.indexOf(t) === -1) out.push(t); });
    return out;
  })();
  var HEADS = (function () {
    var out = [];
    DB.zones.forEach(function (z) { if (z.head && z.head !== '—' && out.indexOf(z.head) === -1) out.push(z.head); });
    DB.users.forEach(function (u) {
      if (u.role !== 'worker' || !u.unit) return;
      var org = u.unit.split('–')[0].replace(/\s+$/, '');
      if (org && org.length > 2 && out.indexOf(org) === -1) out.push(org);
    });
    return out;
  })();

  var f = { q: '', type: '', state: '' };
  var formModal = null;

  /* ---------- lọc ---------- */
  function rows() {
    return store.where('zones', function (z) {
      if (f.type && z.type !== f.type) return false;
      if (f.state === 'active' && !z.active) return false;
      if (f.state === 'inactive' && z.active) return false;
      if (f.q) {
        var zr = store.zoneRisk(z.id);
        var hay = (z.code + ' ' + z.name + ' ' + z.type + ' ' + (z.head || '') + ' ' + zr.open + ' ' + zr.score).toLowerCase();
        if (hay.indexOf(f.q.toLowerCase()) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return String(a.code).localeCompare(String(b.code));
    });
  }

  /* ---------- KPI ---------- */
  function kpis() {
    var all = store.list('zones');
    var active = all.filter(function (z) { return z.active; });
    var openHaz = 0, overdue = 0, high = 0;
    active.forEach(function (z) {
      var r = store.zoneRisk(z.id);
      openHaz += r.open; overdue += r.overdue;
      if (r.band.level === 'Cao' || r.band.level === 'Nghiêm trọng') high++;
    });
    var cards = [
      { v: all.length, l: 'Tổng khu vực', i: 'map', c: 'var(--ss-teal-700)' },
      { v: active.length, l: 'Đang hoạt động', i: 'check2-circle', c: '#2fa36b' },
      { v: all.length - active.length, l: 'Đã ngừng', i: 'stop-circle', c: '#6a6f78' },
      { v: openHaz, l: 'Nguy cơ đang mở', i: 'exclamation-triangle', c: '#b0521b' },
      { v: high, l: 'Khu vực rủi ro cao', i: 'fire', c: '#a82d3b' },
      { v: overdue, l: 'Hành động quá hạn', i: 'alarm', c: '#d94f5c' }
    ];
    document.getElementById('kpis').innerHTML = cards.map(function (c) {
      return '<div class="col-6 col-xl-2"><div class="card h-100"><div class="card-body ss-kpi">' +
        '<div class="d-flex justify-content-between align-items-start"><span class="ss-kpi-value" style="color:' + c.c + '">' + c.v + '</span>' +
        '<span class="ss-kpi-icon"><i class="bi bi-' + c.i + '"></i></span></div>' +
        '<div class="ss-kpi-label">' + c.l + '</div></div></div></div>';
    }).join('');
  }

  /* ---------- bảng ---------- */
  function renderList() {
    var host = document.getElementById('listHost');
    var data = rows();
    document.getElementById('rowCount').textContent = data.length + '/' + store.list('zones').length + ' khu vực';

    if (!data.length) {
      host.innerHTML = A.empty('geo-alt', store.list('zones').length ? 'Không có khu vực nào khớp bộ lọc' : 'Chưa khai báo khu vực nào',
        store.list('zones').length
          ? 'Đổi từ khóa tìm kiếm hoặc bỏ bộ lọc loại/trạng thái để xem lại toàn bộ khu vực.'
          : 'Hãy thêm khu vực đầu tiên; mỗi khu vực cần mã, tổ phụ trách và vùng hiển thị trên bản đồ.',
        '<button class="btn btn-primary btn-sm mt-1" data-new><i class="bi bi-plus-lg me-1"></i>Thêm khu vực</button>' +
        '<button class="btn btn-ghost btn-sm mt-1" data-reset-filter>Xóa bộ lọc</button>');
      var nb = host.querySelector('[data-new]');
      if (nb) nb.addEventListener('click', function () { openForm(null); });
      var rb = host.querySelector('[data-reset-filter]');
      if (rb) rb.addEventListener('click', clearFilters);
      return;
    }

    host.innerHTML = '<div class="table-responsive"><table class="table table-hover align-middle mb-0">' +
      '<thead><tr><th scope="col">Khu vực</th>' +
      '<th scope="col" class="d-none d-lg-table-cell">Loại</th>' +
      '<th scope="col" class="d-none d-md-table-cell">Tổ phụ trách</th>' +
      '<th scope="col" class="text-center">Nguy cơ mở</th>' +
      '<th scope="col">Điểm rủi ro</th>' +
      '<th scope="col" class="d-none d-xl-table-cell">Vùng bản đồ</th>' +
      '<th scope="col">Trạng thái</th>' +
      '<th scope="col" class="text-end">Thao tác</th></tr></thead><tbody>' +
      data.map(rowHtml).join('') + '</tbody></table></div>';
    wireRows();
  }

  function rowHtml(z) {
    var r = store.zoneRisk(z.id);
    return '<tr data-id="' + z.id + '">' +
      '<td><span class="ss-row-code">' + A.esc(z.code) + '</span>' +
      '<div class="ss-row-title">' + A.esc(z.name) + '</div>' +
      '<div class="ss-row-meta d-lg-none"><span class="ss-chip" style="font-size:.74rem">' + A.esc(z.type) + '</span></div></td>' +
      '<td class="d-none d-lg-table-cell"><span class="ss-chip" style="font-size:.78rem">' + A.esc(z.type) + '</span></td>' +
      '<td class="small d-none d-md-table-cell">' + A.esc(z.head || '—') + '</td>' +
      '<td class="text-center"><strong>' + r.open + '</strong>' +
      (r.critical ? '<div class="ss-row-meta"><span class="ss-badge ss-lv-Nghiêmtrọng">' + r.critical + ' nghiêm trọng</span></div>' : '') + '</td>' +
      '<td>' + A.levelBadge(r.band.level) + '<div class="ss-row-meta">điểm ' + r.score +
      (r.overdue ? ' · ' + r.overdue + ' quá hạn' : '') + '</div></td>' +
      '<td class="small d-none d-xl-table-cell">' + (z.map ? 'x ' + z.map.x + ' · y ' + z.map.y + '<div class="ss-row-meta">' + z.map.w + ' × ' + z.map.h + '</div>' : '—') + '</td>' +
      '<td>' + (z.active
        ? '<span class="badge text-bg-success">Đang hoạt động</span>'
        : '<span class="badge text-bg-secondary">Đã ngừng</span>') + '</td>' +
      '<td class="text-end"><div class="ss-steps justify-content-end">' +
      '<button class="btn btn-ghost btn-sm py-0" data-edit="' + z.id + '" title="Sửa khu vực" aria-label="Sửa khu vực ' + A.esc(z.code) + '"><i class="bi bi-pencil"></i></button>' +
      (z.active
        ? '<button class="btn btn-ghost btn-sm py-0 text-danger" data-off="' + z.id + '">Ngừng hoạt động</button>'
        : '<button class="btn btn-soft btn-sm py-0" data-on="' + z.id + '">Kích hoạt lại</button>') +
      '</div></td></tr>';
  }

  function wireRows() {
    bind('#listHost [data-edit]', function (el) { openForm(el.getAttribute('data-edit')); });
    bind('#listHost [data-off]', function (el) { requestActive(el.getAttribute('data-off'), false); });
    bind('#listHost [data-on]', function (el) { setActive(el.getAttribute('data-on'), true); });
  }
  function bind(sel, fn) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) (function (el) { el.addEventListener('click', function () { fn(el); }); })(els[i]);
  }

  /* ---------- ngừng hoạt động / kích hoạt lại ---------- */
  function requestActive(id, active) {
    var z = store.find('zones', id);
    if (!z) { A.toast('Không tìm thấy khu vực cần cập nhật.', 'error'); return; }
    if (active) { setActive(id, true); return; }

    var open = store.openHazardsOfZone(id);
    if (open.length) {
      A.toast('Khu vực “' + z.name + '” còn ' + open.length + ' nguy cơ đang mở (điểm rủi ro ' +
        store.zoneRisk(id).score + '). Hãy đóng hoặc chuyển các báo cáo đó trước khi ngừng hoạt động.',
        'error', 'Chưa thể ngừng hoạt động');
      // vẫn cho phép quản trị viên cưỡng chế sau khi đã đọc cảnh báo
      A.confirm({
        title: 'Vẫn ngừng hoạt động ' + z.code + '?',
        body: 'Còn ' + open.length + ' nguy cơ đang mở tại ' + z.name + '. Khu vực sẽ mất trên bản đồ rủi ro và không chọn được khi tạo báo cáo mới.',
        detail: 'Lịch sử nguy cơ vẫn giữ nguyên zoneId; nên thống nhất với quản lý công trường trước khi cưỡng chế.',
        okText: 'Vẫn ngừng hoạt động'
      }, function () { setActive(id, false); });
      return;
    }
    A.confirm({
      title: 'Ngừng hoạt động ' + z.code + '?',
      body: 'Khu vực “' + z.name + '” sẽ ẩn khỏi danh sách chọn của nhân sự hiện trường và các trang theo dõi.',
      detail: 'Có thể kích hoạt lại bất cứ lúc nào; dữ liệu lịch sử không bị xóa.',
      okText: 'Ngừng hoạt động'
    }, function () { setActive(id, false); });
  }

  function setActive(id, active) {
    var z = store.find('zones', id);
    if (!z) { A.toast('Không tìm thấy khu vực cần cập nhật.', 'error'); return; }
    store.update('zones', id, { active: active });
    A.toast(z.code + ' · ' + z.name + (active ? ' đã hoạt động lại.' : ' đã ngừng hoạt động.'),
      'success', active ? 'Đã kích hoạt' : 'Đã ngừng hoạt động');
    renderList(); kpis(); renderMap();
  }

  /* ---------- sơ đồ vùng ---------- */
  function rectOf(z) { return z.map || { x: 0, y: 0, w: 0, h: 0 }; }

  function overlaps(a, b) {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  }

  function mapSvg(list, highlightId) {
    var shapes = list.map(function (z) {
      var r = rectOf(z);
      if (!r.w || !r.h) return '';
      var risk = store.zoneRisk(z.id);
      var fill = !z.active ? '#b9c8c6' : (FILL[risk.band.level] || '#1ba99c');
      var on = z.id === highlightId;
      return '<g class="ss-zone' + (on ? ' is-active' : '') + '" data-zid="' + z.id + '"' + (on ? '' : ' tabindex="-1"') + '>' +
        '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h + '" rx="10" fill="' + fill + '"' +
        ' opacity="' + (on ? .95 : (z.active ? .78 : .45)) + '"' + (z.active ? '' : ' stroke-dasharray="6 5"') + '></rect>' +
        '<text class="ss-zone-name" x="' + (r.x + 10) + '" y="' + (r.y + 22) + '">' + A.esc(z.code) + '</text>' +
        '<text class="ss-zone-meta" x="' + (r.x + 10) + '" y="' + (r.y + 40) + '">' + A.esc(shorten(z.name, 26)) + '</text>' +
        '<text class="ss-zone-meta" x="' + (r.x + 10) + '" y="' + (r.y + 57) + '">' + (z.active ? risk.open + ' mở · điểm ' + risk.score : 'đã ngừng') + '</text>' +
        '</g>';
    }).join('');
    return '<svg viewBox="0 0 ' + MAP_W + ' ' + MAP_H + '" role="img" aria-label="Sơ đồ vùng các khu vực công trường">' +
      '<rect x="0" y="0" width="' + MAP_W + '" height="' + MAP_H + '" fill="#eef7f5"></rect>' + shapes + '</svg>';
  }

  function shorten(s, n) { return String(s || '').length > n ? String(s || '').slice(0, n - 1) + '…' : String(s || ''); }

  function renderMap() {
    var zones = store.list('zones');
    document.getElementById('mapHost').innerHTML = mapSvg(zones, null);
    document.getElementById('mapLegend').innerHTML = ['Nghiêm trọng', 'Cao', 'Trung bình', 'Thấp', 'An toàn'].map(function (lv) {
      return '<span><span class="ss-swatch" style="background:' + FILL[lv] + '"></span>' + A.esc(lv) + '</span>';
    }).join('') + '<span><span class="ss-swatch" style="background:#b9c8c6"></span>Đã ngừng hoạt động</span>' +
      '<span class="ms-auto">Bấm một khối trên sơ đồ để mở biểu mẫu sửa khu vực đó.</span>';
    bind('#mapHost [data-zid]', function (el) { openForm(el.getAttribute('data-zid')); });
  }

  function renderPreview() {
    var zones = store.list('zones').filter(function (z) { return z.id !== document.getElementById('fId').value; });
    var draft = { id: '__draft', code: document.getElementById('fCode').value || 'KQ-?', name: document.getElementById('fName').value || 'Tên khu vực',
      type: document.getElementById('fTypeInput').value, head: document.getElementById('fHead').value, active: true,
      map: { x: num('fMapX'), y: num('fMapY'), w: num('fMapW'), h: num('fMapH') } };
    document.getElementById('previewHost').innerHTML = mapSvg(zones.concat([draft]), '__draft');
  }
  function num(id) {
    var v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? 0 : v;
  }

  /* ---------- biểu mẫu ---------- */
  function options(values, selected, blank) {
    var out = blank ? '<option value="">' + blank + '</option>' : '';
    return out + values.map(function (v) {
      return '<option value="' + A.esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + A.esc(v) + '</option>';
    }).join('');
  }

  function openForm(id) {
    var z = id ? store.find('zones', id) : null;
    if (id && !z) { A.toast('Khu vực không còn trong dữ liệu.', 'error'); return; }
    var m = z && z.map ? z.map : { x: 60 + Math.round(Math.random() * 20) * 10, y: 470, w: 160, h: 110 };
    document.getElementById('formTitle').textContent = z ? 'Sửa khu vực ' + z.code : 'Thêm khu vực công trường';
    document.getElementById('fId').value = z ? z.id : '';
    document.getElementById('fCode').value = z ? z.code : '';
    document.getElementById('fName').value = z ? z.name : '';
    document.getElementById('fTypeInput').innerHTML = options(TYPES, z ? z.type : TYPES[0], null);
    document.getElementById('fHead').innerHTML = options(HEADS, z ? z.head : HEADS[0], '— Chọn tổ phụ trách —');
    document.getElementById('fMapX').value = m.x;
    document.getElementById('fMapY').value = m.y;
    document.getElementById('fMapW').value = m.w;
    document.getElementById('fMapH').value = m.h;
    document.getElementById('fActive').checked = z ? !!z.active : true;
    var used = z ? store.hazardsOfZone(z.id).length : 0;
    var openN = z ? store.openHazardsOfZone(z.id).length : 0;
    document.getElementById('formHint').textContent = z
      ? 'Toàn cảnh: ' + used + ' nguy cơ đã ghi nhận, ' + openN + ' đang mở.'
      : 'Khu vực mới sẽ xuất hiện trên bản đồ rủi ro ngay sau khi lưu.';
    ['fCode', 'fName', 'fTypeInput', 'fHead', 'fMapX', 'fMapY', 'fMapW', 'fMapH'].forEach(function (k) {
      document.getElementById(k).classList.remove('is-invalid');
    });
    document.getElementById('mapErr').hidden = true;
    renderPreview();
    formModal.show();
  }

  function fieldError(id, message) {
    var el = document.getElementById(id);
    el.classList.add('is-invalid');
    var fb = el.parentNode.querySelector('.invalid-feedback');
    if (fb && message) fb.textContent = message;
  }

  function validate() {
    var ok = true;
    var code = document.getElementById('fCode');
    code.value = code.value.trim().toUpperCase();
    var name = document.getElementById('fName');
    var id = document.getElementById('fId').value;
    ['fCode', 'fName', 'fTypeInput', 'fHead', 'fMapX', 'fMapY', 'fMapW', 'fMapH'].forEach(function (k) {
      document.getElementById(k).classList.remove('is-invalid');
    });
    var mapErr = document.getElementById('mapErr');
    mapErr.hidden = true;

    if (!CODE_RE.test(code.value)) {
      fieldError('fCode', 'Mã khu vực phải viết hoa không dấu, dạng KQ-ABC (2–6 ký tự sau gạch nối).');
      ok = false;
    } else if (store.where('zones', function (z) { return z.code === code.value && z.id !== id; }).length) {
      fieldError('fCode', 'Mã ' + code.value + ' đã được khu vực khác sử dụng.');
      ok = false;
    }
    if (name.value.trim().length < 4) { name.classList.add('is-invalid'); ok = false; }
    if (!document.getElementById('fTypeInput').value) { fieldError('fTypeInput', ''); ok = false; }
    if (!document.getElementById('fHead').value) { fieldError('fHead', ''); ok = false; }

    var m = { x: num('fMapX'), y: num('fMapY'), w: num('fMapW'), h: num('fMapH') };
    var bad = [];
    if (m.x < 0) bad.push('Trái (x) không được âm.');
    if (m.y < 0) bad.push('Trên (y) không được âm.');
    if (m.w < MIN_SIDE) bad.push('Rộng (w) phải ≥ ' + MIN_SIDE + '.');
    if (m.h < MIN_SIDE) bad.push('Cao (h) phải ≥ ' + MIN_SIDE + '.');
    if (m.x + m.w > MAP_W) bad.push('Vùng tràn ra cạnh phải khung bản đồ (x + w ≤ ' + MAP_W + ').');
    if (m.y + m.h > MAP_H) bad.push('Vùng tràn ra cạnh dưới khung bản đồ (y + h ≤ ' + MAP_H + ').');
    if (bad.length) {
      mapErr.hidden = false;
      mapErr.innerHTML = '<i class="bi bi-rulers me-1"></i>' + bad.map(A.esc).join('<br>');
      ['fMapX', 'fMapY', 'fMapW', 'fMapH'].forEach(function (k) { document.getElementById(k).classList.add('is-invalid'); });
      ok = false;
    }
    return ok;
  }

  function writeRecord(forceOff) {
    var id = document.getElementById('fId').value;
    var patch = {
      code: document.getElementById('fCode').value.trim().toUpperCase(),
      name: document.getElementById('fName').value.trim(),
      type: document.getElementById('fTypeInput').value,
      head: document.getElementById('fHead').value,
      active: document.getElementById('fActive').checked,
      map: { x: num('fMapX'), y: num('fMapY'), w: num('fMapW'), h: num('fMapH') }
    };
    var old = id ? store.find('zones', id) : null;
    // bỏ dấu "đang hoạt động" trong biểu mẫu cũng phải qua quy tắc nguy cơ mở
    var switchingOff = !!(old && old.active && !patch.active);
    var openN = switchingOff ? store.openHazardsOfZone(id).length : 0;
    if (switchingOff && openN && !forceOff) {
      A.toast('Chưa lưu: ' + old.name + ' còn ' + openN + ' nguy cơ đang mở — hãy đóng các báo cáo đó trước.',
        'error', 'Chưa thể ngừng hoạt động');
      A.confirm({
        title: 'Vẫn tắt khu vực ' + (old.code || '') + '?',
        body: 'Lưu kèm ngừng hoạt động khi còn ' + openN + ' nguy cơ đang mở. Khu vực sẽ ẩn khỏi bản đồ rủi ro và không chọn được nữa.',
        detail: 'Lịch sử nguy cơ vẫn giữ zoneId cũ; nên thống nhất với quản lý công trường.',
        okText: 'Vẫn lưu và ngừng hoạt động'
      }, function () { writeRecord(true); });
      return;
    }
    if (!patch.head) patch.head = 'Chưa phân công';
    if (id) {
      store.update('zones', id, patch);
      A.toast('Đã cập nhật ' + patch.code + ' · ' + patch.name +
        (switchingOff ? ' (khu vực đã ngừng hoạt động).' : '.'), 'success', 'Lưu khu vực');
    } else {
      patch.id = nextZoneId();
      store.insert('zones', patch);
      A.toast('Đã thêm ' + patch.code + ' (' + patch.name + ') và vẽ vùng lên bản đồ rủi ro.', 'success', 'Thêm khu vực');
    }
    formModal.hide();
    renderList(); kpis(); renderMap();
  }

  function nextZoneId() {
    var max = 0;
    store.list('zones').forEach(function (z) {
      var m = /^Z-(\d+)/.exec(z.id);
      if (m) max = Math.max(max, +m[1]);
    });
    return 'Z-' + ('00' + (max + 1)).slice(-3);
  }

  function save(e) {
    e.preventDefault();
    if (!validate()) {
      A.toast('Chưa lưu: kiểm tra lại các trường tô đỏ.', 'error', 'Biểu mẫu chưa hợp lệ');
      return;
    }
    var id = document.getElementById('fId').value;
    var me = { x: num('fMapX'), y: num('fMapY'), w: num('fMapW'), h: num('fMapH') };
    var clash = store.where('zones', function (z) {
      return z.id !== id && z.active && rectOf(z).w > 0 && overlaps(me, rectOf(z));
    })[0];
    if (clash) {
      A.confirm({
        title: 'Vùng bản đồ chồng lấn',
        body: 'Chữ nhật mới chồng lên ' + clash.code + ' · ' + clash.name + ' trên bản đồ rủi ro (SCR-07).',
        detail: 'Hai vùng đè nhau khiến khối rủi ro khó đọc. Nên dịch chuyển ô x/y cho tách biệt.',
        okText: 'Vẫn lưu'
      }, writeRecord);
      return;
    }
    writeRecord();
  }

  /* ---------- bộ lọc ---------- */
  function clearFilters() {
    f = { q: '', type: '', state: '' };
    document.getElementById('q').value = '';
    document.getElementById('fType').value = '';
    document.getElementById('fState').value = '';
    renderList();
  }

  /* ---------- khởi tạo ---------- */
  document.getElementById('fType').innerHTML = options(TYPES, null, 'Mọi loại khu vực');
  formModal = new bootstrap.Modal(document.getElementById('formModal'));

  kpis();
  renderList();
  renderMap();

  document.getElementById('q').addEventListener('input', A.debounce(function (e) { f.q = e.target.value; renderList(); }, 220));
  document.getElementById('fType').addEventListener('change', function (e) { f.type = e.target.value; renderList(); });
  document.getElementById('fState').addEventListener('change', function (e) { f.state = e.target.value; renderList(); });
  document.getElementById('clearFilter').addEventListener('click', clearFilters);
  document.getElementById('newBtn').addEventListener('click', function () { openForm(null); });
  document.getElementById('scrollMap').addEventListener('click', function () {
    var el = document.getElementById('mapCard');
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('zoneForm').addEventListener('submit', save);
  ['fMapX', 'fMapY', 'fMapW', 'fMapH', 'fCode', 'fName', 'fTypeInput', 'fHead'].forEach(function (k) {
    document.getElementById(k).addEventListener('input', function () {
      document.getElementById(k).classList.remove('is-invalid');
      if (document.getElementById('formModal').classList.contains('show')) renderPreview();
    });
  });
})();
