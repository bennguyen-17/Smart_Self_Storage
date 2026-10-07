import { useState, type ReactNode } from "react"
import {
  IdCardIcon,
  KeyRoundIcon,
  UserCogIcon,
  WrenchIcon,
} from "lucide-react"
import { cn } from "cn"

import { useTheme } from "@/components/common/theme-provider"

import CheckinPanel from "../components/CheckinPanel"
import StaffPinPanel from "../components/StaffPinPanel"
import StaffProfileModal from "../components/StaffProfileModal"
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

/** US-16: Cổng nhân viên vận hành — bám prototype staff.html */
function StaffCheckinPage() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<StaffTab>("checkin")
  const [profileOpen, setProfileOpen] = useState(false)

  const isDark = resolveIsDark(theme)

  return (
    <div className="staff-portal flex min-h-screen flex-col antialiased">
      <StaffTopBar
        isDark={isDark}
        onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
        onOpenProfile={() => setProfileOpen(true)}
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
                <h2 className="text-sm font-black tracking-wide text-white sm:text-base">
                  <span className="inline-flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5">
                    <span className="text-xs font-semibold text-slate-300">
                      Chuyên viên:
                    </span>
                    <span>Nguyễn Văn Staff</span>
                  </span>
                </h2>
                <p className="text-[11px] text-slate-300">
                  Xử lý Hợp đồng Khách hàng, Tiếp nhận Ticket, Bảo trì ô kho &
                  Cấp PIN mở cổng khẩn cấp.
                </p>
              </div>
            </div>
          </div>

          {/* OPERATIONAL TABS */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3 text-xs font-extrabold dark:border-slate-800">
            <TabButton
              active={activeTab === "checkin"}
              onClick={() => setActiveTab("checkin")}
              icon={<IdCardIcon className="size-4 text-blue-600" />}
              activeIcon={<IdCardIcon className="size-4" />}
              label="DỊCH VỤ KHÁCH HÀNG"
            />
            <TabButton
              active={activeTab === "ticket"}
              onClick={() => setActiveTab("ticket")}
              icon={<WrenchIcon className="size-4 text-amber-500" />}
              activeIcon={<WrenchIcon className="size-4" />}
              label="KHO BÃI SỰ CỐ"
            />
            <TabButton
              active={activeTab === "pin"}
              onClick={() => setActiveTab("pin")}
              icon={<KeyRoundIcon className="size-4 text-emerald-500" />}
              activeIcon={<KeyRoundIcon className="size-4" />}
              label="LẤY MÃ PIN"
            />
          </div>

          {activeTab === "pin" && <StaffPinPanel />}
          {activeTab === "checkin" && <CheckinPanel />}
          {activeTab === "ticket" && <StaffTicketPanel />}
        </div>
      </main>

      <StaffProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
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
          : "text-title hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
      )}
    >
      {active ? activeIcon : icon}
      <span>{label}</span>
    </button>
  )
}

export default StaffCheckinPage
