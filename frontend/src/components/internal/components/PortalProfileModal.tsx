import { IdCardIcon, LogOutIcon } from "lucide-react"

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
 * Popup hồ sơ nhân sự của cổng nội bộ (BOM, Manager, Admin),
 * đồng bộ thiết kế giống "Hồ sơ khách hàng":
 * icon thẻ ID, dải tên gradient, danh sách các dòng thẻ ngang bo góc, và nút Đăng xuất đỏ.
 */
function PortalProfileModal({
  profile,
  onClose,
  onLogout,
}: {
  profile: PortalProfile
  onClose: () => void
  onLogout: () => void
}) {
  const facilities = useAsyncData(
    profile.facilityId !== null ? "profile-facilities" : null,
    getFacilities
  )
  const facility = facilities.data?.find((f) => f.facilityId === profile.facilityId)
  const facilityText =
    profile.facilityId === null
      ? "Toàn hệ thống"
      : facility
        ? facility.facilityName
        : facilities.isLoading
          ? "Đang tải…"
          : `Cơ sở #${profile.facilityId}`

  const fields: { label: string; value: string; mono?: boolean }[] = [
    { label: "HỌ VÀ TÊN", value: profile.fullName },
    {
      label: "MÃ NHÂN SỰ",
      value: profile.accountId !== null ? `#${profile.accountId}` : "—",
      mono: true,
    },
    { label: "SỐ ĐIỆN THOẠI", value: profile.phone || "Chưa cập nhật", mono: true },
    { label: "EMAIL", value: profile.email || "Chưa cập nhật" },
    { label: "CƠ SỞ PHỤ TRÁCH", value: facilityText },
  ]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
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
        <DialogDescription className="sr-only">Thông tin tài khoản nội bộ đang đăng nhập</DialogDescription>

        {/* Banner đại diện */}
        <div className="relative flex items-center space-x-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-blue-950 p-4 text-white shadow-inner sm:p-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-blue-300 bg-gradient-to-tr from-blue-500 to-indigo-400 text-xl font-black text-white shadow-lg">
            {initials(profile.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black text-white">{profile.fullName}</h2>
            <span className="block mt-0.5 text-[11px] font-medium text-blue-200">
              {profile.roleLabel}
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
          onClick={onLogout}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 text-xs font-bold text-white shadow-md transition hover:bg-rose-700 active:scale-[0.99]"
        >
          <LogOutIcon className="size-4" aria-hidden="true" />
          <span>Đăng xuất</span>
        </button>
      </DialogContent>
    </Dialog>
  )
}

export default PortalProfileModal
