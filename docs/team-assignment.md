//Ghi tên thành viên, chức năng được giao, deadline, nhánh Git, commit/PR và minh chứng OBS.
## 1. Nguyên tắc phân công

Theo đề bài, nhóm có 3 sinh viên. Mỗi người phụ trách chính một phần nghiệp vụ nhưng vẫn phải tự thực hiện HTML, CSS, JavaScript, dữ liệu, responsive, Git/GitHub và OBS cho ít nhất một luồng hoàn chỉnh. Không chia theo kiểu một người chỉ thiết kế, một người chỉ HTML và một người chỉ JavaScript.

## 2. Phân công chính

| Thành viên | Vai trò/phạm vi chính | Trách nhiệm cụ thể | Trách nhiệm chéo |
|---|---|---|---|
| **SV1 – Lê Thị Mai Ngọc** | Nhân sự hiện trường (`worker/`) | Checklist; tạo hazard; danh sách hazard cá nhân; responsive phần worker; kiểm thử phần mình | Kiểm tra tính dễ sử dụng và biểu mẫu |
| **SV2 – Nguyễn Thị Thảo** | Cán bộ an toàn (`safety/`) | Dashboard an toàn; chi tiết hazard/review; quản lý inspection; tương tác JavaScript/dữ liệu giả lập theo thống nhất nhóm | Review phần worker hoặc manager theo lịch |
| **SV3 – Đỗ Hồng Nhung** | Quản lý công trường (`manager/`) và Quản trị viên (`admin/`) | Bản đồ/điểm nóng rủi ro; hành động khắc phục; báo cáo; quản lý mẫu checklist, khu vực, tài khoản; tích hợp điều hướng | Theo dõi tích hợp, tính nhất quán giao diện và phát hành |

**Lưu ý về khối lượng:** SV3 có hai khu vực vai trò nên nhóm cần chia sẻ việc kiểm thử, thành phần dùng chung và tích hợp để khối lượng hợp lý. Có thể điều chỉnh phân công nếu cả nhóm thống nhất, nhưng phải cập nhật bảng này và bảng kiểm kê màn hình.

## 3. Tính năng nghiệp vụ mỗi thành viên

Bảng dưới đây là gợi ý phân chia các tính năng để nhóm xác nhận. Tên màn hình và phạm vi phải khớp `screen-list.md`.

| Thành viên | Tối thiểu 3 tính năng nghiệp vụ gợi ý |
|---|---|
| SV1 – Lê Thị Mai Ngọc | (1) Thực hiện checklist; (2) tạo báo cáo hazard có validation; (3) tìm kiếm/lọc và theo dõi trạng thái hazard của mình |
| SV2 – Nguyễn Thị Thảo | (1) Dashboard hazard/inspection; (2) review, phân loại và cập nhật hazard; (3) tạo/quản lý inspection và giao hành động xử lý |
| SV3 – Đỗ Hồng Nhung | (1) Bản đồ/ma trận rủi ro theo khu vực; (2) theo dõi hành động khắc phục và báo cáo; (3) quản lý cấu hình gồm mẫu checklist, khu vực và tài khoản |

Nếu giảng viên yêu cầu mỗi sinh viên đúng 3 tính năng, hãy chốt ba tính năng độc lập có đầu vào, xử lý và kết quả rõ ràng cho từng người. Không tính trang chủ, đăng nhập, đăng ký hoặc trang dùng chung vào ba tính năng nghiệp vụ.

## 4. Quy trình phối hợp

1. Cả nhóm đọc đề và thống nhất `project-proposal.md`, `roles-and-features.md`.
2. Chốt `screen-list.md`, sơ đồ trang, luồng người dùng và bản thiết kế; xin giảng viên duyệt.
3. Tạo task trên Trello/Jira/Notion. Mỗi task ghi mã, màn hình/tệp, người phụ trách, hạn, nhánh và trạng thái.
4. Tạo nhánh riêng từ `dev`, ví dụ `feature/worker-hazard-create`.
5. Code, chạy thử và commit với thông điệp mô tả rõ thay đổi.
6. Push nhánh và tạo Pull Request vào `dev`.
7. Thành viên khác review; sửa lỗi và kiểm thử tích hợp trước khi merge.
8. Cập nhật tài liệu, liên kết commit/PR và video OBS.
9. Chỉ merge `dev` sang `main` sau khi kiểm thử bản tích hợp.

## 5. Quy tắc Git

### Nhánh

```text
main
dev
feature/worker-safety-checklist
feature/worker-hazard-create
feature/safety-dashboard
feature/manager-zone-risk-map
fix/form-validation
docs/update-screen-list
```

### Commit mẫu

```text
feat: add worker hazard report form
feat: filter hazards by status
fix: validate required checklist fields
style: improve safety dashboard on mobile
docs: update screen inventory
```

Không dùng thông điệp quá chung chung như `update`, `done`, `final` hoặc `fix code`.

## 6. Bảng theo dõi task

Cập nhật bảng này trong quá trình làm; không điền trạng thái hoàn thành khi chưa có minh chứng.

| Mã task | Đầu việc | Người phụ trách | Nhánh/PR | Hạn | Trạng thái | OBS |
|---|---|---|---|---|---|---|
| TASK-01 | Chốt bảng kiểm kê màn hình và luồng người dùng | Cả nhóm | Chưa tạo | Chưa chốt | Cần làm | Chưa có |
| TASK-02 | Hoàn thiện luồng checklist và báo hazard | SV1 | Chưa tạo | Chưa chốt | Cần làm | Chưa có |
| TASK-03 | Hoàn thiện luồng review hazard/inspection | SV2 | Chưa tạo | Chưa chốt | Cần làm | Chưa có |
| TASK-04 | Hoàn thiện luồng manager/admin | SV3 | Chưa tạo | Chưa chốt | Cần làm | Chưa có |
| TASK-05 | Tích hợp dữ liệu JSON/LocalStorage | Cả nhóm; điều phối theo thống nhất | Chưa tạo | Chưa chốt | Cần làm | Chưa có |
| TASK-06 | Hoàn thiện 3 trải nghiệm AI mô phỏng | Phân công tại buổi họp nhóm | Chưa tạo | Chưa chốt | Cần làm | Chưa có |
| TASK-07 | Kiểm thử responsive và luồng liên vai trò | Review chéo | Chưa tạo | Chưa chốt | Cần làm | Chưa có |
| TASK-08 | OBS, cập nhật README và tài liệu cuối | Từng người + người tích hợp | Chưa tạo | Chưa chốt | Cần làm | Chưa có |

## 7. Quy tắc review chéo

- Người viết code không tự coi task là hoàn thành trước khi chạy thử.
- PR cần mô tả thay đổi, màn hình liên quan và cách kiểm thử.
- Reviewer kiểm tra giao diện, tương tác, dữ liệu, responsive và trạng thái lỗi phù hợp.
- Nếu đổi tên file, trường dữ liệu hoặc trạng thái, phải báo cả nhóm và cập nhật tài liệu liên quan.
- Mỗi thành viên chuẩn bị khả năng giải thích code và thực hiện một chỉnh sửa nhỏ khi bảo vệ.

## 8. Minh chứng OBS

Mỗi màn hình độc lập đã được duyệt trong bảng kiểm kê cần có video theo đề bài. Video cần cho thấy sinh viên thực hiện, bản mô phỏng, file HTML/CSS/JS, giải thích logic, chỉnh sửa trực tiếp, chạy thử và thông tin task/nhánh/commit.

Mẫu tên file:

```text
SV1-01-worker-safety-checklist.mp4
SV1-02-worker-hazard-create.mp4
SV2-01-safety-dashboard.mp4
SV3-01-manager-zone-risk-map.mp4
```

## 9. Các thông tin nhóm cần chốt

- Ngày bắt đầu và hạn hoàn thành từng task.
- Link repository GitHub và bảng Trello/Jira/Notion.
- Link Figma/Canva.
- Nhánh thực tế đang sử dụng.
- Tên file và đường dẫn code thực tế.
- Link PR/commit và thư mục lưu video OBS.
