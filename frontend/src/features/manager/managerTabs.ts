// Các trang của Manager Portal, mỗi trang một link riêng /manager/<key> trên navbar.
// Từ 14/10 cả cổng Manager thuộc Vỹ (chia việc theo trang). Trang chưa có `component` hiện ô "Đang phát triển".

import type { ComponentType } from "react"
import {
  ChartColumnIcon,
  ClipboardListIcon,
  DoorOpenIcon,
  HeadphonesIcon,
  UserCheckIcon,
  UsersRoundIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react"

import CheckoutDebtPanel from "@/features/manager/facility-contracts/components/CheckoutDebtPanel"
import CustomersContractsPanel from "@/features/manager/facility-contracts/components/CustomersContractsPanel"
import FacilityReportPanel from "@/features/manager/facility-report/components/FacilityReportPanel"
import GateLogPanel from "@/features/manager/gate-logs/components/GateLogPanel"
import ShiftsPanel from "@/features/manager/staff-shifts/components/ShiftsPanel"
import UnitManagementPanel from "@/features/manager/unit-management/components/UnitManagementPanel"
import ManagerTicketPanel from "@/features/manager/ticket-escalation/components/ManagerTicketPanel"

export type ManagerTabKey = "units" | "reports" | "customers" | "workflow" | "staff" | "gate-logs" | "tickets"

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
    label: "Ô kho",
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
    hint: "Lấp đầy, doanh thu, SLA",
    icon: ChartColumnIcon,
    stories: "US-33",
    owner: "Vỹ",
    description: "Ô trống, đã thuê, doanh thu, tỷ lệ lấp đầy và các ca quá hạn của cơ sở.",
    component: FacilityReportPanel,
  },
  {
    key: "customers",
    label: "Khách & hợp đồng",
    title: "Khách hàng & hợp đồng",
    hint: "Thời hạn & công nợ",
    icon: UsersRoundIcon,
    stories: "US-24, US-25",
    owner: "Vỹ",
    description: "Theo dõi khách, hợp đồng, thời hạn thuê và tình trạng thanh toán của cơ sở.",
    component: CustomersContractsPanel,
  },
  {
    key: "workflow",
    label: "Trả kho & công nợ",
    title: "Trả kho & công nợ",
    hint: "Quá hạn, trả kho, miễn giảm",
    icon: ClipboardListIcon,
    stories: "US-24, US-25, US-26, US-31",
    owner: "Vỹ",
    description: "Nghiệm thu trả kho, quyết toán cọc, truy thu và duyệt miễn/giảm phí.",
    component: CheckoutDebtPanel,
  },
  {
    key: "staff",
    label: "Phân công",
    title: "Phân công nhân viên",
    hint: "Ai trực ca nào",
    icon: UserCheckIcon,
    stories: "US-32",
    owner: "Vỹ",
    description: "Phân ca và phân công nhân viên hỗ trợ bàn giao, kiểm tra, xử lý sự cố.",
    component: ShiftsPanel,
  },
  {
    key: "gate-logs",
    label: "Nhật ký cổng",
    title: "Nhật ký mở cổng thủ công",
    hint: "Mở bằng Thẻ Master",
    icon: DoorOpenIcon,
    stories: "US-18",
    owner: "Vỹ",
    description: "Xem và lọc nhật ký mở cổng thủ công bằng Thẻ Master của cơ sở (chỉ đọc).",
    component: GateLogPanel,
  },
  {
    key: "tickets",
    label: "Sự cố & Escalation",
    title: "Xử lý sự cố & Ticket quá hạn (Escalation)",
    hint: "Tiếp nhận & xử lý SLA quá hạn",
    icon: HeadphonesIcon,
    stories: "US-22, US-33",
    owner: "Tâm",
    description: "Tiếp nhận và giải quyết trực tiếp các ticket hỗ trợ / sự cố quá hạn 15 phút chưa có nhân viên nhận.",
    component: ManagerTicketPanel,
  },
]

export const DEFAULT_MANAGER_TAB: ManagerTabKey = "units"

/** Tìm trang theo key; key lạ hoặc trống thì trả undefined để trang tự chuyển về mặc định */
export function findManagerTab(key: string | null | undefined): ManagerTab | undefined {
  return MANAGER_TABS.find((t) => t.key === key)
}
