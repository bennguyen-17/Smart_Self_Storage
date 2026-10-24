import { useEffect, useState } from "react"
import { ClockIcon, PlayIcon } from "lucide-react"
import { toast } from "sonner"

import { getErrorMessage } from "@/lib/api"

import { startCurrentShift } from "@/features/staff/shifts/api/staffShiftApi"
import {
  getStaffProfile,
  type StaffProfileData,
} from "@/features/staff/services/staffProfileService"
import StaffProfileModal from "./StaffProfileModal"

export default function StaffShiftBadge() {
  const [profile, setProfile] = useState<StaffProfileData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    let isMounted = true
    getStaffProfile()
      .then((data) => {
        if (isMounted && data && data.success) {
          setProfile(data)
        }
      })
      .catch((err) => {
        console.error("Lỗi tải thông tin ca trực cho badge:", err)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const shiftStatus = profile?.shiftStatus || "NO_SHIFT"
  const shifts = profile?.assignedShifts || []
  const currentShift = shifts.find((s) => s.isCurrent) || shifts[0]
  const attended = started || currentShift?.status === "ATTENDED"

  async function handleStartShift() {
    setStarting(true)
    try {
      await startCurrentShift()
      setStarted(true)
      toast.success(
        currentShift
          ? `Đã bắt đầu ca ${currentShift.shiftName}`
          : "Đã bắt đầu ca"
      )
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setStarting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {shiftStatus === "IN_SHIFT" && currentShift && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            title="Nhấp để xem chi tiết ca trực & hồ sơ nhân viên"
            className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-200/90 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 cursor-pointer shadow-2xs"
          >
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            <span>
              {attended ? "Ca Trực Hoạt Động" : "Trong Ca · Chưa Bắt Đầu"} (
              {currentShift.shiftName}: {currentShift.startTime} -{" "}
              {currentShift.endTime})
            </span>
          </button>
        )}

        {shiftStatus === "IN_SHIFT" && currentShift && !attended && (
          <button
            type="button"
            onClick={handleStartShift}
            disabled={starting}
            className="flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-2xs transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
          >
            <PlayIcon className="size-3" />
            <span>{starting ? "Đang bắt đầu…" : "Bắt đầu ca"}</span>
          </button>
        )}

        {shiftStatus === "UPCOMING" && currentShift && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            title="Nhấp để xem chi tiết ca trực & hồ sơ nhân viên"
            className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/80 px-3 py-1 text-xs font-bold text-amber-900 transition hover:bg-amber-200/90 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300 cursor-pointer shadow-2xs"
          >
            <ClockIcon className="size-3 text-amber-600 dark:text-amber-400" />
            <span>
              Ca Sắp Tới ({currentShift.shiftName}: {currentShift.startTime} - {currentShift.endTime})
            </span>
          </button>
        )}

        {shiftStatus === "ENDED" && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            title="Nhấp để xem chi tiết ca trực & hồ sơ nhân viên"
            className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer shadow-2xs"
          >
            <span className="size-2 rounded-full bg-slate-400" />
            <span>Đã Hết Ca Trực Hôm Nay</span>
          </button>
        )}

        {shiftStatus === "NO_SHIFT" && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            title="Nhấp để xem chi tiết ca trực & hồ sơ nhân viên"
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/70 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 cursor-pointer shadow-2xs"
          >
            <span className="size-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Chưa Có Phân Ca Hôm Nay</span>
          </button>
        )}
      </div>

      <StaffProfileModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
