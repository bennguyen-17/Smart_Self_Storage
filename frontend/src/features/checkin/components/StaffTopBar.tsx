import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronDownIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  UserCogIcon,
  WarehouseIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/context/AuthContext"
import StaffProfileModal from "./StaffProfileModal"

interface StaffTopBarProps {
  isDark: boolean
  onToggleTheme: () => void
}

function getInitials(name?: string | null): string {
  if (!name) return "NV"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Header nhân viên vận hành — bám prototype staff_portal.html (full-width, px-6 sm:px-10) */
function StaffTopBar({ isDark, onToggleTheme }: StaffTopBarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  const staffName = user?.fullName || "Nguyễn Văn Staff"
  const initials = getInitials(staffName)
  const roleTitle =
    user?.role === "STAFF"
      ? "Chuyên viên Vận hành"
      : user?.role === "MANAGER"
        ? "Quản lý Chi nhánh"
        : user?.role || "Chuyên viên Vận hành"

  function handleLogout() {
    signOut()
    toast.success("Đã đăng xuất phiên làm việc nhân viên.")
    navigate("/internal_login")
  }

  return (
    <>
      <header className="portal-topbar sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b px-6 shadow-sm transition-colors sm:px-10">
        {/* BRAND */}
        <div className="flex shrink-0 items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <WarehouseIcon className="size-5" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-title block text-base leading-tight font-bold">
              Smart Storage
            </span>
            <span className="text-muted block text-[11px] font-medium">
              Hệ thống cho thuê kho tự quản thông minh 24/7
            </span>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex shrink-0 items-center space-x-2.5 sm:space-x-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inner-box flex cursor-pointer items-center space-x-2 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDark ? (
              <MoonIcon className="size-3.5 shrink-0 text-indigo-400" />
            ) : (
              <SunIcon className="size-3.5 shrink-0 text-amber-500" />
            )}
            <span className="text-title hidden text-xs whitespace-nowrap md:inline">
              {isDark ? "Giao diện Tối" : "Giao diện Sáng"}
            </span>
          </button>

          <div className="hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" />

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            title="Nhấn để xem Hồ sơ Nhân viên Vận hành"
            className="inner-box group flex cursor-pointer items-center space-x-2.5 rounded-xl border px-3 py-1.5 text-left shadow-sm transition hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-black text-white shadow-sm transition-transform group-hover:scale-105">
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-title flex items-center space-x-1 text-xs leading-tight font-extrabold">
                <span>{staffName}</span>
                <ChevronDownIcon className="text-muted size-2.5 transition-colors group-hover:text-blue-600" />
              </div>
              <div className="flex items-center space-x-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                <UserCogIcon className="size-2.5" />
                <span>{roleTitle}</span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất khỏi Cổng Nhân viên"
            className="inner-box flex cursor-pointer items-center space-x-1.5 rounded-xl border border-rose-200/60 px-2.5 py-1.5 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <LogOutIcon className="size-3.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      <StaffProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  )
}

export default StaffTopBar
