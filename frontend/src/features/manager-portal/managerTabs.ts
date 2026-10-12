// Khung Manager Portal: danh sách tab theo prototype/manager_portal.html.
// Mỗi thành viên gắn chức năng của mình bằng cách điền `component` cho tab tương ứng,
// không cần sửa layout. Tab chưa có component sẽ hiện ô "Đang phát triển".

import type { ComponentType } from "react"
import {
  ChartColumnIcon,
  ClipboardListIcon,
  UserCheckIcon,
  UsersRoundIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react"

import UnitManagementPanel from "@/features/unit-management/components/UnitManagementPanel"

export type ManagerTabKey = "reports" | "units" | "customers" | "workflow" | "staff"

export interface ManagerTab {
  key: ManagerTabKey
  label: string
  icon: LucideIcon
  /** User story và người phụ trách chức năng của tab */
  stories: string
  owner: string
  description: string
  component?: ComponentType
}

export const MANAGER_TABS: readonly ManagerTab[] = [
  {
    key: "reports",
    label: "Báo cáo Cơ sở & KPI",
    icon: ChartColumnIcon,
    stories: "US-33",
    owner: "Tâm",
    description: "Ô trống, đã thuê, doanh thu, tỷ lệ lấp đầy và các ca quá hạn của cơ sở.",
  },
  {
    key: "units",
    label: "Quản lý Kho & Bảng giá",
    icon: WarehouseIcon,
    stories: "US-13, US-14",
    owner: "Vỹ",
    description: "Đổi loại kho, đưa ô vào bảo trì; xem giá theo bảng giá hệ thống.",
    component: UnitManagementPanel,
  },
  {
    key: "customers",
    label: "Giám sát Khách & HĐ",
    icon: UsersRoundIcon,
    stories: "US-24, US-25",
    owner: "Tâm, Vy",
    description: "Theo dõi khách, hợp đồng, thời hạn thuê và tình trạng thanh toán của cơ sở.",
  },
  {
    key: "workflow",
    label: "QTrình Trả kho & Nợ",
    icon: ClipboardListIcon,
    stories: "US-24, US-25, US-26, US-31",
    owner: "Tâm, Vy, Vỹ",
    description: "Nghiệm thu trả kho, quyết toán cọc, truy thu và duyệt miễn/giảm phí.",
  },
  {
    key: "staff",
    label: "Phân công Staff",
    icon: UserCheckIcon,
    stories: "US-32",
    owner: "Vy",
    description: "Phân ca và phân công nhân viên hỗ trợ bàn giao, kiểm tra, xử lý sự cố.",
  },
]

export const DEFAULT_MANAGER_TAB: ManagerTabKey = "units"

export function findManagerTab(key: string | null): ManagerTab {
  return (
    MANAGER_TABS.find((t) => t.key === key) ??
    MANAGER_TABS.find((t) => t.key === DEFAULT_MANAGER_TAB)!
  )
}
