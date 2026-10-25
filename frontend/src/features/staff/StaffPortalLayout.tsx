import { Outlet } from "react-router-dom"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useTheme } from "@/components/common/theme-provider"

import StaffSidebar from "@/features/staff/components/StaffSidebar"
import StaffShiftBadge from "@/features/staff/components/StaffShiftBadge"

function resolveIsDark(theme: string): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
}

function StaffPortalLayout() {
  const { theme, setTheme } = useTheme()
  const isDark = resolveIsDark(theme)

  return (
    <div className="staff-portal relative min-h-screen bg-[#eef5fc] text-slate-900 dark:bg-[#0b1120] dark:text-slate-100 antialiased">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-1/2 -z-0 h-64 w-full max-w-4xl -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/20 via-cyan-400/25 to-indigo-500/20 blur-3xl lg:left-[calc(50%+8rem)] dark:from-blue-500/10 dark:via-cyan-400/10 dark:to-indigo-500/10"
      />

      <TooltipProvider>
        <SidebarProvider>
          <StaffSidebar
            isDark={isDark}
            onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
          />

          <SidebarInset className="relative z-10 flex min-h-screen flex-1 flex-col bg-transparent">
            {/* Top persistent navigation bar */}
            <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-2.5 backdrop-blur-md md:px-8 dark:border-slate-800/80 dark:bg-slate-950/80">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black tracking-wide uppercase text-slate-900 md:hidden dark:text-white">
                  Smart Storage
                </span>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
                    <span className="size-2 rounded-full bg-blue-500" />
                    Cơ sở: HN01 - Cầu Giấy
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StaffShiftBadge />
              </div>
            </header>

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
