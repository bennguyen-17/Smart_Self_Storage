import { useState } from "react"
import { NavLink } from "react-router-dom"
import { ChevronDownIcon, LogOutIcon, MenuIcon, MoonIcon, SunIcon, WarehouseIcon, XIcon, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { isMockMode } from "@/lib/apiClient"

import { initials } from "../initials"

export interface PortalNavItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface PortalNavbarProps {
  /** Tên cổng hiện cạnh logo, ví dụ "Quản lý cơ sở" */
  portalName: string
  /** Mỗi mục là một trang có link riêng (F5 / Back / gửi link đều giữ đúng trang) */
  items: readonly PortalNavItem[]
  fullName: string
  roleLabel: string
  email?: string | null
  isDark: boolean
  onToggleTheme: () => void
  onLogout: () => void
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-bold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none",
    isActive
      ? "bg-purple-600/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
      : "text-muted hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
  )

/**
 * Navbar của các cổng nội bộ (Manager, Admin). Mỗi cổng truyền danh sách trang riêng của mình;
 * khung chung giữ logo, nút sáng/tối và menu tài khoản giống nhau giữa các cổng.
 */
function PortalNavbar({
  portalName,
  items,
  fullName,
  roleLabel,
  email,
  isDark,
  onToggleTheme,
  onLogout,
}: PortalNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="portal-topbar sticky top-0 z-40 w-full border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-purple-600 text-white">
            <WarehouseIcon className="size-4" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <span className="text-title block text-sm font-black">Smart Storage</span>
            <span className="text-muted block text-[11px] font-semibold">{portalName}</span>
          </div>
        </div>

        <nav aria-label={`Các trang ${portalName}`} className="ml-2 hidden min-w-0 items-center gap-0.5 lg:flex">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon className="hidden size-4 2xl:block" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {isMockMode() && (
            <span
              title="Đang chạy dữ liệu mẫu, chưa nối máy chủ thật"
              className="hidden rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 xl:inline dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
            >
              Dữ liệu mẫu
            </span>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            className="text-muted flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {isDark ? <MoonIcon className="size-4" aria-hidden="true" /> : <SunIcon className="size-4" aria-hidden="true" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Tài khoản: ${fullName}`}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none dark:hover:bg-slate-800"
            >
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-full bg-purple-600 text-xs font-black text-white"
              >
                {initials(fullName)}
              </span>
              <span className="text-title hidden max-w-40 truncate text-[13px] font-bold 2xl:block">{fullName}</span>
              <ChevronDownIcon className="text-muted size-3.5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="space-y-0.5 px-2 py-1.5">
                  <span className="block text-sm font-bold text-foreground">{fullName}</span>
                  <span className="block text-xs">{roleLabel}</span>
                  {email && <span className="block truncate text-xs">{email}</span>}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onLogout}>
                <LogOutIcon aria-hidden="true" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="portal-mobile-nav"
            aria-label={mobileOpen ? "Đóng danh sách trang" : "Mở danh sách trang"}
            className="text-title flex size-9 cursor-pointer items-center justify-center rounded-lg hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none lg:hidden dark:hover:bg-slate-800"
          >
            {mobileOpen ? <XIcon className="size-5" aria-hidden="true" /> : <MenuIcon className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="portal-mobile-nav"
          aria-label={`Các trang ${portalName} (màn hẹp)`}
          className="grid gap-1 border-t px-4 py-3 sm:px-6 lg:hidden"
        >
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={() => setMobileOpen(false)}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

export default PortalNavbar
