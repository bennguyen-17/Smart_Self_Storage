import { useEffect, useState } from "react"
import { ClockIcon, MoonIcon, PlayIcon } from "lucide-react"
import { toast } from "sonner"

import { getErrorMessage } from "@/lib/api"
import { startCurrentShift } from "@/features/staff/shifts/api/staffShiftApi"
import {
  getStaffProfile,
  type StaffProfileData,
} from "@/features/staff/shifts/api/staffProfileService"

interface StaffShiftRequiredCardProps {
  title?: string
  subtitle?: string
  onStarted?: () => void
}

export default function StaffShiftRequiredCard({
  title,
  subtitle,
  onStarted,
}: StaffShiftRequiredCardProps) {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<StaffProfileData | null>(null)

  useEffect(() => {
    getStaffProfile()
      .then((data) => {
        if (data && data.success) {
          setProfile(data)
        }
      })
      .catch(() => {})
  }, [])

  async function handleStart() {
    setLoading(true)
    try {
      await startCurrentShift()
      window.dispatchEvent(new CustomEvent("staff-shift-changed"))
      toast.success("Đã bắt đầu ca trực thành công!")
      onStarted?.()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const shiftStatus = profile?.shiftStatus
  const hasAssignedShifts = (profile?.assignedShifts?.length ?? 0) > 0

  const now = new Date()
  const currentHour = now.getHours()
  const isNormalBusinessHours = currentHour >= 8 && currentHour < 20

  let displayTitle = title || "Bạn chưa tiếp nhận ca trực được phân công"
  let displaySubtitle =
    subtitle ||
    "Vui lòng bắt đầu ca trực để kích hoạt quyền làm việc và xử lý nghiệp vụ tại quầy."
  let canStart = false

  if (profile) {
    if (shiftStatus === "IN_SHIFT") {
      const currentShift =
        profile.assignedShifts.find((s) => s.isCurrent || (s as any).current) ||
        profile.assignedShifts[0]
      if (currentShift?.status === "ATTENDED") {
        displayTitle = "Đang trong ca làm việc"
        displaySubtitle = currentShift
          ? `Bạn đang trong ca trực ${currentShift.shiftName} (${currentShift.startTime} - ${currentShift.endTime}). Bấm thử lại để tải dữ liệu hợp đồng.`
          : "Bạn đang trong ca làm việc. Bấm thử lại để tải dữ liệu hợp đồng."
        canStart = false
      } else {
        displayTitle = "Bạn chưa tiếp nhận ca trực được phân công"
        displaySubtitle = currentShift
          ? `Bạn có lịch trực ${currentShift.shiftName} (${currentShift.startTime} - ${currentShift.endTime}). Vui lòng bắt đầu ca trực để kích hoạt quyền làm việc tại quầy.`
          : "Vui lòng bắt đầu ca trực để kích hoạt quyền làm việc và xử lý nghiệp vụ tại quầy."
        canStart = true
      }
    } else if (shiftStatus === "UPCOMING") {
      const nextShift = profile.assignedShifts[0]
      displayTitle = "Chưa đến giờ ca trực"
      displaySubtitle = nextShift
        ? `Ca trực tiếp theo (${nextShift.shiftName}: ${nextShift.startTime} - ${nextShift.endTime}) chưa bắt đầu. Vui lòng quay lại khi đến giờ làm việc.`
        : "Chưa đến giờ vào ca làm việc được phân công."
      canStart = false
    } else if (shiftStatus === "ENDED") {
      displayTitle = "Ca trực hôm nay đã kết thúc"
      displaySubtitle =
        "Ca làm việc hôm nay của bạn đã kết thúc hoặc đã được bàn giao."
      canStart = false
    } else if (shiftStatus === "NO_SHIFT" || !hasAssignedShifts) {
      if (!isNormalBusinessHours) {
        displayTitle = "Hiện đang ngoài giờ làm việc"
        displaySubtitle =
          "Khung giờ vận hành quầy dịch vụ là từ 08:00 đến 20:00. Hiện không có ca trực nào đang hoạt động."
      } else {
        displayTitle = "Chưa có ca trực được phân công"
        displaySubtitle =
          "Bạn chưa được Quản lý phân công ca trực hôm nay. Vui lòng liên hệ Quản lý cơ sở để được xếp lịch làm việc."
      }
      canStart = false
    }
  } else if (!isNormalBusinessHours) {
    displayTitle = "Hiện đang ngoài giờ làm việc"
    displaySubtitle =
      "Khung giờ vận hành quầy dịch vụ là từ 08:00 đến 20:00. Hiện không có ca trực nào đang hoạt động."
    canStart = false
  }

  const showMoonIcon = !canStart && !isNormalBusinessHours && shiftStatus !== "IN_SHIFT"

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-indigo-50/80 p-8 shadow-sm backdrop-blur-md dark:border-blue-900/60 dark:from-slate-900/90 dark:via-blue-950/40 dark:to-slate-900/90 text-center">
      {/* Icon đồng hồ viền xanh chuẩn thiết kế (hoặc mặt trăng khi ngoài giờ không có ca) */}
      <div className="mx-auto mb-4 flex items-center justify-center text-blue-600 dark:text-blue-400">
        {showMoonIcon ? (
          <MoonIcon className="size-12 stroke-[2.5]" />
        ) : (
          <ClockIcon className="size-12 stroke-[2.5]" />
        )}
      </div>

      <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
        {displayTitle}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        {displaySubtitle}
      </p>

      {canStart ? (
        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={handleStart}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <PlayIcon className="size-3.5 fill-current" />
            <span>{loading ? "Đang bắt đầu…" : "Bắt Đầu Ca Ngay"}</span>
          </button>
        </div>
      ) : onStarted ? (
        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={onStarted}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-700 active:scale-[0.98] dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <span>Thử lại</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
