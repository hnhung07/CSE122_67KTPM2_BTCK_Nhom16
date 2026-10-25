
# SiteSafe – Theo dõi an toàn công trường

> **Học phần:** Phát triển ứng dụng Web cơ bản – CSE122  
> **Sản phẩm:** Website Frontend mô phỏng quản lý an toàn công trường  
> **Nhóm:** 16

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

## 5. Công nghệ sử dụng

- **HTML:** cấu trúc nội dung và biểu mẫu cho 16 trang.
- **CSS + Bootstrap 5.3.3:** lưới, thành phần và responsive; `assets/css/styles.css` định nghĩa design system (biến màu, badge trạng thái, card, bản đồ, timeline).
- **JavaScript (ES5 thuần, không framework):** sự kiện, DOM, tìm kiếm, lọc, validation, kéo–thả HTML5, FileReader + canvas cho ảnh minh chứng, SVG tự vẽ biểu đồ và bản đồ.
- **JSON / LocalStorage:** `js/modules/seed-data.js` dựng dữ liệu mẫu, `js/modules/store.js` đọc/ghi và suy dẫn các giá trị nghiệp vụ (điểm rủi ro, quá hạn, thống kê).
- **Phiên đăng nhập mô phỏng ở trình duyệt:** biểu mẫu `login.html` kiểm tra tên đăng nhập/mật khẩu theo bộ luật đặt tài khoản, băm mật khẩu bằng FNV-1a (chỉ để minh họa), đếm lần sai và khóa tạm 30 giây trong `sitesafe.auth.v3`; phiên lưu ở `sitesafe.session.v3`. Không có máy chủ, không có API xác thực.
- **Bootstrap Icons 1.11.3:** biểu tượng.
- **Git / GitHub:** quy trình đã mô tả ở mục 9; kho mã hiện chưa khởi tạo, nhóm cần `git init`, tạo nhánh `dev` và nộp theo PR.
- **Figma / Canva:** bản mô phỏng nằm ở liên kết trong `design/figma-link.txt`.
- **OBS:** chưa ghi; mỗi màn hình cần một video theo mục 8.

## 6. Cấu trúc thư mục

```text
SiteSafe_demo/
├── index.html                 # Trang giới thiệu dự án + 4 vai trò
├── login.html                 # Đăng nhập bằng tên tài khoản + mật khẩu demo
├── 403.html / 404.html        # Chặn vai trò / sai đường dẫn
├── worker/                    # SCR-01 checklist · SCR-02 báo nguy cơ · SCR-03 báo cáo của tôi
├── safety/                    # SCR-04 bảng xem xét · SCR-05 chi tiết nguy cơ · SCR-06 đợt kiểm tra
├── manager/                   # SCR-07 bản đồ rủi ro · SCR-08 hành động khắc phục · SCR-09 báo cáo an toàn
├── admin/                     # SCR-10 mẫu checklist · SCR-11 khu vực · SCR-12 tài khoản
├── assets/css/styles.css      # Design system tông xanh ngọc + các thành phần dùng chung
├── js/modules/                # seed-data.js · store.js · app.js · charts.js · ai.js
├── js/pages/                  # Một file script cho mỗi trang (15 file)
├── docs/                      # project-proposal · roles-and-features · screen-inventory · team-assignment · ai-usage-report 
├── design/figma-link.txt      # Liên kết bản mô phỏng Figma
├── design/mockups/            # Ảnh xuất wireframe + mockup Desktop/Mobile + Component Guide
```

Toàn bộ ứng dụng là frontend thuần: không có build step, không có máy chủ, không có thư viện JavaScript ngoài Bootstrap 5.3.3 và Bootstrap Icons 1.11.3 (nạp qua CDN).

## 7. Cách chạy dự án

1. Mở thư mục dự án trong Visual Studio Code.
2. Mở `index.html` hoặc `login.html` trực tiếp bằng trình duyệt (nhấp đúp file), hoặc dùng tiện ích **Live Server** nếu muốn: chuột phải vào tệp HTML → **Open with Live Server**.
3. Ở màn hình đăng nhập, nhập tên đăng nhập + mật khẩu của một vai trò. Bảng **Tài khoản demo** bên dưới liệt kê đủ 10 tài khoản; bấm **Điền** để nạp nhanh vào ô (vẫn phải bấm **Đăng nhập**).

| Vai trò | Tên đăng nhập | Mật khẩu demo | Sinh viên phụ trách |
|---|---|---|---|
| Nhân sự hiện trường (`worker`) | `maingoc` | `Worker@2026` | SV1 – Lê Thị Mai Ngọc |
| Cán bộ an toàn (`safety`) | `thao.nguyen` | `AnToan@2026` | SV2 – Nguyễn Thị Thảo |
| Quản lý công trường (`manager`) | `nhung.do` | `ChiHuy@2026` | SV3 – Đỗ Hồng Nhung |
| Quản trị viên (`admin`) | `quantri` | `Admin@2026` | SV3 – Đỗ Hồng Nhung |

Tài khoản demo bổ sung: `gia.han`, `kieu.anh` (worker), `hoai.nam` (safety), `quoc.bao` (manager) dùng cùng mật khẩu theo vai trò; `minh.chau` và `thanh.truc` bị vô hiệu hóa để demo luồng “tài khoản không còn hoạt động”.

**Luật tên đăng nhập:** 6–20 ký tự, viết thường không dấu, bắt đầu bằng chữ cái, chỉ dùng `a-z` `0-9` `. _ -`, không kết thúc bằng ký tự đặc biệt, không có hai ký tự đặc biệt liền nhau, không trùng tài khoản đã có.
**Luật mật khẩu:** 8–24 ký tự, đủ 4 nhóm (hoa, thường, số, ký tự đặc biệt `!@#$%^&*_-.`), không chứa tên đăng nhập, không lặp một ký tự ba lần liền, không thuộc danh sách dễ đoán (`password`, `12345678`, `sitesafe`, …).
**Khóa tạm:** nhập sai 5 lần liên tiếp thì tài khoản bị khóa 30 giây, màn hình đếm ngược và không cho gửi. **Bắt buộc đổi mật khẩu:** mật khẩu do quản trị viên đặt (`SCR-12`) bị đánh dấu `mustChange`, lần đăng nhập đầu mở hộp thoại đổi mật khẩu không thể bỏ qua.

Mật khẩu chỉ là cơ chế minh họa của nguyên mẫu: băm FNV-1a theo tên đăng nhập, lưu trong LocalStorage, không có máy chủ hay vận chuyển qua mạng — không dùng cho hệ thống thật.

4. Data mẫu nằm trong `js/modules/seed-data.js` và được nhân bản vào LocalStorage với khóa `sitesafe.db.v3` (trường `version` = 4; tăng version sẽ tự nạp lại dữ liệu gốc). Nút **Khôi phục dữ liệu mẫu** ở thanh trên (trang đăng nhập cũng có) sẽ đưa dữ liệu về trạng thái gốc sau khi thử.
5. Kiểm tra: điều hướng theo vai trò, biểu mẫu và validation, kéo–thả bảng xem xét, lọc/biểu đồ, bản đồ rủi ro, và các deep link `?id=` / `?zone=` / `?focus=` / `?show=`.
6. Kiểm tra tầng tài khoản: đăng nhập sai 5 lần → khóa tạm 30 giây có đếm ngược; tài khoản `active: false` (`minh.chau`, `thanh.truc`) bị chặn; menu người dùng → **Đổi mật khẩu**; SCR-12 thêm tài khoản kèm mật khẩu khởi tạo → lần đăng nhập đầu buộc đổi.

Ứng dụng chạy được cả khi mở từ `file://` (không cần máy chủ), nhưng một số trình duyệt hạn chế `localStorage` trên `file://`; nếu thấy dữ liệu không lưu, hãy dùng Live Server.

### 7.1. Ba tính năng nổi bật theo từng sinh viên

| Sinh viên | Màn hình | Tính năng nổi bật | Điểm kiểm chứng |
|---|---|---|---|
| SV1 – Lê Thị Mai Ngọc | SCR-02 | **Hazard Report Composer:** soạn báo cáo kèm ảnh minh chứng (nén bằng canvas), AI-01 gợi ý nhóm nguy cơ + mức độ + biện pháp, người dùng sửa/chấp nhận/từ chối, có lưu bản nháp | Thay mô tả, chạy lại phân loại, kiểm tra giải thích và độ khớp; tải ảnh và xem thumbnail |
| SV2 – Nguyễn Thị Thảo | SCR-04 + SCR-05 | **Triage board kéo–thả:** 5 cột trạng thái, kéo thẻ là đổi trạng thái kèm hàng rào nghiệp vụ (không đóng khi còn hành động mở, bắt buộc ghi chú khi từ chối), mọi lần đổi đều ghi lịch sử | Kéo thẻ bằng chuột, thử đóng báo cáo còn hành động, mở SCR-05 đọc timeline |
| SV3 – Đỗ Hồng Nhung | SCR-07 | **Sơ đồ công trường SVG tương tác:** lớp nhiệt rủi ro theo khu vực, vòng xung nháy cho nguy cơ Nghiêm trọng, ma trận 5×5 bấm được, AI-03 xếp hạng điểm nóng và công khai công thức tính điểm | Bật/tắt lớp nhiệt, bấm ô ma trận, đối chiếu bảng xếp hạng với danh sách nguy cơ thật |

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

## 09. Báo cáo sử dụng AI

Tệp `docs/ai-usage-report.md` phải ghi rõ công cụ AI đã dùng, prompt chính, phần AI tạo, phần sinh viên chỉnh sửa, lỗi phát hiện, cách kiểm chứng và những tính năng chỉ mô phỏng so với tính năng có gọi API thật.

## 10. Tài liệu dự án

- [`docs/project-proposal.md`](docs/project-proposal.md): đề xuất, bối cảnh, vấn đề và mục tiêu dự án.
- [`docs/roles-and-features.md`](docs/roles-and-features.md): vai trò và chức năng của từng vai trò.
- [`docs/screen-inventory.md`](docs/screen-inventory.md): danh sách màn hình, nhiệm vụ, tệp, CRUD/trạng thái, AI và người phụ trách.
- [`docs/team-assignment.md`](docs/team-assignment.md): phân công thành viên và trách nhiệm.
- [`docs/ai-usage-report.md`](docs/ai-usage-report.md): khai báo việc sử dụng AI trong quá trình làm bài.
- [`design/component-guide.md`](design/component-guide.md): bảng màu, font, bo góc, breakpoint và 77 thành phần — nguồn để dựng mockup Figma khớp tuyệt đối với code.
- [`design/mockups/README.md`](design/mockups/README.md): danh sách 30 file mockup bắt buộc và quy trình xuất PNG từ Figma.

## 11. Lưu ý

- Danh sách 12 giao diện ban đầu trong đề chỉ là điểm khởi đầu; số lượng cuối cùng phải theo nghiệp vụ và bảng kiểm kê đã được duyệt.
- Mỗi thành viên phải tự hoàn thành ít nhất một luồng end-to-end, bao gồm HTML, CSS, JavaScript, dữ liệu, responsive, Git và OBS.
- Mỗi giao diện thực tế đã được duyệt trong bảng kiểm kê cần có video OBS theo yêu cầu đề bài.
- Không tuyên bố tính năng đã hoàn thành nếu chưa kiểm thử hoặc chưa có minh chứng tương ứng.

---

**Trạng thái:** 12 màn hình nghiệp vụ + 4 trang phụ trợ đã hoàn thành và kiểm thử trên trình duyệt (24/10/2026)
**Tên dự án:** SiteSafe – Theo dõi an toàn công trường
