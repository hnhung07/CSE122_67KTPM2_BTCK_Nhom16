/* Khung giao diện dùng chung: điều hướng theo vai trò, kiểm tra phiên,
   tiện ích định dạng/badge/thông báo cho mọi màn hình SiteSafe. */
(function (global) {
  'use strict';

  var store = global.SiteSafeStore;

  var NAV = {
    worker: {
      owner: 'SV1 · Lê Thị Mai Ngọc',
      home: 'worker/worker-safety-checklist.html',
      items: [
        { file: 'worker/worker-safety-checklist.html', icon: 'clipboard2-check', label: 'Checklist an toàn' },
        { file: 'worker/worker-hazard-create.html', icon: 'megaphone', label: 'Tạo báo cáo nguy cơ' },
        { file: 'worker/worker-my-hazards.html', icon: 'list-checks', label: 'Nguy cơ của tôi' }
      ]
    },
    safety: {
      owner: 'SV2 · Nguyễn Thị Thảo',
      home: 'safety/safety-dashboard.html',
      items: [
        { file: 'safety/safety-dashboard.html', icon: 'speedometer2', label: 'Dashboard an toàn' },
        { file: 'safety/safety-hazard-detail.html', icon: 'file-earmark-text', label: 'Chi tiết & xem xét nguy cơ' },
        { file: 'safety/safety-inspection-management.html', icon: 'calendar2-check', label: 'Quản lý đợt kiểm tra' }
      ]
    },
    manager: {
      owner: 'SV3 · Đỗ Hồng Nhung',
      home: 'manager/manager-zone-risk-map.html',
      items: [
        { file: 'manager/manager-zone-risk-map.html', icon: 'geo-alt', label: 'Bản đồ rủi ro khu vực' },
        { file: 'manager/manager-corrective-actions.html', icon: 'tools', label: 'Hành động khắc phục' },
        { file: 'manager/manager-safety-report.html', icon: 'bar-chart-line', label: 'Báo cáo an toàn' }
      ]
    },
    admin: {
      owner: 'SV3 · Đỗ Hồng Nhung',
      home: 'admin/admin-checklist-template-management.html',
      items: [
        { file: 'admin/admin-checklist-template-management.html', icon: 'clipboard2-pulse', label: 'Mẫu checklist' },
        { file: 'admin/admin-zone-management.html', icon: 'map', label: 'Khu vực công trường' },
        { file: 'admin/admin-user-management.html', icon: 'people', label: 'Quản lý tài khoản' }
      ]
    }
  };

  var ROLE_LABEL = { worker: 'Nhân sự hiện trường', safety: 'Cán bộ an toàn', manager: 'Quản lý công trường', admin: 'Quản trị viên' };

  /* ---------- tiện ích nhỏ ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function cls(label) { return String(label || '').replace(/\s+/g, ''); }
  function badge(kind, label, extra) {
    return '<span class="ss-badge ss-' + kind + '-' + cls(label) + (extra ? ' ' + extra : '') + '">' + esc(label) + '</span>';
  }
  function levelBadge(level) { return badge('lv', level); }
  function statusBadge(status) { return badge('st', status); }
  function priBadge(p) { return '<span class="ss-badge ss-badge-blue">Ưu tiên: ' + esc(p) + '</span>'; }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/);
    return ((parts[parts.length - 2] || parts[0] || '')[0] || '') + ((parts[parts.length - 1] || '')[0] || '');
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function date(d) {
    var x = new Date(d);
    if (isNaN(x)) return '—';
    return pad(x.getDate()) + '/' + pad(x.getMonth() + 1) + '/' + x.getFullYear();
  }
  function datetime(d) {
    var x = new Date(d);
    if (isNaN(x)) return '—';
    return date(x) + ' ' + pad(x.getHours()) + ':' + pad(x.getMinutes());
  }
  function timeAgo(d) {
    var x = new Date(d).getTime();
    if (isNaN(x)) return '—';
    var s = Math.round((Date.now() - x) / 1000);
    if (s < 60) return 'vừa xong';
    if (s < 3600) return Math.round(s / 60) + ' phút trước';
    if (s < 86400) return Math.round(s / 3600) + ' giờ trước';
    var days = Math.round(s / 86400);
    if (days < 30) return days + ' ngày trước';
    return date(d);
  }
  function daysTo(due) {
    var ms = new Date(due + 'T23:59:59').getTime() - Date.now();
    return Math.ceil(ms / 864e5);
  }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms || 250);
    };
  }
  function rootUrl(file) { return document.body.getAttribute('data-root') + '/' + file; }

  /* ---------- thông báo toast ---------- */
  function toast(message, type, title) {
    var box = document.querySelector('.toast-container');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var icon = { success: 'check-circle-fill', error: 'exclamation-octagon-fill', warn: 'exclamation-triangle-fill', info: 'info-circle-fill' }[type || 'success'];
    var el = document.createElement('div');
    el.className = 'toast ss-toast align-items-center t-' + (type || 'success');
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    el.innerHTML = '<div class="d-flex"><div class="toast-body d-flex gap-2 align-items-start">' +
      '<i class="bi bi-' + icon + '"></i><div><strong>' + esc(title || 'SiteSafe') + '</strong><div>' + esc(message) + '</div></div></div>' +
      '<button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Đóng"></button></div>';
    box.appendChild(el);
    if (global.bootstrap) new global.bootstrap.Toast(el, { delay: 4200 }).show();
    else el.remove();
  }

  /* ---------- hộp thoại xác nhận ---------- */
  function confirmDialog(opts, onYes) {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="modal fade" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered">' +
      '<div class="modal-content"><div class="modal-header border-0"><h5 class="modal-title">' + esc(opts.title) + '</h5>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button></div>' +
      '<div class="modal-body">' + esc(opts.body) + (opts.detail ? '<div class="mt-2 small text-muted-soft">' + esc(opts.detail) + '</div>' : '') + '</div>' +
      '<div class="modal-footer border-0"><button type="button" class="btn btn-ghost" data-bs-dismiss="modal">' + esc(opts.cancelText || 'Hủy') + '</button>' +
      '<button type="button" class="btn btn-primary" data-ss-confirm>' + esc(opts.okText || 'Xác nhận') + '</button></div></div></div></div>';
    document.body.appendChild(wrap);
    var el = wrap.firstElementChild;
    var modal = new global.bootstrap.Modal(el);
    el.querySelector('[data-ss-confirm]').addEventListener('click', function () {
      modal.hide();
      onYes();
    });
    el.addEventListener('hidden.bs.modal', function () { el.remove(); });
    modal.show();
  }

  /* ---------- trạng thái rỗng / đang tải ---------- */
  function empty(icon, title, text, actionHtml) {
    return '<div class="ss-empty"><i class="bi bi-' + icon + '"></i>' +
      '<h3 class="h6 mt-2 mb-1">' + esc(title) + '</h3><p class="mb-2 small text-muted-soft">' + esc(text || '') + '</p>' +
      (actionHtml || '') + '</div>';
  }
  function skeletonRows(n) {
    var out = '';
    for (var i = 0; i < (n || 3); i++) out += '<div class="ss-skeleton mb-2" style="height:' + (34 + i * 2) + 'px"></div>';
    return '<div class="ss-loading"><div class="spinner-border spinner-border-sm text-primary" role="status"></div>Đang tải dữ liệu…</div><div class="mt-3">' + out + '</div>';
  }

  /* ---------- ảnh minh chứng: thu nhỏ rồi lưu dataURL ---------- */
  function shrinkImage(file, maxSide, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        cb(null, canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = function () { cb(new Error('Không đọc được ảnh')); };
      img.src = reader.result;
    };
    reader.onerror = function () { cb(new Error('Không đọc được tệp')); };
    reader.readAsDataURL(file);
  }

  /* ---------- đổi mật khẩu ---------- */
  function pwdField(id, label, autocomplete) {
    return '<div class="mb-3"><label class="form-label" for="' + id + '">' + esc(label) + '</label>' +
      '<div class="input-group"><span class="input-group-text"><i class="bi bi-key"></i></span>' +
      '<input class="form-control" id="' + id + '" name="' + id + '" type="password" autocomplete="' + autocomplete + '"></div></div>';
  }

  /* forced = true khi tài khoản đang mang cờ mustChange: không đóng được, chỉ đổi hoặc đăng xuất. */
  function openPasswordModal(forced) {
    var u = store.sessionUser();
    if (!u) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="modal fade" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered">' +
      '<div class="modal-content"><form id="ssPwdForm" novalidate>' +
      '<div class="modal-header"><h5 class="modal-title"><i class="bi bi-key me-1"></i>Đổi mật khẩu</h5>' +
      (forced ? '' : '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>') + '</div>' +
      '<div class="modal-body">' +
      (forced ? '<div class="alert alert-warning small py-2 mb-3"><i class="bi bi-exclamation-triangle-fill me-1"></i>' +
        'Quản trị viên đã đặt mật khẩu cho bạn. Hãy đổi sang mật khẩu riêng trước khi dùng hệ thống.</div>' : '') +
      '<div class="small text-muted-soft mb-3">Tài khoản <strong>' + esc(u.username) + '</strong> · ' + esc(ROLE_LABEL[u.role]) + '</div>' +
      pwdField('ssPwdOld', 'Mật khẩu hiện tại', 'current-password') +
      pwdField('ssPwdNew', 'Mật khẩu mới', 'new-password') +
      pwdField('ssPwdConfirm', 'Nhập lại mật khẩu mới', 'new-password') +
      '<div class="ss-item mb-3"><div class="ss-section-title mb-2">Luật mật khẩu mới</div><ul class="small mb-0 ps-3">' +
      store.AUTH_RULES.password.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="alert alert-danger d-none" id="ssPwdErr" role="alert"></div>' +
      '</div><div class="modal-footer border-0">' +
      (forced ? '<button type="button" class="btn btn-ghost" data-ss-forced-out><i class="bi bi-box-arrow-right me-1"></i>Đăng xuất</button>'
        : '<button type="button" class="btn btn-ghost" data-bs-dismiss="modal">Hủy</button>') +
      '<button type="submit" class="btn btn-primary">Đổi mật khẩu</button></div></form></div></div></div>';
    document.body.appendChild(wrap);
    var el = wrap.firstElementChild;
    var modal = new global.bootstrap.Modal(el, { backdrop: forced ? 'static' : true, keyboard: !forced });
    var old = el.querySelector('#ssPwdOld');
    var npwd = el.querySelector('#ssPwdNew');
    var again = el.querySelector('#ssPwdConfirm');
    var err = el.querySelector('#ssPwdErr');
    el.querySelector('#ssPwdForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var msgs = [];
      if (!old.value) msgs.push('Nhập mật khẩu hiện tại.');
      if (npwd.value !== again.value) msgs.push('Mật khẩu nhập lại chưa khớp.');
      store.passwordErrors(npwd.value, u.username).forEach(function (m) { msgs.push(m); });
      if (msgs.length) {
        err.innerHTML = msgs.map(esc).join('<br>');
        err.classList.remove('d-none');
        return;
      }
      var r = store.changePassword(u.id, old.value, npwd.value);
      if (!r.ok) {
        err.innerHTML = r.errors.map(esc).join('<br>');
        err.classList.remove('d-none');
        return;
      }
      modal.hide();
      toast('Đã đổi mật khẩu cho tài khoản ' + u.username + '.', 'success');
    });
    var out = el.querySelector('[data-ss-forced-out]');
    if (out) out.addEventListener('click', function () { store.logout(); location.href = rootUrl('login.html'); });
    el.addEventListener('hidden.bs.modal', function () { el.remove(); });
    modal.show();
    setTimeout(function () { old.focus(); }, 300);
  }

  /* ---------- khung trang ---------- */
  function navHtml(role, activeFile) {
    var groups = [{ role: role, label: ROLE_LABEL[role] + ' · ' + NAV[role].owner, items: NAV[role].items }];
    var others = Object.keys(NAV).filter(function (r) { return r !== role; });
    return groups.map(function (g) {
      return '<div class="ss-nav-group"><div class="ss-nav-title">' + esc(g.label) + '</div>' +
        g.items.map(function (it) {
          var on = it.file.indexOf(activeFile) !== -1;
          return '<a class="ss-nav-link' + (on ? ' active' : '') + '" href="' + rootUrl(it.file) + '"' +
            (on ? ' aria-current="page"' : '') + '><i class="bi bi-' + it.icon + '"></i><span>' + esc(it.label) + '</span></a>';
        }).join('') + '</div>';
    }).join('') +
      '<div class="ss-nav-group"><div class="ss-nav-title">Không gian khác</div>' +
      others.map(function (r) {
        return '<a class="ss-nav-link" href="' + rootUrl(NAV[r].home) + '"><i class="bi bi-arrow-right-circle"></i><span>' + esc(ROLE_LABEL[r]) + '</span></a>';
      }).join('') +
      '<a class="ss-nav-link" href="' + rootUrl('index.html') + '"><i class="bi bi-house-door"></i><span>Trang giới thiệu</span></a>' +
      '</div>';
  }

  function notificationsHtml(role) {
    var rows = store.list('notifications').filter(function (n) { return n.role === role; });
    if (!rows.length) return '<div class="px-3 py-2 small text-muted-soft">Không có cập nhật nào cho vai trò của bạn.</div>';
    return rows.map(function (n) {
      var icon = n.kind === 'cảnh báo' ? 'exclamation-triangle-fill text-danger' : n.kind === 'nhắc việc' ? 'bell-fill text-warning' : 'info-circle-fill text-primary';
      return '<div class="d-flex gap-2 px-3 py-2 border-bottom"><i class="bi ' + icon + ' mt-1"></i><div><div class="small">' + esc(n.text) + '</div>' +
        '<div class="ss-row-meta">' + esc(n.kind) + ' · ' + esc(timeAgo(n.at)) + '</div></div></div>';
    }).join('');
  }

  function mountChrome() {
    var body = document.body;
    var role = body.getAttribute('data-role');
    var activeFile = body.getAttribute('data-active') || '';
    var title = body.getAttribute('data-title') || 'SiteSafe';
    var subtitle = body.getAttribute('data-subtitle') || '';

    var side = navHtml(role, activeFile);
    var sidebar = document.getElementById('ssSidebar');
    var offcanvas = document.getElementById('ssOffcanvasBody');
    [sidebar, offcanvas].forEach(function (host) {
      if (!host) return;
      host.innerHTML =
        '<div class="ss-brand"><div class="ss-brand-mark"><i class="bi bi-hexagon-fill"></i></div>' +
        '<div class="ss-brand-text"><strong>SiteSafe</strong><small>An toàn công trường</small></div></div>' +
        '<div><span class="ss-role-chip"><i class="bi bi-person-badge"></i>' + esc(ROLE_LABEL[role]) + '</span></div>' +
        side +
        '<div class="ss-sidebar-foot">Nguyên mẫu học tập CSE122 · nhóm 3 sinh viên<br>Đại học Thủy lợi</div>';
    });
    if (sidebar) sidebar.classList.add('ss-sidebar');

    var s = store.summary();
    var pending = role === 'worker'
      ? store.where('runs', function (r) { return ['Bản nháp', 'Đang thực hiện'].indexOf(r.status) !== -1; }).length
      : role === 'safety' ? s.awaitingReview
      : role === 'manager' ? s.actionsOverdue
      : store.list('users').filter(function (u) { return u.active; }).length;

    var top = document.getElementById('ssTopbar');
    if (top) {
      top.innerHTML =
        '<button class="btn btn-ghost d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#ssOffcanvasNav" aria-label="Mở menu">' +
        '<i class="bi bi-list"></i></button>' +
        '<div class="flex-grow-1 min-w-0"><h1 class="ss-page-title text-truncate">' + esc(title) + '</h1>' +
        '<nav aria-label="Đường dẫn"><ol class="breadcrumb mb-0"><li class="breadcrumb-item"><a href="' + rootUrl(NAV[role].home) + '">' + esc(ROLE_LABEL[role]) + '</a></li>' +
        '<li class="breadcrumb-item active" aria-current="page">' + esc(title) + '</li></ol></nav>' +
        (subtitle ? '<div class="small text-muted-soft d-none d-md-block">' + esc(subtitle) + '</div>' : '') + '</div>' +
        '<span class="ss-badge ss-badge-soft d-none d-lg-inline-flex">' +
        '<i class="bi bi-diagram-3"></i>' + esc(store.read().project.name) + '</span>' +
        '<button class="btn btn-ghost ss-theme-btn" type="button" data-ss-theme><i class="bi bi-circle-half"></i>' +
        '<span class="ss-theme-label d-none d-md-inline ms-1">Tự động</span></button>' +
        '<div class="dropdown"><button class="btn btn-ghost position-relative" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Thông báo">' +
        '<i class="bi bi-bell"></i>' + (pending ? '<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">' + pending + '</span>' : '') +
        '</button><div class="dropdown-menu dropdown-menu-end" style="width:min(340px,92vw)">' +
        '<div class="px-3 py-2 fw-bold border-bottom">Cập nhật gần đây</div>' + notificationsHtml(role) +
        '<div class="px-3 py-2"><a class="small" href="' + rootUrl(NAV[role].home) + '">Xem bảng điều khiển</a></div></div></div>' +
        '<div class="dropdown"><button class="btn btn-ghost" data-bs-toggle="dropdown" aria-expanded="false"><i class="bi bi-gear"></i><span class="d-none d-md-inline ms-1">Dữ liệu</span></button>' +
        '<div class="dropdown-menu dropdown-menu-end"><div class="px-3 py-2 small text-muted-soft">Dữ liệu đang lưu trong trình duyệt của bạn (LocalStorage).</div>' +
        '<button class="dropdown-item" data-ss-export><i class="bi bi-download me-2"></i>Xuất JSON</button>' +
        '<button class="dropdown-item text-danger" data-ss-reset><i class="bi bi-arrow-counterclockwise me-2"></i>Khôi phục dữ liệu mẫu</button></div></div>' +
        '<div class="dropdown"><button class="ss-user-pill" data-bs-toggle="dropdown" aria-expanded="false">' +
        '<span class="ss-avatar">' + esc(initials(store.sessionUser() ? store.sessionUser().name : 'Khách')) + '</span>' +
        '<span class="d-none d-sm-block text-start"><span class="d-block fw-semibold" style="font-size:.85rem">' + esc(store.sessionUser() ? store.sessionUser().name : 'Chưa đăng nhập') + '</span>' +
        '<span class="ss-row-meta">' + esc(ROLE_LABEL[role]) + '</span></span><i class="bi bi-chevron-down small"></i></button>' +
        '<div class="dropdown-menu dropdown-menu-end">' +
        '<div class="px-3 py-2 small text-muted-soft border-bottom">Đang đăng nhập: <strong>' +
        esc(store.sessionUser() ? store.sessionUser().username : '—') + '</strong></div>' +
        '<button class="dropdown-item" data-ss-changepwd><i class="bi bi-key me-2"></i>Đổi mật khẩu</button>' +
        '<a class="dropdown-item" href="' + rootUrl('login.html') + '?switch=1"><i class="bi bi-arrow-repeat me-2"></i>Đăng nhập vai trò khác</a>' +
        '<hr class="dropdown-divider"><button class="dropdown-item text-danger" data-ss-logout><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</button></div></div>';

      if (global.SiteSafeTheme) global.SiteSafeTheme.refresh();

      top.addEventListener('click', function (e) {
        if (e.target.closest('[data-ss-changepwd]')) openPasswordModal(false);
        if (e.target.closest('[data-ss-logout]')) { store.logout(); location.href = rootUrl('login.html'); }
        if (e.target.closest('[data-ss-reset]')) {
          confirmDialog({ title: 'Khôi phục dữ liệu mẫu?', body: 'Mọi thay đổi bạn đã lưu trong trình duyệt (báo cáo, ảnh minh chứng, trạng thái xử lý) sẽ bị xoá.', okText: 'Khôi phục' },
            function () { store.reset(); toast('Đã đặt lại dữ liệu mẫu.', 'success'); setTimeout(function () { location.reload(); }, 600); });
        }
        if (e.target.closest('[data-ss-export]')) {
          var blob = new Blob([JSON.stringify(store.read(), null, 2)], { type: 'application/json' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'sitesafe-du-lieu.json';
          a.click();
          URL.revokeObjectURL(a.href);
          toast('Đã xuất file JSON mô phỏng dữ liệu.', 'success');
        }
      });
    }

    // khu vực nội dung: mô tả quyền của màn hình hiện tại
    var foot = document.getElementById('ssOwnerNote');
    if (foot) {
      foot.innerHTML = '<div class="d-flex flex-wrap gap-2 align-items-center justify-content-between small text-muted-soft">' +
        '<span><i class="bi bi-person-workspace me-1"></i>Màn hình do <strong>' + esc(NAV[role].owner) + '</strong> phụ trách · SCR-' + esc(body.getAttribute('data-scr') || '··') + '</span>' +
        '<span><i class="bi bi-hdd me-1"></i>Dữ liệu mô phỏng: LocalStorage · JavaScript DOM</span></div>';
    }
  }

  /* ---------- chặn truy cập theo vai trò ---------- */
  function guard(role) {
    var s = store.session();
    if (!s) {
      location.replace(rootUrl('login.html') + '?next=' + encodeURIComponent(location.pathname.split('/').slice(-2).join('/')));
      return false;
    }
    if (s.role !== role) {
      location.replace(rootUrl('403.html') + '?need=' + role);
      return false;
    }
    return true;
  }

  function init() {
    var role = document.body.getAttribute('data-role');
    if (!role) return;
    if (!guard(role)) return;
    mountChrome();
    var u = store.sessionUser();
    if (u && u.mustChange) openPasswordModal(true);
  }

  global.SiteSafeApp = {
    NAV: NAV, ROLE_LABEL: ROLE_LABEL, init: init, esc: esc, cls: cls,
    badge: badge, levelBadge: levelBadge, statusBadge: statusBadge, priBadge: priBadge,
    date: date, datetime: datetime, timeAgo: timeAgo, daysTo: daysTo, initials: initials,
    qs: qs, debounce: debounce, rootUrl: rootUrl, toast: toast, confirm: confirmDialog,
    empty: empty, skeleton: skeletonRows, shrinkImage: shrinkImage, passwordModal: openPasswordModal
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
