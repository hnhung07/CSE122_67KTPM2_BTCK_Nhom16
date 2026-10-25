/* SCR-12 · Quản lý tài khoản (SV3 – Đỗ Hồng Nhung)
   C/R/U trên danh mục tài khoản mô phỏng: phân vai trò, chặn trùng email,
   vô hiệu hóa có kiểm tra (không tắt chính mình, không để mất admin cuối cùng). */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;

  var ROLES = (store.read().roles || []).slice();
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
  var PHONE_RE = /^\d{9,11}$/;

  function roleName(id) {
    for (var i = 0; i < ROLES.length; i++) if (ROLES[i].id === id) return ROLES[i].name;
    return A.ROLE_LABEL[id] || id;
  }
  function roleDesc(id) {
    for (var i = 0; i < ROLES.length; i++) if (ROLES[i].id === id) return ROLES[i].desc;
    return '—';
  }
  function me() { return store.sessionUser(); }

  var f = { q: '', role: '', state: '' };
  var formModal = null;

  /* ---------- lọc ---------- */
  function rows() {
    return store.where('users', function (u) {
      if (f.role && u.role !== f.role) return false;
      if (f.state === 'active' && !u.active) return false;
      if (f.state === 'inactive' && u.active) return false;
      if (f.q) {
        var hay = (u.name + ' ' + u.email + ' ' + (u.username || '') + ' ' + u.unit + ' ' + (u.phone || '') + ' ' + roleName(u.role)).toLowerCase();
        if (hay.indexOf(f.q.toLowerCase()) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return String(a.name).localeCompare(String(b.name), 'vi');
    });
  }

  /* ---------- KPI + thống kê theo vai trò ---------- */
  function kpis() {
    var all = store.list('users');
    var active = all.filter(function (u) { return u.active; });
    var admins = all.filter(function (u) { return u.role === 'admin'; });
    var adminActive = admins.filter(function (u) { return u.active; });
    var recent = all.filter(function (u) {
      return u.lastLogin && (Date.now() - new Date(u.lastLogin).getTime()) < 3 * 864e5;
    }).length;
    var cards = [
      { v: all.length, l: 'Tổng tài khoản', i: 'people', c: 'var(--ss-teal-700)' },
      { v: active.length, l: 'Đang hoạt động', i: 'person-check', c: 'var(--ss-lv-thap)' },
      { v: all.length - active.length, l: 'Đã vô hiệu hóa', i: 'person-dash', c: 'var(--ss-ink-soft)' },
      { v: adminActive.length + '/' + admins.length, l: 'Quản trị viên hoạt động', i: 'shield-lock', c: 'var(--ss-tint-blue-fg)' },
      { v: recent, l: 'Đăng nhập trong 3 ngày', i: 'clock-history', c: 'var(--ss-tint-orange-fg)' }
    ];
    document.getElementById('kpis').innerHTML = cards.map(function (c) {
      return '<div class="col-6 col-xl-2"><div class="card h-100"><div class="card-body ss-kpi">' +
        '<div class="d-flex justify-content-between align-items-start"><span class="ss-kpi-value" style="color:' + c.c + ';font-size:1.5rem">' + c.v + '</span>' +
        '<span class="ss-kpi-icon"><i class="bi bi-' + c.i + '"></i></span></div>' +
        '<div class="ss-kpi-label">' + c.l + '</div></div></div></div>';
    }).join('');

    var byRole = store.tally(all, 'role');
    var byRoleActive = store.tally(active, 'role');
    document.getElementById('roleStats').innerHTML = ROLES.map(function (r) {
      var total = byRole[r.id] || 0, on = byRoleActive[r.id] || 0;
      var danger = r.id === 'admin' && on === 0;
      return '<button type="button" class="ss-chip" data-role="' + r.id + '" title="Lọc theo vai trò ' + A.esc(r.name) + '"' +
        (danger ? ' style="border-color:var(--ss-tint-red-bd);color:var(--ss-tint-red-fg)"' : '') + '>' +
        '<i class="bi bi-person-badge"></i>' + A.esc(r.name) +
        ' <span class="fw-bold">' + on + '/' + total + '</span></button>';
    }).join('') + '<span class="ss-row-meta align-self-center ms-auto">Tỉ lệ đang hoạt động / tổng số theo vai trò (store.tally).</span>';
    var chips = document.querySelectorAll('#roleStats [data-role]');
    for (var i = 0; i < chips.length; i++) (function (el) {
      el.addEventListener('click', function () {
        f.role = f.role === el.getAttribute('data-role') ? '' : el.getAttribute('data-role');
        document.getElementById('fRole').value = f.role;
        renderList();
      });
    })(chips[i]);
  }

  /* ---------- bảng ---------- */
  function lastLoginText(u) {
    return u.lastLogin ? A.timeAgo(u.lastLogin) : 'chưa đăng nhập lần nào';
  }

  function renderList() {
    var host = document.getElementById('listHost');
    var data = rows();
    document.getElementById('rowCount').textContent = data.length + '/' + store.list('users').length + ' tài khoản';

    if (!data.length) {
      host.innerHTML = A.empty('person-x', store.list('users').length ? 'Không tìm thấy tài khoản phù hợp' : 'Chưa có tài khoản nào',
        store.list('users').length
          ? 'Thử xóa bộ lọc vai trò/trạng thái, hoặc gõ một phần tên, email hay đơn vị.'
          : 'Hãy thêm tài khoản đầu tiên và gán vai trò phù hợp.',
        '<button class="btn btn-primary btn-sm mt-1" data-new><i class="bi bi-person-plus me-1"></i>Thêm tài khoản</button>' +
        '<button class="btn btn-ghost btn-sm mt-1" data-reset-filter>Xóa bộ lọc</button>');
      var nb = host.querySelector('[data-new]');
      if (nb) nb.addEventListener('click', function () { openForm(null); });
      var rb = host.querySelector('[data-reset-filter]');
      if (rb) rb.addEventListener('click', clearFilters);
      return;
    }

    host.innerHTML = '<div class="table-responsive"><table class="table table-hover align-middle mb-0">' +
      '<thead><tr><th scope="col">Tài khoản</th>' +
      '<th scope="col">Vai trò</th>' +
      '<th scope="col" class="d-none d-lg-table-cell">Đơn vị</th>' +
      '<th scope="col" class="d-none d-md-table-cell">Liên hệ</th>' +
      '<th scope="col" class="d-none d-xl-table-cell">Đăng nhập gần nhất</th>' +
      '<th scope="col">Trạng thái</th>' +
      '<th scope="col" class="text-end">Thao tác</th></tr></thead><tbody>' +
      data.map(rowHtml).join('') + '</tbody></table></div>';
    wireRows();
  }

  function rowHtml(u) {
    var self = me() && u.id === me().id;
    return '<tr data-id="' + u.id + '">' +
      '<td><div class="d-flex gap-2 align-items-center">' +
      '<span class="ss-avatar">' + A.esc(A.initials(u.name)) + '</span>' +
      '<div class="min-w-0"><div class="ss-row-title">' + A.esc(u.name) +
      (self ? ' <span class="ss-badge" style="background:var(--ss-teal-50);color:var(--ss-teal-800);border:1px solid var(--ss-teal-100)">bạn đang dùng</span>' : '') + '</div>' +
      '<div class="ss-row-meta text-truncate" style="max-width:260px">' + A.esc(u.email) + '</div>' +
      '<div class="ss-row-meta"><i class="bi bi-person me-1"></i><code>' + A.esc(u.username || '—') + '</code>' +
      (u.mustChange ? ' <span class="ss-badge ss-badge-amber">buộc đổi mật khẩu</span>' : '') + '</div>' +
      '<div class="ss-row-meta d-lg-none">' + A.esc(u.unit) + '</div></div></div></td>' +
      '<td><span class="ss-chip" style="font-size:.76rem">' + A.esc(roleName(u.role)) + '</span></td>' +
      '<td class="small d-none d-lg-table-cell">' + A.esc(u.unit) + '</td>' +
      '<td class="small d-none d-md-table-cell">' + A.esc(u.phone || '—') + '</td>' +
      '<td class="small d-none d-xl-table-cell">' + lastLoginText(u) +
      (u.lastLogin ? '<div class="ss-row-meta">' + A.datetime(u.lastLogin) + '</div>' : '') + '</td>' +
      '<td>' + (u.active ? '<span class="badge text-bg-success">Hoạt động</span>' : '<span class="badge text-bg-secondary">Đã vô hiệu hóa</span>') + '</td>' +
      '<td class="text-end"><div class="ss-steps justify-content-end">' +
      '<button class="btn btn-ghost btn-sm py-0" data-edit="' + u.id + '" title="Sửa tài khoản" aria-label="Sửa tài khoản ' + A.esc(u.name) + '"><i class="bi bi-pencil"></i></button>' +
      (u.active
        ? '<button class="btn btn-ghost btn-sm py-0 text-danger" data-off="' + u.id + '" aria-label="Vô hiệu hóa tài khoản ' + A.esc(u.name) + '"' + (self ? ' disabled title="Không thể vô hiệu hóa chính mình"' : '') + '>Vô hiệu hóa</button>'
        : '<button class="btn btn-soft btn-sm py-0" data-on="' + u.id + '" aria-label="Kích hoạt lại tài khoản ' + A.esc(u.name) + '">Kích hoạt lại</button>') +
      '</div></td></tr>';
  }

  function wireRows() {
    bind('#listHost [data-edit]', function (el) { openForm(el.getAttribute('data-edit')); });
    bind('#listHost [data-off]', function (el) { setActive(el.getAttribute('data-off'), false); });
    bind('#listHost [data-on]', function (el) { setActive(el.getAttribute('data-on'), true); });
  }
  function bind(sel, fn) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) (function (el) { el.addEventListener('click', function () { fn(el); }); })(els[i]);
  }

  /* ---------- vô hiệu hóa / kích hoạt lại (có hàng rào kiểm tra) ---------- */
  function setActive(id, active) {
    var u = store.find('users', id);
    if (!u) { A.toast('Không tìm thấy tài khoản cần cập nhật.', 'error'); return; }
    var current = me();

    if (!active) {
      if (current && u.id === current.id) {
        A.toast('Bạn không thể vô hiệu hóa chính tài khoản đang đăng nhập.', 'error', 'Thao tác bị chặn');
        return;
      }
      if (u.role === 'admin') {
        var otherAdmins = store.where('users', function (x) { return x.role === 'admin' && x.active && x.id !== u.id; });
        if (!otherAdmins.length) {
          A.toast('Đây là quản trị viên đang hoạt động cuối cùng. Hệ thống sẽ không còn ai quản lý cấu hình.', 'error', 'Không được tắt admin cuối cùng');
          return;
        }
      }
      var roleLeft = store.where('users', function (x) { return x.role === u.role && x.active && x.id !== u.id; }).length;
      var body = 'Tài khoản “' + u.name + '” (' + roleName(u.role) + ' · ' + u.unit + ') sẽ không đăng nhập được vào hệ thống.';
      var detail = 'Lịch sử báo cáo và checklist đã giao vẫn được giữ.';
      if (!roleLeft) detail += ' Cảnh báo: sau thao tác này không còn tài khoản nào hoạt động ở vai trò ' + roleName(u.role) + ', điều hướng nhanh trên thanh trên sẽ trống.';
      A.confirm({
        title: 'Vô hiệu hóa ' + u.name + '?',
        body: body,
        detail: detail,
        okText: 'Vô hiệu hóa'
      }, function () { commit(id, false); });
      return;
    }
    commit(id, true);
  }

  function commit(id, active) {
    var u = store.find('users', id);
    if (!u) { A.toast('Tài khoản không còn tồn tại.', 'error'); return; }
    store.update('users', id, { active: active });
    A.toast(u.name + (active ? ' đã được kích hoạt lại.' : ' đã vô hiệu hóa.'), 'success', active ? 'Đã kích hoạt' : 'Đã vô hiệu hóa');
    renderList(); kpis();
  }

  /* ---------- biểu mẫu ---------- */
  function options(values, label) {
    var out = label ? '<option value="">' + label + '</option>' : '';
    return out + values.map(function (v) { return '<option value="' + A.esc(v.id) + '">' + A.esc(v.name) + '</option>'; }).join('');
  }

  function openForm(id) {
    var u = id ? store.find('users', id) : null;
    if (id && !u) { A.toast('Tài khoản không còn trong dữ liệu.', 'error'); return; }
    document.getElementById('formTitle').textContent = u ? 'Sửa tài khoản · ' + u.name : 'Thêm tài khoản';
    document.getElementById('fId').value = u ? u.id : '';
    document.getElementById('fName').value = u ? u.name : '';
    document.getElementById('fEmail').value = u ? u.email : '';
    document.getElementById('fUsername').value = u ? (u.username || '') : '';
    document.getElementById('fPassword').value = '';
    document.getElementById('fPassword').required = !u;
    document.getElementById('fPwdReq').hidden = !!u;
    document.getElementById('fPassword').placeholder = u ? 'Để trống nếu giữ mật khẩu hiện tại' : '8–24 ký tự, đủ 4 nhóm';
    document.getElementById('fRoleInput').innerHTML = options(ROLES, null);
    document.getElementById('fRoleInput').value = u ? u.role : ROLES[0].id;
    document.getElementById('fUnit').value = u ? u.unit : '';
    document.getElementById('fPhone').value = u ? (u.phone || '') : '';
    document.getElementById('fActive').checked = u ? !!u.active : true;
    ['fName', 'fEmail', 'fUsername', 'fPassword', 'fUnit', 'fPhone'].forEach(function (k) { document.getElementById(k).classList.remove('is-invalid'); });
    document.getElementById('roleNote').hidden = true;
    document.getElementById('formHint').textContent = u
      ? 'Đăng nhập gần nhất: ' + lastLoginText(u) + ' · điền mật khẩu chỉ khi muốn đặt lại.'
      : 'Tài khoản mới sẽ buộc đổi mật khẩu ở lần đăng nhập đầu tiên.';
    var isSelf = !!(u && me() && u.id === me().id);
    document.getElementById('activeHint').textContent = isSelf
      ? 'Đây là tài khoản bạn đang dùng để đăng nhập — hệ thống không cho phép tự vô hiệu hóa.'
      : (u && !u.active ? 'Tài khoản đang bị vô hiệu hóa, không hiển thị trong danh sách phân công.' : '');
    syncRole();
    formModal.show();
  }

  function syncRole() {
    var rid = document.getElementById('fRoleInput').value;
    document.getElementById('roleDesc').textContent = roleDesc(rid);
    var byRole = store.tally(store.list('users'), 'role');
    var note = document.getElementById('roleNote');
    if (rid === 'admin') {
      note.hidden = false;
      note.innerHTML = '<i class="bi bi-shield-lock me-1"></i>Vai trò Quản trị viên quản lý cấu hình dùng chung (mẫu checklist, khu vực, tài khoản). ' +
        'Hiện có ' + (byRole.admin || 0) + ' tài khoản admin trong hệ thống.';
    } else if (rid === 'worker') {
      note.hidden = false;
      note.innerHTML = '<i class="bi bi-clipboard2-check me-1"></i>Nhân sự hiện trường chỉ thấy checklist được giao và báo cáo của chính mình.';
    } else if (rid === 'safety') {
      note.hidden = false;
      note.innerHTML = '<i class="bi bi-shield-check me-1"></i>Cán bộ an toàn xem xét nguy cơ và quản lý đợt kiểm tra toàn công trường.';
    } else {
      note.hidden = false;
      note.innerHTML = '<i class="bi bi-bar-chart-line me-1"></i>Quản lý công trường theo dõi bản đồ rủi ro, hành động khắc phục và báo cáo.';
    }
  }

  function normalizePhone(v) { return String(v || '').replace(/[\s.\-]/g, ''); }

  function validate() {
    var ok = true;
    var id = document.getElementById('fId').value;
    var name = document.getElementById('fName');
    var email = document.getElementById('fEmail');
    var username = document.getElementById('fUsername');
    var pwd = document.getElementById('fPassword');
    var unit = document.getElementById('fUnit');
    var phone = document.getElementById('fPhone');
    [name, email, username, pwd, unit, phone].forEach(function (el) { el.classList.remove('is-invalid'); });

    if (name.value.trim().length < 3) {
      document.getElementById('fNameErr').textContent = 'Họ tên phải từ 3 ký tự trở lên (ví dụ: Nguyễn Văn A).';
      name.classList.add('is-invalid'); ok = false;
    }
    var mail = email.value.trim().toLowerCase();
    if (!EMAIL_RE.test(mail)) {
      document.getElementById('fEmailErr').textContent = 'Email cần dạng ten@miền.vn (không dấu cách, có tên miền).';
      email.classList.add('is-invalid'); ok = false;
    } else {
      var dup = store.where('users', function (u) {
        return u.id !== id && String(u.email || '').toLowerCase() === mail;
      })[0];
      if (dup) {
        document.getElementById('fEmailErr').textContent = 'Email này đã dùng cho tài khoản ' + dup.name + '.';
        email.classList.add('is-invalid'); ok = false;
      }
    }
    var uname = username.value.trim().toLowerCase();
    var uErr = store.usernameErrors(uname, id);
    if (uErr.length) {
      document.getElementById('fUsernameErr').textContent = uErr[0];
      username.classList.add('is-invalid'); ok = false;
    }
    // Khi sửa tài khoản, mật khẩu chỉ bắt buộc nếu quản trị viên muốn đặt lại.
    if (pwd.value || !id) {
      var pErr = store.passwordErrors(pwd.value, uname);
      if (pErr.length) {
        document.getElementById('fPasswordErr').textContent = pErr[0];
        pwd.classList.add('is-invalid'); ok = false;
      }
    }
    if (unit.value.trim().length < 2) {
      document.getElementById('fUnitErr').textContent = 'Ghi rõ đơn vị hoặc tổ phụ trách (ví dụ: Tổ 3 – Hầm/móng).';
      unit.classList.add('is-invalid'); ok = false;
    }
    var digits = normalizePhone(phone.value);
    if (!PHONE_RE.test(digits)) {
      document.getElementById('fPhoneErr').textContent = 'Số điện thoại chỉ gồm chữ số, 9–11 ký tự (ví dụ 0912345678).';
      phone.classList.add('is-invalid'); ok = false;
    }
    if (!document.getElementById('fRoleInput').value) ok = false;
    return { ok: ok, digits: digits, mail: mail, uname: uname, pwd: pwd.value };
  }

  function save(e) {
    e.preventDefault();
    var v = validate();
    if (!v.ok) { A.toast('Chưa lưu: kiểm tra lại các trường tô đỏ.', 'error', 'Biểu mẫu chưa hợp lệ'); return; }

    var id = document.getElementById('fId').value;
    var patch = {
      name: document.getElementById('fName').value.trim(),
      email: v.mail,
      username: v.uname,
      role: document.getElementById('fRoleInput').value,
      unit: document.getElementById('fUnit').value.trim(),
      phone: v.digits,
      active: document.getElementById('fActive').checked
    };
    var old = id ? store.find('users', id) : null;
    var switchingOff = !!(old && old.active && !patch.active);
    var current = me();

    if (switchingOff && current && old.id === current.id) {
      A.toast('Bạn đang đăng nhập bằng tài khoản này — không thể tự vô hiệu hóa.', 'error', 'Thao tác bị chặn');
      return;
    }
    if (switchingOff && old.role === 'admin') {
      var others = store.where('users', function (x) { return x.role === 'admin' && x.active && x.id !== old.id; }).length;
      if (!others) {
        A.toast('Không thể lưu: đây là quản trị viên hoạt động cuối cùng.', 'error', 'Cần ít nhất một admin');
        return;
      }
    }

    if (v.pwd) {
      patch.passwordHash = store.hashPassword(v.uname, v.pwd);
      patch.mustChange = true;
    }

    if (id) {
      store.update('users', id, patch);
      A.toast('Đã cập nhật tài khoản ' + patch.name + '.' + (v.pwd ? ' Mật khẩu mới đã đặt, người dùng buộc đổi khi đăng nhập.' : ''), 'success', 'Lưu tài khoản');
    } else {
      patch.id = nextUserId();
      patch.lastLogin = null;
      store.insert('users', patch);
      A.toast('Đã thêm ' + patch.name + ' (' + patch.username + ') với vai trò ' + roleName(patch.role) + '. Người dùng đăng nhập bằng mật khẩu vừa đặt và buộc đổi lần đầu.', 'success', 'Thêm tài khoản');
    }
    formModal.hide();
    renderList(); kpis();
  }

  function nextUserId() {
    var max = 0;
    store.list('users').forEach(function (u) {
      var m = /^U-(\d+)/.exec(u.id);
      if (m) max = Math.max(max, +m[1]);
    });
    return 'U-' + ('00' + (max + 1)).slice(-3);
  }

  /* ---------- bộ lọc ---------- */
  function clearFilters() {
    f = { q: '', role: '', state: '' };
    document.getElementById('q').value = '';
    document.getElementById('fRole').value = '';
    document.getElementById('fState').value = '';
    renderList();
  }

  /* ---------- khởi tạo ---------- */
  document.getElementById('fRole').innerHTML = options(ROLES, 'Mọi vai trò');
  // gợi ý đơn vị có sẵn để quản trị viên khỏi gõ tay
  document.getElementById('unitList').innerHTML = Object.keys(store.tally(store.list('users'), 'unit'))
    .map(function (x) { return '<option value="' + A.esc(x) + '"></option>'; }).join('');
  formModal = new bootstrap.Modal(document.getElementById('formModal'));

  kpis();
  renderList();

  document.getElementById('q').addEventListener('input', A.debounce(function (e) { f.q = e.target.value; renderList(); }, 220));
  document.getElementById('fRole').addEventListener('change', function (e) { f.role = e.target.value; renderList(); });
  document.getElementById('fState').addEventListener('change', function (e) { f.state = e.target.value; renderList(); });
  document.getElementById('clearFilter').addEventListener('click', clearFilters);
  document.getElementById('newBtn').addEventListener('click', function () { openForm(null); });
  document.getElementById('userForm').addEventListener('submit', save);
  document.getElementById('fRoleInput').addEventListener('change', syncRole);
  document.getElementById('fPhone').addEventListener('input', function (e) {
    e.target.value = e.target.value.replace(/[^\d\s.\-]/g, '');
  });
  document.getElementById('fUsername').addEventListener('input', function (e) {
    e.target.value = e.target.value.toLowerCase().replace(/\s+/g, '');
  });
})();
