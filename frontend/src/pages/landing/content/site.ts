// Thông tin chung của landing: sửa ở đây khi có feedback về CTA, hotline, SEO.

export const SITE = {
  brand: "Smart Self Storage",
  title: "Smart Self Storage | Kho tự quản 24/7 tại 7 cơ sở toàn quốc",
  description:
    "Thuê kho tự quản theo ngày hoặc theo tháng tại Hà Nội, TP.HCM, Đà Nẵng và Cần Thơ. Ra vào 24/7 bằng mã PIN, giá niêm yết rõ ràng, đặt kho online.",
} as const

export interface Hotline {
  display: string
  /** null = số giả, chưa gọi được: nút "Gọi tư vấn" chỉ hiện số. Có số thật thì điền dạng "0901234567". */
  tel: string | null
}

export const HOTLINE: Hotline = {
  display: "1900 391 391",
  tel: null,
}

export const ROUTES = {
  book: "/portal",
  login: "/customer_login",
} as const

export const CTA = {
  book: "Đặt kho ngay",
  explore: "Khám phá ngay",
  bookThisSize: "Đặt kho cỡ này",
  call: "Gọi tư vấn",
  callShort: "Gọi",
  login: "Đăng nhập",
} as const
