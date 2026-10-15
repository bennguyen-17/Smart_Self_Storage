import { useEffect, useState, type ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { ChevronDownIcon, MoonIcon, PanelLeftIcon, SunIcon, Warehouse, XIcon, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import SiteFooter from "@/components/common/SiteFooter"
import { useTheme } from "@/components/common/theme-provider"

import { initials } from "../initials"
import PortalProfileModal, { type PortalProfile } from "./PortalProfileModal"

export interface PortalNavItem {
  to: string
  label: string
  /** Mô tả ngắn dưới tên trang */
  hint: string
  icon: LucideIcon
}

export interface PortalNavbarProps {
  /** Tên cổng, ví dụ "Cổng quản lý cơ sở" */
  portalName: string
  /** Mỗi mục là một trang có link riêng (F5 / Back / gửi link đều giữ đúng trang) */
  items: readonly PortalNavItem[]
  profile: PortalProfile
  onLogout: () => void
  /** Nội dung trang */
  children: ReactNode
}

function resolveDark(theme: string): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
}

/**
 * Khung các cổng nội bộ (Manager, Admin), cùng kiểu cổng BOM của Tâm:
 * header tối cố định + thanh điều hướng dọc bên trái; nền vùng nội dung lấy theo cổng khách (/portal):
 * xanh rất nhạt và một vầng sáng xanh mờ phía trên, để trang không trắng trơn.
 * Màn hẹp: thanh dọc ẩn, mở bằng nút ở header (có lớp nền mờ, Esc để đóng).
 */
function PortalNavbar({ portalName, items, profile, onLogout, children }: PortalNavbarProps) {
  const { theme, setTheme } = useTheme()
  const isDark = resolveDark(theme)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen])

  return (
    <div className="relative min-h-screen bg-[#eef5fc] text-slate-900 dark:bg-[#0b1120] dark:text-slate-100">
      {/* Vầng sáng xanh mờ phía trên vùng nội dung, như cổng khách */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-1/2 -z-0 h-64 w-full max-w-4xl -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/20 via-cyan-400/25 to-indigo-500/20 blur-3xl lg:left-[calc(50%+8rem)] dark:from-blue-500/10 dark:via-cyan-400/10 dark:to-indigo-500/10"
      />

      <header className="fixed inset-x-0 top-0 z-40 flex h-[58px] items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-3 text-white shadow-lg backdrop-blur-xl sm:px-6 dark:border-blue-500/20 dark:bg-slate-950/95">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-expanded={sidebarOpen}
            aria-controls="portal-sidebar"
            aria-label={sidebarOpen ? "Đóng danh sách trang" : "Mở danh sách trang"}
            className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800 text-blue-300 transition hover:bg-slate-700 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none lg:hidden"
          >
            {sidebarOpen ? <XIcon className="size-4" aria-hidden="true" /> : <PanelLeftIcon className="size-4" aria-hidden="true" />}
          </button>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
            <Warehouse className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="block text-base font-black tracking-tight sm:text-lg">Smart Storage</span>
            <span className="block truncate text-[11px] font-medium text-slate-400">{portalName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            {isDark ? <SunIcon className="size-4" aria-hidden="true" /> : <MoonIcon className="size-4" aria-hidden="true" />}
          </button>
          <div className="hidden h-5 w-px bg-slate-700 sm:block" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label={`Tài khoản: ${profile.fullName}`}
            title="Nhấn để xem hồ sơ và đăng xuất"
            className="group flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-left text-slate-900 shadow-xs transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white transition-transform group-hover:scale-105"
            >
              {initials(profile.fullName)}
            </span>
            <span className="hidden text-left md:block">
              <span className="flex items-center gap-1 text-xs leading-tight font-extrabold">
                <span className="max-w-36 truncate">{profile.fullName}</span>
                <ChevronDownIcon className="size-3 text-slate-400 group-hover:text-blue-600" aria-hidden="true" />
              </span>
              <span className="block text-[10px] font-semibold text-blue-600 dark:text-blue-300">{profile.roleLabel}</span>
            </span>
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        id="portal-sidebar"
        className={cn(
          "fixed top-[58px] bottom-0 left-0 z-30 flex w-64 flex-col border-r border-slate-800 bg-slate-900 p-4 text-white transition-transform duration-200 ease-out motion-reduce:transition-none dark:border-blue-500/20 dark:bg-slate-950",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <p className="px-2 pb-2 text-[11px] font-bold text-slate-400">Danh mục quản lý</p>
        <nav aria-label={`Các trang ${portalName}`} className="space-y-1.5">
          {items.map(({ to, label, hint, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none",
                  isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isActive ? "bg-white/15 text-white" : "bg-slate-800 text-blue-300"
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-extrabold">{label}</span>
                    <span className={cn("block truncate text-[11px]", isActive ? "text-blue-100" : "text-slate-400")}>{hint}</span>
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto px-2 text-[11px] text-slate-500">{portalName}</p>
      </aside>

      {/* Footer dùng chung với cổng khách (SiteFooter); luôn nằm sát đáy kể cả khi trang ít nội dung */}
      <main className="relative z-10 flex min-h-screen flex-col pt-[58px] lg:pl-64">
        <div className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        <SiteFooter />
      </main>

      {profileOpen && (
        <PortalProfileModal
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onLogout={() => {
            setProfileOpen(false)
            onLogout()
          }}
        />
      )}
    </div>
  )
}

export default PortalNavbar
