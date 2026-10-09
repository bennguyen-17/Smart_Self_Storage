import { useState, type ReactNode } from "react"
import { IdCardIcon, KeyRoundIcon, UserCogIcon, WrenchIcon } from "lucide-react"
import { cn } from "cn"

import { useTheme } from "@/components/common/theme-provider"

import CheckinPanel from "../components/CheckinPanel"
import StaffPinPanel from "../components/StaffPinPanel"
import StaffTicketPanel from "../components/StaffTicketPanel"
import StaffTopBar from "../components/StaffTopBar"

type StaffTab = "checkin" | "ticket"

function resolveIsDark(theme: string): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
}

/** US-16: Cổng nhân viên vận hành — bám prototype self_storage_prototype.html */
function StaffCheckinPage() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<StaffTab>("checkin")
  const [pinOpen, setPinOpen] = useState(false)

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
                  <span>
                    BÀN TRỰC CA & VẬN HÀNH NHÂN VIÊN (STAFF COCKPIT)
                  </span>
                  <span className="rounded-full border border-blue-400/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                    Trực ca Cơ sở
                  </span>
                </h2>
                <p className="text-[11px] text-slate-300">
                  Xử lý Hợp đồng Khách hàng, Tiếp nhận Ticket SLA, Bảo trì ô kho
                  & Cấp PIN mở cổng khẩn cấp.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPinOpen((v) => !v)}
              className="flex w-full shrink-0 cursor-pointer animate-pulse items-center justify-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-blue-500 sm:w-auto"
            >
              <KeyRoundIcon className="size-3.5" />
              <span>⚡ LẤY MÃ PIN CỔNG TÒA NHÀ (30S)</span>
            </button>
          </div>

          {pinOpen && <StaffPinPanel />}

          {/* 2 OPERATIONAL TABS */}
          <div className="flex items-center space-x-3 border-b border-slate-200 pb-3 text-xs font-extrabold dark:border-slate-800">
            <TabButton
              active={activeTab === "checkin"}
              onClick={() => setActiveTab("checkin")}
              icon={<IdCardIcon className="size-4 text-blue-600" />}
              activeIcon={<IdCardIcon className="size-4" />}
              label="TAB 1: DỊCH VỤ KHÁCH HÀNG & HỢP ĐỒNG (CHECK-IN / TRẢ KHO / THU PHẠT)"
            />
            <TabButton
              active={activeTab === "ticket"}
              onClick={() => setActiveTab("ticket")}
              icon={<WrenchIcon className="size-4 text-amber-500" />}
              activeIcon={<WrenchIcon className="size-4" />}
              label="TAB 2: KHO BÃI, SỰ CỐ SLA & BẢO TRÌ (IOT & FACILITY FEED)"
            />
          </div>

          {activeTab === "checkin" && <CheckinPanel />}
          {activeTab === "ticket" && <StaffTicketPanel />}
        </div>
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  activeIcon,
  label,
}: {
  active: boolean
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
          ? "border-blue-600 bg-blue-600 text-white shadow"
          : "text-title hover:shadow hover:text-blue-600"
      )}
    >
      {active ? activeIcon : icon}
      <span>{label}</span>
    </button>
  )
}

export default StaffCheckinPage
