import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { IdCardIcon, LogOutIcon } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import {
  getStaffProfile,
  type StaffProfileData,
} from "@/features/staff/shifts/api/staffProfileService"

interface StaffProfileModalProps {
  open: boolean
  onClose: () => void
}

function getInitials(name?: string | null): string {
  if (!name) return "NV"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function StaffProfileModal({
  open,
  onClose,
}: StaffProfileModalProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<StaffProfileData | null>(null)

  // Tải dữ liệu thật từ máy chủ
  useEffect(() => {
    if (!open) return

    let isMounted = true
    setLoading(true)

    getStaffProfile()
      .then((data) => {
        if (isMounted && data && data.success) {
          setProfile(data)
        }
      })
      .catch((err) => {
        console.error("Lỗi tải thông tin hồ sơ nhân viên:", err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open])

  // Dữ liệu hiển thị (Lấy từ API hồ sơ, fallback từ phiên đăng nhập thực tế của tài khoản)
  const staffName = profile?.fullName || user?.fullName || "Chưa cập nhật"
  const staffEmail = profile?.email || user?.email || "Chưa cập nhật"
  const staffPhone = profile?.phone || user?.phone || "Chưa cập nhật"
  const staffCode =
    profile?.staffCode ||
    (user?.id ? `NV-${String(user.id).padStart(4, "0")}` : "—")
  const facilityCode =
    profile?.facilityCode ||
    (user as { facilityCode?: string })?.facilityCode ||
    ""
  const branchName =
    profile?.facilityName ||
    (user as { facilityName?: string })?.facilityName ||
    (facilityCode ? `Cơ sở ${facilityCode}` : "Chưa phân bổ cơ sở")
  const roleName =
    profile?.roleTitle || (user?.role === "MANAGER" ? "Quản lý cơ sở" : "Nhân viên cơ sở")
  const initials = getInitials(staffName)

  function handleLogout() {
    onClose()
    signOut()
    toast.success("Đã đăng xuất tài khoản thành công.")
    navigate("/internal_login")
  }

  const fields: { label: string; value: string; mono?: boolean }[] = [
    { label: "HỌ VÀ TÊN", value: staffName },
    { label: "MÃ NHÂN SỰ", value: staffCode, mono: true },
    { label: "SỐ ĐIỆN THOẠI", value: staffPhone, mono: true },
    { label: "EMAIL", value: staffEmail },
    {
      label: "CƠ SỞ PHỤ TRÁCH",
      value:
        facilityCode && !branchName.includes(facilityCode)
          ? `${branchName} (${facilityCode})`
          : branchName,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md gap-4 rounded-3xl p-5 sm:max-w-md sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Header tiêu đề */}
        <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3 pr-8">
          <div className="flex size-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
            <IdCardIcon className="size-4" aria-hidden="true" />
          </div>
          <DialogTitle className="text-sm font-extrabold tracking-wide text-slate-900 dark:text-white">
            HỒ SƠ NHÂN SỰ
          </DialogTitle>
        </div>
        <DialogDescription className="sr-only">Thông tin hồ sơ nhân sự</DialogDescription>

        {/* Banner đại diện */}
        <div className="relative flex items-center space-x-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-blue-950 p-4 text-white shadow-inner sm:p-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-blue-300 bg-gradient-to-tr from-blue-500 to-indigo-400 text-xl font-black text-white shadow-lg">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black text-white">{staffName}</h2>
            <span className="block mt-0.5 text-[11px] font-medium text-blue-200">
              {roleName}
            </span>
          </div>
        </div>

        {/* Khung danh sách thông tin kiểu các dòng thẻ ngang như Customer */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white pt-0.5">
          {fields.map((f) => (
            <div
              key={f.label}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs gap-3"
            >
              <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider shrink-0">
                {f.label}
              </span>
              <span
                className={`font-bold text-xs text-slate-900 dark:text-white text-right break-all ${
                  f.mono ? "font-mono" : ""
                }`}
              >
                {f.value}
              </span>
            </div>
          ))}
        </div>

        {/* Nút Đăng xuất màu đỏ full-width như bên Customer */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 text-xs font-bold text-white shadow-md transition hover:bg-rose-700 active:scale-[0.99]"
        >
          <LogOutIcon className="size-4" aria-hidden="true" />
          <span>Đăng xuất</span>
        </button>
      </DialogContent>
    </Dialog>
  )
}
