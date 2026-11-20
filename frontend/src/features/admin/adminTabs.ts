import type { ComponentType } from "react"
import { Building2Icon, ContactIcon, ScrollTextIcon, UsersIcon, type LucideIcon } from "lucide-react"

import AuditLogPanel from "@/features/admin/audit-logs/components/AuditLogPanel"
import BranchesPanel from "@/features/admin/branches/components/BranchesPanel"
import AccountsPanel from "@/features/admin/accounts/components/AccountsPanel"
import CustomersPanel from "@/features/admin/customers/components/CustomersPanel"

export type AdminTabKey = "users" | "customers" | "facilities" | "audit"

export interface AdminTab {
  key: AdminTabKey
  label: string
  title: string
  hint: string
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
    hint: "Vai trò & cơ sở",
    icon: UsersIcon,
    stories: "",
    owner: "Vỹ",
    description: "Tạo tài khoản nội bộ, gán vai trò và cơ sở, khóa / mở khóa.",
    component: AccountsPanel,
  },
  {
    key: "customers",
    label: "Khách hàng",
    title: "Tài khoản khách hàng",
    hint: "Tra cứu & mở khóa",
    icon: ContactIcon,
    stories: "",
    owner: "Vỹ",
    description: "Tra cứu tài khoản khách, mở khóa sớm tài khoản bị khóa do nhập sai mật khẩu.",
    component: CustomersPanel,
  },
  {
    key: "facilities",
    label: "Chi nhánh",
    title: "Chi nhánh",
    hint: "Danh sách cơ sở",
    icon: Building2Icon,
    stories: "chưa gán US",
    owner: "Vỹ",
    description: "Danh sách cơ sở, thông tin liên hệ và trạng thái hoạt động của từng chi nhánh.",
    component: BranchesPanel,
  },
  {
    key: "audit",
    label: "Nhật ký hoạt động",
    title: "Nhật ký hoạt động hệ thống",
    hint: "Thao tác toàn hệ thống",
    icon: ScrollTextIcon,
    stories: "",
    owner: "Vỹ",
    description: "Tra cứu và xuất nhật ký thao tác của toàn hệ thống.",
    component: AuditLogPanel,
  },
]

export const DEFAULT_ADMIN_TAB: AdminTabKey = "users"

export function findAdminTab(key: string | null | undefined): AdminTab | undefined {
  return ADMIN_TABS.find((t) => t.key === key)
}
