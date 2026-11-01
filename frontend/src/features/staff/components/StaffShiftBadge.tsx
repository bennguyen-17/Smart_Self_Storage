import { useEffect, useState } from "react"
import { SquareIcon } from "lucide-react"
import { toast } from "sonner"

import { getErrorMessage } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { endCurrentShift } from "@/features/staff/shifts/api/staffShiftApi"
import {
  getStaffProfile,
  type StaffProfileData,
} from "@/features/staff/shifts/api/staffProfileService"

export default function StaffShiftBadge() {
  const [profile, setProfile] = useState<StaffProfileData | null>(null)
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  const [ending, setEnding] = useState(false)

  const loadProfile = () => {
    getStaffProfile()
      .then((data) => {
        if (data && data.success) {
          setProfile(data)
        }
      })
      .catch((err) => {
        console.error("Lỗi tải thông tin ca trực cho badge:", err)
      })
  }

  useEffect(() => {
    loadProfile()

    const onShiftChanged = () => {
      loadProfile()
    }
    window.addEventListener("staff-shift-changed", onShiftChanged)
    return () => window.removeEventListener("staff-shift-changed", onShiftChanged)
  }, [])

  const shifts = profile?.assignedShifts || []
  const currentShift = shifts.find((s) => s.isCurrent || s.current) || shifts[0]
  const attended = currentShift?.status === "ATTENDED"

  // Cách 1: Chỉ khi nào nhân viên đang trong ca trực (attended) mới hiển thị
  // Còn khi chưa vào ca, chưa có ca hoặc hết ca thì ẩn hoàn toàn để Card to ở giữa lo thông báo
  if (!attended) {
    return null
  }

  async function handleEndShift() {
    setEnding(true)
    try {
      await endCurrentShift()
      setConfirmEndOpen(false)
      window.dispatchEvent(new CustomEvent("staff-shift-changed"))
      toast.success(
        currentShift
          ? `Đã kết thúc ca ${currentShift.shiftName} và bàn giao ca thành công.`
          : "Đã kết thúc ca làm việc và bàn giao thành công."
      )
      loadProfile()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setEnding(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/90 px-3 py-1 text-xs font-medium text-slate-700 select-none dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300"
        >
          <span className="size-1.5 rounded-full " />
          <span>
            {currentShift
              ? `${currentShift.shiftName} (${currentShift.startTime} - ${currentShift.endTime})`
              : ""}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setConfirmEndOpen(true)}
          disabled={ending}
          className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/90 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 cursor-pointer disabled:opacity-50"
          title="Kết thúc ca làm việc"
        >
          <SquareIcon className="size-2.5 fill-current text-rose-600 dark:text-rose-400" />
          <span>{ending ? "Đang kết thúc…" : "Kết thúc ca"}</span>
        </button>
      </div>

      <Dialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Xác Nhận Kết Thúc Ca Trực
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed" render={<div />}>
              <div className="text-sm text-slate-800 dark:text-slate-200">
                Bạn có chắc chắn muốn kết thúc{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentShift?.shiftName || "ca trực hiện tại"}
                </span>{" "}
                và bàn giao quầy không?
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Sau khi kết thúc ca, quyền thao tác nghiệp vụ tại quầy sẽ được
                khóa lại cho đến khi nhân viên ca tiếp theo tiếp nhận.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={ending}
              onClick={() => setConfirmEndOpen(false)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={ending}
              onClick={handleEndShift}
              className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
            >
              {ending ? "Đang xử lý…" : "Xác nhận kết thúc ca"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
}
