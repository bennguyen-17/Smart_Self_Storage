import { IdCardIcon, LogOutIcon, ShieldCheckIcon } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { getFacilities } from "@/features/floorplan/api/floorPlanApi"
import { useAsyncData } from "@/hooks/useAsyncData"

import { initials } from "../initials"

export interface PortalProfile {
  accountId: number | null
  fullName: string
  roleLabel: string
  email: string | null
  phone: string | null
  /** null = toàn hệ thống (Admin, BOM) */
  facilityId: number | null
}

/**
 * Popup hồ sơ nhân sự của cổng nội bộ, cùng kiểu "Hồ sơ khách hàng" ở cổng khách của Tâm:
 * dải tên + vai trò, lưới thông tin, nút Đăng xuất. Chỉ xem: thông tin tài khoản nội bộ do Admin quản lý.
 */
function PortalProfileModal({ profile, onClose, onLogout }: { profile: PortalProfile; onClose: () => void; onLogout: () => void }) {
  const facilities = useAsyncData(profile.facilityId !== null ? "profile-facilities" : null, getFacilities)
  const facility = facilities.data?.find((f) => f.facilityId === profile.facilityId)
  const facilityText =
    profile.facilityId === null
      ? "Toàn hệ thống"
      : facility
        ? facility.facilityName
        : facilities.isLoading
          ? "Đang tải…"
          : `Cơ sở #${profile.facilityId}`

  const fields: { label: string; value: string; mono?: boolean; wide?: boolean }[] = [
    { label: "Họ và tên", value: profile.fullName },
    { label: "Mã nhân sự", value: profile.accountId !== null ? `#${profile.accountId}` : "—", mono: true },
    { label: "Số điện thoại", value: profile.phone || "Chưa cập nhật" },
    { label: "Cơ sở phụ trách", value: facilityText, wide: true },
    { label: "Email", value: profile.email || "Chưa cập nhật", wide: true },
  ]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md gap-4 rounded-3xl p-5 sm:max-w-md sm:p-6">
        <div className="flex items-center gap-2.5 border-b pb-3 pr-8">
          <div className="flex size-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
            <IdCardIcon className="size-4" aria-hidden="true" />
          </div>
          <DialogTitle className="text-sm font-extrabold tracking-wide">HỒ SƠ NHÂN SỰ</DialogTitle>
        </div>
        <DialogDescription className="sr-only">Thông tin tài khoản nội bộ đang đăng nhập</DialogDescription>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-blue-950 p-4 text-white shadow-inner sm:p-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-blue-300 bg-blue-600 text-xl font-black shadow-lg">
            {initials(profile.fullName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black">{profile.fullName}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-slate-950">
              <ShieldCheckIcon className="size-3" aria-hidden="true" />
              {profile.roleLabel}
            </span>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border bg-slate-50 p-3.5 text-xs dark:bg-slate-800/50">
          <p className="border-b pb-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">Thông tin tài khoản</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5">
            {fields.map((f) => (
              <div key={f.label} className={f.wide ? "col-span-2" : undefined}>
                <dt className="mb-0.5 text-slate-500 dark:text-slate-400">{f.label}</dt>
                <dd className={`font-semibold text-slate-900 dark:text-white ${f.wide ? "break-words" : "truncate"} ${f.mono ? "font-mono" : ""}`}>{f.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Muốn đổi thông tin hoặc vai trò, vui lòng liên hệ quản trị hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-rose-500 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
        >
          <LogOutIcon className="size-3.5" aria-hidden="true" /> Đăng xuất
        </button>
      </DialogContent>
    </Dialog>
  )
}

export default PortalProfileModal
