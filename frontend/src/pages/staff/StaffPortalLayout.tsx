import { Outlet } from "react-router-dom"
import { Building2Icon, UserCogIcon } from "lucide-react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useTheme } from "@/components/common/theme-provider"
import { useAuth } from "@/context/AuthContext"

import StaffSidebar from "@/pages/staff/checkin/components/StaffSidebar"

function resolveIsDark(theme: string): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
}

/**
 * Khung cổng nhân viên vận hành
 */
function StaffPortalLayout() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  const isDark = resolveIsDark(theme)
  const staffName = user?.fullName || "Nguyễn Văn Staff"
  const staffBranch =
    (user as { facilityName?: string })?.facilityName || "Quận 9 (Khu FPT)"
  const staffRole =
    user?.role === "STAFF"
      ? "Chuyên viên Vận hành"
      : user?.role === "MANAGER"
        ? "Quản lý Cơ sở"
        : user?.role || "Chuyên viên Vận hành"

  return (
    <div className="staff-portal antialiased">
      {/* Nền ambient  */}
      <div
        className={`pointer-events-none fixed inset-0 z-0 transition-colors ${
          isDark
            ? "bg-gradient-to-b from-slate-950 via-[#0a1628] to-slate-950"
            : "bg-gradient-to-b from-[#eaf4fe] via-[#f1f7ff] to-[#e4effb]"
        }`}
      >
        <div className="absolute -top-32 left-1/2 h-[500px] w-full max-w-6xl -translate-x-1/2 rounded-full bg-gradient-to-b from-sky-200/50 via-blue-100/30 to-transparent blur-3xl" />
      </div>

      <TooltipProvider>
        <SidebarProvider>
          <StaffSidebar
            isDark={isDark}
            onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
          />

          <SidebarInset className="relative z-10 bg-transparent">
            <div className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
              {/* STAFF IDENTITY */}
              <div className="card-box flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
                    <UserCogIcon className="size-5" strokeWidth={2.5} />
                  </div>
                  <div className="leading-tight">
                    <div className="text-title text-sm font-extrabold">
                      {staffName}
                    </div>
                    <div className="text-[11px] font-bold text-muted">
                      {staffRole}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inner-box inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold">
                    <Building2Icon
                      className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400"
                      strokeWidth={2.5}
                    />
                    <span className="text-title">{staffBranch}</span>
                  </span>
                  <span className="inner-box inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="size-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                    <span>Trực ca 08:00 - 20:00</span>
                  </span>
                </div>
              </div>

              <Outlet />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  )
}

export default StaffPortalLayout
