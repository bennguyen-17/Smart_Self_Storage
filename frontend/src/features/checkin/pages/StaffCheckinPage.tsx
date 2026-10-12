import { useState, type ReactNode } from "react"
import { Building2Icon, IdCardIcon, KeyIcon, UserCogIcon, WrenchIcon } from "lucide-react"
import { cn } from "cn"

import { useTheme } from "@/components/common/theme-provider"
import { useAuth } from "@/context/AuthContext"

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
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<StaffTab>("checkin")

  const isDark = resolveIsDark(theme)
  const staffName = user?.fullName || "Nguyễn Văn Staff"
  const staffBranch = (user as { facilityName?: string })?.facilityName || "Quận 9 (Khu FPT)"
  const staffRole =
    user?.role === "STAFF"
      ? "Chuyên viên Vận hành"
      : user?.role === "MANAGER"
        ? "Quản lý Cơ sở"
        : user?.role || "Chuyên viên Vận hành"

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
                <h2 className="flex flex-wrap items-center gap-2 text-sm font-black tracking-wide text-white sm:text-base">
                  <span className="inline-flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5">
                    <span className="text-xs font-semibold text-slate-300">
                      {staffRole}:
                    </span>
                    <span>{staffName}</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 rounded-xl border border-blue-500/40 bg-blue-950/60 px-2.5 py-1 text-xs font-semibold text-blue-200">
                    <Building2Icon className="size-3 text-blue-400" />
                    <span>{staffBranch}</span>
                  </span>
                </h2>
                <p className="mt-1 text-[11px] text-slate-300">
                  Xử lý Hợp đồng Khách hàng, Tiếp nhận Ticket, Bảo trì ô kho
                  &amp; Cấp PIN mở cổng khẩn cấp.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/70 px-3 py-1 text-[11px] font-bold text-emerald-300">
                <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                <span>Trực ca 08:00 - 20:00</span>
              </span>
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
