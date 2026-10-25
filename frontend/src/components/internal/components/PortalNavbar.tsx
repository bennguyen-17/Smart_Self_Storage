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
  /** Ẩn dòng chữ tên cổng trên Header và Sidebar */
  hidePortalNameText?: boolean
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
function PortalNavbar({ portalName, hidePortalNameText = false, items, profile, onLogout, children }: PortalNavbarProps) {
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
        className="pointer-events-none fixed top-0 left-1/2 -z-0 h-64 w-full max-w-4xl -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/20 via-cyan-400/25 to-indigo-500/20 blur-3xl md:left-[calc(50%+8rem)] dark:from-blue-500/10 dark:via-cyan-400/10 dark:to-indigo-500/10"
      />

      {sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar dọc: full height, logo Smart Storage nằm trên đỉnh sidebar (giống cổng Staff) */}
      <aside
        id="portal-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white/95 text-slate-900 shadow-sm backdrop-blur-xl transition-transform duration-200 ease-out motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-950/95 dark:text-white",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header ở đỉnh sidebar chứa Brand Logo & Slogan */}
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-200/80 px-4 dark:border-slate-800/80">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Warehouse className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-base font-black tracking-tight text-slate-900 dark:text-white">
                Smart Storage
              </span>
              <span className="block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {portalName || "Hệ thống nội bộ"}
              </span>
            </div>
          </div>
        </div>

        {/* Danh mục các trang nghiệp vụ */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="px-2 pb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">Danh mục nghiệp vụ</p>
          <nav aria-label={`Các trang ${portalName}`} className="space-y-1.5">
            {items.map(({ to, label, hint, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none",
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-bold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-slate-100 text-blue-600 group-hover:bg-blue-50 dark:bg-slate-800 dark:text-blue-300 dark:group-hover:text-white"
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-extrabold">{label}</span>
                      <span className={cn("block truncate text-[11px]", isActive ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>{hint}</span>
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Sidebar: Profile & Theme Toggle giống phong cách Staff */}
        <div className="mt-auto shrink-0 border-t border-slate-200/80 p-4 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label={`Tài khoản: ${profile.fullName}`}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left cursor-pointer group"
              title="Xem hồ sơ & Đăng xuất"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white group-hover:scale-105 transition-transform shadow-xs">
                {initials(profile.fullName)}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">
                  {profile.fullName}
                </span>
                <span className="block truncate text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  {profile.roleLabel}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition cursor-pointer"
            >
              {isDark ? (
                <MoonIcon className="size-4 text-indigo-400" />
              ) : (
                <SunIcon className="size-4 text-amber-500" />
              )}
            </button>
          </div>
          {!hidePortalNameText && portalName && (
            <p className="px-1 pt-1.5 text-[11px] text-slate-500 dark:text-slate-400">{portalName}</p>
          )}
        </div>
      </aside>

      {/* Vùng nội dung chính: Trên desktop bắt đầu từ mép trên không bị header cắt ngang */}
      <main className="relative z-10 flex min-h-screen flex-col md:pl-64">
        {/* Thanh bar mobile (chỉ hiện trên màn hình hẹp md:hidden, giống Staff md:hidden) */}
        <div className="flex h-[52px] items-center justify-between border-b border-slate-200/80 bg-slate-50/95 px-4 shadow-xs backdrop-blur-xl md:hidden dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-expanded={sidebarOpen}
              aria-controls="portal-sidebar"
              aria-label={sidebarOpen ? "Đóng danh sách trang" : "Mở danh sách trang"}
              className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none dark:border-slate-700/80 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              {sidebarOpen ? <XIcon className="size-4" aria-hidden="true" /> : <PanelLeftIcon className="size-4" aria-hidden="true" />}
            </button>
            <span className="text-xs font-black tracking-wide uppercase text-slate-900 dark:text-white">
              Smart Storage
            </span>
          </div>

          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {isDark ? <SunIcon className="size-3.5 text-amber-400" aria-hidden="true" /> : <MoonIcon className="size-3.5 text-indigo-400" aria-hidden="true" />}
          </button>
        </div>

        <div className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</div>
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
