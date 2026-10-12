import { useNavigate } from "react-router-dom"
import { KeyRoundIcon, LogOutIcon, ShieldCheckIcon, UserShieldIcon } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/context/AuthContext"
import ProtoModal from "./ProtoModal"

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

/** Hồ sơ Nhân viên Vận hành — bám prototype staff_portal.html */
function StaffProfileModal({ open, onClose }: StaffProfileModalProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const staffName = user?.fullName || "Nguyễn Văn Staff"
  const staffEmail = user?.email || "staff.nguyen@swp391.vn"
  const staffPhone = (user as { phone?: string })?.phone || "0909 888 999"
  const staffCode = user?.id ? `ST-${String(user.id).padStart(4, "0")}` : "ST-391-8899"
  const branchName =
    (user as { facilityName?: string })?.facilityName || "Quận 9 (Khu FPT)"
  const roleName =
    user?.role === "STAFF"
      ? "Chuyên viên Vận hành Kho"
      : user?.role === "MANAGER"
        ? "Quản lý Cơ sở Kho"
        : user?.role || "Chuyên viên Vận hành"
  const initials = getInitials(staffName)

  function handleLogout() {
    onClose()
    signOut()
    toast.success("Đã đăng xuất tài khoản nhân viên vận hành.")
    navigate("/internal_login")
  }

  return (
    <ProtoModal
      open={open}
      onClose={onClose}
      title="Hồ sơ Nhân viên Vận hành"
      subtitle="Self-Storage Operations Specialist Profile"
      icon={<UserShieldIcon className="size-5" />}
    >
      {/* PROFILE BANNER */}
      <div className="flex items-center space-x-4 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-4 text-white shadow-inner">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-blue-300 bg-gradient-to-tr from-blue-500 to-indigo-400 text-xl font-black text-white shadow-lg">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h2 className="truncate text-lg font-black text-white">
              {staffName}
            </h2>
            <span className="ml-2 inline-flex shrink-0 items-center rounded-full bg-emerald-500 px-2.5 py-0.5 text-[9.5px] font-black text-slate-950 shadow-sm">
              <span className="mr-1.5 size-1.5 animate-pulse rounded-full bg-slate-950" />
              ĐANG TRONG CA TRỰC
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-blue-200">
            {roleName} &amp; Quản lý Thẻ từ / PIN Smart Lock
          </p>
          <div className="mt-1 flex items-center space-x-3 font-mono text-[10px] text-slate-300">
            <span>
              Mã NV: <b className="text-white">{staffCode}</b>
            </span>
            <span>•</span>
            <span>
              Chi nhánh: <b className="text-white">{branchName}</b>
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1 */}
      <div className="inner-box space-y-2 rounded-2xl border p-3.5">
        <div className="flex items-center justify-between border-b pb-1">
          <span className="text-[10px] font-bold tracking-wider text-muted uppercase">
            1. Thông tin Định danh & Công tác
          </span>
          <span className="text-[10px] font-bold text-blue-600">
            Tài khoản Nội bộ Staff
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field label="Họ và Tên" value={staffName} />
          <Field
            label="Mã Nhân Viên"
            value={staffCode}
            className="font-mono text-blue-600 dark:text-blue-400"
          />
          <Field label="Số Điện Thoại Ca Trực" value={staffPhone} />
          <Field label="Email Công Việc" value={staffEmail} />
        </div>
      </div>

      {/* SECTION 2 */}
      <div className="inner-box space-y-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3.5">
        <div className="flex items-center justify-between border-b border-blue-200 pb-1 dark:border-blue-800/40">
          <span className="text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:text-blue-400">
            2. Quyền hạn Vận hành & Phân công
          </span>
          <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
            CA TRỰC: 08:00 - 20:00
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <Row label="Cơ sở trực ban" value={branchName} />
          <Row label="Tầng & Ô kho quản lý" value="Tất cả các tầng tại cơ sở" />
          <Row
            label="Quyền hạn Cấp PIN Cổng"
            value="Cấp PIN Khẩn cấp (Staff Gate PIN 24/7)"
            valueClass="text-emerald-600 dark:text-emerald-400"
          />
          <Row
            label="Quyền Duyệt Vận hành"
            value="✓ Check-in quầy, Đổi ô, Trả kho, Khóa/Mở khẩn cấp"
            valueClass="text-blue-600 dark:text-blue-400"
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center space-x-2 pt-2">
        <button
          type="button"
          onClick={() =>
            toast.info("Vui lòng liên hệ Quản trị viên IT để thay đổi mật khẩu hệ thống.")
          }
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-slate-200 py-2.5 text-xs font-extrabold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <KeyRoundIcon className="size-3.5" />
          <span>Đổi Mật Khẩu</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl border border-rose-300 bg-rose-50 py-2.5 text-xs font-extrabold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
        >
          <LogOutIcon className="size-3.5" />
          <span>Đăng Xuất</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-700"
        >
          <ShieldCheckIcon className="size-3.5" />
          <span>Đóng</span>
        </button>
      </div>
    </ProtoModal>
  )
}

function Field({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div>
      <span className="block text-[10px] text-muted">{label}:</span>
      <span className={`text-sm font-bold text-title ${className ?? ""}`}>
        {value}
      </span>
    </div>
  )
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 first:border-t-0 first:pt-0 dark:border-slate-800">
      <span className="text-muted">{label}:</span>
      <span className={`font-bold ${valueClass ?? "text-title"}`}>{value}</span>
    </div>
  )
}

export default StaffProfileModal