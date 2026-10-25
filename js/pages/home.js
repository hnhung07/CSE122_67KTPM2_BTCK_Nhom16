/* Trang giới thiệu: số liệu sống từ LocalStorage + danh mục 12 màn hình. */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;

  var SCREENS = [
    { id: 'SCR-01', role: 'worker', name: 'Checklist an toàn', file: 'worker/worker-safety-checklist.html', crud: 'R/U', note: 'Đánh dấu từng mục, ghi chú, gửi kết quả' },
    { id: 'SCR-02', role: 'worker', name: 'Tạo báo cáo nguy cơ', file: 'worker/worker-hazard-create.html', crud: 'C', note: 'Validation + ảnh minh chứng + Hazard Classifier' },
    { id: 'SCR-03', role: 'worker', name: 'Nguy cơ của tôi', file: 'worker/worker-my-hazards.html', crud: 'R/U', note: 'Tìm kiếm, lọc, theo dõi trạng thái xử lý' },
    { id: 'SCR-04', role: 'safety', name: 'Dashboard an toàn', file: 'safety/safety-dashboard.html', crud: 'R', note: 'KPI, biểu đồ và bảng xem xét kéo–thả' },
    { id: 'SCR-05', role: 'safety', name: 'Chi tiết & xem xét nguy cơ', file: 'safety/safety-hazard-detail.html', crud: 'R/U', note: 'Đổi trạng thái, ghi chú review, giao hành động' },
    { id: 'SCR-06', role: 'safety', name: 'Quản lý đợt kiểm tra', file: 'safety/safety-inspection-management.html', crud: 'C/R/U', note: 'Tạo/sửa lịch kiểm tra, gắn mẫu checklist' },
    { id: 'SCR-07', role: 'manager', name: 'Bản đồ / ma trận rủi ro', file: 'manager/manager-zone-risk-map.html', crud: 'R', note: 'Sơ đồ công trường + Risk Hotspot Insight' },
    { id: 'SCR-08', role: 'manager', name: 'Hành động khắc phục', file: 'manager/manager-corrective-actions.html', crud: 'C/R/U', note: 'Người phụ trách, hạn xử lý, tiến độ, quá hạn' },
    { id: 'SCR-09', role: 'manager', name: 'Báo cáo an toàn', file: 'manager/manager-safety-report.html', crud: 'R', note: 'Tổng hợp theo thời gian, khu vực, trạng thái' },
    { id: 'SCR-10', role: 'admin', name: 'Quản lý mẫu checklist', file: 'admin/admin-checklist-template-management.html', crud: 'C/R/U', note: 'Thêm/sửa mục, lưu trữ mẫu, Checklist Generator' },
    { id: 'SCR-11', role: 'admin', name: 'Quản lý khu vực', file: 'admin/admin-zone-management.html', crud: 'C/R/U', note: 'Khai báo khu vực, trùng mã, vô hiệu hóa' },
    { id: 'SCR-12', role: 'admin', name: 'Quản lý tài khoản', file: 'admin/admin-user-management.html', crud: 'C/R/U', note: 'Tìm kiếm, phân quyền vai trò, vô hiệu hóa' }
  ];

  var FLAGS = {
    worker: { icon: 'megaphone', title: 'Điểm nhấn của SV1', text: 'Báo nguy cơ tại hiện trường: bộ luật gợi ý nhóm nguy cơ ngay khi bạn gõ, kèm ảnh chụp minh chứng và bản nháp tự lưu.' },
    safety: { icon: 'hand-index-thumb', title: 'Điểm nhấn của SV2', text: 'Bảng xem xét kéo–thả: rê thẻ nguy cơ giữa các cột trạng thái để cập nhật quy trình, có lịch sử và ghi chú review.' },
    manager: { icon: 'geo-alt-fill', title: 'Điểm nhấn của SV3', text: 'Sơ đồ công trường tô nhiệt theo điểm rủi ro tính từ dữ liệu thật của trang, kèm đề xuất khu vực cần kiểm tra.' },
    admin: { icon: 'sliders', title: 'Nền cấu hình', text: 'Mẫu checklist, khu vực và tài khoản do SV3 quản lý; mọi thay đổi ảnh hưởng ngay tới các màn hình vai trò khác.' }
  };

  function heroStats() {
    var s = store.summary();
    var items = [
      { v: s.open, l: 'Nguy cơ đang mở', i: 'exclamation-diamond' },
      { v: s.criticalOpen, l: 'Mức Nghiêm trọng', i: 'fire' },
      { v: s.actionsOverdue, l: 'Hành động quá hạn', i: 'alarm' },
      { v: s.zonesActive, l: 'Khu vực đang thi công', i: 'map' }
    ];
    document.getElementById('heroStats').innerHTML = items.map(function (it) {
      return '<div class="col-6 col-md-3"><div class="card h-100"><div class="card-body ss-kpi">' +
        '<div class="d-flex justify-content-between align-items-start"><div class="ss-kpi-value">' + it.v + '</div>' +
        '<span class="ss-kpi-icon"><i class="bi bi-' + it.i + '"></i></span></div>' +
        '<div class="ss-kpi-label">' + it.l + '</div></div></div></div>';
    }).join('');
  }

  function roleCards() {
    var s = store.summary();
    var metrics = {
      worker: 'Checklist chờ gửi: ' + store.where('runs', function (r) { return ['Bản nháp', 'Đang thực hiện'].indexOf(r.status) !== -1; }).length,
      safety: 'Chờ xem xét: ' + s.awaitingReview,
      manager: 'Quá hạn: ' + s.actionsOverdue,
      admin: 'Tài khoản đang dùng: ' + s.usersActive
    };
    var icons = { worker: 'person-badge', safety: 'shield-check', manager: 'clipboard-data', admin: 'gear-wide-connected' };
    document.getElementById('roleCards').innerHTML = store.list('users') && ['worker', 'safety', 'manager', 'admin'].map(function (r) {
      var screens = SCREENS.filter(function (x) { return x.role === r; });
      var persona = store.list('users').filter(function (u) { return u.role === r && u.active; })[0];
      return '<div class="col-md-6 col-xl-3"><div class="ss-role-card">' +
        '<div class="d-flex justify-content-between align-items-start mb-2"><span class="ss-kpi-icon"><i class="bi bi-' + icons[r] + '"></i></span>' +
        '<span class="ss-badge ss-lv-Antoan">' + screens.length + ' màn hình</span></div>' +
        '<h3 class="h6 mb-1">' + A.esc(A.ROLE_LABEL[r]) + '</h3>' +
        '<p class="small text-muted-soft">' + A.esc(screens.map(function (x) { return x.name; }).join(' · ')) + '</p>' +
        '<div class="ss-row-meta mb-3">' + A.esc(metrics[r]) + '</div>' +
        '<a class="btn btn-soft btn-sm" href="' + A.NAV[r].home + '" data-role-enter="' + r + '"><i class="bi bi-box-arrow-in-right me-1"></i>Vào không gian làm việc</a>' +
        '<div class="ss-cred mt-3">Demo: ' + A.esc(persona.name) + ' · ' + A.esc(persona.unit) + '</div>' +
        '</div></div>';
    }).join('');
  }

  function tabs() {
    var roles = ['worker', 'safety', 'manager', 'admin'];
    var host = document.getElementById('scrTabs');
    host.innerHTML = roles.map(function (r, i) {
      return '<li class="nav-item" role="presentation"><button class="nav-link' + (i === 0 ? ' active' : '') + '" data-tab="' + r + '" role="tab">' +
        A.esc(A.ROLE_LABEL[r]) + ' <span class="badge rounded-pill bg-secondary ms-1">' + SCREENS.filter(function (s) { return s.role === r; }).length + '</span></button></li>';
    }).join('');
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (!b) return;
      host.querySelectorAll('.nav-link').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      render(b.getAttribute('data-tab'));
    });

    function render(role) {
      var flag = FLAGS[role];
      document.getElementById('scrBody').innerHTML =
        '<div class="alert d-flex gap-2 align-items-start" style="background:var(--ss-teal-50);border:1px solid var(--ss-teal-100)">' +
        '<i class="bi bi-star-fill mt-1" style="color:var(--ss-teal-600)"></i><div><strong>' + A.esc(flag.title) + '</strong><div class="small mb-0">' + A.esc(flag.text) + '</div></div></div>' +
        '<div class="row g-3">' + SCREENS.filter(function (s) { return s.role === role; }).map(function (s) {
          return '<div class="col-md-6 col-xl-4"><div class="card h-100"><div class="card-body d-flex flex-column">' +
            '<div class="d-flex justify-content-between align-items-center mb-2"><span class="ss-row-code">' + s.id + '</span>' +
            '<span class="ss-badge ss-badge-blue">' + s.crud + '</span></div>' +
            '<h3 class="h6">' + A.esc(s.name) + '</h3><p class="small text-muted-soft flex-grow-1">' + A.esc(s.note) + '</p>' +
            '<div class="d-flex gap-2"><a class="btn btn-primary btn-sm" href="' + s.file + '" data-role-enter="' + s.role + '"><i class="bi bi-box-arrow-up-right me-1"></i>Mở màn hình</a>' +
            '<code class="small text-muted-soft align-self-center">' + s.file.split('/')[0] + '/…</code></div>' +
            '</div></div></div>';
        }).join('') + '</div>';
    }
    render('worker');
  }

  function aiCards() {
    var cards = [
      {
        k: 'AI-01', name: 'Hazard Classifier', icon: 'magic', where: 'Màn hình “Tạo báo cáo nguy cơ” và “Chi tiết nguy cơ”',
        in: 'Tiêu đề + mô tả + khu vực + loại công việc', out: 'Nhóm nguy cơ, mức độ, mức ưu tiên, lý do và biện pháp gợi ý',
        file: 'worker/worker-hazard-create.html', role: 'worker', demo: 'Phân loại thử'
      },
      {
        k: 'AI-02', name: 'Checklist Generator', icon: 'ui-checks', where: 'Màn hình “Quản lý mẫu checklist”',
        in: 'Loại công việc + điều kiện công trường', out: 'Bản nháp danh sách mục kiểm tra kèm lý do từng nhóm',
        file: 'admin/admin-checklist-template-management.html', role: 'admin', demo: 'Sinh checklist thử'
      },
      {
        k: 'AI-03', name: 'Risk Hotspot Insight', icon: 'fire', where: 'Màn hình “Bản đồ rủi ro khu vực”',
        in: 'Toàn bộ nguy cơ theo khu vực và khoảng thời gian', out: 'Xếp hạng điểm nóng, diễn giải số liệu, gợi ý đợt kiểm tra',
        file: 'manager/manager-zone-risk-map.html', role: 'manager', demo: 'Xem insight'
      }
    ];
    document.getElementById('aiCards').innerHTML = cards.map(function (c) {
      return '<div class="col-lg-4"><div class="ss-ai h-100"><div class="ss-ai-head">' +
        '<i class="bi bi-' + c.icon + ' ss-ai-spark"></i><strong>' + c.name + '</strong><span class="ss-ai-badge ms-auto">' + c.k + '</span></div>' +
        '<div class="ss-ai-body"><p class="small mb-2">' + A.esc(c.where) + '</p>' +
        '<dl class="row small mb-3"><dt class="col-4 text-muted-soft fw-normal">Đầu vào</dt><dd class="col-8 mb-1">' + A.esc(c.in) + '</dd>' +
        '<dt class="col-4 text-muted-soft fw-normal">Đầu ra</dt><dd class="col-8 mb-0">' + A.esc(c.out) + '</dd></dl>' +
        '<div class="ss-ai-note mb-3"><i class="bi bi-info-circle me-1"></i>' + A.esc(store ? 'Có trạng thái thiếu dữ liệu và cảnh báo độ tin cậy thấp.' : '') + '</div>' +
        '<a class="btn btn-soft btn-sm" href="' + c.file + '" data-role-enter="' + c.role + '"><i class="bi bi-play-btn me-1"></i>' + c.demo + '</a>' +
        '</div></div></div>';
    }).join('');
  }

  /* thẻ preview quay vòng theo dữ liệu mẫu */
  var STEPS = ['Mới tạo', 'Chờ xem xét', 'Đã xác nhận', 'Đang khắc phục', 'Đã đóng'];
  var cursor = 0;

  function renderPreview() {
    var list = store.list('hazards');
    if (!list.length) return;
    var h = list[cursor % list.length];
    cursor++;
    var idx = STEPS.indexOf(h.status);
    document.getElementById('previewSteps').innerHTML = STEPS.map(function (s, i) {
      var state = i < idx ? 'is-done' : i === idx ? 'is-current' : '';
      return '<div class="ss-step ' + state + '" style="flex:1 1 0;text-align:center;font-size:.72rem">' +
        (i < idx ? '<i class="bi bi-check2"></i> ' : '') + A.esc(s) + '</div>';
    }).join('');
    var badge = idx >= 0 ? h.status : 'Cần bổ sung thông tin';
    document.getElementById('previewStatus').outerHTML = A.badge('st', badge).replace('class="ss-badge', 'id="previewStatus" class="ss-badge');
    document.getElementById('previewCard').innerHTML =
      '<div class="d-flex justify-content-between align-items-start gap-2">' +
      '<div><div class="ss-row-code">' + A.esc(h.code) + '</div><div class="ss-row-title">' + A.esc(h.title) + '</div></div>' +
      A.levelBadge(h.level) + '</div>' +
      '<div class="small text-muted-soft mt-1"><i class="bi bi-geo-alt me-1"></i>' + A.esc(store.zoneName(h.zoneId)) + '</div>' +
      '<p class="small mt-2 mb-2" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">' + A.esc(h.description) + '</p>' +
      '<div class="d-flex flex-wrap gap-1">' + A.priBadge(h.priority) +
      '<span class="ss-badge" style="background:var(--ss-teal-50);color:var(--ss-teal-800);border:1px solid var(--ss-teal-100)">' + A.esc(h.category) + '</span></div>';
    document.getElementById('previewAgo').textContent = A.timeAgo(h.updatedAt);
  }

  /* Mỗi không gian vai trò dẫn về màn hình đăng nhập với deep link phù hợp. */
  function wireQuickLogin() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-role-enter]');
      if (!b) return;
      e.preventDefault();
      var role = b.getAttribute('data-role-enter');
      location.href = 'login.html?switch=1&next=' + encodeURIComponent(A.NAV[role].home);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    heroStats();
    roleCards();
    tabs();
    aiCards();
    renderPreview();
    wireQuickLogin();
    document.getElementById('previewNext').addEventListener('click', renderPreview);
  });
})();
