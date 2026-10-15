import { HammerIcon } from "lucide-react"

import type { ManagerTab } from "../managerTabs"

export type PortalTabInfo = Pick<ManagerTab, "label" | "icon" | "stories" | "owner" | "description">

function TabPlaceholder({ tab }: { tab: PortalTabInfo }) {
  const Icon = tab.icon
  return (
    <section
      aria-label={tab.label}
      className="card-box flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center shadow-sm"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <p className="text-muted max-w-md text-xs">{tab.description}</p>
      <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        <HammerIcon className="size-3.5" aria-hidden="true" />
        Đang phát triển · {tab.stories} · phụ trách: {tab.owner}
      </p>
    </section>
  )
}

export default TabPlaceholder
