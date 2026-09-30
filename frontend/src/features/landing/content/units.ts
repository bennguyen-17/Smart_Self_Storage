// Cỡ kho và bảng giá theo Business Rule BR-09 (docs/Business Rule.pdf).
// Khi BE có API giá, thay mảng này bằng dữ liệu từ API.

export type UnitSize = "S" | "M" | "L" | "XL"

export interface LandingUnit {
  size: UnitSize
  name: string
  dimensions: string
  areaM2: number
  volumeM3: number
  pricePerDay: number
  pricePerMonth: number
  deposit: number
  fits: string
  tag?: string
}

export const UNITS: readonly LandingUnit[] = [
  {
    size: "S",
    name: "Tủ cá nhân",
    dimensions: "1.0 × 1.0 × 2.0 m",
    areaM2: 1,
    volumeM3: 2,
    pricePerDay: 30_000,
    pricePerMonth: 600_000,
    deposit: 500_000,
    fits: "Vali, túi golf, giấy tờ, 8–10 thùng carton nhỏ.",
  },
  {
    size: "M",
    name: "Phòng vừa",
    dimensions: "1.5 × 2.0 × 2.0 m",
    areaM2: 3,
    volumeM3: 6,
    pricePerDay: 60_000,
    pricePerMonth: 1_200_000,
    deposit: 1_000_000,
    fits: "Đồ phòng trọ hoặc căn hộ studio: nệm, tủ lạnh nhỏ, 15–20 thùng.",
    tag: "Hợp chuyển nhà",
  },
  {
    size: "L",
    name: "Phòng lớn",
    dimensions: "2.0 × 3.0 × 2.0 m",
    areaM2: 6,
    volumeM3: 12,
    pricePerDay: 120_000,
    pricePerMonth: 2_400_000,
    deposit: 2_000_000,
    fits: "Nội thất căn hộ 1–2 phòng ngủ: sofa, giường, tủ, bàn ăn.",
  },
  {
    size: "XL",
    name: "Kho doanh nghiệp",
    dimensions: "2.5 × 4.0 × 2.0 m",
    areaM2: 10,
    volumeM3: 20,
    pricePerDay: 200_000,
    pricePerMonth: 4_000_000,
    deposit: 3_000_000,
    fits: "Nội thất nhà 3 phòng ngủ, hàng hóa bán online, đồ homestay.",
  },
]

/** Kho mát 22–25°C cộng thêm 20% đơn giá. */
export const CLIMATE_SURCHARGE = 0.2

export const PRICING_NOTES = [
  "Thuê tối thiểu 7 ngày. Từ 7 đến 29 ngày tính theo giá ngày.",
  "Gói 3 tháng giảm 5%, 6 tháng giảm 10%, 12 tháng giảm 15%.",
  "Kho mát điều hòa 22–25°C (sẵn sàng tại tất cả cơ sở) cộng thêm 20% đơn giá.",
] as const
