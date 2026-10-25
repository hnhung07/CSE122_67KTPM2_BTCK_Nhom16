## 1. Bảng màu (Design Tokens)

### Nhận diện — tone xanh ngọc, chủ đạo do SV1 giữ

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

## 5. Thành phần dùng chung (77 class `.ss-*`)

| Nhóm | Class | Đặc điểm phải vẽ đúng trong mockup |
|---|---|---|
| Khung ứng dụng | `.ss-app` `.ss-sidebar` `.ss-main` `.ss-topbar` `.ss-content` | Sidebar gradient teal-900→800, topbar trắng có viền dưới |
| Điều hướng | `.ss-nav-group` `.ss-nav-link` `.ss-nav-title` `.ss-nav-owner` `.ss-offcanvas-sidebar` | Mục đang chọn: nền teal-700 + chữ trắng + gạch trái 3px teal-300 |
| Thương hiệu | `.ss-brand` `.ss-brand-mark` `.ss-brand-text` `.ss-avatar` `.ss-user-pill` | Avatar 34px bo tròn, nền mint |
| Số liệu | `.ss-kpi` `.ss-kpi-icon` `.ss-kpi-value` `.ss-kpi-label` `.ss-kpi-spark` | Icon trong ô 42px nền teal-100, sparkline SVG |
| Thẻ & khối | `.ss-card-body` `.ss-section-title` `.ss-tile` `.ss-col` `.ss-col-head` `.ss-col-body` | Bo 18px, bóng `--ss-shadow-sm` |
| Bảng | `.ss-table` `.ss-row-title` `.ss-row-meta` `.ss-row-code` | Mã bản ghi font monospace teal-700 |
| Trạng thái | `.ss-badge` `.ss-st-<trạng-thái>` `.ss-lv-<mức>` `.ss-chip` `.ss-overdue` | **Tên class viết liền, giữ dấu**: `.ss-st-Chờxemxét`, `.ss-lv-Nghiêmtrọng` |
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
4. Không dùng `!important` và không viết style inline trong mã production — mockup cũng không mô phỏng hai kiểu đó.
5. Ảnh minh chứng là **ảnh nội bộ nhóm tự chụp**, không dùng ảnh mạng; nếu mockup cần ảnh thì dùng khối placeholder cùng tỷ lệ.
