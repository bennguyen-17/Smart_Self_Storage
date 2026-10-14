import { useState } from "react"
import { NavLink } from "react-router-dom"
import { ChevronDownIcon, MenuIcon, Warehouse, XIcon, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import ThemeToggle from "@/components/common/ThemeToggle"

import { initials } from "../initials"
import PortalProfileModal, { type PortalProfile } from "./PortalProfileModal"

export interface PortalNavItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface PortalNavbarProps {
  /** Tên cổng hiện dưới chữ "Smart Storage", ví dụ "Cổng quản lý cơ sở" */
  portalName: string
  /** Mỗi mục là một trang có link riêng (F5 / Back / gửi link đều giữ đúng trang) */
  items: readonly PortalNavItem[]
  profile: PortalProfile
  onLogout: () => void
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-bold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none",
    isActive
      ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
  )

/**
 * Navbar của các cổng nội bộ (Manager, Admin), làm theo Header của cổng khách (Tâm):
 * logo xanh bo tròn, nút sáng/tối tròn, vạch ngăn, nút người dùng có viền mở popup hồ sơ.
 * Thêm danh sách trang ở giữa vì cổng nội bộ chuyển trang bằng navbar.
 */
function PortalNavbar({ portalName, items, profile, onLogout }: PortalNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 border-b border-slate-200 bg-white shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900">
      {/* 3 cột: logo | danh sách trang (căn giữa) | công cụ. Hai cột bên bằng nhau nên cột giữa luôn nằm chính giữa */}
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Warehouse className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="block text-lg font-black tracking-tight text-slate-900 dark:text-white">Smart Storage</span>
            <span className="block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{portalName}</span>
          </div>
        </div>

        <nav aria-label={`Các trang ${portalName}`} className="hidden items-center gap-0.5 lg:flex">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon className="hidden size-4 2xl:block" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-self-end gap-2">
          <ThemeToggle />
          <div className="hidden h-5 w-px bg-slate-300 sm:block dark:bg-slate-700" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label={`Tài khoản: ${profile.fullName}`}
            title="Nhấn để xem hồ sơ và đăng xuất"
            className="group flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-left shadow-xs transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shadow-xs transition-transform group-hover:scale-105"
            >
              {initials(profile.fullName)}
            </span>
            <span className="hidden text-left xl:block">
              <span className="flex items-center gap-1 text-xs leading-tight font-extrabold text-slate-900 dark:text-white">
                <span className="max-w-36 truncate">{profile.fullName}</span>
                <ChevronDownIcon className="size-3 text-slate-400 transition-colors group-hover:text-blue-600" aria-hidden="true" />
              </span>
              <span className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{profile.roleLabel}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="portal-mobile-nav"
            aria-label={mobileOpen ? "Đóng danh sách trang" : "Mở danh sách trang"}
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none lg:hidden dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {mobileOpen ? <XIcon className="size-5" aria-hidden="true" /> : <MenuIcon className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="portal-mobile-nav"
          aria-label={`Các trang ${portalName} (màn hẹp)`}
          className="grid gap-1 border-t border-slate-200 px-4 py-3 sm:px-6 lg:hidden dark:border-slate-800"
        >
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={() => setMobileOpen(false)}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      )}

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
    </header>
  )
}

export default PortalNavbar
