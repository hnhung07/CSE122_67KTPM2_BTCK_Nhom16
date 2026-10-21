## 1. Mục đích

Tài liệu xác định trách nhiệm và chức năng chính của bốn vai trò trong SiteSafe. Quyền hạn dưới đây là quy tắc nghiệp vụ dự kiến cho nguyên mẫu Frontend; cách mô phỏng đăng nhập và phân quyền đã chốt ở mục 3.1.

## 2. Vai trò và chức năng

### 2.1. Nhân sự hiện trường (`worker/`)

**Mục tiêu:** thực hiện kiểm tra an toàn và báo nguy cơ phát hiện tại công trường.

- Xem và thực hiện checklist an toàn.
- Đánh dấu kết quả từng mục checklist.
- Tạo báo cáo hazard với tiêu đề, mô tả, khu vực, mức độ và minh chứng nếu có.
- Xem danh sách hazard do mình báo cáo.
- Tìm kiếm/lọc báo cáo theo trạng thái hoặc mức độ.
- Chỉnh sửa báo cáo khi được phép; không xóa tùy tiện báo cáo đã được xử lý.
- Xem trạng thái và phản hồi xử lý.

**Màn hình nền tảng:** `worker-safety-checklist.html`, `worker-hazard-create.html`, `worker-my-hazards.html`.

### 2.2. Cán bộ an toàn (`safety/`)

**Mục tiêu:** xem xét báo cáo nguy cơ và điều phối hoạt động kiểm tra/khắc phục.

- Xem dashboard tổng hợp số lượng hazard theo trạng thái/mức độ.
- Mở chi tiết hazard, xem mô tả và minh chứng.
- Xác nhận, yêu cầu bổ sung thông tin hoặc cập nhật mức độ ưu tiên.
- Giao hành động khắc phục và người phụ trách.
- Quản lý các đợt kiểm tra (inspection).
- Cập nhật trạng thái xử lý và ghi chú review.
- Sử dụng Hazard Classifier để tham khảo phân loại nguy cơ; người dùng vẫn quyết định cuối cùng.

**Màn hình nền tảng:** `safety-dashboard.html`, `safety-hazard-detail.html`, `safety-inspection-management.html`.

### 2.3. Quản lý công trường (`manager/`)

**Mục tiêu:** theo dõi tình hình rủi ro và việc hoàn thành hành động khắc phục.

- Xem bản đồ/ma trận rủi ro theo khu vực.
- Lọc khu vực theo mức độ hoặc số lượng hazard.
- Theo dõi hành động khắc phục, người phụ trách, hạn xử lý và trạng thái.
- Cập nhật tiến độ hoặc xác nhận hoàn thành theo quy trình mô phỏng.
- Xem báo cáo an toàn theo khoảng thời gian/trạng thái.
- Sử dụng Risk Hotspot Insight để xem khu vực cần ưu tiên kiểm tra.

**Màn hình nền tảng:** `manager-zone-risk-map.html`, `manager-corrective-actions.html`, `manager-safety-report.html`.

### 2.4. Quản trị viên (`admin/`)

**Mục tiêu:** quản lý dữ liệu cấu hình dùng chung cho hệ thống.

- Xem và quản lý mẫu checklist.
- Tạo, sửa, vô hiệu hóa hoặc lưu trữ khu vực công trường.
- Xem, tạo, sửa và vô hiệu hóa tài khoản mô phỏng; đặt tên đăng nhập theo luật và gán mật khẩu khởi tạo (hoặc mật khẩu tạm khi đặt lại) cho người dùng.
- Tìm kiếm/lọc dữ liệu quản trị.
- Kiểm tra dữ liệu đầu vào trước khi lưu.
- Dùng Checklist Generator để tạo bản nháp checklist theo loại công việc; cần xem lại trước khi áp dụng.

**Màn hình nền tảng:** `admin-checklist-template-management.html`, `admin-zone-management.html`, `admin-user-management.html`.

## 3. Ma trận quyền dự kiến

Ký hiệu: **✓** = có thể thực hiện trong phạm vi vai trò; **—** = không phải nhiệm vụ chính. Cần điều chỉnh nếu thiết kế được duyệt quy định khác.

| Chức năng | Worker | Safety | Manager | Admin |
|---|:---:|:---:|:---:|:---:|
| Xem/thực hiện checklist được giao | ✓ | ✓ | — | ✓ |
| Tạo báo cáo hazard | ✓ | ✓ | — | — |
| Xem báo cáo hazard | Báo cáo của mình | ✓ | ✓ | Theo nhu cầu quản trị |
| Review và phân loại hazard | — | ✓ | Theo dõi | — |
| Giao/theo dõi hành động khắc phục | Xem trạng thái | ✓ | ✓ | — |
| Quản lý đợt kiểm tra | — | ✓ | Xem tổng hợp | — |
| Xem bản đồ/điểm nóng rủi ro | — | ✓ | ✓ | — |
| Quản lý mẫu checklist | — | Theo quyền được giao | — | ✓ |
| Quản lý khu vực | — | — | Xem | ✓ |
| Quản lý tài khoản | — | — | — | ✓ |
| Xem báo cáo tổng hợp | Cá nhân | ✓ | ✓ | Khi cần |

### 3.1. Quy tắc tài khoản và đăng nhập

Đăng nhập chạy hoàn toàn ở trình duyệt (`login.html` + `SiteSafeStore.authenticate`): nhập tên đăng nhập và mật khẩu, không còn nút chọn nhanh vai trò.

| Quy tắc | Nội dung áp dụng trong nguyên mẫu |
|---|---|
| Tên đăng nhập | 6–20 ký tự, viết thường không dấu, bắt đầu bằng chữ cái, chỉ dùng `a-z` `0-9` `. _ -`, không kết thúc bằng ký tự đặc biệt, không có hai ký tự đặc biệt liền nhau, không trùng tài khoản đang tồn tại |
| Mật khẩu | 8–24 ký tự, đủ 4 nhóm (chữ hoa, chữ thường, chữ số, ký tự đặc biệt `!@#$%^&*_-.`), không chứa tên đăng nhập, không lặp một ký tự ba lần liền, không thuộc danh sách dễ đoán |
| Khóa tạm | 5 lần sai liên tiếp → khóa 30 giây theo từng tên đăng nhập, màn hình đếm ngược và chặn gửi (bộ đếm ở `sitesafe.auth.v3`) |
| Đặt mật khẩu hộ | Quản trị viên thêm tài khoản hoặc đặt lại mật khẩu ở SCR-12 → tài khoản bị đánh dấu `mustChange`, lần đăng nhập đầu mở hộp thoại đổi mật khẩu không thể bỏ qua (chỉ có nút Đăng xuất) |
| Đổi mật khẩu | Mục **Đổi mật khẩu** trong menu người dùng ở thanh trên: kiểm mật khẩu hiện tại, áp dụng cùng bộ luật, mật khẩu mới phải khác mật khẩu cũ |
| Tài khoản vô hiệu hóa | `active: false` thì màn hình đăng nhập báo “đã bị vô hiệu hóa” và không tạo phiên |
| Đổi vai trò | Không còn đăng nhập hộ: menu người dùng đưa về `login.html?switch=1` (xóa phiên cũ), trang `403.html` đưa tới `login.html?switch=1&next=<màn hình cần quyền>` |

Bản rõ các mật khẩu demo nằm trong `js/modules/seed-data.js` để nhóm biết dùng gì khi quay video; khi nạp vào LocalStorage, `store.js` băm theo tên đăng nhập (FNV-1a bốn vòng) và xóa bản rõ. Bảng credentials và giải thích đầy đủ ở mục 7 của `README.md`. Đây là cơ chế minh họa cho nguyên mẫu học tập — không có máy chủ, không có vận chuyển qua mạng, không phải giải pháp bảo mật.

## 4. Quy tắc trạng thái nghiệp vụ gợi ý

### Hazard

`Mới tạo` → `Chờ xem xét` → `Đã xác nhận` → `Đang khắc phục` → `Đã đóng`

Nhánh phụ có thể gồm `Cần bổ sung thông tin`, `Bị từ chối` hoặc `Đã lưu trữ` khi có lý do phù hợp.

### Hành động khắc phục

`Chưa bắt đầu` → `Đang thực hiện` → `Chờ xác nhận` → `Hoàn thành`

Có thể có trạng thái `Quá hạn` được tính từ hạn xử lý và trạng thái hiện tại, thay vì người dùng tự nhập.

### Checklist/Inspection

`Bản nháp` → `Đang thực hiện` → `Đã gửi` → `Đã xem xét` → `Hoàn tất`

Đây là trạng thái đề xuất để nhóm thống nhất; phải dùng cùng tên trạng thái trên giao diện, dữ liệu và tài liệu.

## 5. Quy tắc chung về giao diện

- Mỗi trang có tiêu đề, điều hướng và phản hồi thao tác nhất quán.
- Các biểu mẫu phải kiểm tra trường bắt buộc và hiển thị lỗi dễ hiểu.
- Danh sách phải có trạng thái rỗng; bộ lọc không có kết quả phải được thông báo.
- Thao tác lưu, cập nhật, đóng hoặc lưu trữ phải phản ánh lên dữ liệu mô phỏng.
- Dữ liệu nguy cơ và đề xuất AI chỉ phục vụ nguyên mẫu học tập, không thay thế đánh giá an toàn thực tế.

## 6. Ba trải nghiệm AI

| Tính năng | Người dùng chính | Đầu vào | Đầu ra dự kiến |
|---|---|---|---|
| Hazard Classifier | Cán bộ an toàn | Mô tả nguy cơ, khu vực, loại công việc | Nhóm nguy cơ, mức ưu tiên, lý do |
| Checklist Generator | Quản trị viên/cán bộ được phép | Loại công việc, khu vực, điều kiện | Bản nháp các mục checklist và lý do |
| Risk Hotspot Insight | Quản lý công trường | Dữ liệu hazard theo khu vực/thời gian | Khu vực nổi bật, số liệu hỗ trợ, gợi ý kiểm tra |

Mỗi trải nghiệm phải có trạng thái xử lý, kết quả, giải thích, lựa chọn chấp nhận/chỉnh sửa/từ chối và ít nhất một trạng thái thiếu dữ liệu/lỗi/không chắc chắn. Nếu mô phỏng bằng JavaScript/JSON thì phải ghi rõ là mô phỏng.
"""