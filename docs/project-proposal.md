## 1. Thông tin chung

- **Tên dự án:** SiteSafe – Theo dõi an toàn công trường
- **Học phần:** Phát triển ứng dụng Web cơ bản – CSE122
- **Loại sản phẩm:** Nguyên mẫu website Frontend
- **Nhóm thực hiện:** 3 sinh viên
- **Lĩnh vực:** Xây dựng / ConstructionTech

## 2. Bối cảnh

Trong hoạt động xây dựng, việc kiểm tra an toàn, ghi nhận nguy cơ tại hiện trường, lưu ảnh minh chứng và theo dõi hành động khắc phục cần được tổ chức rõ ràng. Nếu thông tin nằm rải rác hoặc không có trạng thái xử lý thống nhất, người phụ trách có thể khó biết nguy cơ nào mới phát sinh, nguy cơ nào đang chờ xử lý và nguy cơ nào đã hoàn thành.

## 3. Vấn đề cần giải quyết

- **P1 – Checklist chưa đồng nhất:** các công việc kiểm tra có thể sử dụng danh sách kiểm tra khác nhau.
- **P2 – Thiếu quy trình theo dõi hazard:** báo cáo nguy cơ cần có trạng thái và người phụ trách xử lý.
- **P3 – Minh chứng khó theo dõi:** ảnh và thông tin xử lý cần gắn với báo cáo tương ứng.
- **P4 – Khó nhận diện khu vực rủi ro:** quản lý cần xem được các khu vực có nhiều nguy cơ để ưu tiên kiểm tra.

## 4. Mục tiêu

1. Xây dựng website có luồng sử dụng rõ ràng cho các vai trò.
2. Thực hiện các thao tác CRUD hoặc thay đổi trạng thái phù hợp nghiệp vụ.
3. Sử dụng JavaScript/DOM cho biểu mẫu, tìm kiếm, lọc và cập nhật giao diện.
4. Tổ chức dữ liệu giả lập bằng JSON và/hoặc LocalStorage.
5. Xây dựng tối thiểu ba trải nghiệm AI có giải thích và cho phép người dùng kiểm soát kết quả.
6. Thiết kế responsive cho desktop, tablet và điện thoại.
7. Quản lý công việc bằng Trello/Jira/Notion và mã nguồn bằng Git/GitHub.
8. Có minh chứng thiết kế, code, commit/PR và video OBS theo yêu cầu môn học.

## 5. Đối tượng sử dụng

| Vai trò | Nhu cầu chính |
|---|---|
| Nhân sự hiện trường | Thực hiện checklist, báo nguy cơ, theo dõi báo cáo của mình |
| Cán bộ an toàn | Xem xét nguy cơ, quản lý đợt kiểm tra, giao hành động |
| Quản lý công trường | Theo dõi điểm nóng rủi ro, hành động khắc phục và báo cáo |
| Quản trị viên | Quản lý mẫu checklist, khu vực và tài khoản |

## 6. Phạm vi sản phẩm

### Trong phạm vi

- Quản lý checklist, hazard, đợt kiểm tra, khu vực và hành động khắc phục.
- Tìm kiếm, lọc, kiểm tra dữ liệu biểu mẫu và cập nhật trạng thái.
- Dashboard hoặc báo cáo tổng hợp phù hợp với vai trò.
- Ba trải nghiệm AI mô phỏng: Hazard Classifier, Checklist Generator và Risk Hotspot Insight.
- Dữ liệu giả lập bằng JSON/LocalStorage hoặc công cụ API giả lập.
- Responsive, điều hướng thống nhất, GitHub, quản lý task và video OBS.

### Ngoài phạm vi bắt buộc

- Không bắt buộc có máy chủ thật hoặc cơ sở dữ liệu trực tuyến.
- Không khẳng định AI là mô hình thật nếu chỉ sử dụng quy tắc JavaScript, dữ liệu JSON hoặc phản hồi dựng sẵn.
- Không xem website là hệ thống chứng nhận an toàn công trường ngoài thực tế.

## 7. Luồng sử dụng tổng quát

1. Người dùng vào website và chọn/đăng nhập vai trò theo phạm vi nguyên mẫu.
2. Người dùng thực hiện nhiệm vụ phù hợp với vai trò.
3. Hệ thống kiểm tra dữ liệu, lưu hoặc cập nhật dữ liệu mô phỏng.
4. Người có trách nhiệm xem xét, giao xử lý hoặc cập nhật trạng thái.
5. Người dùng xem phản hồi, báo cáo và gợi ý AI nếu phù hợp.
6. Người dùng có thể chấp nhận, chỉnh sửa hoặc từ chối đề xuất AI.

## 8. Công nghệ dự kiến

- HTML: cấu trúc giao diện và biểu mẫu.
- CSS: bố cục, thành phần giao diện và responsive.
- JavaScript: DOM, sự kiện, tìm kiếm, lọc, validation và xử lý nghiệp vụ.
- JSON/LocalStorage: dữ liệu mô phỏng.
- Git/GitHub: quản lý phiên bản, nhánh và Pull Request.
- Figma/Canva: thiết kế wireframe và giao diện.
- OBS: ghi hình minh chứng.

## 9. Tiêu chí đánh giá nội bộ

- Các luồng nghiệp vụ chính có thể chạy từ đầu đến cuối.
- Các trang có điều hướng nhất quán và hiển thị tốt trên nhiều kích thước màn hình.
- Dữ liệu được tổ chức hợp lý, tránh viết cứng rải rác.
- Các thao tác và biểu mẫu có phản hồi rõ ràng.
- Tính năng AI có giải thích, trạng thái thất bại và quyền kiểm soát của người dùng.
- Có lịch sử Git, review, tài liệu cập nhật và video OBS theo bảng kiểm kê màn hình đã được duyệt.

## 10. Rủi ro và cách giảm thiểu

| Rủi ro | Cách xử lý |
|---|---|
| Giao diện các thành viên không đồng nhất | Thống nhất màu sắc, thành phần, điều hướng và quy tắc đặt tên sớm |
| Trùng hoặc lệch cấu trúc dữ liệu | Chốt mẫu dữ liệu JSON và tên trường dùng chung |
| Merge gây lỗi | Làm trên nhánh riêng, review và kiểm thử trước khi merge |
| Thiếu thời gian hoàn thiện | Ưu tiên luồng nghiệp vụ chính trước, ghi task và hạn hoàn thành |
| Kết quả AI không phù hợp | Ghi rõ đây là mô phỏng; cho phép sửa, từ chối hoặc dùng thủ công |