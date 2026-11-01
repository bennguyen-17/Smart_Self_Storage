// Các trang của Manager Portal, mỗi trang một link riêng /manager/<key> trên navbar.
// Từ 14/10 cả cổng Manager thuộc Vỹ (chia việc theo trang). Trang chưa có `component` hiện ô "Đang phát triển".

import type { ComponentType } from "react"
import {
  ActivityIcon,
  BanknoteIcon,
  ChartColumnIcon,
  DoorOpenIcon,
  HeadphonesIcon,
  UserCheckIcon,
  UsersRoundIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react"

import CustomersContractsPanel from "@/features/manager/contracts/components/CustomersContractsPanel"
import FacilityReportPanel from "@/features/manager/reports/components/FacilityReportPanel"
import GateLogPanel from "@/features/manager/gate-logs/components/GateLogPanel"
import RefundsPanel from "@/features/manager/refunds/components/RefundsPanel"
import ShiftsPanel from "@/features/manager/shifts/components/ShiftsPanel"
import UnitManagementPanel from "@/features/manager/units/components/UnitManagementPanel"
import ManagerTicketPanel from "@/features/manager/tickets/components/ManagerTicketPanel"
import StaffActivityPanel from "@/features/manager/activity/components/StaffActivityPanel"

export type ManagerTabKey =
  | "units"
  | "reports"
  | "customers"
  | "refunds"
  | "staff"
  | "activity"
  | "gate-logs"
  | "tickets"

export interface ManagerTab {
  key: ManagerTabKey
  /** Tên ngắn trên navbar */
  label: string
  /** Tiêu đề đầy đủ của trang (thẻ h1) */
  title: string
  /** Mô tả ngắn dưới tên trang trên thanh điều hướng dọc */
  hint: string
  icon: LucideIcon
  /** User story và người phụ trách chức năng của trang */
  stories: string
  owner: string
  description: string
  component?: ComponentType
}

export const MANAGER_TABS: readonly ManagerTab[] = [
  {
    key: "units",
    label: "Quản lý ô kho",
    title: "Quản lý ô kho",
    hint: "Loại kho & bảo trì",
    icon: WarehouseIcon,
    stories: "US-13, US-14",
    owner: "Vỹ",
    description: "Đổi loại kho, đưa ô vào bảo trì; giá theo bảng giá hệ thống.",
    component: UnitManagementPanel,
  },
  {
    key: "reports",
    label: "Báo cáo",
    title: "Báo cáo cơ sở & KPI",
    hint: "Tỉ lệ lấp đầy, doanh thu",
    icon: ChartColumnIcon,
    stories: "US-33",
    owner: "Vỹ",
    description: "Ô trống, đã thuê, doanh thu, tỷ lệ lấp đầy và các ca quá hạn của cơ sở.",
    component: FacilityReportPanel,
  },
  {
    key: "customers",
    label: "Quản lí hợp đồng",
    title: "Khách hàng & hợp đồng",
    hint: "Thời hạn, tình trạng",
    icon: UsersRoundIcon,
    stories: "US-24, US-25",
    owner: "Vỹ",
    description: "Theo dõi khách, hợp đồng, thời hạn thuê và tình trạng thanh toán của cơ sở.",
    component: CustomersContractsPanel,
  },
  {
    key: "refunds",
    label: "Hoàn tiền",
    title: "Hoàn tiền cho khách hàng",
    hint: "Hoàn cọc hoặc tiền thừa",
    icon: BanknoteIcon,
    stories: "US-26",
    owner: "Vỹ",
    description: "Phiếu hoàn cọc / hoàn tiền thừa: Manager chuyển khoản, đính kèm biên lai và xác nhận.",
    component: RefundsPanel,
  },
  {
    key: "staff",
    label: "Phân công",
    title: "Phân công nhân viên",
    hint: "Phân công trực ca ",
    icon: UserCheckIcon,
    stories: "US-32",
    owner: "Vỹ",
    description: "Xếp người trực từng ca; nhân viên trong ca xử lý mọi việc của cơ sở.",
    component: ShiftsPanel,
  },
  {
    key: "activity",
    label: "Hoạt động nhân viên",
    title: "Hoạt động nhân viên & nhật ký cơ sở",
    hint: "Vào ca, việc đã làm, nhật ký",
    icon: ActivityIcon,
    stories: "US-30, US-32",
    owner: "Vỹ",
    description: "Theo từng ca: ai đã vào ca, làm được bao nhiêu việc; nhật ký thao tác nội bộ của cơ sở.",
    component: StaffActivityPanel,
  },
  {
    key: "gate-logs",
    label: "Nhật ký cổng",
    title: "Nhật ký kiểm soát ra vào cổng",
    hint: "Nhật ký kiểm soát cổng",
    icon: DoorOpenIcon,
    stories: "US-18",
    owner: "Vỹ",
    description: "Xem và lọc lịch sử người ra vào cổng bằng Mã PIN động IoT 24/7 và Thẻ Master thủ công của cơ sở.",
    component: GateLogPanel,
  },
  {
    key: "tickets",
    label: "Sự cố cơ sở",
    title: "Theo dõi sự cố cơ sở",
    hint: "Giám sát & xử lý ticket",
    icon: HeadphonesIcon,
    stories: "US-22, US-33",
    owner: "Tâm",
    description: "Theo dõi ticket của khách: ai phụ trách, đang ở bước nào. Nhân viên trong ca tiếp nhận và giải quyết.",
    component: ManagerTicketPanel,
  },
]

export const DEFAULT_MANAGER_TAB: ManagerTabKey = "units"

export function findManagerTab(key: string | null | undefined): ManagerTab | undefined {
  return MANAGER_TABS.find((t) => t.key === key)
}
