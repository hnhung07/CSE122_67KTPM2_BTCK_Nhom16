## 1. Bảng màu (Design Tokens)

### Nhận diện — tone xanh ngọc, chủ đạo do SV1 giữ

*Hex dưới đây là giá trị **nền sáng**; mỗi token có giá trị nền tối tương ứng ở bảng "Mực trầm" cuối §1.*

| Token | Hex | Dùng cho |
|---|---|---|
| `--ss-teal-900` | `#083B39` | Nền sidebar, chữ tiêu đề mạnh |
| `--ss-teal-800` | `#0D5450` | Gradient sidebar, hover đậm |
| `--ss-teal-700` | `#11736C` | Liên kết đang chọn, mã bản ghi |
| `--ss-teal-600` | `#158B81` | Nút chính, viền nhấn |
| `--ss-teal-500` | `#1BA99C` | Màu brand, biểu đồ |
| `--ss-teal-300` | `#7FD6CB` | Viền mờ, sparkline |
| `--ss-teal-100` | `#D9F4EF` | Nền chip, nền icon KPI |
| `--ss-teal-50` | `#EEFAF7` | Nền khối phụ |
| `--ss-mint` | `#C9F2E8` | Nền card nổi bật |
| `--ss-plum` | `#7C5CAD` | **Chỉ** cho khung AI (phân biệt mô phỏng) |
| `--ss-rose` | `#E07A9A` | Điểm nhấn phụ, huy hiệu số lượng |

### Ngữ nghĩa — chỉ dùng cho trạng thái, không dùng làm màu trang trí

| Token | Hex | Trạng thái |
|---|---|---|
| `--ss-lv-thap` | `#2FA36B` | Thấp / An toàn / Hoàn thành |
| `--ss-lv-tb` | `#E0A410` | Trung bình / Chờ |
| `--ss-lv-cao` | `#EF7B3D` | Cao / Đang thực hiện |
| `--ss-lv-nt` | `#D94F5C` | Nghiêm trọng / Quá hạn / Lỗi |

### Trung tính

| Token | Hex | Dùng cho |
|---|---|---|
| `--ss-ink` | `#10333A` | Chữ chính |
| `--ss-ink-soft` | `#4B6A72` | Chữ phụ, chú giải |
| `--ss-line` | `#D9E8E6` | Viền, kẻ bảng |
| `--ss-bg` | `#F3FAF9` | Nền trang |
| `--ss-surface` | `#FFFFFF` | Nền thẻ, modal |

### Nền sáng hay nền tối? Một bảng biến, hai bộ giá trị

Toàn bộ màu trong giao diện đi qua biến. Chế độ tối (`[data-theme="dark"]` ở cuối `assets/css/styles.css`, bảng **"Mực trầm"**) chỉ ghi đè giá trị biến — không có quy tắc giao diện nào viết riêng cho nền tối, nên 16 trang đổi nền cùng lúc và không lệch style.

| Token | Sáng | Tối (`data-theme="dark"`) | Ghi chú |
|---|---|---|---|
| `--ss-teal-900` | `#083B39` | `#0D1116` | Nền sidebar / nền đậm nhất |
| `--ss-teal-800` | `#0D5450` | `#141A22` | Gradient sidebar |
| `--ss-teal-700` | `#11736C` | `#8FDCD0` | Liên kết đang chọn, **chữ** nhấn và mã bản ghi (đảo vai trò sáng↔tối) |
| `--ss-teal-600` | `#158B81` | `#23A897` | Nút chính (chữ trên nút tối là `#0D1116`) |
| `--ss-teal-500` | `#1BA99C` | `#2FC4B4` | Brand, biểu đồ |
| `--ss-teal-100` | `#D9F4EF` | `#223038` | Nền chip / ô icon KPI |
| `--ss-teal-50` | `#EEFAF7` | `#151920` | Nền khối phụ |
| `--ss-ink` / `--ss-ink-soft` | `#10333A` / `#4B6A72` | `#E6ECF1` / `#AAB6C2` | Chữ chính / chữ phụ |
| `--ss-line` | `#D9E8E6` | `#2A303B` | Viền, kẻ bảng |
| `--ss-bg` / `--ss-surface` | `#F3FAF9` / `#FFFFFF` | `#12151B` / `#1A1E26` | Nền trang / nền thẻ |
| `--ss-heading` | theo `--ss-teal-800` | `#D7F3EE` | Tiêu đề card, H1–H3 |
| `--ss-on-tint` | `--ss-teal-800` | `#8FDCD0` | Chữ đặt trên nền teal nhạt |
| `--ss-lv-thap/tb/cao/nt` | `#2FA36B` `#E0A410` `#EF7B3D` `#D94F5C` | `#4EC08A` `#F0C04A` `#F79A5E` `#EF6F7D` | Bốn mức rủi ro, nấc sáng hơn để giữ tương phản |
| khối màu nhạt (`--ss-tint-*`) | cặp nền + chữ tự chọn | `#16241F`/`#86DCAE` (xanh lá), `#2A2214`/`#F0CF8E` (hổ phách), `#2B1D15`/`#F7B184` (cam), `#2A171B`/`#FFADB5` (đỏ), `#16202E`/`#A6C8F5` (xanh dương), `#1E1A2B`/`#C9B6F5` (tím), `#1D2229`/`#B8C4CF` (trung tính) | Mỗi huy hiệu trạng thái dùng **cả cặp** nền + chữ, không dùng hex + alpha |

Ba token còn lại (`--ss-plum`, `--ss-rose`, `--ss-mint`) và các biến khung AI (`--ss-ai-*`), biểu đồ (`--ss-chart-*`), bản đồ (`--ss-map-*`, `--ss-zone-*`) cũng đổi theo bảng trên.

**Nút đổi chế độ** (`js/modules/theme.js`): nhãn **Tự động / Sáng / Tối** — "Tự động" theo `prefers-color-scheme`, lựa chọn lưu ở `sitesafe.theme.v3`, script nạp trong `<head>` để tránh nháy nền, đồng bộ các tab qua sự kiện `storage`, và cập nhật `<meta name="theme-color">` (`#f3faf9` / `#12151b`).

## 2. Typografi

- **Font:** `"Be Vietnam Pro", "Segoe UI", system-ui, -apple-system, sans-serif` — tải qua Google Fonts, có đủ dấu tiếng Việt.
- **Chữ số / mã bản ghi:** `ui-monospace, "Cascadia Mono", monospace` · `0.78rem` · `700` · màu `--ss-teal-700`.
- **H1 trang:** class `.ss-page-title` (render từ `js/modules/app.js`), **mỗi trang đúng một `<h1>`**.
- Thang chữ: 0.78rem (mã) · 0.8125rem (chú giải) · 0.875rem (nội dung) · 1rem (tiêu đề thẻ) · 1.35rem (H1) · 2.2rem (giá trị KPI).

## 3. Bo góc, bóng, khoảng cách

| Token | Giá trị | Áp dụng |
|---|---|---|
| `--ss-radius` | `18px` | Card, modal, hero, drawer |
| `--ss-radius-sm` | `12px` | Nút, ô nhập, chip, ảnh nhỏ |
| `--ss-shadow` | `0 10px 30px rgba(16,87,82,.08)` | Card nổi, modal |
| `--ss-shadow-sm` | `0 4px 14px rgba(16,87,82,.07)` | KPI, bảng, ảnh nhỏ |
| `--ss-sidebar` | `268px` | Bề rộng sidebar desktop |

Khoảng cách dùng theo thang Bootstrap: `0.25 / 0.5 / 0.75 / 1 / 1.5rem`. **Không** thêm giá trị lạ trong mockup.

## 4. Breakpoint (phải khớp `@media` trong CSS)

| Tên | Ngưỡng | Hành vi |
|---|---|---|
| Desktop | ≥ 1200px | Sidebar 268px cố định + nội dung |
| Laptop | 992–1199.98px | Sidebar thu, lưới KPI 3 cột |
| Tablet | 576–991.98px | **Sidebar → offcanvas drawer**, bảng xuống `table-responsive` |
| Mobile | ≤ 575.98px | 1 cột, KPI 2 cột, chữ phụ ẩn |
| In | `@media print` | Ẩn sidebar/topbar/nút, chỉ giữ nội dung báo cáo |
| Giảm chuyển động | `prefers-reduced-motion` | Tắt animation |

**Kiểm tra bắt buộc:** không có thanh cuộn ngang ở **320px**, và phóng **200%** không mất nội dung.

## 5. Thành phần dùng chung (112 class `.ss-*`)

| Nhóm | Class | Đặc điểm phải vẽ đúng trong mockup |
|---|---|---|
| Khung ứng dụng | `.ss-app` `.ss-sidebar` `.ss-main` `.ss-topbar` `.ss-content` | Sidebar gradient teal-900→800, topbar trắng có viền dưới |
| Điều hướng | `.ss-nav-group` `.ss-nav-link` `.ss-nav-title` `.ss-nav-owner` `.ss-offcanvas-sidebar` | Mục đang chọn: nền teal-700 + chữ trắng + gạch trái 3px teal-300 |
| Thương hiệu | `.ss-brand` `.ss-brand-mark` `.ss-brand-text` `.ss-avatar` `.ss-user-pill` | Avatar 34px bo tròn, nền mint |
| Số liệu | `.ss-kpi` `.ss-kpi-icon` `.ss-kpi-value` `.ss-kpi-label` `.ss-kpi-spark` | Icon trong ô 42px nền teal-100, sparkline SVG |
| Thẻ & khối | `.ss-card-body` `.ss-section-title` `.ss-tile` `.ss-col` `.ss-col-head` `.ss-col-body` | Bo 18px, bóng `--ss-shadow-sm` |
| Bảng | `.ss-table` `.ss-row-title` `.ss-row-meta` `.ss-row-code` | Mã bản ghi font monospace teal-700 |
| Trạng thái | `.ss-badge` `.ss-st-<trạng-thái>` `.ss-lv-<mức>` `.ss-chip` `.ss-overdue` | **Tên class viết liền, giữ dấu**: `.ss-st-Chờxemxét`, `.ss-lv-Nghiêmtrọng` |
| Huy hiệu đổi nền | `.ss-badge-soft` `-green` `-amber` `-orange` `-red` `-blue` `-violet` `-neutral` `.ss-alert-warn` `-bad` `-ok` `.ss-tint-panel` `.ss-kpi-green` `.ss-note-ai` | Mỗi class giữ **cặp** nền + chữ theo token `--ss-tint-*`, nên tự thích ứng nền tối; **không** ghép hex + alpha (kiểu `màu + '20'`) |
| Chế độ hiển thị | `.ss-theme-btn` | Nút chữ/icon `Tự động` `Sáng` `Tối` ở thanh trên, `white-space:nowrap`, có `aria-label` và `title` |
| Biểu mẫu | Bootstrap `.form-control` `.form-select` + `.btn-soft` `.btn-ghost` | Lỗi đỏ `--ss-lv-nt` ngay **dưới** trường; nút phụ trợ nền teal-50 |
| **Khung AI** | `.ss-ai` `.ss-ai-head` `.ss-ai-badge` `.ss-ai-body` `.ss-ai-reason` `.ss-ai-conf` `.ss-ai-bar` `.ss-ai-actions` `.ss-ai-note` | **Viền/huy hiệu màu `--ss-plum`** để phân biệt với khối nghiệp vụ; luôn có badge "Mô phỏng"; thanh độ tin cậy; 4 nút Chấp nhận / Chỉnh sửa / Từ chối / Tạo lại |
| Trạng thái rỗng & tải | `.ss-empty` `.ss-loading` `.ss-skeleton` | Empty = biểu tượng + hướng dẫn + **nút CTA**; Skeleton = 3 dòng xám bo góc |
| Kéo–thả | `.ss-kanban` `.ss-drop` | Cột nhận highlight viền teal-500 nét đứt khi kéo vào |
| Bản đồ rủi ro | `.ss-map` `.ss-map-wrap` `.ss-map-legend` `.ss-matrix` `.ss-zone` `.ss-heat-pulse` | Vùng rect tô theo 4 màu ngữ nghĩa, điểm nóng có vòng xung |
| Dòng thời gian | `.ss-timeline` `.ss-tl-item` `.ss-tl-when` `.ss-steps` `.ss-step` `.ss-flow-step` `.ss-flow-num` | Chấm 10px teal-600, đường kẻ `--ss-line` |
| Trang giới thiệu | `.ss-landing` `.ss-hero` `.ss-bg-grid` `.ss-role-card` `.ss-role-chip` `.ss-cred` `.ss-swatch` | Hero nền grid mờ, card vai trò có dòng demo credential |
| Ảnh & thu nhỏ | `.ss-thumb` `.ss-item` `.ss-item-num` | Thumbnail 56px bo 12px |
| Thông báo | `.ss-toast` | Góc dưới phải, 4 mức success/warn/danger/info |

## 6. Quy tắc thiết kế phải giữ khi vẽ mockup

1. **Màu nóng (đỏ/cam/hồng) chỉ mang nghĩa trạng thái**, không dùng làm màu trang trí — toàn bộ giao diện nền là xanh ngọc.
2. Mọi khung AI dùng **tím mận `--ss-plum`** + badge "Mô phỏng" để người xem phân biệt ngay với số liệu nghiệp vụ.
3. Một màn chỉ có **một `<h1>`**, breadcrumb ngay dưới, và luôn có đường về trang chủ của vai trò.
4. Không viết style inline và không dùng `!important` trong mã production — mockup cũng không mô phỏng hai kiểu đó. **Bốn ngoại lệ có chủ đích, đã ghi trong CSS:** `[data-theme="dark"] .text-danger / .text-success / .text-warning / .text-primary` phải thắng class màu của Bootstrap (đối thủ cụ thể: `.text-danger` gốc `#dc3545` chỉ đạt 1.77:1 trên nền tối). Ngoài bốn dòng đó, mọi chỗ đổi màu đều qua token.
5. Ảnh minh chứng là **ảnh nội bộ nhóm tự chụp**, không dùng ảnh mạng; nếu mockup cần ảnh thì dùng khối placeholder cùng tỷ lệ.
6. Mockup **nộp cả hai nền**: mỗi màn phải vẽ thêm bản nền tối theo bảng "Mực trầm" ở §1, không tự đặt màu mới ngoài bảng token.
