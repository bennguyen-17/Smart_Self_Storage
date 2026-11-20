import { useLocation } from "react-router-dom"

import PortalNavbar, { type PortalNavbarProps } from "@/components/internal/components/PortalNavbar"

import { MANAGER_TABS } from "../managerTabs"
import { badgeText, type UnreadTab } from "../unread/unreadRules"
import { useUnreadCounts } from "../unread/useUnreadCounts"

function ManagerNavbar(props: Omit<PortalNavbarProps, "portalName" | "items">) {
  const activeTab = useLocation().pathname.split("/")[2]
  const counts = useUnreadCounts(activeTab)
  const items = MANAGER_TABS.map((t) => ({
    to: `/manager/${t.key}`,
    label: t.label,
    hint: t.hint,
    icon: t.icon,
    badge: badgeText(counts[t.key as UnreadTab] ?? 0),
  }))
  return <PortalNavbar portalName="Cổng quản lý cơ sở" hidePortalNameText items={items} {...props} />
}

export default ManagerNavbar
