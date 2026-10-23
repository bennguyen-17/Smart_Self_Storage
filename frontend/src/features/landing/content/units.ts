// Cỡ kho và bảng giá niêm yết & sức chứa thực tế.

export type UnitSize = "S" | "M" | "L" | "XL"

export interface CapacityHighlight {
  icon: "box" | "luggage" | "items"
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
  tag?: string
  image: string
  equivalent: string
  capacityHighlights: CapacityHighlight[]
  idealFor: string
  fits: string
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
    tag: "Tiết kiệm nhất",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
    equivalent: "Cốp xe SUV lớn hoặc tủ đồ âm tường",
    capacityHighlights: [
      { icon: "box", label: "8 – 10 thùng carton tiêu chuẩn" },
      { icon: "luggage", label: "2 – 3 vali du lịch cỡ lớn" },
      { icon: "items", label: "Túi golf, đồ cắm trại, 15–20 tệp hồ sơ" },
    ],
    idealFor: "Cá nhân gửi đồ du học, dân văn phòng, đồ thể thao theo mùa.",
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
    tag: "Phổ biến nhất ⭐",
    image: "/images/personal-storage-boxes.jpg",
    equivalent: "1 phòng trọ sinh viên hoặc xe tải 500kg",
    capacityHighlights: [
      { icon: "box", label: "15 – 20 thùng carton tiêu chuẩn" },
      { icon: "luggage", label: "4 – 6 vali du lịch" },
      { icon: "items", label: "Nệm đơn, bàn làm việc, tủ lạnh mini & 1 xe máy" },
    ],
    idealFor: "Sinh viên nghỉ hè, người độc thân đổi nhà trọ, căn hộ studio.",
    fits: "Đồ phòng trọ hoặc căn hộ studio: nệm, tủ lạnh nhỏ, 15–20 thùng.",
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
    tag: "Hợp chuyển nhà",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    equivalent: "Căn hộ 1–2 phòng ngủ hoặc xe tải 1.5 tấn",
    capacityHighlights: [
      { icon: "box", label: "30 – 40 thùng carton tiêu chuẩn" },
      { icon: "luggage", label: "8 – 10 vali du lịch" },
      { icon: "items", label: "Sofa văng, giường đôi, tủ lạnh 2 cánh, máy giặt" },
    ],
    idealFor: "Hộ gia đình sửa nhà, chuyển chung cư mới, giữ nội thất.",
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
    tag: "Kho lớn đa năng",
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80",
    equivalent: "Nhà phố 3 tầng hoặc xe tải 2.5–3.5 tấn",
    capacityHighlights: [
      { icon: "box", label: "60 – 80 thùng carton tiêu chuẩn" },
      { icon: "luggage", label: "15+ vali du lịch lớn" },
      { icon: "items", label: "4–6 bộ bàn ghế văn phòng, 4–6 kệ pallet hàng" },
    ],
    idealFor: "Shop online, doanh nghiệp lưu kho mẫu/tài liệu, homestay.",
    fits: "Nội thất nhà 3 phòng ngủ, hàng hóa bán online, đồ homestay.",
  },
]

/** Kho mát 22–25°C cộng thêm 20% đơn giá. */
export const CLIMATE_SURCHARGE = 0.2

export const PRICING_NOTES = [
  "Thuê tối thiểu 7 ngày. Từ 7 đến 29 ngày tính theo đơn giá ngày.",
  "Chiết khấu thanh toán dài hạn: Gói 3 tháng giảm 5%, gói 6 tháng giảm 10%, gói 12 tháng giảm 15%.",
  "Kho mát kiểm soát nhiệt độ 22–25°C & độ ẩm: Phụ thu 20% đơn giá niêm yết.",
  "Toàn bộ ô kho có trần cao 2.0m tiêu chuẩn, trang bị khóa mã PIN riêng biệt ra vào 24/7.",
] as const
