# Landing page (`/`)

Trang chủ public của Smart Self Storage. Người phụ trách: Vỹ.

## Muốn đổi… → sửa ở…

| Muốn đổi                                                   | Sửa file                                                 | Ghi chú                                                                                                                                                     |
| ---------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chữ trên trang (tiêu đề, mô tả, FAQ, đánh giá, tình huống) | `content/copy.ts`                                        | Không viết chữ trong component                                                                                                                              |
| Hotline                                                    | `content/site.ts` → `HOTLINE`                            | `tel: null` = số giả, nút chỉ hiện số. Điền số thật (vd. `"0901234567"`) thì mọi nút "Gọi" tự thành link `tel:`                                             |
| Nút CTA (chữ, trang đích)                                  | `content/site.ts` → `CTA`, `ROUTES`                      |                                                                                                                                                             |
| Tiêu đề tab trình duyệt, mô tả SEO                         | `content/site.ts` → `SITE`                               |                                                                                                                                                             |
| Giá, kích thước, cọc của cỡ S/M/L/XL                       | `content/units.ts`                                       | Đang theo BR-09. Khi có API giá thì thay mảng `UNITS`                                                                                                       |
| Danh sách cơ sở                                            | `content/facilities.ts`                                  | Chỉ ghi thông tin public                                                                                                                                    |
| Thứ tự section, ẩn/hiện section                            | `content/sections.ts`                                    | Đổi thứ tự mảng; `enabled: false` để ẩn (nav cũng tự ẩn). Nút "Tính thử" tự ẩn khi tắt bộ ước tính; nút "Gọi" (khi chưa có số thật) chỉ hiện số khi tắt FAQ |
| Có cần nhãn "Đánh giá minh họa"                            | `content/copy.ts` → `TESTIMONIALS_SECTION.illustrative`  | Đổi thành `false` khi đã có đánh giá thật                                                                                                                   |
| Ngưỡng gợi ý cỡ kho                                        | `lib/estimate.ts` (dựa trên `volumeM3` trong `units.ts`) |                                                                                                                                                             |
| Tốc độ, độ dịch của hiệu ứng                               | `motion/presets.ts`                                      | `DURATION`, `REVEAL`, `STAGGER`                                                                                                                             |
| Tắt toàn bộ hiệu ứng                                       | `motion/presets.ts` → `MOTION_ENABLED = false`           | Nội dung vẫn hiện đủ                                                                                                                                        |
| Màu, bo góc, khoảng cách giữa section                      | `landing.css`                                            | Biến `--l-*`, chỉ có tác dụng trong landing                                                                                                                 |
| Ảnh hero, ảnh "Chuyển nhà"                                 | `content/copy.ts` → `HERO.image`, `USE_CASES[0].image`   | Ảnh Unsplash; mở thử link trước khi đổi                                                                                                                     |

## Nhận góp ý trực tiếp trên trang

1. Ở máy demo, thêm `VITE_ENABLE_AGENTATION=true` vào `frontend/.env.local` rồi chạy `npm run dev`.
2. Người góp ý bấm vào phần tử trên trang và ghi chú (công cụ Agentation có sẵn trong App).
3. Gửi ghi chú cho người phụ trách landing để xử lý.

Không bật Agentation khi deploy thật.

## Quy tắc khi sửa

- Trang public không link tới cổng nội bộ (`/staff/*`, admin, manager), file preview hay route chưa hoàn thiện.
- Không nêu tên đối tác, chứng chỉ hay số liệu chưa kiểm chứng.
- Chữ thường trên nền xanh phải dùng `--l-cta` (đạt AA), không dùng `--primary`.
