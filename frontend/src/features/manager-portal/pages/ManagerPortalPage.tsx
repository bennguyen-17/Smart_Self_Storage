import { useEffect, useRef } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { BuildingIcon, FileTextIcon, UserCheckIcon } from "lucide-react"
import { cn } from "cn"

import { useTheme } from "@/components/common/theme-provider"
import { useAuth } from "@/context/AuthContext"
import { getRoleTitle, normalizeRole } from "@/lib/roles"

import ManagerTopBar from "../components/ManagerTopBar"
import TabPlaceholder from "../components/TabPlaceholder"
import { findManagerTab, MANAGER_TABS } from "../managerTabs"

function resolveIsDark(theme: string): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
}

/** Lối tắt sang các trang vận hành đã có (giữ từ trang placeholder trước đây của Bảo) */
const SHORTCUTS = [
  { label: "Đơn cọc & No-Show", to: "/staff/reservations", icon: FileTextIcon },
  { label: "Cổng Vận hành (Check-in)", to: "/staff/checkin", icon: UserCheckIcon },
]

/**
 * Khung Manager Portal (builder: Vỹ), bám prototype/manager_portal.html.
 * Chặn quyền do RoleProtectedRoute chung của nhóm đảm nhận (khai báo ở app/App.tsx).
 * Dùng chung bộ class giao diện với cổng Staff (.staff-portal) để các cổng nội bộ cùng một hệ.
 */
function ManagerPortalPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [params, setParams] = useSearchParams()

  const isDark = resolveIsDark(theme)
  const activeTab = findManagerTab(params.get("tab"))
  const Panel = activeTab.component
  const activeTabRef = useRef<HTMLButtonElement>(null)

  // Màn hẹp: thanh tab cuộn ngang, nên đưa tab đang chọn vào tầm nhìn (ví dụ mở thẳng ?tab= của tab cuối)
  useEffect(() => {
    activeTabRef.current?.scrollIntoView?.({ block: "nearest", inline: "nearest" })
  }, [activeTab.key])

  const logout = () => {
    signOut()
    navigate("/internal_login", { replace: true })
  }

  return (
    <div className="staff-portal flex min-h-screen flex-col antialiased">
      <ManagerTopBar
        fullName={user?.fullName ?? "Quản lý cơ sở"}
        roleLabel={getRoleTitle(normalizeRole(user?.role))}
        isDark={isDark}
        onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
        onLogout={logout}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="card-box flex flex-col gap-3 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow">
              <BuildingIcon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-wide text-white sm:text-base">Cổng Quản lý cơ sở</h1>
              <p className="text-[11px] text-slate-300">
                Theo dõi và điều hành ô kho, hợp đồng, quy trình trả kho và nhân sự của cơ sở bạn phụ trách.
              </p>
            </div>
          </div>
          <nav aria-label="Lối tắt" className="flex flex-wrap gap-2">
            {SHORTCUTS.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:outline-none"
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <nav
          aria-label="Chức năng quản lý"
          className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-3 text-xs font-extrabold dark:border-slate-800"
        >
          {MANAGER_TABS.map((tab) => {
            const active = tab.key === activeTab.key
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                ref={active ? activeTabRef : undefined}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setParams({ tab: tab.key })}
                className={cn(
                  "flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none",
                  active
                    ? "border-transparent bg-purple-600 text-white shadow"
                    : "text-title inner-box hover:border-purple-400 hover:text-purple-600"
                )}
              >
                <Icon className={cn("size-4", !active && "text-purple-500")} strokeWidth={2.5} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {Panel ? <Panel /> : <TabPlaceholder tab={activeTab} />}
      </main>
    </div>
  )
}

export default ManagerPortalPage
