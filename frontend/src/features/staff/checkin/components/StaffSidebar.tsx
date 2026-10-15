import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  IdCardIcon,
  KeyIcon,
  MoonIcon,
  SunIcon,
  WarehouseIcon,
  WrenchIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"
import StaffProfileModal from "./StaffProfileModal"

const NAV_ITEMS = [
  {
    label: "Dịch vụ khách hàng",
    hint: "Check-in, hợp đồng, hủy ô",
    to: "/staff/checkin",
    icon: IdCardIcon,
  },
  {
    label: "Hỗ trợ & xử lý ticket",
    hint: "Tiếp nhận & xử lý SLA",
    to: "/staff/support",
    icon: WrenchIcon,
  },
  {
    label: "Lấy mã PIN",
    hint: "Cấp lại PIN mở cửa cho khách",
    to: "/staff/pin",
    icon: KeyIcon,
  },
]

function getInitials(name?: string | null): string {
  if (!name) return "NV"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface StaffSidebarProps {
  isDark: boolean
  onToggleTheme: () => void
}

/** Sidebar điều hướng cổng nhân viên vận hành — phong cách portal đồng bộ. */
function StaffSidebar({ isDark, onToggleTheme }: StaffSidebarProps) {
  const { user } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  const staffName = user?.fullName || "Nguyễn Văn Staff"
  const staffRole =
    user?.role === "STAFF"
      ? "Chuyên viên Vận hành"
      : user?.role === "MANAGER"
        ? "Quản lý Cơ sở"
        : user?.role || "Chuyên viên Vận hành"
  const initials = getInitials(staffName)

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="border-r border-slate-200/80 bg-white/95 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white [&_[data-sidebar=sidebar]]:border-r [&_[data-sidebar=sidebar]]:border-slate-200/80 [&_[data-sidebar=sidebar]]:bg-white/95 [&_[data-sidebar=sidebar]]:text-slate-900 dark:[&_[data-sidebar=sidebar]]:border-slate-800 dark:[&_[data-sidebar=sidebar]]:bg-slate-950 dark:[&_[data-sidebar=sidebar]]:text-white"
      >
        <SidebarHeader className="border-b border-slate-200/80 p-3 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <WarehouseIcon className="size-5" />
              </div>
              <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-base font-black tracking-tight text-slate-900 dark:text-white">
                  Smart Storage
                </span>
                <span className="block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Hệ thống cho thuê kho tự quản thông minh 24/7
                </span>
              </div>
            </div>

            <SidebarTrigger className="shrink-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800" />
          </div>
        </SidebarHeader>

        <SidebarContent className="p-3">
          <p className="px-2 pb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 group-data-[collapsible=icon]:hidden">
            Danh mục nghiệp vụ
          </p>
          <nav aria-label="Nghiệp vụ nhân viên" className="space-y-1.5">
            {NAV_ITEMS.map(({ to, label, hint, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2",
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
                    <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                      <span className="block truncate text-xs font-extrabold">{label}</span>
                      <span
                        className={cn(
                          "block truncate text-[11px]",
                          isActive ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
                        )}
                      >
                        {hint}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </SidebarContent>

        <SidebarFooter className="border-t border-slate-200/80 p-3 mt-auto dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left cursor-pointer group"
              title="Xem hồ sơ nhân viên & Đăng xuất"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white group-hover:scale-105 transition-transform shadow-xs">
                {initials}
              </div>
              <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">
                  {staffName}
                </span>
                <span className="block truncate text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  {staffRole}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              title={
                isDark
                  ? "Chuyển sang giao diện Sáng"
                  : "Chuyển sang giao diện Tối"
              }
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition cursor-pointer"
            >
              {isDark ? (
                <MoonIcon className="size-4 text-indigo-400" />
              ) : (
                <SunIcon className="size-4 text-amber-500" />
              )}
            </button>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <StaffProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  )
}

export default StaffSidebar
