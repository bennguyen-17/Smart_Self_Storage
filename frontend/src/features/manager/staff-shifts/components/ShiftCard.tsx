import { useState } from "react"
import {
  MoonIcon,
  PlusIcon,
  SunIcon,
  SunsetIcon,
  TriangleAlertIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { StatusBadge } from "@/components/internal/components/PanelKit"
import { initials } from "@/components/internal/initials"
import type { ManagerContext } from "@/features/manager/unit-management/types"
import { getErrorMessage } from "@/lib/api"

import { saveShift } from "../api/shiftApi"
import {
  addAssignment,
  assignableStaff,
  otherShiftsOf,
  shiftPeriod,
  shiftTimeLabel,
  type ShiftPeriod,
} from "../shiftRules"
import type { DaySchedule, DayShift, FacilityStaff } from "../types"

const PERIOD_ICON: Record<ShiftPeriod, LucideIcon> = {
  morning: SunIcon,
  afternoon: SunsetIcon,
  night: MoonIcon,
}

const fieldClass =
  "inner-box text-title w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"

/**
 * Một ca trong ngày (theo prototype manager_portal): tên + giờ ca lấy từ bảng Shift,
 * danh sách người trực, chọn thêm người ngay trong thẻ và "Lưu".
 * Chỉ phân AI trực ca nào, không chia việc trong ca.
 */
function ShiftCard({
  ctx,
  schedule,
  shift,
  staff,
  onSaved,
}: {
  ctx: ManagerContext
  schedule: DaySchedule
  shift: DayShift
  staff: readonly FacilityStaff[]
  onSaved: (message: string) => void
}) {
  const Icon = PERIOD_ICON[shiftPeriod(shift.startTime)]
  const [draft, setDraft] = useState(shift.staff)
  const [pickId, setPickId] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = assignableStaff(staff, ctx.facilityId, draft)
  const picked = options.find((s) => String(s.employeeId) === pickId)
  const changed = JSON.stringify(draft) !== JSON.stringify(shift.staff)
  const titleId = `shift-${shift.shiftId}-title`

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await saveShift(
        ctx,
        schedule.date,
        shift.shiftId,
        draft.map((a) => a.employeeId)
      )
      onSaved(`Đã lưu ${shift.shiftName}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      aria-labelledby={titleId}
      className="card-box flex flex-col gap-4 rounded-2xl border p-4 shadow-sm"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-title text-sm font-black">
              {shift.shiftName}
            </h2>
            <p className="text-xs text-muted tabular-nums">
              {shiftTimeLabel(shift.startTime, shift.endTime)}
            </p>
          </div>
        </div>
        <StatusBadge tone={draft.length === 0 ? "red" : "blue"}>
          {draft.length} người trực
        </StatusBadge>
      </header>

      <div className="space-y-2">
        {draft.length === 0 ? (
          <p className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <TriangleAlertIcon
              aria-hidden="true"
              className="size-3.5 shrink-0"
            />
            Ca chưa có nhân viên trực
          </p>
        ) : (
          <ul className="space-y-1.5">
            {draft.map((a) => {
              const others = otherShiftsOf(
                schedule,
                a.employeeId,
                shift.shiftId
              )
              return (
                <li
                  key={a.employeeId}
                  className="flex items-center gap-2.5 rounded-xl px-1 py-1"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white"
                  >
                    {initials(a.fullName)}
                  </span>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="text-title truncate font-bold">
                      {a.fullName}
                    </p>
                    {others.length > 0 && (
                      <p className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300">
                        <TriangleAlertIcon
                          aria-hidden="true"
                          className="size-3 shrink-0"
                        />
                        Đã trực {others.join(", ")}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={saving}
                    aria-label={`Bỏ ${a.fullName} khỏi ${shift.shiftName}`}
                    onClick={() =>
                      setDraft((d) =>
                        d.filter((x) => x.employeeId !== a.employeeId)
                      )
                    }
                  >
                    <XIcon aria-hidden="true" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <fieldset className="mt-auto space-y-2 border-t pt-3" disabled={saving}>
        <legend className="sr-only">Thêm người vào {shift.shiftName}</legend>
        <select
          aria-label={`Nhân viên thêm vào ${shift.shiftName}`}
          value={pickId}
          onChange={(e) => setPickId(e.target.value)}
          className={fieldClass}
        >
          <option value="">
            {options.length === 0 ? "Hết nhân viên" : "Chọn nhân viên…"}
          </option>
          {options.map((s) => (
            <option key={s.employeeId} value={s.employeeId}>
              {s.fullName}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={!picked}
            onClick={() => {
              if (!picked) return
              setDraft((d) => addAssignment(d, picked))
              setPickId("")
            }}
          >
            <PlusIcon aria-hidden="true" /> Thêm
          </Button>
          <Button
            size="sm"
            className={cn("flex-1 bg-blue-600 text-white hover:bg-blue-500")}
            disabled={!changed || saving}
            title={changed ? undefined : "Chưa có thay đổi nào"}
            aria-label={`Lưu ${shift.shiftName}`}
            onClick={save}
          >
            {saving && <Spinner />}
            Lưu
          </Button>
        </div>
        {error && (
          <p
            role="alert"
            className="text-xs font-semibold text-rose-600 dark:text-rose-400"
          >
            {error}
          </p>
        )}
      </fieldset>
    </section>
  )
}

export default ShiftCard
