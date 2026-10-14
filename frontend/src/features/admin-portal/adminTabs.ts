// Các trang của Admin Portal, mỗi trang một link riêng /admin/<key> trên navbar.
// Chốt nhóm (Q-14, 12/10): Tài khoản, Chi nhánh, Nhật ký hoạt động; cấu hình chính sách thuộc cổng BOM.
// Từ 14/10 cả cổng Admin thuộc Vỹ (chia việc theo trang). Trang chưa có `component` hiện ô "Đang phát triển".

import type { ComponentType } from "react"
import { Building2Icon, ScrollTextIcon, UsersIcon, type LucideIcon } from "lucide-react"

import AccountsPanel from "@/features/internal-accounts/components/AccountsPanel"

export type AdminTabKey = "users" | "facilities" | "audit"

export interface AdminTab {
  key: AdminTabKey
  /** Tên ngắn trên navbar */
  label: string
  /** Tiêu đề đầy đủ của trang (thẻ h1) */
  title: string
  icon: LucideIcon
  stories: string
  owner: string
  description: string
  component?: ComponentType
}

export const ADMIN_TABS: readonly AdminTab[] = [
  {
    key: "users",
    label: "Tài khoản",
    title: "Tài khoản & phân quyền",
    icon: UsersIcon,
    stories: "US-29",
    owner: "Vỹ",
    description: "Tạo tài khoản nội bộ, gán vai trò và cơ sở, khóa / mở khóa.",
    component: AccountsPanel,
  },
  {
    key: "facilities",
    label: "Chi nhánh",
    title: "Chi nhánh",
    icon: Building2Icon,
    stories: "chưa gán US",
    owner: "Vỹ",
    description: "Danh sách cơ sở, thông tin liên hệ và trạng thái hoạt động của từng chi nhánh.",
  },
  {
    key: "audit",
    label: "Nhật ký hoạt động",
    title: "Nhật ký hoạt động hệ thống",
    icon: ScrollTextIcon,
    stories: "US-30",
    owner: "Vỹ",
    description: "Tra cứu và xuất nhật ký thao tác của toàn hệ thống.",
  },
]

export const DEFAULT_ADMIN_TAB: AdminTabKey = "users"

/** Tìm trang theo key; key lạ hoặc trống thì trả undefined để trang tự chuyển về mặc định */
export function findAdminTab(key: string | null | undefined): AdminTab | undefined {
  return ADMIN_TABS.find((t) => t.key === key)
}
