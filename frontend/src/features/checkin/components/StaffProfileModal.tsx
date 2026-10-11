import { KeyRoundIcon, ShieldCheckIcon, UserShieldIcon } from "lucide-react"
import { toast } from "sonner"

import ProtoModal from "./ProtoModal"

interface StaffProfileModalProps {
  open: boolean
  onClose: () => void
}

/** Hồ sơ Nhân viên Vận hành — bám prototype staff.html */
function StaffProfileModal({ open, onClose }: StaffProfileModalProps) {
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
          NV
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h2 className="truncate text-lg font-black text-white">
              Nguyễn Văn Staff
            </h2>
            <span className="ml-2 inline-flex shrink-0 items-center rounded-full bg-emerald-500 px-2.5 py-0.5 text-[9.5px] font-black text-slate-950 shadow-sm">
              ĐANG TRONG CA TRỰC
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-blue-200">
            Chuyên viên Vận hành Kho & Quản lý Thẻ từ / PIN Smart Lock
          </p>
          <div className="mt-1 flex items-center space-x-3 font-mono text-[10px] text-slate-300">
            <span>
              Mã NV: <b className="text-white">ST-391-8899</b>
            </span>
            <span>•</span>
            <span>
              Chi nhánh: <b className="text-white">Quận 9 (Khu FPT)</b>
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
          <Field label="Họ và Tên" value="Nguyễn Văn Staff" />
          <Field
            label="Mã Nhân Viên"
            value="ST-391-8899"
            className="font-mono text-blue-600 dark:text-blue-400"
          />
          <Field label="Số Điện Thoại Ca Trực" value="0909 888 999" />
          <Field label="Email Công Việc" value="staff.nguyen@swp391.vn" />
        </div>
      </div>

      {/* SECTION 2 */}
      <div className="inner-box space-y-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3.5">
        <div className="flex items-center justify-between border-b border-blue-200 pb-1 dark:border-blue-800/40">
          <span className="text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:text-blue-400">
            2. Quyền hạn Vận hành & Phân công
          </span>
          <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
            CA SÁNG: 07:00 - 15:00
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <Row label="Tầng & Ô kho quản lý" value="Tầng 1, Tầng 2 & Tầng 3" />
          <Row
            label="Quyền hạn Cấp PIN Cổng"
            value="Cấp PIN Khẩn cấp (Staff Gate PIN)"
            valueClass="text-emerald-600 dark:text-emerald-400"
          />
          <Row
            label="Quyền Duyệt Vận hành"
            value="✓ Check-in, Trả kho, Đóng kho Quá hạn"
            valueClass="text-blue-600 dark:text-blue-400"
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center space-x-2 pt-2">
        <button
          type="button"
          onClick={() =>
            toast.info("Tính năng Đổi mật khẩu tài khoản Chuyên viên Vận hành")
          }
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-slate-200 py-2.5 text-xs font-extrabold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <KeyRoundIcon className="size-3.5" />
          <span>Đổi Mật Khẩu</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-700"
        >
          <ShieldCheckIcon className="size-3.5" />
          <span>Hoàn Tất & Đóng</span>
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
