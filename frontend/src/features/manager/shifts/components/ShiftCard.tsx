import { useState } from "react"
import { MoonIcon, SunIcon, SunsetIcon, TriangleAlertIcon, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { StatusBadge } from "@/components/internal/components/PanelKit"
import { initials } from "@/components/internal/initials"
import type { ManagerContext } from "@/features/manager/units/types"
import { readableError } from "@/components/internal/readableError"

import { saveShift } from "../api/shiftApi"
import { onDutyOf, otherShiftsOf, pickableStaff, shiftPeriod, shiftTimeLabel, type ShiftPeriod } from "../shiftRules"
import type { DaySchedule, DayShift, FacilityStaff } from "../types"

const PERIOD_ICON: Record<ShiftPeriod, LucideIcon> = {
  morning: SunIcon,
  afternoon: SunsetIcon,
  night: MoonIcon,
}

const fieldClass =
  "inner-box text-title w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"

/**
 * Một ca trong ngày: tên + giờ ca lấy từ bảng Shift, **một người trực** (nhóm chốt 03/11), đổi người bằng ô chọn rồi "Lưu".
 * Mỗi ca 1 người nên sự cố khách gửi trong ca luôn được phân cho đúng người đang trực.
 */
function ShiftCard({
  ctx,
  schedule,
  shift,
  staff,
  readOnly = false,
  onSaved,
}: {
  ctx: ManagerContext
  schedule: DaySchedule
  shift: DayShift
  staff: readonly FacilityStaff[]
  /** Ngày đã qua: chỉ xem ai đã trực, không sửa (tránh làm sai lịch sử ca và số liệu Hoạt động nhân viên) */
  readOnly?: boolean
  onSaved: (message: string) => void
}) {
  const Icon = PERIOD_ICON[shiftPeriod(shift.startTime)]
  const current = onDutyOf(shift)
  const [pickId, setPickId] = useState(current ? String(current.employeeId) : "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = pickableStaff(staff, ctx.facilityId)
  const picked = options.find((s) => String(s.employeeId) === pickId) ?? null
  // Dữ liệu cũ còn nhiều người trong ca: lưu lại là chuẩn hóa về 1 người
  const extra = shift.staff.length > 1
  const changed = extra || (picked?.employeeId ?? null) !== (current?.employeeId ?? null)
  const others = picked ? otherShiftsOf(schedule, picked.employeeId, shift.shiftId) : []
  const titleId = `shift-${shift.shiftId}-title`

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await saveShift(ctx, schedule.date, shift.shiftId, picked ? [picked.employeeId] : [])
      onSaved(picked ? `Đã đổi người trực ${shift.shiftName}: ${picked.fullName}` : `Đã để trống ${shift.shiftName}`)
    } catch (err) {
      setError(readableError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby={titleId} className="card-box flex flex-col gap-4 rounded-2xl border p-4 shadow-sm">
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-title text-sm font-black">
              {shift.shiftName}
            </h2>
            <p className="text-muted text-xs tabular-nums">{shiftTimeLabel(shift.startTime, shift.endTime)}</p>
          </div>
        </div>
        <StatusBadge tone={current ? "blue" : "red"}>{current ? "Có người trực" : "Chưa có người"}</StatusBadge>
      </header>

      {current ? (
        <div className="flex items-center gap-2.5 rounded-xl px-1 py-1">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white"
          >
            {initials(current.fullName)}
          </span>
          <div className="min-w-0 text-xs">
            <p className="text-muted">Người trực</p>
            <p className="text-title truncate font-bold">{current.fullName}</p>
          </div>
        </div>
      ) : (
        <p className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <TriangleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
          Ca chưa có người trực
        </p>
      )}

      {extra && (
        <p className="text-xs font-semibold [overflow-wrap:anywhere] text-amber-700 dark:text-amber-300">
          Ca đang có {shift.staff.length} người ({shift.staff.map((a) => a.fullName).join(", ")}). Mỗi ca chỉ 1 người: chọn người
          trực rồi Lưu.
        </p>
      )}

      <fieldset className="mt-auto space-y-2 border-t pt-3" disabled={saving || readOnly}>
        <legend className="sr-only">Đổi người trực {shift.shiftName}</legend>
        {readOnly && <p className="text-muted text-xs font-semibold">Ngày đã qua: chỉ xem, không đổi được người trực.</p>}
        <label className="block space-y-1 text-xs font-bold">
          <span className="text-title">Người trực</span>
          <select
            aria-label={`Người trực ${shift.shiftName}`}
            value={pickId}
            onChange={(e) => setPickId(e.target.value)}
            className={fieldClass}
          >
            <option value="">— Chưa xếp người —</option>
            {options.map((s) => (
              <option key={s.employeeId} value={s.employeeId}>
                {s.fullName}
              </option>
            ))}
          </select>
        </label>
        {others.length > 0 && (
          <p className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <TriangleAlertIcon aria-hidden="true" className="size-3 shrink-0" />
            {picked?.fullName} cũng đang trực {others.join(", ")} hôm nay
          </p>
        )}
        <Button
          size="sm"
          className={cn("w-full bg-blue-600 text-white hover:bg-blue-500")}
          disabled={!changed || saving || readOnly}
          title={changed ? undefined : "Chưa có thay đổi nào"}
          aria-label={`Lưu ${shift.shiftName}`}
          onClick={save}
        >
          {saving && <Spinner />}
          Lưu
        </Button>
        {error && (
          <p role="alert" className="text-xs font-semibold [overflow-wrap:anywhere] text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
      </fieldset>
    </section>
  )
}

export default ShiftCard
