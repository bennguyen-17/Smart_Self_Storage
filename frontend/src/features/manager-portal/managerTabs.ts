// Các trang của Manager Portal, mỗi trang một link riêng /manager/<key> trên navbar.
// Từ 14/10 cả cổng Manager thuộc Vỹ (chia việc theo trang). Trang chưa có `component` hiện ô "Đang phát triển".

import type { ComponentType } from "react"
import {
  ChartColumnIcon,
  ClipboardListIcon,
  DoorOpenIcon,
  UserCheckIcon,
  UsersRoundIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react"

import GateLogPanel from "@/features/gate-logs/components/GateLogPanel"
import UnitManagementPanel from "@/features/unit-management/components/UnitManagementPanel"

export type ManagerTabKey = "units" | "reports" | "customers" | "workflow" | "staff" | "gate-logs"

export interface ManagerTab {
  key: ManagerTabKey
  /** Tên ngắn trên navbar */
  label: string
  /** Tiêu đề đầy đủ của trang (thẻ h1) */
  title: string
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
    icon: ChartColumnIcon,
    stories: "US-33",
    owner: "Vỹ",
    description: "Ô trống, đã thuê, doanh thu, tỷ lệ lấp đầy và các ca quá hạn của cơ sở.",
  },
  {
    key: "customers",
    label: "Khách & hợp đồng",
    title: "Khách hàng & hợp đồng",
    icon: UsersRoundIcon,
    stories: "US-24, US-25",
    owner: "Vỹ",
    description: "Theo dõi khách, hợp đồng, thời hạn thuê và tình trạng thanh toán của cơ sở.",
  },
  {
    key: "workflow",
    label: "Trả kho & công nợ",
    title: "Trả kho & công nợ",
    icon: ClipboardListIcon,
    stories: "US-24, US-25, US-26, US-31",
    owner: "Vỹ",
    description: "Nghiệm thu trả kho, quyết toán cọc, truy thu và duyệt miễn/giảm phí.",
  },
  {
    key: "staff",
    label: "Phân công",
    title: "Phân công nhân viên",
    icon: UserCheckIcon,
    stories: "US-32",
    owner: "Vỹ",
    description: "Phân ca và phân công nhân viên hỗ trợ bàn giao, kiểm tra, xử lý sự cố.",
  },
  {
    key: "gate-logs",
    label: "Nhật ký cổng",
    title: "Nhật ký mở cổng thủ công",
    icon: DoorOpenIcon,
    stories: "US-18",
    owner: "Vỹ",
    description: "Xem và lọc nhật ký mở cổng thủ công bằng Thẻ Master của cơ sở (chỉ đọc).",
    component: GateLogPanel,
  },
]

export const DEFAULT_MANAGER_TAB: ManagerTabKey = "units"

/** Tìm trang theo key; key lạ hoặc trống thì trả undefined để trang tự chuyển về mặc định */
export function findManagerTab(key: string | null | undefined): ManagerTab | undefined {
  return MANAGER_TABS.find((t) => t.key === key)
}
