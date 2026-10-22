
# SiteSafe – Theo dõi an toàn công trường

> **Học phần:** Phát triển ứng dụng Web cơ bản – CSE122  
> **Sản phẩm:** Website Frontend mô phỏng quản lý an toàn công trường  
> **Nhóm:** 3 sinh viên

## 1. Giới thiệu

**SiteSafe** là website hỗ trợ theo dõi an toàn tại công trường xây dựng. Sản phẩm tập trung vào việc thực hiện checklist, ghi nhận nguy cơ (hazard), giao và theo dõi hành động khắc phục, quản lý khu vực và tổng hợp tình hình rủi ro.

Đây là nguyên mẫu Frontend phục vụ học tập. Dữ liệu có thể được mô phỏng bằng JavaScript, JSON và LocalStorage; đề bài không bắt buộc phải xây dựng máy chủ thật.

## 2. Vấn đề cần giải quyết

- Checklist an toàn chưa đồng nhất.
- Báo cáo nguy cơ chưa có quy trình theo dõi xuyên suốt.
- Ảnh minh chứng cần gắn với lịch sử xử lý.
- Người quản lý cần theo dõi các khu vực có nguy cơ cao.

## 3. Vai trò người dùng

| Vai trò | Nhiệm vụ chính |
|---|---|
| Nhân sự hiện trường (`worker`) | Thực hiện checklist, báo nguy cơ và theo dõi báo cáo của mình |
| Cán bộ an toàn (`safety`) | Xem xét nguy cơ, quản lý kiểm tra và giao hành động xử lý |
| Quản lý công trường (`manager`) | Theo dõi bản đồ rủi ro, hành động khắc phục và báo cáo an toàn |
| Quản trị viên (`admin`) | Quản lý mẫu checklist, khu vực và tài khoản người dùng |

## 4. Chức năng chính

- Quản lý checklist và kết quả kiểm tra an toàn.
- Tạo, xem, cập nhật và quản lý trạng thái báo cáo nguy cơ.
- Theo dõi hành động khắc phục và trạng thái hoàn thành.
- Quản lý khu vực công trường, mẫu checklist và tài khoản.
- Tìm kiếm, lọc dữ liệu và kiểm tra hợp lệ của biểu mẫu.
- Hiển thị bảng điều khiển, báo cáo hoặc thông tin rủi ro phù hợp.
- Mô phỏng ít nhất 3 trải nghiệm AI:
  1. **Hazard Classifier:** phân loại nguy cơ và đề xuất mức ưu tiên.
  2. **Checklist Generator:** gợi ý checklist theo loại công việc.
  3. **Risk Hotspot Insight:** tổng hợp khu vực có nhiều nguy cơ.

> Các tính năng AI có thể được mô phỏng bằng quy tắc JavaScript và dữ liệu JSON. Không được giới thiệu kết quả mô phỏng là kết quả từ một mô hình AI hoặc API thật nếu dự án không thực sự gọi dịch vụ đó. Người dùng cần có quyền xem xét, sửa, chấp nhận hoặc từ chối đề xuất.

## 5. Công nghệ dự kiến

- **HTML:** cấu trúc nội dung và biểu mẫu.
- **CSS:** bố cục, thành phần giao diện và responsive.
- **JavaScript:** xử lý sự kiện, DOM, tìm kiếm, lọc, kiểm tra dữ liệu và luồng nghiệp vụ.
- **JSON / LocalStorage:** dữ liệu giả lập và lưu trạng thái ở trình duyệt.
- **Git / GitHub:** quản lý phiên bản, nhánh và yêu cầu hợp nhất (Pull Request).
- **Figma / Canva:** thiết kế giao diện trước khi lập trình.
- **OBS:** ghi video minh chứng quá trình thực hiện từng giao diện theo yêu cầu môn học.

## 6. Cấu trúc thư mục

Cấu trúc thực tế của kho mã nguồn cần được cập nhật theo các thư mục và tệp đang có trong dự án. Dựa trên cấu trúc hiện tại:

```text
project-root/
├── README.md
├── admin/                 # Giao diện quản trị viên
├── assets/                # Hình ảnh, biểu tượng và tài nguyên
├── design/                # Figma/Canva, wireframe và bản mô phỏng
├── doc/                   # Tài liệu bổ sung (cần kiểm tra nội dung)
├── docs/                  # Tài liệu phân tích và quản lý dự án
│   ├── project-proposal.md
│   ├── roles-and-features.md
│   ├── screen-list.md
│   ├── team-assignment.md
│   └── ai-usage-report.md
├── js/
│   └── modules/           # Các mô-đun JavaScript dùng chung
├── manager/               # Giao diện quản lý công trường
├── safety/                # Giao diện cán bộ an toàn
└── worker/                # Giao diện nhân sự hiện trường
```

Đây là mô tả theo cấu trúc nhìn thấy trong VS Code, không khẳng định mọi tệp con đã tồn tại. Nếu CSS, dữ liệu hoặc trang HTML đang được đặt ở vị trí khác, hãy cập nhật phần này để khớp với kho mã nguồn thực tế.

## 7. Cách chạy dự án

1. Mở thư mục dự án trong Visual Studio Code.
2. Kiểm tra `README.md`, `docs/screen-list.md` và các thư mục theo vai trò để xác định trang bắt đầu.
3. Mở tệp HTML có sẵn cần chạy.
4. Có thể dùng tiện ích **Live Server** trong VS Code: nhấn chuột phải vào tệp HTML rồi chọn **Open with Live Server**.
5. Kiểm tra các chức năng trên trình duyệt: điều hướng, biểu mẫu, tìm kiếm/lọc, trạng thái dữ liệu và responsive.

Nếu dự án chưa có trang `index.html`, hãy xác định trang vào hệ thống trong bảng kiểm kê màn hình trước khi tạo trang mới. Không tự giả định đường dẫn trang chủ khi chưa kiểm tra mã nguồn.

## 8. Yêu cầu hoàn thiện mỗi giao diện

Một giao diện chỉ được xem là hoàn thành khi các mục phù hợp đã được xử lý:

- Có bản mô phỏng Figma/Canva.
- HTML, CSS và JavaScript hoạt động đúng.
- Có điều hướng nhất quán với các vai trò khác.
- Responsive trên desktop, tablet và mobile.
- Có tương tác JavaScript có ý nghĩa.
- Biểu mẫu có kiểm tra dữ liệu nếu cần.
- Dữ liệu được tổ chức hợp lý, tránh viết cứng rải rác.
- Có trạng thái rỗng, đang tải, thành công hoặc lỗi khi phù hợp.
- Có kiểm tra khả năng tiếp cận cơ bản.
- Được review và merge vào nhánh `dev`.
- Có video OBS, commit/PR và cập nhật tài liệu liên quan.

## 9. Quy trình làm việc nhóm

1. Phân tích ngữ cảnh, vấn đề, vai trò và nhiệm vụ người dùng.
2. Lập luồng người dùng và bảng kiểm kê màn hình.
3. Thiết kế wireframe và giao diện bằng Figma/Canva; xin giảng viên duyệt trước khi code chính thức.
4. Tạo task trên Trello/Jira/Notion, ghi người phụ trách và hạn hoàn thành.
5. Tạo nhánh `feature/<ten-chuc-nang>` hoặc `fix/<ten-loi>`.
6. Hoàn thiện một luồng từ giao diện đến JavaScript, dữ liệu và responsive.
7. Commit với thông điệp rõ ràng, đẩy nhánh và tạo Pull Request.
8. Thành viên khác review; kiểm thử tích hợp rồi merge vào `dev`.
9. Kiểm thử lại sản phẩm, cập nhật tài liệu và ghi video OBS.
10. Sau khi tích hợp ổn định, merge bản đã kiểm thử vào `main`.

Ví dụ commit:

```text
feat: add hazard report form
feat: filter hazards by status
fix: validate empty checklist fields
style: improve worker page on mobile
docs: update screen inventory
```

## 10. Báo cáo sử dụng AI

Tệp `docs/ai-usage-report.md` phải ghi rõ công cụ AI đã dùng, prompt chính, phần AI tạo, phần sinh viên chỉnh sửa, lỗi phát hiện, cách kiểm chứng và những tính năng chỉ mô phỏng so với tính năng có gọi API thật.

## 11. Tài liệu dự án

- [`docs/project-proposal.md`](docs/project-proposal.md): đề xuất, bối cảnh, vấn đề và mục tiêu dự án.
- [`docs/roles-and-features.md`](docs/roles-and-features.md): vai trò và chức năng của từng vai trò.
- [`docs/screen-list.md`](docs/screen-list.md): danh sách màn hình, nhiệm vụ, tệp, CRUD/trạng thái, AI và người phụ trách.
- [`docs/team-assignment.md`](docs/team-assignment.md): phân công thành viên và trách nhiệm.
- [`docs/ai-usage-report.md`](docs/ai-usage-report.md): khai báo việc sử dụng AI trong quá trình làm bài.

## 12. Lưu ý

- Danh sách 12 giao diện ban đầu trong đề chỉ là điểm khởi đầu; số lượng cuối cùng phải theo nghiệp vụ và bảng kiểm kê đã được duyệt.
- Mỗi thành viên phải tự hoàn thành ít nhất một luồng end-to-end, bao gồm HTML, CSS, JavaScript, dữ liệu, responsive, Git và OBS.
- Mỗi giao diện thực tế đã được duyệt trong bảng kiểm kê cần có video OBS theo yêu cầu đề bài.
- Không tuyên bố tính năng đã hoàn thành nếu chưa kiểm thử hoặc chưa có minh chứng tương ứng.

---

**Trạng thái:** Đang phát triển  
**Tên dự án:** SiteSafe – Theo dõi an toàn công trường
