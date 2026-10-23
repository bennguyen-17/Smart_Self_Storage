// Cỡ kho và bảng giá niêm yết & sức chứa thực tế.

export type UnitSize = "S" | "M" | "L" | "XL"

export interface CapacityHighlight {
  label: string
}

export interface LandingUnit {
  size: UnitSize
  name: string
  dimensions: string
  areaM2: number
  volumeM3: number
  pricePerDay: number
  pricePerMonth: number
  deposit: number
  image: string
  capacityHighlights: CapacityHighlight[]
  idealFor: string
}

export const UNITS: readonly LandingUnit[] = [
  {
    size: "S",
    name: "Tủ cá nhân",
    dimensions: "1.0m × 1.0m × 2.0m",
    areaM2: 1,
    volumeM3: 2,
    pricePerDay: 30_000,
    pricePerMonth: 600_000,
    deposit: 500_000,
    image: "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=800&q=80",
    capacityHighlights: [
      { label: "8 – 10 thùng carton tiêu chuẩn" },
      { label: "2 – 3 vali du lịch cỡ lớn" },
      { label: "Túi golf, quạt máy, hồ sơ tài liệu" },
    ],
    idealFor: "Cá nhân gửi đồ du học, đồ mùa vụ, tài liệu sổ sách.",
  },
  {
    size: "M",
    name: "Phòng vừa",
    dimensions: "1.5m × 2.0m × 2.0m",
    areaM2: 3,
    volumeM3: 6,
    pricePerDay: 60_000,
    pricePerMonth: 1_200_000,
    deposit: 1_000_000,
    image: "/images/personal-storage-boxes.jpg",
    capacityHighlights: [
      { label: "15 – 20 thùng carton tiêu chuẩn" },
      { label: "4 – 6 vali du lịch đồ đạc" },
      { label: "Nệm đơn, bàn làm việc, tủ lạnh mini" },
    ],
    idealFor: "Sinh viên đổi trọ, người độc thân, phòng studio.",
  },
  {
    size: "L",
    name: "Phòng lớn",
    dimensions: "2.0m × 3.0m × 2.0m",
    areaM2: 6,
    volumeM3: 12,
    pricePerDay: 120_000,
    pricePerMonth: 2_400_000,
    deposit: 2_000_000,
    image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80",
    capacityHighlights: [
      { label: "30 – 40 thùng carton tiêu chuẩn" },
      { label: "Giường, nệm, sofa, máy giặt, tủ lạnh" },
      { label: "Đồ nội thất gia đình chuyển dọn nhà" },
    ],
    idealFor: "Hộ gia đình sửa nhà, chuyển chung cư 1–2 phòng ngủ.",
  },
  {
    size: "XL",
    name: "Kho doanh nghiệp",
    dimensions: "2.5m × 4.0m × 2.0m",
    areaM2: 10,
    volumeM3: 20,
    pricePerDay: 200_000,
    pricePerMonth: 4_000_000,
    deposit: 3_000_000,
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    capacityHighlights: [
      { label: "60 – 80 thùng carton tiêu chuẩn" },
      { label: "Bàn ghế văn phòng, kệ pallet hàng" },
      { label: "Hàng hóa kinh doanh hoặc nội thất lớn" },
    ],
    idealFor: "Shop online, doanh nghiệp lưu kho hàng & hồ sơ lớn.",
  },
]

/** Kho mát 22–25°C cộng thêm 20% đơn giá. */
export const CLIMATE_SURCHARGE = 0.2
