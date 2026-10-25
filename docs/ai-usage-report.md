# Báo cáo sử dụng AI – SiteSafe

Tài liệu ghi lại việc sử dụng công cụ AI trong quá trình phân tích, thiết kế, lập trình và kiểm thử SiteSafe. Báo cáo phản ánh đúng những gì nhóm đã sử dụng và đã kiểm chứng; không khai rằng một công cụ đã tạo hoặc kiểm thử nội dung nếu điều đó không xảy ra.

## 1. Công cụ AI đã sử dụng

| Công cụ | Mục đích | Phần đã dùng | Trạng thái xác minh |
|---|---|---|---|
| ChatGPT | Phân tích đề bài, lập cấu trúc tài liệu, soạn bản nháp Markdown | 5 tài liệu trong `docs/` và bản nháp `README.md` | Thành viên đã đọc và chỉnh theo repo thực tế |
| Qoder (trợ lý lập trình trong IDE) | Viết và chỉnh sửa mã nguồn HTML/CSS/JavaScript, tạo dữ liệu mẫu, dò lỗi khi chạy thử | Khung giao diện dùng chung (`assets/css/styles.css`, `js/modules/*`), 16 trang HTML và các script trang trong `js/pages/*` | Mã chạy được và đã kiểm thử tương tác trên trình duyệt; **thành viên phải tự đọc hiểu từng file trước khi bảo vệ** |

Không có dịch vụ AI/API thật nào được gọi khi chạy sản phẩm. Ba tính năng "AI" trong ứng dụng là **mô phỏng bằng bộ luật JavaScript** trên dữ liệu mẫu (xem mục 4).

## 2. Prompt và kết quả sử dụng

| STT | Prompt/yêu cầu chính | Nội dung AI hỗ trợ | Sinh viên đã làm gì tiếp theo |
|---:|---|---|---|
| 1 | Phân tích đề bài SiteSafe: vai trò, nghiệp vụ, số màn hình | Bảng vai trò, luồng nghiệp vụ và khung tài liệu | Đối chiếu từng yêu cầu với đề gốc, chốt 12 màn hình trong `screen-inventory.md` |
| 2 | Soạn bộ tài liệu `docs/` và `README.md` | Bản nháp proposal, roles/features, screen list, phân công, báo cáo AI | Rà soát nghiệp vụ, sửa tên file/đường dẫn, chốt phân công 3 sinh viên |
| 3 | Xây design system tone xanh ngọc và khung Bootstrap dùng chung | `styles.css`, sidebar/topbar/offcanvas, toast, modal xác nhận, role guard trong `app.js` | Chạy thử từng trang, đối chiếu nhãn trạng thái với `roles-and-features.md` |
| 4 | Viết 3 tính năng nổi bật: Hazard Classifier + ảnh minh chứng (SV1), Triage board kéo–thả (SV2), Bản đồ rủi ro SVG + Hotspot (SV3) | `worker-hazard-create.js`, `safety-dashboard.js`, `manager-zone-risk-map.js` và `charts.js` | Kiểm thử kéo–thả thật bằng chuột, kiểm tra ảnh nén, kiểm tra điểm rủi ro khớp dữ liệu |
| 5 | Rà lỗi sau khi tích hợp | Báo cáo các lỗi liệt kê ở mục 5 | Sửa, chạy lại toàn bộ 12 màn hình và dọn dữ liệu mẫu về trạng thái gốc |

## 3. Phần do AI hỗ trợ và phần sinh viên chịu trách nhiệm

AI hỗ trợ: gợi ý bố cục tài liệu, viết khung HTML/CSS/JS, đề xuất trường dữ liệu và trạng thái, chỉ ra chỗ thiếu validation, dò nguyên nhân lỗi khi gặp triệu chứng.

Sinh viên trực tiếp thực hiện: đọc đề gốc và chịu trách nhiệm tính chính xác của tài liệu; thống nhất nghiệp vụ và phân công; thiết kế Figma/Canva và xin giảng viên duyệt; chạy thử từng luồng; kiểm tra responsive và các trạng thái lỗi; review code, commit, tạo PR và ghi hình OBS. Không tính năng nào được báo cáo là hoàn thành trước khi chạy được trên trình duyệt.

## 4. Tính năng AI trong sản phẩm

| Tính năng | Nơi hiển thị | Cách triển khai thực tế | Có phải AI/API thật không? | Cách kiểm chứng |
|---|---|---|---|---|
| AI-01 Hazard Classifier | SCR-02 khi soạn báo cáo; SCR-05 khi review | `js/modules/ai.js`: khớp từ khóa vào 11 nhóm nguy cơ, tính điểm theo từ khóa làm nặng/nhẹ, suy mức độ và ưu tiên, kèm `reasons`, `alternatives`, `confidence` | **Không.** Bộ luật JavaScript thuần trên dữ liệu mẫu, không gọi mạng hay API | Nhập các mô tả khác nhau (thiết bị điện, hố thang máy, nắng gắt) và kiểm tra nhóm/mức độ + phần giải thích có khớp không; thử mô tả rỗng để xem trạng thái "cần người đánh giá" |
| AI-02 Checklist Generator | SCR-10 (mẫu checklist) và SCR-06 (gợi ý lịch kiểm tra) | `ai.js`: chọn mục từ `CHECK_LIBRARY` theo loại công việc, thêm mục theo điều kiện thời tiết/đêm/gió/hàn và theo số nguy cơ mở của khu vực | **Không.** Bản nháp chỉ mang tính gợi ý | Sinh viên bỏ chọn/sửa từng mục rồi mới lưu; kiểm tra mẫu lưu ra đúng nội dung đã sửa |
| AI-03 Risk Hotspot Insight | SCR-04, SCR-06, SCR-07 | `ai.js`: tính điểm rủi ro từng khu vực `Σ trọng số mức độ (nguy cơ mở) + 2 × số quá hạn + số mới trong 7 ngày`, xếp hạng và sinh diễn giải | **Không.** Là phân tích quy tắc trên dữ liệu mẫu | Đối chiếu bảng xếp hạng với danh sách nguy cơ thật; thử khoảng thời gian không có dữ liệu để xem nhánh `no-data` |

Nguyên tắc đã áp dụng trong giao diện: mọi khối đề xuất đều có badge **Mô phỏng**, tên bộ luật, dòng disclaimer "không phải kết quả từ mô hình AI hay API thật", cờ **Cần người đánh giá** khi `confidence` thấp, và người dùng luôn có nút chấp nhận / chỉnh sửa / từ chối. Công thức tính điểm rủi ro được viết công khai ngay cạnh bản đồ (SCR-07).

## 5. Lỗi đã gặp và cách kiểm chứng

| Lỗi/vấn đề | Cách phát hiện | Cách sửa | Minh chứng xác minh (21/10/2026) |
|---|---|---|---|
| Lịch sử xử lý báo cáo không được lưu sau khi đổi trạng thái | Kiểm tra khối "Lịch sử xử lý" ở SCR-05 sau khi kéo thẻ ở SCR-04 | `store.addHistory` làm việc trên bản sao rồi ghi đè; sửa thành tìm đối tượng trong lần đọc duy nhất và ghi lại | Kéo–thả lại một báo cáo, lịch sử xuất hiện "Chuyển Đã xác nhận · Cập nhật từ bảng xem xét nhanh" |
| AI-02 trả về danh sách mục rỗng (chữ biến mất) | Bấm "Sinh bản nháp" ở SCR-10 thấy 7 mục nhưng không có nội dung | `ai.js` trộn hai dạng dữ liệu (mảng `[text, category]` và object `{text, category}`); thống nhất về object trong `generateChecklist` | Sinh bản nháp cho "Cẩu / nâng hạ": 7 mục đều có chữ và nhãn nhóm |
| Nhãn khu vực trên bản đồ bị cắt sai ("vực thử nghiệm") | So sánh tên khu vực trong danh mục và trên bản đồ SCR-07 | Chỉ bỏ tiền thừa `Công trình` ở đầu chuỗi, không cắt từ `Khu` nằm giữa tên | Thêm khu vực "Khu vực thử nghiệm" ở SCR-11, đọc lại nhãn trên bản đồ SCR-07 |
| Mã đợt kiểm tra sinh ra sai format (`PK-20261022-B`) | So với mã trong dữ liệu mẫu | Dùng format `PK-YYYY-MMDD-<chữ>` khớp seed | Phát checklist từ đợt KT-2026-014, mã run `PK-2026-1024-B` |
| Tên biểu tượng Bootstrap không tồn tại (`bi-geo`, `bi-person-add`) | Icon trống trên giao diện | Thay bằng tên hợp lệ `bi-geo-alt`, `bi-person-plus` | Rà lại bằng danh sách icon trong DOM của các trang |
| Class `min-w-0` được dùng nhưng chưa định nghĩa | Chữ dài tràn khỏi thẻ ở SCR-12 | Bổ sung utility vào `styles.css` | Danh sách tài khoản có email dài không còn tràn |
| Cảnh báo `Blocked aria-hidden on a focused element` khi đóng modal bằng script | Đọc Console khi lập trình kiểm thử | Không phát sinh khi người dùng bấm nút thông thường; ghi nhận để tránh giả lập focus khi demo | Console trống ở cả 16 trang khi thao tác bằng chuột |

## 6. Cách kiểm thử

1. Mở `login.html`, đăng nhập bằng tên tài khoản + mật khẩu demo (bảng credentials ở `README.md` §7); hệ thống ghi phiên vào `localStorage` (`sitesafe.session.v3`), mật khẩu chỉ còn dạng băm trong `sitesafe.db.v3`.
2. Kiểm tra role guard: truy cập màn hình của vai trò khác phải chuyển về `403.html?need=<role>`, và nút trên trang 403 đưa về `login.html?switch=1&next=<màn hình cần quyền>`.
3. Chạy trọn 3 luồng liên vai trò đã mô tả trong `team-assignment.md` §6 (báo cáo → review → giao hành động → nghiệm thu → đóng; lập đợt kiểm tra → phát checklist → điền kết quả; thêm khu vực → hiện trên bản đồ).
4. Mở DevTools Console ở từng trang để bảo đảm không có lỗi JavaScript; dùng nút "Khôi phục dữ liệu mẫu" để trả `sitesafe.db.v3` về dữ liệu seed sau mỗi lần thử.
5. Kiểm tra deep link: `safety-hazard-detail.html?id=`, `manager-zone-risk-map.html?zone=`, `manager-corrective-actions.html?focus=`, `worker-my-hazards.html?show=`.
6. Kiểm tra tầng tài khoản: sai 5 lần liên tiếp → khóa tạm 30 giây có đếm ngược; tài khoản `active: false` bị chặn; SCR-12 thêm tài khoản kèm mật khẩu → lần đăng nhập đầu buộc đổi mật khẩu (hộp thoại không đóng được); menu người dùng → **Đổi mật khẩu** kiểm cả mật khẩu cũ và luật mật khẩu mới.

Kết quả ngày 21/10/2026: 16/16 trang tải được, không có lỗi console, toàn bộ liên kết nội bộ trong HTML trỏ tới file tồn tại. Tầng đăng nhập theo tên tài khoản đã kiểm chứng cùng ngày: 10/10 tài khoản seed đăng nhập đúng mật khẩu tương ứng, sai mật khẩu báo đúng số lần còn lại, lần thứ 5 mở khóa 30 giây, luồng `mustChange` và đổi mật khẩu đều chạy.

## 7. Trạng thái hiện tại

- [x] Đã rà soát nội dung tài liệu do AI hỗ trợ và sửa theo repo thực tế.
- [x] Đã đối chiếu với đề bài gốc (12 màn hình, 4 vai trò, 3 trải nghiệm AI mô phỏng).
- [x] Đã kiểm tra các đường dẫn trong README và `screen-inventory.md`.
- [x] Đã thử nghiệm các tính năng được mô tả là hoàn thành trên trình duyệt.
- [x] Đã ghi lại prompt và phần sinh viên chỉnh sửa.
- [x] Đã phân biệt rõ tính năng mô phỏng và API thật (không có API thật).
- [ ] Đã được các thành viên rà soát chéo và review qua Pull Request (kho mã chưa khởi tạo Git).
- [ ] Đã ghi video OBS cho từng màn hình.

## 8. Điều học được

- Kiến thức mới: tách tầng dữ liệu khỏi giao diện (`store.js` đọc/ghi LocalStorage một chỗ), suy dẫn trạng thái nghiệp vụ (quá hạn, điểm rủi ro, tỷ lệ đóng) thay vì lưu sẵn, và dựng biểu đồ/bản đồ bằng SVG thuần nên chạy được offline.
- Lỗi AI gợi ý chưa chính xác: hàm ghi lịch sử tạo bản sao rồi ghi đè nên mất dữ liệu; bộ luật trộn hai dạng cấu trúc dữ liệu làm mất nội dung đề xuất; tự thêm tiền tố `Khu ` khi cắt nhãn; đặt tên icon Bootstrap không tồn tại. Bài học: mọi hàm AI viết đều phải được gọi thật và đọc kết quả, không chỉ nhìn mã nguồn.
- Cách nhóm kiểm chứng: chạy tương tác thật trên trình duyệt (kéo–thả, phát checklist, nghiệm thu hành động), đọc Console, và đối chiếu số liệu trên màn hình với dữ liệu trong `localStorage`.
- Phần code mỗi thành viên cần chuẩn bị giải trình khi bảo vệ: SV1 – `worker-*.js` + AI-01; SV2 – `safety-*.js` + bảng kéo–thả; SV3 – `manager-*.js`, `admin-*.js`, `charts.js` + AI-02/AI-03.
- Kinh nghiệm: AI tạo nhanh được khung và các luồng CRUD, nhưng validation nghiệp vụ (không đóng báo cáo khi còn hành động mở, bắt buộc ghi chú khi từ chối, chặn tự vô hiệu hóa chính mình) và việc gọi đúng tên API/thư viện vẫn phải do người viết kiểm tra bằng cách chạy thử.

**Cam kết:** Báo cáo phản ánh trung thực công cụ đã dùng, nội dung AI hỗ trợ, phần sinh viên chỉnh sửa và kết quả kiểm thử thực tế. Ba tính năng AI trong sản phẩm là mô phỏng bằng bộ luật JavaScript; nhóm không tuyên bố chúng là mô hình hay dịch vụ AI thật.
