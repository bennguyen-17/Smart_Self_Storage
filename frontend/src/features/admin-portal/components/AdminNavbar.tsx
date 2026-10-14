import PortalNavbar, { type PortalNavbarProps } from "@/features/internal-shell/components/PortalNavbar"

import { ADMIN_TABS } from "../adminTabs"

const ADMIN_NAV_ITEMS = ADMIN_TABS.map((t) => ({ to: `/admin/${t.key}`, label: t.label, icon: t.icon }))

/** Navbar riêng của cổng Quản trị hệ thống: tài khoản, chi nhánh, nhật ký toàn hệ thống */
function AdminNavbar(props: Omit<PortalNavbarProps, "portalName" | "items">) {
  return <PortalNavbar portalName="Cổng quản trị hệ thống" items={ADMIN_NAV_ITEMS} {...props} />
}

export default AdminNavbar
