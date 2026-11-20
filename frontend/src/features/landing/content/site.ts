// Cấu hình chung của trang landing (thương hiệu, hotline, route, CTA)

export const SITE = {
  brand: "Smart Self Storage",
  title: "Smart Self Storage | Kho tự quản 24/7 tại 7 cơ sở toàn quốc",
  description:
    "Thuê kho tự quản theo ngày hoặc theo tháng tại Hà Nội, TP.HCM, Đà Nẵng và Cần Thơ. Ra vào 24/7 bằng mã PIN, giá niêm yết rõ ràng, đặt kho online.",
} as const

export interface Hotline {
  display: string
  // null nếu chưa có số thật (nút gọi sẽ cuộn xuống FAQ thay vì gọi)
  tel: string | null
}

export const HOTLINE: Hotline = {
  display: "1900 8899",
  tel: "19008899",
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
