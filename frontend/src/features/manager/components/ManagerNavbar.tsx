import PortalNavbar, { type PortalNavbarProps } from "@/components/internal/components/PortalNavbar"

import { MANAGER_TABS } from "../managerTabs"

const MANAGER_NAV_ITEMS = MANAGER_TABS.map((t) => ({ to: `/manager/${t.key}`, label: t.label, hint: t.hint, icon: t.icon }))

/** Navbar riêng của cổng Quản lý cơ sở: các trang vận hành tại một cơ sở */
function ManagerNavbar(props: Omit<PortalNavbarProps, "portalName" | "items">) {
  return <PortalNavbar portalName="Cổng quản lý cơ sở" hidePortalNameText items={MANAGER_NAV_ITEMS} {...props} />
}

export default ManagerNavbar
