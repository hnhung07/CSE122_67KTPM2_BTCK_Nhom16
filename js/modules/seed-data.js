/* Dữ liệu nền của SiteSafe (bản mô phỏng). Ghi chú: toàn bộ là dữ liệu dựng sẵn
   phục vụ nguyên mẫu học tập CSE122, không phải dữ liệu công trường thật. */
window.SITESAFE_SEED = (function () {
  'use strict';

  var HAZARD_STATUS = ['Mới tạo', 'Chờ xem xét', 'Đã xác nhận', 'Cần bổ sung thông tin', 'Đang khắc phục', 'Đã đóng', 'Bị từ chối'];
  var LEVELS = ['Thấp', 'Trung bình', 'Cao', 'Nghiêm trọng'];
  var PRIORITIES = ['Thấp', 'Vừa', 'Cao', 'Khẩn cấp'];
  var CATEGORIES = [
    'Ngã trên cao', 'Vật rơi / va đập', 'Điện & thiết bị điện', 'Máy móc & vận thăng',
    'Hóa chất & vật liệu dễ cháy', 'Cháy nổ & PCCC', 'Bụi & tiếng ồn', 'Giao thông nội bộ',
    'Tư thế & mang vác', 'Thời tiết & môi trường', 'Cấu trúc tạm & giàn giáo'
  ];
  var ACTION_STATUS = ['Chưa bắt đầu', 'Đang thực hiện', 'Chờ xác nhận', 'Hoàn thành'];
  var TASK_STATUS = ['Bản nháp', 'Đang thực hiện', 'Đã gửi', 'Đã xem xét', 'Hoàn tất'];
  var ROLES = [
    { id: 'worker', name: 'Nhân sự hiện trường', desc: 'Thực hiện checklist, báo nguy cơ, theo dõi báo cáo của mình' },
    { id: 'safety', name: 'Cán bộ an toàn', desc: 'Xem xét nguy cơ, quản lý đợt kiểm tra, giao hành động khắc phục' },
    { id: 'manager', name: 'Quản lý công trường', desc: 'Theo dõi bản đồ rủi ro, tiến độ khắc phục và báo cáo an toàn' },
    { id: 'admin', name: 'Quản trị viên', desc: 'Quản lý mẫu checklist, khu vực và tài khoản' }
  ];

  var zones = [
    { id: 'Z-01', code: 'KQ-THA', name: 'Công trình tháp A (18 tầng)', type: 'Thi công thân', head: 'Tổ 1', active: true, map: { x: 60, y: 70, w: 220, h: 180 } },
    { id: 'Z-02', code: 'KQ-THB', name: 'Công trình tháp B (12 tầng)', type: 'Thi công thân', head: 'Tổ 2', active: true, map: { x: 320, y: 70, w: 210, h: 180 } },
    { id: 'Z-03', code: 'KQ-HAM', name: 'Tầng hầm & khu móng', type: 'Hầm/móng', head: 'Tổ 3', active: true, map: { x: 60, y: 290, w: 200, h: 150 } },
    { id: 'Z-04', code: 'KQ-GCT', name: 'Khu gia công thép', type: 'Xưởng', head: 'Tổ 4', active: true, map: { x: 290, y: 290, w: 170, h: 150 } },
    { id: 'Z-05', code: 'KQ-KHO', name: 'Kho vật liệu & hóa chất', type: 'Kho', head: 'Tổ 5', active: true, map: { x: 490, y: 290, w: 180, h: 150 } },
    { id: 'Z-06', code: 'KQ-DIE', name: 'Trạm điện & máy phát', type: 'Hạ tầng', head: 'Tổ điện', active: true, map: { x: 560, y: 70, w: 140, h: 180 } },
    { id: 'Z-07', code: 'KQ-VAN', name: 'Văn trường & lán trại', type: 'Sinh hoạt', head: 'Hành chính', active: true, map: { x: 730, y: 70, w: 210, h: 120 } },
    { id: 'Z-08', code: 'KQ-COT', name: 'Cổng ra vào & đường nội bộ', type: 'Giao thông', head: 'Bảo vệ', active: true, map: { x: 730, y: 220, w: 210, h: 220 } },
    { id: 'Z-09', code: 'KQ-COP', name: 'Khu cốp pha & giàn giáo', type: 'Vật tư tạm', head: 'Tổ 6', active: true, map: { x: 60, y: 470, w: 400, h: 110 } },
    { id: 'Z-10', code: 'KQ-CRA', name: 'Vùng hoạt động cần cẩu tháp', type: 'Cẩu', head: 'Tổ cẩu', active: true, map: { x: 490, y: 470, w: 450, h: 110 } },
    { id: 'Z-11', code: 'KQ-CU', name: 'Khu cũ – nhà kho tạm (đã ngừng)', type: 'Kho', head: '—', active: false, map: { x: 730, y: 470, w: 210, h: 110 } }
  ];

  /* Tài khoản demo: `password` là mật khẩu rõ để nhóm đọc repo biết dùng gì khi quay video.
     store.js băm theo tên đăng nhập ngay khi nạp vào LocalStorage và xoá bản rõ.
     Đăng nhập = username + password. */
  var users = [
    { id: 'U-01', name: 'Lê Thị Mai Ngọc', role: 'worker', username: 'maingoc', password: 'Worker@2026', unit: 'Tổ 1 – Thi công thân', email: 'maingoc@sitesafe.vn', phone: '0912 345 601', active: true, lastLogin: '2026-10-21T07:12:00' },
    { id: 'U-02', name: 'Nguyễn Thị Thảo', role: 'safety', username: 'thao.nguyen', password: 'AnToan@2026', unit: 'Phòng An toàn – HSE', email: 'thao.nguyen@sitesafe.vn', phone: '0912 345 602', active: true, lastLogin: '2026-10-21T08:02:00' },
    { id: 'U-03', name: 'Đỗ Hồng Nhung', role: 'manager', username: 'nhung.do', password: 'ChiHuy@2026', unit: 'Ban chỉ huy công trường', email: 'nhung.do@sitesafe.vn', phone: '0912 345 603', active: true, lastLogin: '2026-10-21T06:40:00' },
    { id: 'U-04', name: 'Đỗ Hồng Nhung', role: 'admin', username: 'quantri', password: 'Admin@2026', unit: 'Quản trị hệ thống', email: 'admin@sitesafe.vn', phone: '0912 345 603', active: true, lastLogin: '2026-10-20T21:15:00' },
    { id: 'U-05', name: 'Phạm Gia Hân', role: 'worker', username: 'gia.han', password: 'Worker@2026', unit: 'Tổ 2 – Thi công thân', email: 'ghan.pham@sitesafe.vn', phone: '0912 345 605', active: true, lastLogin: '2026-10-21T07:55:00' },
    { id: 'U-06', name: 'Vương Kiều Anh', role: 'worker', username: 'kieu.anh', password: 'Worker@2026', unit: 'Tổ điện', email: 'khoianh.v@sitesafe.vn', phone: '0912 345 606', active: true, lastLogin: '2026-10-19T13:20:00' },
    { id: 'U-07', name: 'Trịnh Hoài Nam', role: 'safety', username: 'hoai.nam', password: 'AnToan@2026', unit: 'Phòng An toàn – HSE', email: 'nam.trinh@sitesafe.vn', phone: '0912 345 607', active: true, lastLogin: '2026-10-20T09:05:00' },
    { id: 'U-08', name: 'Ngô Minh Châu', role: 'safety', username: 'minh.chau', password: 'AnToan@2026', unit: 'Phòng An toàn – HSE', email: 'chau.ngo@sitesafe.vn', phone: '0912 345 608', active: false, lastLogin: '2026-08-14T10:00:00' },
    { id: 'U-09', name: 'Lý Quốc Bảo', role: 'manager', username: 'quoc.bao', password: 'ChiHuy@2026', unit: 'Ban chỉ huy công trường', email: 'bao.ly@sitesafe.vn', phone: '0912 345 609', active: true, lastLogin: '2026-10-18T16:30:00' },
    { id: 'U-10', name: 'Bùi Thanh Trúc', role: 'worker', username: 'thanh.truc', password: 'Worker@2026', unit: 'Tổ cẩu', email: 'truc.bui@sitesafe.vn', phone: '0912 345 610', active: false, lastLogin: '2026-07-30T08:00:00' }
  ];

  var templates = [
    {
      id: 'CT-01', code: 'MCL-DUNG', name: 'Checklist dựng giàn giáo', workType: 'Giàn giáo / cốp pha', zoneType: 'Thi công thân',
      active: true, createdAt: '2026-09-02T08:00:00', updatedBy: 'Đỗ Hồng Nhung',
      items: [
        { id: 'i1', text: 'Nền đặt giàn giáo chắc, không lún, có tấm đế chuẩn', category: 'Cấu trúc tạm' },
        { id: 'i2', text: 'Giằng chéo đầy đủ theo bước 3 m, không thiếu liên kết', category: 'Cấu trúc tạm' },
        { id: 'i3', text: 'Sàn công tác lót kín, có ván chống trượt và khe < 10 cm', category: 'Ngã trên cao' },
        { id: 'i4', text: 'Lan can + gối chắn + lưới an toàn quanh sàn thao tác', category: 'Ngã trên cao' },
        { id: 'i5', text: 'Thang lên xuống cố định, đầu trên buộc vào lan can', category: 'Ngã trên cao' },
        { id: 'i6', text: 'Biển báo tải trọng tối đa và cấm thay đổi kết cấu', category: 'Cấu trúc tạm' },
        { id: 'i7', text: 'Giáo cách đường dây điện > 6 m hoặc có che chắn', category: 'Điện & thiết bị điện' }
      ]
    },
    {
      id: 'CT-02', code: 'MCL-DIEN', name: 'Checklist an toàn điện tạm', workType: 'Điện thi công', zoneType: 'Hạ tầng',
      active: true, createdAt: '2026-09-10T09:30:00', updatedBy: 'Nguyễn Thị Thảo',
      items: [
        { id: 'i1', text: 'Tủ điện có cửa khóa, tiếp đất và chống dòng rò (ELCB)', category: 'Điện & thiết bị điện' },
        { id: 'i2', text: 'Cáp đi nổi được treo cao > 2,5 m, tránh đường xe chạy', category: 'Điện & thiết bị điện' },
        { id: 'i3', text: 'Thiết bị đóng cắt có nhãn, không dùng ổ cắm nối tạm chắp vá', category: 'Điện & thiết bị điện' },
        { id: 'i4', text: 'Thợ điện có thẻ an toàn và dụng cụ cách điện đầy đủ', category: 'Điện & thiết bị điện' },
        { id: 'i5', text: 'Máy phát có khoảng cách cháy ≥ 3 m, có bình CO2 kế bên', category: 'Cháy nổ & PCCC' },
        { id: 'i6', text: 'Chiếu sáng khu vực làm việc ban đêm ≥ 100 lux', category: 'Môi trường làm việc' }
      ]
    },
    {
      id: 'CT-03', code: 'MCL-CAU', name: 'Checklist vận hành cần cẩu tháp', workType: 'Cẩu / nâng hạ', zoneType: 'Cẩu',
      active: true, createdAt: '2026-09-18T07:00:00', updatedBy: 'Đỗ Hồng Nhung',
      items: [
        { id: 'i1', text: 'Kiểm định còn hiệu lực, hồ sơ kỹ thuật tại cab', category: 'Máy móc & vận thăng' },
        { id: 'i2', text: 'Chống lật, giới hạn tải, giới hạn hành trình hoạt động', category: 'Máy móc & vận thăng' },
        { id: 'i3', text: 'Vùng bán kính nâng có rào chắn và biển báo, không người lạ', category: 'Vật rơi / va đập' },
        { id: 'i4', text: 'Tín hiệu người móc cẩu thống nhất, bộ đàm cùng kênh', category: 'Máy móc & vận thăng' },
        { id: 'i5', text: 'Đo tốc độ gió: dừng cẩu khi gió vượt cấp 6', category: 'Thời tiết & môi trường' },
        { id: 'i6', text: 'Cáp, móc, dây cài không biến dạng, có chốt an toàn', category: 'Máy móc & vận thăng' }
      ]
    },
    {
      id: 'CT-04', code: 'MCL-HOA', name: 'Checklist kho hóa chất', workType: 'Kho & vật liệu', zoneType: 'Kho',
      active: true, createdAt: '2026-09-25T14:00:00', updatedBy: 'Nguyễn Thị Thảo',
      items: [
        { id: 'i1', text: 'Phiếu an toàn hóa chất (MSDS) dán tại từng kệ', category: 'Hóa chất & vật liệu dễ cháy' },
        { id: 'i2', text: 'Kệ chứa có máng chắn tràn, tách biệt chất oxy hóa', category: 'Hóa chất & vật liệu dễ cháy' },
        { id: 'i3', text: 'Thông gió tự nhiên/quạt, khí độc không vượt ngưỡng', category: 'Bụi & tiếng ồn' },
        { id: 'i4', text: 'Bình chữa cháy còn hạn, đường thoát không bị chặn', category: 'Cháy nổ & PCCC' },
        { id: 'i5', text: 'Bộ trung hòa & hấp thụ tràn đổ sẵn trong tủ khẩn cấp', category: 'Hóa chất & vật liệu dễ cháy' }
      ]
    },
    {
      id: 'CT-05', code: 'MCL-CHUNG', name: 'Checklist đầu ca toàn công trường', workType: 'Kiểm tra chung', zoneType: 'Toàn công trường',
      active: true, createdAt: '2026-10-01T06:00:00', updatedBy: 'Đỗ Hồng Nhung',
      items: [
        { id: 'i1', text: 'Anh em đeo đầy đủ BHLĐ: mũ, giày, phản quang, dây an toàn trên cao', category: 'Bảo hộ cá nhân' },
        { id: 'i2', text: 'Họp đầu ca 5 phút, nhắc nguy cơ chính của ngày', category: 'Quản lý an toàn' },
        { id: 'i3', text: 'Lối đi, cầu thang, mép sàn được dọn gọn và che chắn', category: 'Ngã trên cao' },
        { id: 'i4', text: 'Rác vật tư thu gom, không đốt tại công trường', category: 'Môi trường làm việc' },
        { id: 'i5', text: 'Thời tiết trong ca được theo dõi (mưa, gió, nắng gắt)', category: 'Thời tiết & môi trường' }
      ]
    },
    {
      id: 'CT-06', code: 'MCL-COTTHU', name: 'Checklist hố ga, năng lượng ngầm (đã lưu trữ)', workType: 'Hạ tầng', zoneType: 'Hầm/móng',
      active: false, createdAt: '2026-06-11T08:00:00', updatedBy: 'Nguyễn Thị Thảo',
      items: [
        { id: 'i1', text: 'Hàng rào quanh hố ga sâu > 0,8 m, nắp đậy ban đêm', category: 'Ngã trên cao' },
        { id: 'i2', text: 'Khí độc trong hố sâu được đo trước khi xuống', category: 'Hóa chất & vật liệu dễ cháy' }
      ]
    }
  ];

  var runs = [
    {
      id: 'CR-01', code: 'PK-2026-1021-A', templateId: 'CT-01', zoneId: 'Z-01', assigneeId: 'U-01',
      date: '2026-10-21', status: 'Đang thực hiện',
      results: {
        i1: { result: 'Đạt', note: 'Nền bê tông, có tấm đế đầy đủ' },
        i2: { result: 'Không đạt', note: 'Thiếu giằng chéo nhịp D-4 (đã báo nguy cơ HZ-2026-018)' },
        i3: { result: 'Đạt', note: '' }
      },
      notes: 'Kiểm tra trước ca trên tầng 6'
    },
    {
      id: 'CR-02', code: 'PK-2026-1021-B', templateId: 'CT-05', zoneId: 'Z-02', assigneeId: 'U-01',
      date: '2026-10-21', status: 'Bản nháp', results: {}, notes: ''
    },
    {
      id: 'CR-03', code: 'PK-2026-1020-A', templateId: 'CT-02', zoneId: 'Z-06', assigneeId: 'U-01',
      date: '2026-10-20', status: 'Đã gửi',
      results: {
        i1: { result: 'Đạt', note: '' }, i2: { result: 'Không đạt', note: 'Đoạn cáp qua lối đi chưa treo' },
        i3: { result: 'Đạt', note: '' }, i4: { result: 'Đạt', note: '' },
        i5: { result: 'Đạt', note: '' }, i6: { result: 'Cần theo dõi', note: 'Khu vực sau trạm phát thiếu đèn' }
      },
      notes: 'Đã báo HZ-2026-014'
    },
    {
      id: 'CR-04', code: 'PK-2026-1019-A', templateId: 'CT-03', zoneId: 'Z-10', assigneeId: 'U-05',
      date: '2026-10-19', status: 'Hoàn tất',
      results: {
        i1: { result: 'Đạt', note: '' }, i2: { result: 'Đạt', note: '' }, i3: { result: 'Đạt', note: '' },
        i4: { result: 'Đạt', note: '' }, i5: { result: 'Đạt', note: '' }, i6: { result: 'Đạt', note: '' }
      },
      notes: 'Không phát hiện nguy cơ'
    }
  ];

  var hazards = [
    ({
      id: 'HZ-001', code: 'HZ-2026-001', title: 'Sàn thao tác thiếu lan can tại cốt +18.4', description: 'Đầu sàn phía trục C tầng 6 chưa lắp lan can sau khi tháo giáo, mép sàn hở khoảng 4 m, công nhân đi lại khiêng cốp pha qua vị trí này.',
      zoneId: 'Z-01', workType: 'Giàn giáo / cốp pha', category: 'Ngã trên cao', level: 'Nghiêm trọng', priority: 'Khẩn cấp',
      status: 'Đang khắc phục', reporterId: 'U-01', reviewerId: 'U-02', createdAt: '2026-10-06T08:20:00', updatedAt: '2026-10-15T16:10:00',
      evidence: [], aiSuggestion: { category: 'Ngã trên cao', level: 'Nghiêm trọng', confidence: 0.86, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-10-06T08:20:00', actor: 'Lê Thị Mai Ngọc', action: 'Tạo báo cáo', note: 'Phát hiện khi kiểm tra đầu ca' },
        { at: '2026-10-06T09:05:00', actor: 'Nguyễn Thị Thảo', action: 'Chuyển Chờ xem xét', note: '' },
        { at: '2026-10-06T10:40:00', actor: 'Nguyễn Thị Thảo', action: 'Đã xác nhận', note: 'Khảo sát hiện trường, elev > 2 m, áp dụng biện pháp chống rơi' },
        { at: '2026-10-07T08:15:00', actor: 'Nguyễn Thị Thảo', action: 'Đang khắc phục', note: 'Giao CA-001, tạm dừng khu vực mép sàn' },
        { at: '2026-10-15T16:10:00', actor: 'Nguyễn Thị Thảo', action: 'Cập nhật mức độ', note: 'Nâng từ Cao lên Nghiêm trọng vì còn phát sinh người qua lại' }
      ]
    }),
    ({
      id: 'HZ-002', code: 'HZ-2026-002', title: 'Cáp điện thi công nằm ngang lối đi xe', description: 'Nhánh cáp 380V từ tủ TĐ-3 ra máy hàn đi nổi trên mặt đường nội bộ đoạn cổng B, đoạn 12 m không có máng bảo vệ, xe ra vào cán đè.',
      zoneId: 'Z-08', workType: 'Điện thi công', category: 'Điện & thiết bị điện', level: 'Cao', priority: 'Cao',
      status: 'Đã đóng', reporterId: 'U-06', reviewerId: 'U-02', createdAt: '2026-10-03T14:10:00', updatedAt: '2026-10-09T11:20:00',
      evidence: [], aiSuggestion: { category: 'Điện & thiết bị điện', level: 'Cao', confidence: 0.79, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-10-03T14:10:00', actor: 'Vương Kiều Anh', action: 'Tạo báo cáo', note: '' },
        { at: '2026-10-03T15:00:00', actor: 'Nguyễn Thị Thảo', action: 'Đã xác nhận', note: 'Yêu cầu máng cáp + biển báo' },
        { at: '2026-10-04T07:30:00', actor: 'Nguyễn Thị Thảo', action: 'Đang khắc phục', note: 'Giao CA-002' },
        { at: '2026-10-09T11:20:00', actor: 'Nguyễn Thị Thảo', action: 'Đã đóng', note: 'Nghiệm thu máng cáp, không còn hiện tượng cán đè' }
      ]
    }),
    ({
      id: 'HZ-003', code: 'HZ-2026-003', title: 'Bụi xi măng dày tại khu trộn', description: 'Máy trộn không có chụp hút bụi, khu trộn vữa sát kho phát tán bụi trắng sang khu để bao, công nhân chỉ đeo khẩu trang y tế.',
      zoneId: 'Z-05', workType: 'Kho & vật liệu', category: 'Bụi & tiếng ồn', level: 'Trung bình', priority: 'Vừa',
      status: 'Đang khắc phục', reporterId: 'U-05', reviewerId: 'U-07', createdAt: '2026-10-08T10:00:00', updatedAt: '2026-10-18T09:30:00',
      evidence: [], aiSuggestion: { category: 'Bụi & tiếng ồn', level: 'Trung bình', confidence: 0.71, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-10-08T10:00:00', actor: 'Phạm Gia Hân', action: 'Tạo báo cáo', note: '' },
        { at: '2026-10-08T14:20:00', actor: 'Trịnh Hoài Nam', action: 'Đã xác nhận', note: 'Đề xuất chụp hút + khẩu trang bụi mịn' },
        { at: '2026-10-12T08:00:00', actor: 'Trịnh Hoài Nam', action: 'Đang khắc phục', note: 'Giao CA-005' }
      ]
    }),
    ({
      id: 'HZ-004', code: 'HZ-2026-004', title: 'Vật liệu rơi từ tầng 8 xuống vùng dưới cẩu', description: 'Khi nâng bó cốp pha, một số tấm ván nhỏ không được buộc kín, rung lắc và rơi tự do xuống vùng đang có người buộc móc.',
      zoneId: 'Z-10', workType: 'Cẩu / nâng hạ', category: 'Vật rơi / va đập', level: 'Nghiêm trọng', priority: 'Khẩn cấp',
      status: 'Đã xác nhận', reporterId: 'U-01', reviewerId: 'U-02', createdAt: '2026-10-14T15:45:00', updatedAt: '2026-10-16T08:10:00',
      evidence: [], aiSuggestion: { category: 'Vật rơi / va đập', level: 'Nghiêm trọng', confidence: 0.88, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-10-14T15:45:00', actor: 'Lê Thị Mai Ngọc', action: 'Tạo báo cáo', note: 'Có tiếng động, suýt trúng người' },
        { at: '2026-10-15T08:00:00', actor: 'Nguyễn Thị Thảo', action: 'Chờ xem xét', note: '' },
        { at: '2026-10-16T08:10:00', actor: 'Nguyễn Thị Thảo', action: 'Đã xác nhận', note: 'Cấm vùng dưới tải, yêu cầu thùng chứa buộc kín' }
      ]
    }),
    ({
      id: 'HZ-005', code: 'HZ-2026-005', title: 'Tủ điện mở cửa, không khóa', description: 'Tủ TĐ-5 tầng hầm để cửa mở, aptomat không dán nhãn, nước ngưng trên nóc tủ.',
      zoneId: 'Z-03', workType: 'Điện thi công', category: 'Điện & thiết bị điện', level: 'Cao', priority: 'Cao',
      status: 'Chờ xem xét', reporterId: 'U-06', reviewerId: null, createdAt: '2026-10-20T18:05:00', updatedAt: '2026-10-20T18:05:00',
      evidence: [], aiSuggestion: { category: 'Điện & thiết bị điện', level: 'Cao', confidence: 0.82, engine: 'Hazard Classifier (mô phỏng)' },
      history: [{ at: '2026-10-20T18:05:00', actor: 'Vương Kiều Anh', action: 'Tạo báo cáo', note: 'Chụp 2 ảnh hiện trạng' }]
    }),
    ({
      id: 'HZ-006', code: 'HZ-2026-006', title: 'Lối thoát hiểm bị chặn bởi pallet thép', description: '3 pallet thép và 1 xe rùa dựng chắn 60% lối thoát của khu gia công, gần tủ điện và bình chữa cháy.',
      zoneId: 'Z-04', workType: 'Kho & vật liệu', category: 'Cháy nổ & PCCC', level: 'Cao', priority: 'Cao',
      status: 'Đã đóng', reporterId: 'U-05', reviewerId: 'U-07', createdAt: '2026-09-28T09:15:00', updatedAt: '2026-10-02T17:00:00',
      evidence: [], aiSuggestion: { category: 'Cháy nổ & PCCC', level: 'Cao', confidence: 0.75, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-09-28T09:15:00', actor: 'Phạm Gia Hân', action: 'Tạo báo cáo', note: '' },
        { at: '2026-09-28T11:00:00', actor: 'Trịnh Hoài Nam', action: 'Đã xác nhận', note: 'Yêu cầu dọn trong 24h' },
        { at: '2026-09-29T16:00:00', actor: 'Trịnh Hoài Nam', action: 'Đang khắc phục', note: 'Giao CA-003' },
        { at: '2026-10-02T17:00:00', actor: 'Trịnh Hoài Nam', action: 'Đã đóng', note: 'Vạch kẻ vùng để hàng đã hoàn thành' }
      ]
    }),
    ({
      id: 'HZ-007', code: 'HZ-2026-007', title: 'Công nhân không cài dây an toàn trên cao', description: '2 anh em đeo dây nhưng không móc vào điểm neo khi ngồi trên mép sàn cốt +21, dây treo lủng lẳng.',
      zoneId: 'Z-02', workType: 'Giàn giáo / cốp pha', category: 'Ngã trên cao', level: 'Nghiêm trọng', priority: 'Khẩn cấp',
      status: 'Đang khắc phục', reporterId: 'U-01', reviewerId: 'U-02', createdAt: '2026-10-11T13:30:00', updatedAt: '2026-10-19T10:00:00',
      evidence: [], aiSuggestion: { category: 'Ngã trên cao', level: 'Nghiêm trọng', confidence: 0.91, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-10-11T13:30:00', actor: 'Lê Thị Mai Ngọc', action: 'Tạo báo cáo', note: '' },
        { at: '2026-10-11T14:10:00', actor: 'Nguyễn Thị Thảo', action: 'Đã xác nhận', note: 'Dừng việc tại chỗ, đào tạo lại 15 phút' },
        { at: '2026-10-13T09:00:00', actor: 'Nguyễn Thị Thảo', action: 'Đang khắc phục', note: 'Giao CA-006, lắp điểm neo cố định' }
      ]
    }),
    ({
      id: 'HZ-008', code: 'HZ-2026-008', title: 'Sơn chống thấm để gần nguồn nhiệt', description: '4 thùng sơn gốc solvent mở nắp cạnh máy hàn đang hoạt động, bán kính 4 m, không có bình chữa cháy tại chỗ.',
      zoneId: 'Z-04', workType: 'Kho & vật liệu', category: 'Hóa chất & vật liệu dễ cháy', level: 'Nghiêm trọng', priority: 'Khẩn cấp',
      status: 'Đã xác nhận', reporterId: 'U-06', reviewerId: 'U-07', createdAt: '2026-10-19T11:20:00', updatedAt: '2026-10-20T08:40:00',
      evidence: [], aiSuggestion: { category: 'Hóa chất & vật liệu dễ cháy', level: 'Nghiêm trọng', confidence: 0.87, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-10-19T11:20:00', actor: 'Vương Kiều Anh', action: 'Tạo báo cáo', note: '' },
        { at: '2026-10-19T13:00:00', actor: 'Trịnh Hoài Nam', action: 'Chờ xem xét', note: '' },
        { at: '2026-10-20T08:40:00', actor: 'Trịnh Hoài Nam', action: 'Đã xác nhận', note: 'Dời ngay ra kho, yêu cầu MSDS' }
      ]
    }),
    ({
      id: 'HZ-009', code: 'HZ-2026-009', title: 'Giàn giáo kê trên gạch vụn, không có đế chuẩn', description: 'Chân giáo trục B tầng 4 kê chồng gạch vụn, có dấu hiệu lún 3–4 cm sau cơn mưa, tải sàn đang tăng.',
      zoneId: 'Z-01', workType: 'Giàn giáo / cốp pha', category: 'Cấu trúc tạm & giàn giáo', level: 'Nghiêm trọng', priority: 'Khẩn cấp',
      status: 'Đang khắc phục', reporterId: 'U-05', reviewerId: 'U-02', createdAt: '2026-10-16T07:50:00', updatedAt: '2026-10-20T15:30:00',
      evidence: [], aiSuggestion: { category: 'Cấu trúc tạm & giàn giáo', level: 'Nghiêm trọng', confidence: 0.84, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-10-16T07:50:00', actor: 'Phạm Gia Hân', action: 'Tạo báo cáo', note: '' },
        { at: '2026-10-16T09:20:00', actor: 'Nguyễn Thị Thảo', action: 'Đã xác nhận', note: 'Cấm chất tải, sơ tán sàn' },
        { at: '2026-10-17T08:00:00', actor: 'Nguyễn Thị Thảo', action: 'Đang khắc phục', note: 'Giao CA-008' }
      ]
    }),
    ({
      id: 'HZ-010', code: 'HZ-2026-010', title: 'Tiếng ồn máy cắt vượt 90 dB', description: 'Máy cắt đá tại khu gia công hoạt động liên tục, đo nhanh bằng điện thoại khoảng 92 dB, công nhân không dùng chụp chống ồn.',
      zoneId: 'Z-04', workType: 'Xưởng', category: 'Bụi & tiếng ồn', level: 'Trung bình', priority: 'Vừa',
      status: 'Cần bổ sung thông tin', reporterId: 'U-05', reviewerId: 'U-07', createdAt: '2026-10-17T15:00:00', updatedAt: '2026-10-18T10:00:00',
      evidence: [], aiSuggestion: { category: 'Bụi & tiếng ồn', level: 'Trung bình', confidence: 0.63, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-10-17T15:00:00', actor: 'Phạm Gia Hân', action: 'Tạo báo cáo', note: '' },
        { at: '2026-10-18T10:00:00', actor: 'Trịnh Hoài Nam', action: 'Cần bổ sung thông tin', note: 'Cần số đo chính thức bằng dBm chuẩn và thời điểm đo' }
      ]
    }),
    ({
      id: 'HZ-011', code: 'HZ-2026-011', title: 'Hố thang máy không nắp đậy ban đêm', description: '2 hố thang máy tầng 1 không đậy nắp và không căng dây chắn, chỉ có 1 biển báo nhỏ, khu vực thiếu sáng.',
      zoneId: 'Z-01', workType: 'Thi công thân', category: 'Ngã trên cao', level: 'Cao', priority: 'Cao',
      status: 'Đã đóng', reporterId: 'U-01', reviewerId: 'U-02', createdAt: '2026-10-02T19:10:00', updatedAt: '2026-10-07T09:00:00',
      evidence: [], aiSuggestion: { category: 'Ngã trên cao', level: 'Cao', confidence: 0.8, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-10-02T19:10:00', actor: 'Lê Thị Mai Ngọc', action: 'Tạo báo cáo', note: '' },
        { at: '2026-10-03T08:30:00', actor: 'Nguyễn Thị Thảo', action: 'Đã xác nhận', note: '' },
        { at: '2026-10-04T10:00:00', actor: 'Nguyễn Thị Thảo', action: 'Đang khắc phục', note: 'Giao CA-004' },
        { at: '2026-10-07T09:00:00', actor: 'Nguyễn Thị Thảo', action: 'Đã đóng', note: 'Lắp nắp thép + đèn cảnh báo' }
      ]
    }),
    ({
      id: 'HZ-012', code: 'HZ-2026-012', title: 'Xe chở vật liệu chạy nhanh trong công trường', description: '2 lần trong 1 tuần xe ben chạy khoảng 25 km/h trong đoạn đường nội bộ gần lán trại, nhiều người đi bộ sang đường.',
      zoneId: 'Z-08', workType: 'Giao thông nội bộ', category: 'Giao thông nội bộ', level: 'Cao', priority: 'Cao',
      status: 'Chờ xem xét', reporterId: 'U-05', reviewerId: null, createdAt: '2026-10-21T07:30:00', updatedAt: '2026-10-21T07:30:00',
      evidence: [], aiSuggestion: { category: 'Giao thông nội bộ', level: 'Cao', confidence: 0.77, engine: 'Hazard Classifier (mô phỏng)' },
      history: [{ at: '2026-10-21T07:30:00', actor: 'Phạm Gia Hân', action: 'Tạo báo cáo', note: '' }]
    }),
    ({
      id: 'HZ-013', code: 'HZ-2026-013', title: 'Người lao động mang vác nặng sai tư thế', description: 'Anh em khiêng tấm cốp pha 45 kg theo cặp, lưng cong, đoạn đường 20 m không có xe đẩy hỗ trợ.',
      zoneId: 'Z-09', workType: 'Giàn giáo / cốp pha', category: 'Tư thế & mang vác', level: 'Thấp', priority: 'Thấp',
      status: 'Mới tạo', reporterId: 'U-01', reviewerId: null, createdAt: '2026-10-21T08:20:00', updatedAt: '2026-10-21T08:20:00',
      evidence: [], aiSuggestion: { category: 'Tư thế & mang vác', level: 'Thấp', confidence: 0.58, engine: 'Hazard Classifier (mô phỏng)' },
      history: [{ at: '2026-10-21T08:20:00', actor: 'Lê Thị Mai Ngọc', action: 'Tạo báo cáo', note: 'Báo nhanh từ điện thoại' }]
    }),
    ({
      id: 'HZ-014', code: 'HZ-2026-014', title: 'Móc cẩu số 3 thiếu chốt an toàn', description: 'Móc cẩu số 3 chốt hãm bị gãy, dây cài chỉ móc vào mép pallet, nguy cơ tuột tải khi nâng.',
      zoneId: 'Z-10', workType: 'Cẩu / nâng hạ', category: 'Máy móc & vận thăng', level: 'Nghiêm trọng', priority: 'Khẩn cấp',
      status: 'Đã xác nhận', reporterId: 'U-06', reviewerId: 'U-02', createdAt: '2026-10-20T09:40:00', updatedAt: '2026-10-21T07:10:00',
      evidence: [], aiSuggestion: { category: 'Máy móc & vận thăng', level: 'Nghiêm trọng', confidence: 0.89, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-10-20T09:40:00', actor: 'Vương Kiều Anh', action: 'Tạo báo cáo', note: '' },
        { at: '2026-10-20T11:00:00', actor: 'Nguyễn Thị Thảo', action: 'Chờ xem xét', note: '' },
        { at: '2026-10-21T07:10:00', actor: 'Nguyễn Thị Thảo', action: 'Đã xác nhận', note: 'Dừng móc cẩu số 3, kiểm định lại' }
      ]
    }),
    ({
      id: 'HZ-015', code: 'HZ-2026-015', title: 'Nắng gắt, không có điểm tránh nóng', description: 'Ca trưa 13–15h sàn tầng 8 không có mái che, 4 người làm việc liên tục, không có điểm uống nước gần đó.',
      zoneId: 'Z-02', workType: 'Thi công thân', category: 'Thời tiết & môi trường', level: 'Trung bình', priority: 'Vừa',
      status: 'Bị từ chối', reporterId: 'U-05', reviewerId: 'U-07', createdAt: '2026-09-20T13:00:00', updatedAt: '2026-09-21T08:00:00',
      evidence: [], aiSuggestion: { category: 'Thời tiết & môi trường', level: 'Trung bình', confidence: 0.6, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-09-20T13:00:00', actor: 'Phạm Gia Hân', action: 'Tạo báo cáo', note: '' },
        { at: '2026-09-21T08:00:00', actor: 'Trịnh Hoài Nam', action: 'Bị từ chối', note: 'Không phải nguy cơ mới: mái che và giãn ca 13–15h cho sàn tầng 8 đã có trong kế hoạch thi công, đang theo dõi thực hiện' }
      ]
    }),
    ({
      id: 'HZ-016', code: 'HZ-2026-016', title: 'Bình chữa cháy hết hạn tại kho', description: '3/6 bình CO2 khu kho quá hạn kiểm định 4 tháng, đồng hồ áp 2 bình chỉ vùng đỏ.',
      zoneId: 'Z-05', workType: 'Kho & vật liệu', category: 'Cháy nổ & PCCC', level: 'Cao', priority: 'Cao',
      status: 'Đã đóng', reporterId: 'U-01', reviewerId: 'U-02', createdAt: '2026-09-24T08:30:00', updatedAt: '2026-10-01T10:20:00',
      evidence: [], aiSuggestion: { category: 'Cháy nổ & PCCC', level: 'Cao', confidence: 0.83, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-09-24T08:30:00', actor: 'Lê Thị Mai Ngọc', action: 'Tạo báo cáo', note: '' },
        { at: '2026-09-24T10:00:00', actor: 'Nguyễn Thị Thảo', action: 'Đã xác nhận', note: '' },
        { at: '2026-09-25T09:00:00', actor: 'Nguyễn Thị Thảo', action: 'Đang khắc phục', note: 'Giao CA-007' },
        { at: '2026-10-01T10:20:00', actor: 'Nguyễn Thị Thảo', action: 'Đã đóng', note: 'Đã nạp lại và dán tem kiểm định' }
      ]
    }),
    ({
      id: 'HZ-017', code: 'HZ-2026-017', title: 'Thiếu đèn chiếu sáng ban đêm tại tầng hầm', description: 'Khu vực góc D tầng hầm tối, công nhân đi lại vận chuyển cốp pha, không có đèn tạm.',
      zoneId: 'Z-03', workType: 'Điện thi công', category: 'Môi trường làm việc', level: 'Trung bình', priority: 'Vừa',
      status: 'Đã xác nhận', reporterId: 'U-06', reviewerId: 'U-02', createdAt: '2026-10-18T20:15:00', updatedAt: '2026-10-19T09:00:00',
      evidence: [], aiSuggestion: { category: 'Môi trường làm việc', level: 'Trung bình', confidence: 0.68, engine: 'Hazard Classifier (mô phỏng)' },
      history: [
        { at: '2026-10-18T20:15:00', actor: 'Vương Kiều Anh', action: 'Tạo báo cáo', note: '' },
        { at: '2026-10-19T09:00:00', actor: 'Nguyễn Thị Thảo', action: 'Đã xác nhận', note: 'Bổ sung 4 đèn LED 100W' }
      ]
    }),
    ({
      id: 'HZ-018', code: 'HZ-2026-018', title: 'Thiếu giằng chéo giàn giáo nhịp D-4', description: 'Phát hiện khi checklist: thiếu 2 thanh giằng chéo, giáo có rung khi đi lại trên sàn.',
      zoneId: 'Z-01', workType: 'Giàn giáo / cốp pha', category: 'Cấu trúc tạm & giàn giáo', level: 'Cao', priority: 'Cao',
      status: 'Chờ xem xét', reporterId: 'U-01', reviewerId: null, createdAt: '2026-10-21T08:50:00', updatedAt: '2026-10-21T08:50:00',
      evidence: [], aiSuggestion: { category: 'Cấu trúc tạm & giàn giáo', level: 'Cao', confidence: 0.81, engine: 'Hazard Classifier (mô phỏng)' },
      history: [{ at: '2026-10-21T08:50:00', actor: 'Lê Thị Mai Ngọc', action: 'Tạo báo cáo', note: 'Tạo từ mục checklist Không đạt' }]
    })
  ];


  var actions = [
    { id: 'CA-001', code: 'KA-2026-001', hazardId: 'HZ-001', title: 'Lắp lan can + gối chắn trục C cốt +18.4', ownerId: 'U-01', zoneId: 'Z-01', dueDate: '2026-10-10', status: 'Đang thực hiện', progress: 70, updatedAt: '2026-10-15T16:10:00', note: 'Đã lắp 3/4 nhịp, còn đoạn góc C2' },
    { id: 'CA-002', code: 'KA-2026-002', hazardId: 'HZ-002', title: 'Treo cáp vào máng, bổ sung biển báo', ownerId: 'U-06', zoneId: 'Z-08', dueDate: '2026-10-06', status: 'Hoàn thành', progress: 100, updatedAt: '2026-10-09T11:15:00', note: 'Nghiệm thu 09/10' },
    { id: 'CA-003', code: 'KA-2026-003', hazardId: 'HZ-006', title: 'Dọn pallet, vẽ lại vùng để hàng', ownerId: 'U-05', zoneId: 'Z-04', dueDate: '2026-09-30', status: 'Hoàn thành', progress: 100, updatedAt: '2026-10-02T16:50:00', note: '' },
    { id: 'CA-004', code: 'KA-2026-004', hazardId: 'HZ-011', title: 'Chế tạo nắp thép hố thang máy + đèn cảnh báo', ownerId: 'U-01', zoneId: 'Z-01', dueDate: '2026-10-06', status: 'Hoàn thành', progress: 100, updatedAt: '2026-10-07T08:40:00', note: '' },
    { id: 'CA-005', code: 'KA-2026-005', hazardId: 'HZ-003', title: 'Lắp chụp hút bụi máy trộn, cấp khẩu trang bụi mịn', ownerId: 'U-05', zoneId: 'Z-05', dueDate: '2026-10-25', status: 'Đang thực hiện', progress: 45, updatedAt: '2026-10-18T09:20:00', note: 'Đã đặt hàng chụp hút, về 22/10' },
    { id: 'CA-006', code: 'KA-2026-006', hazardId: 'HZ-007', title: 'Lắp 6 điểm neo dây an toàn tầng 10', ownerId: 'U-05', zoneId: 'Z-02', dueDate: '2026-10-16', status: 'Đang thực hiện', progress: 60, updatedAt: '2026-10-19T10:00:00', note: 'Đã kiểm tra thử 4 điểm' },
    { id: 'CA-007', code: 'KA-2026-007', hazardId: 'HZ-016', title: 'Nạp lại và dán tem kiểm định 6 bình CO2', ownerId: 'U-01', zoneId: 'Z-05', dueDate: '2026-09-30', status: 'Hoàn thành', progress: 100, updatedAt: '2026-10-01T10:10:00', note: '' },
    { id: 'CA-008', code: 'KA-2026-008', hazardId: 'HZ-009', title: 'Thay đế giáo, kê tấm thép và kiểm tra lún', ownerId: 'U-06', zoneId: 'Z-01', dueDate: '2026-10-22', status: 'Chờ xác nhận', progress: 95, updatedAt: '2026-10-20T15:30:00', note: 'Đã thay xong, chờ HSE nghiệm thu' },
    { id: 'CA-009', code: 'KA-2026-009', hazardId: 'HZ-008', title: 'Dời sơn ra kho riêng, niêm yết MSDS', ownerId: 'U-05', zoneId: 'Z-04', dueDate: '2026-10-21', status: 'Đang thực hiện', progress: 55, updatedAt: '2026-10-21T07:00:00', note: '' },
    { id: 'CA-010', code: 'KA-2026-010', hazardId: 'HZ-014', title: 'Thay móc cẩu số 3, kiểm định lại bộ dây cài', ownerId: 'U-06', zoneId: 'Z-10', dueDate: '2026-10-23', status: 'Chưa bắt đầu', progress: 10, updatedAt: '2026-10-21T07:15:00', note: 'Chờ đơn vị kiểm định' },
    { id: 'CA-011', code: 'KA-2026-011', hazardId: 'HZ-004', title: 'Lắp thùng chứa buộc kín + biển cấm vùng dưới tải', ownerId: 'U-01', zoneId: 'Z-10', dueDate: '2026-10-19', status: 'Chưa bắt đầu', progress: 0, updatedAt: '2026-10-16T08:15:00', note: 'Quá hạn – cần gia công thùng' },
    { id: 'CA-012', code: 'KA-2026-012', hazardId: 'HZ-017', title: 'Bổ sung 4 đèn LED 100W góc D tầng hầm', ownerId: 'U-06', zoneId: 'Z-03', dueDate: '2026-10-24', status: 'Đang thực hiện', progress: 30, updatedAt: '2026-10-20T09:00:00', note: '' },
    { id: 'CA-013', code: 'KA-2026-013', hazardId: 'HZ-010', title: 'Đo tiếng ồn bằng thiết bị chuẩn, cấp chụp chống ồn', ownerId: 'U-05', zoneId: 'Z-04', dueDate: '2026-10-28', status: 'Chưa bắt đầu', progress: 0, updatedAt: '2026-10-18T10:05:00', note: 'Chờ báo đo quan trắc' }
  ];

  var inspections = [
    { id: 'IN-01', code: 'KT-2026-011', title: 'Kiểm tra định kỳ giàn giáo tháp A', zoneId: 'Z-01', date: '2026-10-21', inspectorId: 'U-02', type: 'Định kỳ', templateId: 'CT-01', status: 'Đang thực hiện', findingsCount: 2, note: 'Chú ý nhịp D-4' },
    { id: 'IN-02', code: 'KT-2026-012', title: 'Kiểm tra an toàn điện trạm phát', zoneId: 'Z-06', date: '2026-10-20', inspectorId: 'U-07', type: 'Chuyên đề', templateId: 'CT-02', status: 'Đã gửi', findingsCount: 3, note: 'Ghi nhận HZ-2026-005' },
    { id: 'IN-03', code: 'KT-2026-013', title: 'Kiểm tra đầu ca toàn công trường', zoneId: 'Z-08', date: '2026-10-21', inspectorId: 'U-02', type: 'Đột xuất', templateId: 'CT-05', status: 'Bản nháp', findingsCount: 0, note: '' },
    { id: 'IN-04', code: 'KT-2026-010', title: 'Kiểm tra vận hành cần cẩu tháp T2', zoneId: 'Z-10', date: '2026-10-17', inspectorId: 'U-02', type: 'Chuyên đề', templateId: 'CT-03', status: 'Đã xem xét', findingsCount: 4, note: 'Ghi nhận HZ-2026-014' },
    { id: 'IN-05', code: 'KT-2026-009', title: 'Kiểm tra PCCC kho vật liệu', zoneId: 'Z-05', date: '2026-10-12', inspectorId: 'U-07', type: 'Định kỳ', templateId: 'CT-04', status: 'Hoàn tất', findingsCount: 1, note: 'Đã khắc phục xong' },
    { id: 'IN-06', code: 'KT-2026-008', title: 'Kiểm tra hố ga, mép sàn tầng hầm', zoneId: 'Z-03', date: '2026-10-09', inspectorId: 'U-02', type: 'Đột xuất', templateId: 'CT-06', status: 'Hoàn tất', findingsCount: 2, note: 'Mẫu đã lưu trữ, chuyển checklist chung' },
    { id: 'IN-07', code: 'KT-2026-014', title: 'Kiểm tra điều kiện thi công mùa mưa', zoneId: 'Z-02', date: '2026-10-24', inspectorId: 'U-07', type: 'Chuyên đề', templateId: 'CT-05', status: 'Bản nháp', findingsCount: 0, note: 'Lịch dự kiến' }
  ];

  var notifications = [
    { id: 'N-01', at: '2026-10-21T08:50:00', role: 'worker', text: 'Báo cáo HZ-2026-018 của bạn đã được chuyển sang Chờ xem xét', kind: 'thông tin' },
    { id: 'N-02', at: '2026-10-21T07:15:00', role: 'safety', text: 'KA-2026-010 chưa bắt đầu, hạn 23/10 – cần đôn đốc', kind: 'cảnh báo' },
    { id: 'N-03', at: '2026-10-20T15:30:00', role: 'manager', text: 'Vùng cần cẩu tháp (Z-10) có 2 nguy cơ mức Nghiêm trọng đang mở', kind: 'nhắc việc' },
    { id: 'N-04', at: '2026-10-20T09:00:00', role: 'safety', text: 'HZ-2026-010 cần bổ sung số đo tiếng ồn chuẩn', kind: 'cảnh báo' }
  ];

  return {
    version: 4,
    project: { name: 'Công trường Green Canal – Gói thầu 3', unit: 'Tổng đơn vị thi công HD-18', site: 'NC03' },
    statuses: { hazard: HAZARD_STATUS, level: LEVELS, priority: PRIORITIES, action: ACTION_STATUS, task: TASK_STATUS, categories: CATEGORIES },
    roles: ROLES,
    zones: zones,
    users: users,
    templates: templates,
    runs: runs,
    hazards: hazards,
    actions: actions,
    inspections: inspections,
    notifications: notifications
  };
})();
