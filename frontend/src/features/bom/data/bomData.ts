export interface FacilityPerformance {
  id: string | number
  code: string
  name: string
  address: string
  managerName: string
  managerEmail: string
  managerPhone?: string
  totalUnits: number
  rentedUnits: number
  occupied?: number
  available?: number
  maintenance?: number
  floorArea: number
  monthlyRevenue: number | string
  overdueUnits: number
  occupancyRate?: number
  priceMultiplier?: number
  note?: string
  status: string
  rating: string
}

export interface UnitPricing {
  id: string
  size: "S" | "M" | "L" | "XL"
  name: string
  description: string
  dimensions: string
  area: string
  normPrice: number
  acPrice: number
  depositText: string
  status: string
}

export interface SurchargeItem {
  id: string
  category: "surcharge" | "penalty" | "discount"
  categoryLabel: string
  type: string
  name: string
  rate: string
  isActive: boolean
  note: string
}

export interface SystemReportRow {
  code: string
  name: string
  address: string
  sizeDetail: string
  typeDetail: string
  totalUnits: number
  rentedUnits: number
  occupancyRate: string
  vacantUnits: number
  overdueUnits: number
  rentalRevenue: number
  depositRevenue: number
  netRevenue: number
  performanceBadge: string
}

export const INITIAL_FACILITIES: FacilityPerformance[] = [
  {
    id: "CS-Q1",
    code: "CS-Q1",
    name: "SelfStorage Trụ Sở Quận 1",
    address: "123 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM",
    managerName: "Nguyễn Văn Manager A",
    managerEmail: "mgr.q1@selfstorage.vn",
    totalUnits: 350,
    rentedUnits: 330,
    floorArea: 1800,
    monthlyRevenue: 620000000,
    overdueUnits: 0,
    status: "Đang Hoạt Động IoT 100% Online",
    rating: "★★★★★ Xuất sắc",
  },
  {
    id: "CS-Q7",
    code: "CS-Q7",
    name: "SelfStorage Nam Sài Gòn Q.7",
    address: "456 Nguyễn Thị Thập, Q.7, TP.HCM",
    managerName: "Trần Thị Manager B",
    managerEmail: "mgr.q7@selfstorage.vn",
    totalUnits: 300,
    rentedUnits: 261,
    floorArea: 1500,
    monthlyRevenue: 480000000,
    overdueUnits: 5,
    status: "Đang Hoạt Động IoT 100% Online",
    rating: "★★★★☆ Tốt",
  },
  {
    id: "CS-TD",
    code: "CS-TD",
    name: "SelfStorage Khu Công Nghệ TP. Thủ Đức",
    address: "789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM",
    managerName: "Lê Văn Manager C",
    managerEmail: "mgr.thuduc@selfstorage.vn",
    totalUnits: 400,
    rentedUnits: 342,
    floorArea: 2200,
    monthlyRevenue: 520000000,
    overdueUnits: 4,
    status: "Đang Hoạt Động IoT 100% Online",
    rating: "★★★★☆ Tốt",
  },
  {
    id: "CS-TB",
    code: "CS-TB",
    name: "SelfStorage Sân Bay Tân Bình",
    address: "102 Truong Son, P.2, Q. Tân Bình, TP.HCM",
    managerName: "Phạm Minh Manager D",
    managerEmail: "mgr.tanbinh@selfstorage.vn",
    totalUnits: 190,
    rentedUnits: 165,
    floorArea: 1100,
    monthlyRevenue: 230000000,
    overdueUnits: 3,
    status: "Đang Hoạt Động IoT 100% Online",
    rating: "★★★☆☆ Cần đẩy mạnh",
  },
]

export const INITIAL_PRICING: UnitPricing[] = [
  {
    id: "size-s",
    size: "S",
    name: "Size S (Mini Storage)",
    description: "Dành cho đồ đạc nhỏ, tài liệu hồ sơ",
    dimensions: "1.2m x 1.5m",
    area: "1.8m²",
    normPrice: 850000,
    acPrice: 1150000,
    depositText: "1 Tháng Tiền Thuê",
    status: "Đang áp dụng",
  },
  {
    id: "size-m",
    size: "M",
    name: "Size M (Medium Box)",
    description: "Đồ đạc gia đình nhỏ, xe máy, vali",
    dimensions: "2.0m x 2.5m",
    area: "5.0m²",
    normPrice: 1750000,
    acPrice: 2250000,
    depositText: "1 Tháng Tiền Thuê",
    status: "Đang áp dụng",
  },
  {
    id: "size-l",
    size: "L",
    name: "Size L (Large Space)",
    description: "Kho hàng shop online, căn hộ 2-3 phòng",
    dimensions: "3.0m x 4.0m",
    area: "12.0m²",
    normPrice: 3600000,
    acPrice: 4500000,
    depositText: "1 Tháng Tiền Thuê",
    status: "Đang áp dụng",
  },
  {
    id: "size-xl",
    size: "XL",
    name: "Size XL (Enterprise Hall)",
    description: "Kho chứa thiết bị doanh nghiệp, máy móc",
    dimensions: "5.0m x 6.0m",
    area: "30.0m²",
    normPrice: 8500000,
    acPrice: 10800000,
    depositText: "2 Tháng Tiền Thuê",
    status: "Đang áp dụng",
  },
]

export const INITIAL_SURCHARGES: SurchargeItem[] = [
  {
    id: "sc-1",
    category: "surcharge",
    categoryLabel: "Biểu Phí Phụ Thu (Surcharges)",
    type: "Dịch vụ bổ sung 24/7",
    name: "Phí Điện Kho Lạnh 24/7",
    rate: "₫300,000 / tháng",
    isActive: true,
    note: "Áp dụng cho kho điều hòa nhiệt độ AC",
  },
  {
    id: "sc-2",
    category: "surcharge",
    categoryLabel: "Biểu Phí Phụ Thu (Surcharges)",
    type: "Dịch vụ bốc xếp",
    name: "Phí Hỗ Trợ Bốc Xếp",
    rate: "₫150,000 / giờ",
    isActive: true,
    note: "Theo yêu cầu nhân công thực tế",
  },
  {
    id: "sc-3",
    category: "surcharge",
    categoryLabel: "Biểu Phí Phụ Thu (Surcharges)",
    type: "Quản lý thiết bị PIN",
    name: "Phí Cấp Lại Mã PIN Thẻ Từ",
    rate: "₫50,000 / lần",
    isActive: true,
    note: "Khi người dùng làm mất/reset mã PIN",
  },
  {
    id: "pn-1",
    category: "penalty",
    categoryLabel: "Phí Phạt Quá Hạn (Penalties & Overdue Fees)",
    type: "Quá hạn thanh toán",
    name: "Mức Phạt Theo Ngày Quá Hạn",
    rate: "1.5% / ngày trễ",
    isActive: true,
    note: "Tính từ ngày thứ 4 quá hạn (Sau Grace Period 3 ngày)",
  },
  {
    id: "pn-2",
    category: "penalty",
    categoryLabel: "Phí Phạt Quá Hạn (Penalties & Overdue Fees)",
    type: "Mở phong tỏa PIN",
    name: "Phí Mở Phong Tỏa PIN Động",
    rate: "₫100,000 / lần",
    isActive: true,
    note: "Tự động khóa sau 7 ngày trễ cước",
  },
  {
    id: "pn-3",
    category: "penalty",
    categoryLabel: "Phí Phạt Quá Hạn (Penalties & Overdue Fees)",
    type: "Kiểm kê xử lý kho",
    name: "Phí Kiểm Kê Niêm Phong Tài Sản",
    rate: "₫500,000 / vụ",
    isActive: true,
    note: "Khi xử lý thanh lý kho quá hạn (BR-21)",
  },
  {
    id: "dc-1",
    category: "discount",
    categoryLabel: "Chính Sách Miễn Giảm Giá (Discount Policy & Waivers)",
    type: "Khuyến mãi dài hạn",
    name: "Ưu Đãi Thuê Khách Hàng 6 Tháng",
    rate: "Giảm 10% Tổng Đơn",
    isActive: true,
    note: "Trừ trực tiếp vào tổng bill hợp đồng 6 tháng",
  },
  {
    id: "dc-2",
    category: "discount",
    categoryLabel: "Chính Sách Miễn Giảm Giá (Discount Policy & Waivers)",
    type: "Khuyến mãi dài hạn",
    name: "Ưu Đãi Thuê Khách Hàng 12 Tháng",
    rate: "Giảm 15% + Miễn Cọc",
    isActive: true,
    note: "Trừ 15% bill + không thu tiền cọc 1 tháng",
  },
  {
    id: "dc-3",
    category: "discount",
    categoryLabel: "Chính Sách Miễn Giảm Giá (Discount Policy & Waivers)",
    type: "Phân quyền chi nhánh",
    name: "Hạn Mức Duyệt Giảm Giá Manager",
    rate: "Tối đa 10% / đơn",
    isActive: true,
    note: "Vượt hạn mức cần BOM phê duyệt",
  },
]

export const INITIAL_SYSTEM_REPORTS: SystemReportRow[] = [
  {
    code: "CS-Q1",
    name: "SelfStorage Trụ Sở Quận 1",
    address: "123 Nguyễn Huệ, Q.1",
    sizeDetail: "Size M & Size L",
    typeDetail: "Kho Thường & Điều Hòa AC",
    totalUnits: 350,
    rentedUnits: 330,
    occupancyRate: "94.2%",
    vacantUnits: 20,
    overdueUnits: 0,
    rentalRevenue: 540000000,
    depositRevenue: 620000000,
    netRevenue: 620000000,
    performanceBadge: "★★★★★ Xuất sắc",
  },
  {
    code: "CS-Q7",
    name: "SelfStorage Nam Sài Gòn Q.7",
    address: "456 Nguyễn Thị Thập, Q.7",
    sizeDetail: "Size S & Size L",
    typeDetail: "Kho Điều Hòa AC (22-24°C)",
    totalUnits: 300,
    rentedUnits: 261,
    occupancyRate: "87.0%",
    vacantUnits: 34,
    overdueUnits: 5,
    rentalRevenue: 430000000,
    depositRevenue: 480000000,
    netRevenue: 480000000,
    performanceBadge: "★★★★☆ Tốt",
  },
  {
    code: "CS-TD",
    name: "SelfStorage TP. Thủ Đức",
    address: "789 Xa Lộ Hà Nội, TP. Thủ Đức",
    sizeDetail: "Size L & Size XL",
    typeDetail: "Enterprise Storage Space",
    totalUnits: 400,
    rentedUnits: 342,
    occupancyRate: "85.5%",
    vacantUnits: 54,
    overdueUnits: 4,
    rentalRevenue: 470000000,
    depositRevenue: 520000000,
    netRevenue: 520000000,
    performanceBadge: "★★★★☆ Tốt",
  },
  {
    code: "CS-TB",
    name: "SelfStorage Sân Bay Tân Bình",
    address: "102 Truong Son, Q. Tân Bình",
    sizeDetail: "Size S & Size M",
    typeDetail: "Mini Box & Warehouse",
    totalUnits: 190,
    rentedUnits: 165,
    occupancyRate: "86.8%",
    vacantUnits: 22,
    overdueUnits: 3,
    rentalRevenue: 210000000,
    depositRevenue: 230000000,
    netRevenue: 230000000,
    performanceBadge: "★★★☆☆ Cần đẩy mạnh",
  },
]
