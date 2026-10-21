## 1. Thông tin chung

- **Dự án:** SiteSafe – Theo dõi an toàn công trường
- **Học phần:** Phát triển ứng dụng Web cơ bản – CSE122
- **Mục đích:** Liệt kê màn hình, chức năng, file dự kiến, người phụ trách và tiêu chí nghiệm thu trước khi lập trình.
- **Trạng thái:** Bản dự thảo để nhóm rà soát và trình giảng viên duyệt.

> Lưu ý: 12 màn hình dưới đây là danh sách nghiệp vụ nền tảng theo kế hoạch hiện tại. Nhóm cần đối chiếu đề bài, luồng người dùng và thiết kế đã được duyệt trước khi chốt phạm vi cuối cùng. Tên file là tên dự kiến; hãy sửa nếu repo đang dùng quy ước khác.

## 2. Quy ước

- **C – Create:** Tạo mới.
- **R – Read:** Xem/đọc.
- **U – Update:** Cập nhật.
- **D – Delete:** Xóa. Với dữ liệu nghiệp vụ, ưu tiên lưu trữ hoặc vô hiệu hóa nếu cần giữ lịch sử.
- **CRUD không áp dụng** cho màn hình chỉ xem báo cáo; các trang này cần có lọc hoặc tương tác phù hợp.
- Mỗi màn hình cần có HTML, CSS, JavaScript khi phù hợp, dữ liệu nhất quán, responsive và trạng thái phản hồi rõ ràng.

## 3. Bảng kiểm kê 12 màn hình nghiệp vụ

| ID | Vai trò | Màn hình | Mục đích/chức năng chính | Tệp HTML dự kiến | CRUD / tương tác | Phụ trách | Tiêu chí nghiệm thu chính |
|---|---|---|---|---|---|---|---|
| SCR-01 | Worker | Checklist an toàn | Xem checklist được giao; đánh dấu kết quả từng mục; ghi chú khi cần | `worker/worker-safety-checklist.html` | R/U; đánh dấu mục, lưu kết quả | SV1 – Lê Thị Mai Ngọc | Có thể mở checklist, đánh dấu và lưu; dữ liệu hiển thị đúng; có phản hồi khi lưu |
| SCR-02 | Worker | Tạo báo cáo nguy cơ | Nhập tiêu đề, mô tả, khu vực, mức độ và minh chứng nếu hỗ trợ | `worker/worker-hazard-create.html` | C; validation; gửi biểu mẫu | SV1 – Lê Thị Mai Ngọc | Báo lỗi trường bắt buộc; gửi hợp lệ tạo bản ghi; báo thành công/lỗi |
| SCR-03 | Worker | Danh sách nguy cơ của tôi | Xem, tìm kiếm, lọc và theo dõi báo cáo đã gửi | `worker/worker-my-hazards.html` | R; lọc/tìm kiếm; U khi được phép | SV1 – Lê Thị Mai Ngọc | Danh sách đúng dữ liệu; lọc hoạt động; có trạng thái rỗng và không có kết quả |
| SCR-04 | Safety | Dashboard an toàn | Tổng hợp hazard, inspection và tình trạng xử lý | `safety/safety-dashboard.html` | R; lọc/tương tác điều hướng | SV2 – Nguyễn Thị Thảo | Số liệu khớp dữ liệu mẫu; các liên kết điều hướng hoạt động |
| SCR-05 | Safety | Chi tiết và xem xét nguy cơ | Xem thông tin hazard; cập nhật trạng thái, mức ưu tiên và ghi chú review | `safety/safety-hazard-detail.html` | R/U; đổi trạng thái; ghi chú | SV2 – Nguyễn Thị Thảo | Hiển thị đúng bản ghi; trạng thái cập nhật; có kiểm tra dữ liệu và phản hồi |
| SCR-06 | Safety | Quản lý đợt kiểm tra | Xem, tạo và cập nhật các đợt inspection | `safety/safety-inspection-management.html` | C/R/U; lọc trạng thái | SV2 – Nguyễn Thị Thảo | Tạo/sửa được đợt kiểm tra; danh sách cập nhật; biểu mẫu kiểm tra hợp lệ |
| SCR-07 | Manager | Bản đồ/ma trận rủi ro khu vực | So sánh nguy cơ theo khu vực và lọc theo mức độ/trạng thái | `manager/manager-zone-risk-map.html` | R; lọc khu vực/mức độ | SV3 – Đỗ Hồng Nhung | Hiển thị dữ liệu rủi ro nhất quán; lọc được; có chú giải dễ hiểu |
| SCR-08 | Manager | Hành động khắc phục | Theo dõi người phụ trách, hạn xử lý và tiến độ khắc phục | `manager/manager-corrective-actions.html` | C/R/U; lọc; cập nhật trạng thái | SV3 – Đỗ Hồng Nhung | Có thể xem và cập nhật tiến độ; thể hiện trạng thái và hạn xử lý |
| SCR-09 | Manager | Báo cáo an toàn | Tổng hợp tình hình theo thời gian, khu vực hoặc trạng thái | `manager/manager-safety-report.html` | R; lọc theo điều kiện | SV3 – Đỗ Hồng Nhung | Bộ lọc hoạt động; số liệu/tổng hợp khớp dữ liệu đầu vào |
| SCR-10 | Admin | Quản lý mẫu checklist | Xem, tạo, sửa và lưu trữ mẫu checklist | `admin/admin-checklist-template-management.html` | C/R/U; lưu trữ/vô hiệu hóa | SV3 – Đỗ Hồng Nhung | Tạo/sửa mẫu được; kiểm tra trường bắt buộc; mẫu cập nhật đúng |
| SCR-11 | Admin | Quản lý khu vực | Quản lý danh sách khu vực công trường | `admin/admin-zone-management.html` | C/R/U; lưu trữ/vô hiệu hóa | SV3 – Đỗ Hồng Nhung | Thêm/sửa khu vực; kiểm tra tên/mã trùng nếu áp dụng; danh sách cập nhật |
| SCR-12 | Admin | Quản lý tài khoản | Xem, tạo, sửa thông tin, đặt tên đăng nhập + mật khẩu khởi tạo và vô hiệu hóa tài khoản mô phỏng | `admin/admin-user-management.html` | C/R/U; tìm kiếm; vô hiệu hóa; luật tài khoản | SV3 – Đỗ Hồng Nhung | Tìm kiếm được; kiểm tra trường bắt buộc; thay đổi trạng thái hiển thị đúng |

## 4. Màn hình dùng chung cần xem xét

Các màn hình dưới đây không tự động được tính vào 12 màn hình nghiệp vụ. Nhóm cần quyết định dựa trên yêu cầu đề bài, luồng người dùng và ý kiến giảng viên.

| ID | Màn hình | Tệp HTML dự kiến | Mục đích | Trạng thái |
|---|---|---|---|---|
| COM-01 | Trang chủ/điều hướng | `index.html` | Giới thiệu sản phẩm và điều hướng đến khu vực phù hợp | Cần nhóm xác nhận |
| COM-02 | Đăng nhập theo tài khoản (tên đăng nhập + mật khẩu) | `login.html` | Kiểm tra luật tài khoản, băm mật khẩu mô phỏng, khóa tạm 30 giây sau 5 lần sai, đổi vai trò phải đăng nhập lại | Cần nhóm xác nhận |
| COM-03 | Hồ sơ cá nhân | `profile.html` | Xem thông tin tài khoản nếu cần | Chưa chốt |
| COM-04 | Thông báo | `notifications.html` | Hiển thị cập nhật trạng thái nếu cần | Chưa chốt |
| COM-05 | Không có quyền truy cập | `403.html` | Phản hồi khi vai trò không được phép truy cập | Chưa chốt |
| COM-06 | Không tìm thấy trang | `404.html` | Xử lý đường dẫn không tồn tại | Chưa chốt |

## 5. Ba trải nghiệm AI dự kiến

| ID | Tính năng | Vị trí sử dụng dự kiến | Đầu vào | Kết quả mong đợi | Kiểm thử tối thiểu |
|---|---|---|---|---|---|
| AI-01 | Hazard Classifier | Tạo/xem xét báo cáo nguy cơ | Mô tả, loại công việc, khu vực | Gợi ý nhóm nguy cơ, mức ưu tiên và lý do | Thử mô tả khác nhau; thử đầu vào trống; cho phép người dùng sửa/chấp nhận/từ chối |
| AI-02 | Checklist Generator | Quản lý mẫu checklist | Loại công việc và điều kiện công trường | Bản nháp các mục checklist gợi ý | Kiểm tra nội dung đầu ra; cho phép chỉnh sửa trước khi lưu |
| AI-03 | Risk Hotspot Insight | Bản đồ rủi ro/báo cáo quản lý | Dữ liệu nguy cơ theo khu vực/thời gian | Nêu khu vực nổi bật kèm số liệu hỗ trợ và gợi ý kiểm tra | Đối chiếu với dữ liệu đầu vào; xử lý trường hợp không có dữ liệu |

> Nếu các tính năng chỉ dùng quy tắc JavaScript và dữ liệu JSON thì phải ghi rõ là mô phỏng/phân tích theo quy tắc, không tuyên bố đang dùng mô hình AI hoặc API thật.

## 6. Quy tắc trạng thái cần thống nhất

### Hazard

`Mới tạo` → `Chờ xem xét` → `Đã xác nhận` → `Đang khắc phục` → `Đã đóng`

Có thể bổ sung `Cần bổ sung thông tin` hoặc `Bị từ chối` nếu quy trình được nhóm thống nhất.

### Hành động khắc phục

`Chưa bắt đầu` → `Đang thực hiện` → `Chờ xác nhận` → `Hoàn thành`

`Quá hạn` có thể được xác định từ hạn xử lý và trạng thái, không nhất thiết là trạng thái do người dùng tự chọn.

### Checklist/Inspection

`Bản nháp` → `Đang thực hiện` → `Đã gửi` → `Đã xem xét` → `Hoàn tất`

> Đây là trạng thái đề xuất. Nhóm cần thống nhất cùng một cách viết trên giao diện, dữ liệu và tài liệu.

## 7. Tiêu chí hoàn thành cho mỗi màn hình

Đánh dấu khi đã hoàn thành và có thể chứng minh:

- [ ] Thiết kế Figma/Canva đã được duyệt.
- [ ] Đường dẫn và tên file khớp cấu trúc repo.
- [ ] HTML hiển thị đúng nội dung.
- [ ] CSS nhất quán và responsive trên desktop, tablet, mobile.
- [ ] JavaScript có tương tác thực tế; không có nút chỉ để trang trí.
- [ ] Biểu mẫu có validation khi cần.
- [ ] Dữ liệu được đọc/ghi đúng theo quy ước chung của nhóm.
- [ ] Có thông báo thành công/lỗi và trạng thái rỗng khi phù hợp.
- [ ] Đã kiểm thử các trường hợp chính và trường hợp biên.
- [ ] Thành viên khác đã review.
- [ ] Đã commit và merge theo quy trình nhóm.
- [ ] Đã có video OBS theo yêu cầu của đề bài.
- [ ] README và tài liệu liên quan đã được cập nhật.

> Ghi chú 21/10/2026: với cả 12 màn hình, các mục về đường dẫn tệp, HTML/CSS/JavaScript, validation, đọc–ghi dữ liệu, thông báo và trạng thái rỗng đã kiểm chứng khi chạy trên trình duyệt. Các mục còn lại (thiết kế đã duyệt, review chéo, commit/PR, video OBS) chưa có minh chứng nên chưa đánh dấu.
>
> Cùng ngày 21/10/2026: tầng đăng nhập theo tài khoản đã được kiểm chứng trên trình duyệt — 10/10 tài khoản seed đăng nhập đúng mật khẩu tương ứng, sai mật khẩu báo số lần còn lại, lần thứ 5 khóa tạm 30 giây có đếm ngược, tài khoản `active: false` bị chặn, hộp thoại đổi mật khẩu (tùy chọn và bắt buộc) chạy đúng, và SCR-12 thêm tài khoản mới kèm tên đăng nhập + mật khẩu rồi đăng nhập được bằng tài khoản đó.

## 8. Trạng thái theo dõi

Tính đến 21/10/2026: cả 12 màn hình nghiệp vụ và 4 trang phụ trợ (`index.html`, `login.html`, `403.html`, `404.html`) đã có mã chạy được và đã kiểm thử trực tiếp trên trình duyệt (desktop). Video OBS, review chéo và liên kết nhánh/PR chưa có vì kho mã chưa khởi tạo Git.

| ID | Người phụ trách | Trạng thái | Link task | Link PR/commit | Video OBS | Ghi chú |
|---|---|---|---|---|---|---|
| SCR-01 | SV1 | Hoàn thành code, đã kiểm thử | Chưa tạo | Chưa có (repo chưa phải Git) | Chưa có | Checklist theo mẫu, lưu nháp từng mục, bắt buộc ghi chú khi "Không đạt" |
| SCR-02 | SV1 | Hoàn thành code, đã kiểm thử | Chưa tạo | Chưa có | Chưa có | **Tính năng nổi bật:** Hazard Report Composer + AI-01 gợi ý phân loại, kèm ảnh minh chứng (canvas nén) |
| SCR-03 | SV1 | Hoàn thành code, đã kiểm thử | Chưa tạo | Chưa có | Chưa có | Danh báo cáo của mình, lọc/sắp xếp, timeline xử lý, deep link `?show=` |
| SCR-04 | SV2 | Hoàn thành code, đã kiểm thử | Chưa tạo | Chưa có | Chưa có | **Tính năng nổi bật:** Triage board kéo–thả 5 cột, chặn đóng khi còn hành động mở, ghi lịch sử mọi lần đổi |
| SCR-05 | SV2 | Hoàn thành code, đã kiểm thử | Chưa tạo | Chưa có | Chưa có | Review chi tiết, chạy lại AI-01, giao hành động, deep link `?id=` |
| SCR-06 | SV2 | Hoàn thành code, đã kiểm thử | Chưa tạo | Chưa có | Chưa có | Lập/sửa/hủy đợt kiểm tra, "Phát checklist" sinh run cho tổ, cảnh báo lịch trùng |
| SCR-07 | SV3 | Hoàn thành code, đã kiểm thử | Chưa tạo | Chưa có | Chưa có | **Tính năng nổi bật:** Sơ đồ công trường SVG + lớp nhiệt rủi ro, ma trận 5×5, AI-03 Hotspot có chấp nhận/từ chối |
| SCR-08 | SV3 | Hoàn thành code, đã kiểm thử | Chưa tạo | Chưa có | Chưa có | Theo dõi hành động, slider tiến độ, nghiệm thu bắt buộc ghi chú, tự đề xuất đóng nguy cơ |
| SCR-09 | SV3 | Hoàn thành code, đã kiểm thử | Chưa tạo | Chưa có | Chưa có | Báo cáo theo kỳ 7/30/90/toàn bộ, 4 biểu đồ SVG, in và xuất CSV (có BOM) |
| SCR-10 | SV3 | Hoàn thành code, đã kiểm thử | Chưa tạo | Chưa có | Chưa có | CRUD mẫu checklist, chặn trùng mã, lưu trữ thay vì xóa; AI-02 sinh bản nháp có chọn/bỏ mục |
| SCR-11 | SV3 | Hoàn thành code, đã kiểm thử | Chưa tạo | Chưa có | Chưa có | CRUD khu vực, vẽ vùng `x/y/w/h` cho bản đồ, cảnh báo chồng lấn ô |
| SCR-12 | SV3 | Hoàn thành code, đã kiểm thử | Chưa tạo | Chưa có | Chưa có | CRUD tài khoản mô phỏng kèm tên đăng nhập + mật khẩu khởi tạo (luật ở `roles-and-features.md` §3.1), validate email/phone, chặn tự tắt chính mình và tắt admin cuối cùng |

## 9. Việc cần chốt trước khi code

1. Đối chiếu bảng với đề bài gốc.
2. Xác nhận luồng người dùng và thiết kế Figma/Canva.
3. Trình giảng viên duyệt bảng kiểm kê.
4. Kiểm tra cấu trúc thư mục thực tế và sửa đường dẫn file dự kiến nếu cần.
5. Chốt người phụ trách, task, deadline và quy ước Git.
6. Chỉ chuyển trạng thái sang `Đang làm` hoặc `Hoàn thành` khi có công việc và minh chứng tương ứng.