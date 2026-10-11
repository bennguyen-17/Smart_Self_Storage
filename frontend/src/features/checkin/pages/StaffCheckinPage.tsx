import { useState, type ReactNode } from "react"
import { IdCardIcon, KeyIcon, UserCogIcon, WrenchIcon } from "lucide-react"
import { cn } from "cn"

import { useTheme } from "@/components/common/theme-provider"

import CheckinPanel from "../components/CheckinPanel"
import StaffPinPanel from "../components/StaffPinPanel"
import StaffTicketPanel from "../components/StaffTicketPanel"
import StaffTopBar from "../components/StaffTopBar"

type StaffTab = "checkin" | "ticket" | "pin"

function resolveIsDark(theme: string): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
}

/** Cổng nhân viên vận hành — bám prototype staff_portal.html */
function StaffCheckinPage() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<StaffTab>("checkin")

  const isDark = resolveIsDark(theme)

  return (
    <div className="staff-portal flex min-h-screen flex-col antialiased">
      <StaffTopBar
        isDark={isDark}
        onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* COMPACT HEADER BAR */}
          <div className="card-box flex flex-col items-start justify-between gap-3 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-4 text-white shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
                <UserCogIcon className="size-5" />
              </div>
              <div>
                <h2 className="flex items-center space-x-2 text-sm font-black tracking-wide text-white sm:text-base">
                  <span className="inline-flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5">
                    <span className="text-xs font-semibold text-slate-300">
                      Chuyên viên:
                    </span>
                    <span>Nguyễn Văn Staff</span>
                  </span>
                </h2>
                <p className="text-[11px] text-slate-300">
                  Xử lý Hợp đồng Khách hàng, Tiếp nhận Ticket, Bảo trì ô kho
                  &amp; Cấp PIN mở cổng khẩn cấp.
                </p>
              </div>
            </div>
          </div>

          {/* 3 OPERATIONAL TABS */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3 text-xs font-extrabold dark:border-slate-800">
            <TabButton
              active={activeTab === "checkin"}
              activeClass="bg-blue-600 text-white"
              onClick={() => setActiveTab("checkin")}
              icon={
                <IdCardIcon
                  className="size-4 text-blue-600"
                  strokeWidth={2.5}
                />
              }
              activeIcon={<IdCardIcon className="size-4" strokeWidth={2.5} />}
              label="DỊCH VỤ KHÁCH HÀNG"
            />
            <TabButton
              active={activeTab === "ticket"}
              activeClass="bg-blue-600 text-white"
              onClick={() => setActiveTab("ticket")}
              icon={
                <WrenchIcon
                  className="size-4 text-amber-500"
                  strokeWidth={2.5}
                />
              }
              activeIcon={<WrenchIcon className="size-4" strokeWidth={2.5} />}
              label="HỖ TRỢ & XỬ LÝ TICKET (SLA)"
            />
            <TabButton
              active={activeTab === "pin"}
              activeClass="bg-emerald-600 text-white"
              onClick={() => setActiveTab("pin")}
              icon={
                <KeyIcon
                  className="size-4 text-emerald-500"
                  strokeWidth={2.5}
                />
              }
              activeIcon={<KeyIcon className="size-4" strokeWidth={2.5} />}
              label="LẤY MÃ PIN"
            />
          </div>

          {activeTab === "checkin" && <CheckinPanel />}
          {activeTab === "ticket" && <StaffTicketPanel />}
          {activeTab === "pin" && <StaffPinPanel />}
        </div>
      </main>
    </div>
  )
}

function TabButton({
  active,
  activeClass,
  onClick,
  icon,
  activeIcon,
  label,
}: {
  active: boolean
  activeClass: string
  onClick: () => void
  icon: ReactNode
  activeIcon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex cursor-pointer items-center space-x-2 rounded-xl border px-4 py-2.5 transition",
        active
          ? cn("border-transparent shadow", activeClass)
          : "text-title border-white hover:text-blue-600 hover:shadow"
      )}
    >
      {active ? activeIcon : icon}
      <span>{label}</span>
    </button>
  )
}

export default StaffCheckinPage
