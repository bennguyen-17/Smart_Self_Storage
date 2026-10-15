import { Outlet } from "react-router-dom"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useTheme } from "@/components/common/theme-provider"

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
  const isDark = resolveIsDark(theme)

  return (
    <div className="staff-portal min-h-screen antialiased">
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

          <SidebarInset className="relative z-10 flex min-h-screen flex-1 flex-col bg-transparent">
            {/* Top mobile navigation bar (chỉ hiển thị trên màn hình nhỏ để bật tắt sidebar) */}
            <div className="flex items-center gap-3 border-b border-border/40 bg-card/60 px-4 py-2.5 backdrop-blur-md md:hidden">
              <SidebarTrigger className="shrink-0" />
              <span className="text-xs font-black tracking-wide uppercase text-title">
                Smart Storage • Cổng Nhân Viên
              </span>
            </div>

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  )
}

export default StaffPortalLayout
