import { Outlet } from "react-router-dom"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useTheme } from "@/components/common/theme-provider"

import StaffSidebar from "@/features/staff/components/StaffSidebar"

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
            {/* Top mobile navigation bar (đồng bộ header với Manager) */}
            <div className="flex items-center gap-3 border-b border-slate-200/80 bg-slate-50/95 px-4 py-2.5 shadow-xs backdrop-blur-xl md:hidden dark:border-slate-800 dark:bg-slate-950/95">
              <span className="text-xs font-black tracking-wide uppercase text-slate-900 dark:text-white">
                Smart Storage
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
