(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;
  var HINT = {
    worker: 'Checklist · báo nguy cơ · theo dõi báo cáo của mình',
    safety: 'Dashboard · xem xét nguy cơ · đợt kiểm tra',
    manager: 'Bản đồ rủi ro · hành động khắc phục · báo cáo',
    admin: 'Mẫu checklist · khu vực · tài khoản'
  };
  var next = A.qs('next');
  var el = {};
  var lockTimer = null;

  function roleHome(role) { return A.NAV[role].home; }
  function target(role) {
    if (next && next.indexOf(role + '/') === 0) return next;
    return roleHome(role);
  }

  function showError(kind, html) {
    el.error.className = 'alert alert-' + kind;
    el.error.innerHTML = html;
    el.error.setAttribute('role', kind === 'danger' ? 'alert' : 'status');
  }
  function clearError() {
    el.error.className = 'alert d-none';
    el.error.textContent = '';
  }

  function nameProblems(name) {
    var known = store.findByUsername(name.toLowerCase());
    return store.usernameErrors(name, known ? known.id : null);
  }

  /* Khóa tạm: đếm ngược trên nút đăng nhập, không cho gửi khi còn khóa. */
  function startLock(seconds, username) {
    stopLock();
    var left = seconds;
    el.submit.disabled = true;
    function render() {
      showError('warning', '<i class="bi bi-hourglass-split me-1"></i>Nhập sai ' + store.MAX_FAILS +
        ' lần liên tiếp — tài khoản <strong>' + A.esc(username) + '</strong> bị khóa tạm. Còn <strong>' +
        left + ' giây</strong>.');
      el.submit.innerHTML = '<i class="bi bi-lock me-1"></i>Đang khóa: ' + left + 's';
    }
    render();
    lockTimer = setInterval(function () {
      left -= 1;
      if (left <= 0) {
        stopLock();
        clearError();
        el.submit.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i>Đăng nhập';
        return;
      }
      render();
    }, 1000);
  }
  function stopLock() {
    clearInterval(lockTimer);
    lockTimer = null;
    el.submit.disabled = false;
  }

  /* Seed khai báo mật khẩu rõ; sang LocalStorage chỉ còn bản băm nên bảng demo đọc từ bản gốc. */
  function demoPassword(u) {
    var rows = (window.SITESAFE_SEED || {}).users || [];
    for (var i = 0; i < rows.length; i++) if (rows[i].id === u.id) return rows[i].password;
    return '—';
  }

  function render() {
    el.ruleUser.innerHTML = store.AUTH_RULES.username.map(function (t) { return '<li>' + A.esc(t) + '</li>'; }).join('');
    el.rulePwd.innerHTML = store.AUTH_RULES.password.map(function (t) { return '<li>' + A.esc(t) + '</li>'; }).join('');

    var users = store.list('users');
    el.demoRows.innerHTML = Object.keys(A.NAV).map(function (role) {
      return users.filter(function (u) { return u.role === role; }).map(function (u, i) {
        return '<tr' + (i === 0 ? ' class="border-top-0"' : '') + ' data-role="' + role + '">' +
          '<td class="ps-3"><span class="ss-row-title">' + A.esc(A.ROLE_LABEL[role]) + '</span>' +
          '<div class="ss-row-meta">' + A.esc(u.name) + (u.active ? '' : ' · vô hiệu hóa') + ' · ' + A.esc(HINT[role]) + '</div></td>' +
          '<td><code>' + A.esc(u.username) + '</code></td>' +
          '<td><code>' + A.esc(demoPassword(u)) + '</code></td>' +
          '<td class="pe-3 text-end"><button type="button" class="btn btn-ghost btn-sm" ' +
          'data-fill="' + A.esc(u.username) + '" aria-label="Điền nhanh tài khoản ' + A.esc(u.username) + '">Điền</button></td></tr>';
      }).join('');
    }).join('');

    document.getElementById('roleCount').textContent = Object.keys(A.NAV).length + ' vai trò · ' +
      users.filter(function (u) { return u.active; }).length + ' tài khoản hoạt động';
    var s = store.summary();
    document.getElementById('dbStats').innerHTML =
      '<i class="bi bi-database me-1"></i>' + store.list('hazards').length + ' nguy cơ · ' +
      store.list('zones').filter(function (z) { return z.active; }).length + ' khu vực · ' +
      s.actions + ' hành động · ' + store.list('templates').filter(function (t) { return t.active; }).length + ' mẫu checklist';
  }

  function fill(username) {
    el.username.value = username;
    el.password.value = demoPassword(store.findByUsername(username.toLowerCase())) || '';
    clearError();
    stopLock();
    el.submit.focus();
  }

  function submit() {
    if (el.submit.disabled) return;
    var name = el.username.value.trim();
    var pwd = el.password.value;
    if (!name || !pwd) {
      showError('danger', '<i class="bi bi-exclamation-triangle me-1"></i>Nhập đầy đủ tên đăng nhập và mật khẩu.');
      (name ? el.password : el.username).focus();
      return;
    }
    var bad = nameProblems(name);
    if (bad.length) {
      showError('danger', '<i class="bi bi-exclamation-triangle me-1"></i>' + A.esc(bad[0]));
      el.username.focus();
      return;
    }
    var r = store.authenticate(name, pwd);
    if (r.ok) {
      store.login(r.user.id);
      location.href = target(r.user.role);
      return;
    }
    if (r.reason === 'lock') { startLock(r.lockedFor, name.toLowerCase()); return; }
    if (r.reason === 'inactive') {
      showError('warning', '<i class="bi bi-person-slash me-1"></i>Tài khoản <strong>' + A.esc(name) +
        '</strong> đã bị vô hiệu hóa. Hãy dùng tài khoản khác hoặc nhờ quản trị viên bật lại.');
      return;
    }
    showError('danger', '<i class="bi bi-x-octagon me-1"></i>Tên đăng nhập hoặc mật khẩu không đúng. Còn <strong>' +
      r.attemptsLeft + '</strong> lần trước khi bị khóa tạm ' + store.LOCK_SECONDS + ' giây.');
    el.password.select();
  }

  document.addEventListener('DOMContentLoaded', function () {
    el = {
      form: document.getElementById('loginForm'),
      username: document.getElementById('username'),
      password: document.getElementById('password'),
      error: document.getElementById('loginError'),
      submit: document.getElementById('btnLogin'),
      toggle: document.getElementById('togglePwd'),
      demoRows: document.getElementById('demoRows'),
      ruleUser: document.getElementById('ruleUser'),
      rulePwd: document.getElementById('rulePwd')
    };
    render();

    if (A.qs('switch') === '1') {
      store.logout();
      showError('info', '<i class="bi bi-arrow-repeat me-1"></i>Đã đăng xuất phiên cũ — đăng nhập tài khoản của vai trò khác.');
    } else {
      var cur = store.session();
      if (cur) {
        showError('info', '<i class="bi bi-person-check me-1"></i>Phiên hiện tại: <strong>' + A.esc(cur.name) +
          '</strong> (' + A.esc(cur.username || '') + '). Đăng nhập tài khoản khác sẽ thay thế phiên này.');
      }
    }

    if (next) {
      var note = document.createElement('div');
      note.className = 'ss-row-meta mb-3';
      note.innerHTML = '<i class="bi bi-link-45deg me-1"></i>Bạn cần tới <code>' + A.esc(next) +
        '</code> — đăng nhập đúng vai trò để mở màn hình này.';
      el.form.insertBefore(note, el.error.nextSibling);
    }

    el.form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    el.demoRows.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-fill]');
      if (btn) fill(btn.getAttribute('data-fill'));
    });
    el.toggle.addEventListener('click', function () {
      var reveal = el.password.type === 'password';
      el.password.type = reveal ? 'text' : 'password';
      el.toggle.setAttribute('aria-pressed', String(reveal));
      el.toggle.setAttribute('aria-label', reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      el.toggle.innerHTML = '<i class="bi bi-' + (reveal ? 'eye-slash' : 'eye') + '"></i>';
    });

    el.username.addEventListener('input', A.debounce(function () {
      if (lockTimer) return;
      var name = el.username.value.trim();
      clearError();
      if (!name) return;
      var lock = store.lockInfo(name);
      if (lock.lockedFor) startLock(lock.lockedFor, name.toLowerCase());
      else {
        var bad = nameProblems(name);
        if (bad.length) showError('danger', '<i class="bi bi-exclamation-triangle me-1"></i>' + A.esc(bad[0]));
      }
    }, 300));

    document.getElementById('btnReset').addEventListener('click', function () {
      A.confirm({ title: 'Khôi phục dữ liệu mẫu?', body: 'Toàn bộ thay đổi trong trình duyệt sẽ bị xoá và nạp lại dữ liệu gốc, gồm cả mật khẩu đã đổi.', okText: 'Khôi phục' }, function () {
        store.reset();
        render();
        A.toast('Đã khôi phục dữ liệu mẫu.', 'success');
      });
    });

    el.username.focus();
  });
})();
