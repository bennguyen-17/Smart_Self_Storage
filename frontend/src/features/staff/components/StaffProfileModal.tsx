import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2Icon,
  CheckCircle2Icon,
  KeyRoundIcon,
  LogOutIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UserShieldIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/context/AuthContext"
import ProtoModal from "./ProtoModal"
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
  const staffEmail = profile?.email || user?.email || "—"
  const staffPhone = profile?.phone || user?.phone || "—"
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

  return (
    <ProtoModal
      open={open}
      onClose={onClose}
      title="Hồ sơ Nhân viên Cơ sở"
      subtitle="Thông tin cá nhân & Đơn vị trực thuộc"
      icon={<UserShieldIcon className="size-5" />}
    >
      {/* THẺ ĐẠI DIỆN NHÂN VIÊN */}
      <div className="flex items-center space-x-4 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-4 text-white shadow-inner">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-blue-300 bg-gradient-to-tr from-blue-500 to-indigo-400 text-xl font-black text-white shadow-lg">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate text-lg font-black text-white">
              {staffName}
            </h2>
          </div>

          {/* Đổi thành: Nhân viên cơ sở */}
          <p className="mt-0.5 text-xs font-semibold text-blue-200">
            {roleName}
          </p>

          {/* Mã nhân viên 1 dòng, xuống dòng là mã cơ sở */}
          <div className="mt-2 space-y-0.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Mã nhân viên:</span>
              <b className="text-white font-mono font-bold tracking-wide">{staffCode}</b>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Chi nhánh:</span>
              <b className="text-white font-mono font-bold tracking-wide">
                {facilityCode && !branchName.includes(facilityCode)
                  ? `${branchName} - ${facilityCode}`
                  : branchName}
              </b>
            </div>
          </div>
        </div>
      </div>

      {/* THÔNG TIN LIÊN HỆ: GỌN GÀNG, KHÔNG LỒNG HỘP, KHÔNG TIÊU ĐỀ THỪA */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2.5 dark:border-slate-800 dark:bg-slate-900/50">
        {/* SỐ ĐIỆN THOẠI */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/50">
              <PhoneIcon className="size-3.5" />
            </div>
            <span className="font-medium">Số điện thoại liên hệ</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            {staffPhone}
          </span>
        </div>

        <div className="border-t border-slate-200/60 dark:border-slate-800/60" />

        {/* EMAIL */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/50">
              <MailIcon className="size-3.5" />
            </div>
            <span className="font-medium">Email</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[210px] text-right">
            {staffEmail}
          </span>
        </div>
      </div>

      {/* NÚT THAO TÁC DƯỚI CÙNG: ĐÓNG (TRÁI) & ĐĂNG XUẤT (PHẢI) */}
      <div className="flex items-center space-x-3 pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl border border-rose-300 bg-rose-50 py-2.5 text-xs font-extrabold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
        >
          <LogOutIcon className="size-3.5" />
          <span>Đăng Xuất</span>
        </button>
      </div>
    </ProtoModal>
  )
}
