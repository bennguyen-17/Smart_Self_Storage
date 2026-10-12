// Khung Admin Portal: danh sách tab theo prototype/admin_portal.html và chốt của nhóm (Q-14, 12/10):
// Admin giữ Users, Chi nhánh, Audit Logs; tab cấu hình chính sách chuyển sang cổng BOM.
// Mỗi thành viên gắn chức năng bằng cách điền `component`; tab chưa có component hiện ô "Đang phát triển".

import type { ComponentType } from "react"
import { Building2Icon, ScrollTextIcon, UsersIcon, type LucideIcon } from "lucide-react"

import AccountsPanel from "@/features/internal-accounts/components/AccountsPanel"

export type AdminTabKey = "users" | "facilities" | "audit"

export interface AdminTab {
  key: AdminTabKey
  label: string
  icon: LucideIcon
  stories: string
  owner: string
  description: string
  component?: ComponentType
}

export const ADMIN_TABS: readonly AdminTab[] = [
  {
    key: "users",
    label: "Tài khoản & Phân quyền",
    icon: UsersIcon,
    stories: "US-29",
    owner: "Vỹ",
    description: "Tạo tài khoản nội bộ, gán vai trò và cơ sở, khóa / mở khóa.",
    component: AccountsPanel,
  },
  {
    key: "facilities",
    label: "Chi nhánh",
    icon: Building2Icon,
    stories: "chưa gán US",
    owner: "chờ nhóm phân công",
    description: "Danh sách cơ sở, thông tin liên hệ và trạng thái hoạt động của từng chi nhánh.",
  },
  {
    key: "audit",
    label: "Nhật ký hoạt động",
    icon: ScrollTextIcon,
    stories: "US-30",
    owner: "Vy",
    description: "Tra cứu và xuất nhật ký thao tác của toàn hệ thống.",
  },
]

export const DEFAULT_ADMIN_TAB: AdminTabKey = "users"

export function findAdminTab(key: string | null): AdminTab {
  return ADMIN_TABS.find((t) => t.key === key) ?? ADMIN_TABS.find((t) => t.key === DEFAULT_ADMIN_TAB)!
}
