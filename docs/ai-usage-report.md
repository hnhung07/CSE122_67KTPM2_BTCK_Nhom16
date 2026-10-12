//Ghi công cụ AI đã sử dụng, prompt, phần AI tạo, phần sinh viên chỉnh sửa, lỗi đã phát hiện, cách kiểm chứng và tính năng nào mô phỏng hoặc dùng API thật.



## 1. Mục đích

Tài liệu ghi lại việc sử dụng công cụ AI trong quá trình phân tích, thiết kế, lập trình và kiểm thử SiteSafe. Báo cáo cần phản ánh đúng những gì nhóm thực sự đã sử dụng và kiểm chứng; không khai rằng một công cụ đã tạo hoặc kiểm thử nội dung nếu điều đó không xảy ra.

## 2. Công cụ AI đã sử dụng

| Công cụ | Mục đích | Phần đã dùng | Trạng thái xác minh |
|---|---|---|---|
| ChatGPT | Hỗ trợ phân tích đề, lập cấu trúc tài liệu và soạn bản nháp Markdown | Bản nháp README và các tài liệu dự án nếu nhóm sử dụng nội dung này | Thành viên cần đọc, chỉnh sửa và xác nhận nội dung trước khi nộp |
| Công cụ khác (nếu có) | Điền theo thực tế | Điền tên và phần đã dùng | Chưa khai báo |

> Chỉ giữ lại các công cụ mà nhóm thực sự đã sử dụng. Bổ sung công cụ khác nếu có.

## 3. Prompt và kết quả sử dụng

| STT | Prompt/yêu cầu chính | Nội dung AI hỗ trợ | Sinh viên đã làm gì tiếp theo? |
|---:|---|---|---|
| 1 | Phân tích tài liệu đề bài SiteSafe và giải thích cấu trúc dự án | Tóm tắt yêu cầu, vai trò, quy trình và cấu trúc tài liệu | Đối chiếu từng yêu cầu với đề gốc; sửa theo repo thực tế |
| 2 | Soạn README cho dự án SiteSafe | Tạo bản nháp giới thiệu dự án, công nghệ, cấu trúc thư mục và quy trình làm việc | Kiểm tra tên file/đường dẫn, thử chạy theo hướng dẫn và cập nhật thông tin thật |
| 3 | Soạn 5 tài liệu Markdown trong `docs/` | Tạo bản nháp proposal, vai trò/chức năng, screen list, phân công và báo cáo AI | Cả nhóm rà soát nghiệp vụ, chốt phân công và xin giảng viên duyệt |
| 4 | Prompt khác (nếu có) | Điền đúng nội dung thực tế | Ghi rõ phần đã kiểm chứng |

Các dòng trên mô tả hỗ trợ soạn thảo tài liệu trong quá trình chuẩn bị dự án. Nhóm cần sửa hoặc xóa dòng nào không đúng với quá trình làm việc thực tế.

## 4. Phần do AI hỗ trợ và phần sinh viên chịu trách nhiệm

### AI có thể hỗ trợ

- Gợi ý bố cục tài liệu và bảng biểu.
- Giải thích khái niệm HTML, CSS, JavaScript, Git và CRUD.
- Đề xuất trường dữ liệu, trạng thái và trường hợp kiểm thử.
- Gợi ý cách tổ chức mã nguồn hoặc xử lý lỗi khi được cung cấp ngữ cảnh.

### Sinh viên phải trực tiếp thực hiện

- Đọc đề gốc và chịu trách nhiệm về tính chính xác của tài liệu.
- Thống nhất nghiệp vụ và phân công trong nhóm.
- Thiết kế Figma/Canva và xin giảng viên duyệt.
- Viết, hiểu, chỉnh sửa và chạy thử HTML/CSS/JavaScript.
- Kiểm tra dữ liệu, đường dẫn, responsive và trạng thái lỗi.
- Review code, commit, tạo PR và ghi hình OBS.
- Chỉ báo cáo tính năng đã hoàn thành sau khi kiểm thử được.

## 5. Tính năng AI trong sản phẩm

| Tính năng | Cách triển khai dự kiến | Có phải AI/API thật không? | Cách kiểm chứng |
|---|---|---|---|
| Hazard Classifier | Quy tắc JavaScript và dữ liệu JSON hoặc API nếu nhóm triển khai thật | **Chưa xác nhận; mặc định là mô phỏng** cho đến khi có tích hợp API thật | Thử nhiều mô tả, kiểm tra phân loại, giải thích và trường hợp thiếu dữ liệu |
| Checklist Generator | Bộ mẫu JSON và quy tắc JavaScript hoặc API nếu nhóm triển khai thật | **Chưa xác nhận; mặc định là mô phỏng** cho đến khi có tích hợp API thật | Thử nhiều loại công việc, kiểm tra nội dung gợi ý và cho phép chỉnh sửa |
| Risk Hotspot Insight | Tổng hợp số lượng hazard theo khu vực bằng JavaScript và dữ liệu giả lập | **Chưa xác nhận; mặc định là phân tích quy tắc/mô phỏng** nếu không gọi mô hình AI | So sánh kết quả tổng hợp với dữ liệu đầu vào, kiểm tra dữ liệu rỗng |

Không gọi một chức năng là “AI thật” chỉ vì giao diện có chữ AI. Nếu dùng API thật, hãy ghi tên dịch vụ, phần được gọi, dữ liệu gửi đi, kết quả nhận về và cách bảo vệ khóa API. Không đưa khóa bí mật vào mã nguồn công khai.

## 6. Lỗi và cách kiểm chứng

Nhóm bổ sung các lỗi thực tế đã gặp, ví dụ:

| Lỗi/vấn đề | Cách phát hiện | Cách sửa | Người xác nhận |
|---|---|---|---|
| Đường dẫn CSS/JS không đúng | Mở trang và kiểm tra Console/Network | Sửa đường dẫn tương đối | Chưa điền |
| Form cho phép gửi dữ liệu thiếu | Thử gửi form rỗng hoặc sai định dạng | Bổ sung validation | Chưa điền |
| Bộ lọc không cập nhật danh sách | Thử nhiều giá trị lọc | Sửa logic JavaScript | Chưa điền |
| Giao diện tràn trên điện thoại | Kiểm tra responsive ở viewport nhỏ | Sửa CSS/layout | Chưa điền |

Các dòng trên là ví dụ để nhóm điền theo lỗi thực tế; không được trình bày là lỗi đã xảy ra nếu chưa gặp.

## 7. Trạng thái hiện tại

- [ ] Đã rà soát nội dung tài liệu do AI hỗ trợ.
- [ ] Đã đối chiếu với đề bài gốc.
- [ ] Đã kiểm tra các đường dẫn trong README.
- [ ] Đã thử nghiệm các tính năng được mô tả là hoàn thành.
- [ ] Đã ghi lại prompt và phần sinh viên chỉnh sửa.
- [ ] Đã phân biệt rõ tính năng mô phỏng và API thật.
- [ ] Đã được các thành viên rà soát trước khi nộp.

## 8. Điều học được

Nhóm điền sau khi thực hiện:

- Kiến thức mới học được:
- Lỗi AI gợi ý chưa chính xác hoặc chưa phù hợp:
- Cách nhóm kiểm chứng và chỉnh sửa:
- Phần code/tài liệu mỗi thành viên hiểu và có thể giải thích:
- Kinh nghiệm rút ra khi kết hợp AI với kiểm thử thực tế:

**Cam kết:** Báo cáo cuối cùng phải phản ánh trung thực công cụ đã dùng, nội dung AI hỗ trợ, phần sinh viên chỉnh sửa và kết quả kiểm thử thực tế.
"""