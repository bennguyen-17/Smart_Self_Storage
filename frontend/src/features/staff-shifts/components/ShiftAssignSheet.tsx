import { useState } from "react"
import { PlusIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import type { ManagerContext } from "@/features/unit-management/types"
import { getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"

import { saveShift } from "../api/shiftApi"
import { addAssignment, assignableStaff, DUTY_LABEL, otherShiftsOf, SHIFTS } from "../shiftRules"
import type { DaySchedule, Duty, FacilityStaff, ShiftAssignment, ShiftKey } from "../types"

const fieldClass =
  "w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"

/** Ngăn phân công một ca: thêm / bỏ người trực và chọn việc cho từng người, rồi lưu cả ca */
function ShiftAssignSheet({
  ctx,
  schedule,
  shift,
  staff,
  onClose,
  onSaved,
}: {
  ctx: ManagerContext
  schedule: DaySchedule
  shift: ShiftKey
  staff: readonly FacilityStaff[]
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const meta = SHIFTS.find((s) => s.key === shift)!
  const initial = schedule.shifts.find((s) => s.shift === shift)?.assignments ?? []
  const [draft, setDraft] = useState<ShiftAssignment[]>(initial)
  const [pickId, setPickId] = useState("")
  const [pickDuty, setPickDuty] = useState<Duty>("CHECKIN")
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const options = assignableStaff(staff, ctx.facilityId, draft)
  const picked = options.find((s) => String(s.accountId) === pickId)
  const changed = JSON.stringify(draft) !== JSON.stringify(initial)
  const shiftLabel = (k: ShiftKey) => SHIFTS.find((s) => s.key === k)!.label.toLowerCase()

  function add() {
    if (!picked) return
    setDraft((d) => addAssignment(d, picked, pickDuty))
    setPickId("")
  }

  async function save() {
    setSubmitting(true)
    setServerError(null)
    try {
      await saveShift(ctx, schedule.date, shift, draft)
      onSaved(`Đã lưu phân công ${meta.label.toLowerCase()} ngày ${formatDate(schedule.date)}`)
    } catch (err) {
      setServerError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="top-0 right-0 left-auto flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-md data-open:slide-in-from-right-10 data-open:zoom-in-100 data-closed:slide-out-to-right-10 data-closed:zoom-out-100">
        <DialogHeader className="border-b p-4 pr-12">
          <DialogTitle className="text-base font-black">Phân công {meta.label.toLowerCase()}</DialogTitle>
          <DialogDescription>
            {formatDate(schedule.date)} · {meta.time}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold">Người trực ({draft.length})</h3>
            {draft.length === 0 ? (
              <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Ca này chưa có ai trực.</p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {draft.map((a) => {
                  const others = otherShiftsOf(schedule, a.accountId, shift)
                  return (
                    <li key={a.accountId} className="flex items-start justify-between gap-2 p-3">
                      <div className="min-w-0 text-xs">
                        <p className="font-bold">{a.fullName}</p>
                        <p className="text-muted-foreground">{DUTY_LABEL[a.duty]}</p>
                        {others.length > 0 && (
                          <p className="mt-0.5 flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300">
                            <TriangleAlertIcon aria-hidden="true" className="size-3" />
                            Cũng trực {others.map(shiftLabel).join(", ")} hôm nay
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={submitting}
                        aria-label={`Bỏ ${a.fullName} khỏi ca`}
                        onClick={() => setDraft((d) => d.filter((x) => x.accountId !== a.accountId))}
                      >
                        <XIcon aria-hidden="true" />
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <fieldset className="space-y-2 rounded-xl border p-3" disabled={submitting}>
            <legend className="px-1 text-sm font-bold">Thêm người trực</legend>
            <label className="block space-y-1 text-xs font-bold">
              <span>Nhân viên của cơ sở</span>
              <select value={pickId} onChange={(e) => setPickId(e.target.value)} className={fieldClass}>
                <option value="">{options.length === 0 ? "Không còn nhân viên để thêm" : "Chọn nhân viên"}</option>
                {options.map((s) => (
                  <option key={s.accountId} value={s.accountId}>
                    {s.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-xs font-bold">
              <span>Việc phụ trách</span>
              <select value={pickDuty} onChange={(e) => setPickDuty(e.target.value as Duty)} className={fieldClass}>
                {(Object.keys(DUTY_LABEL) as Duty[]).map((d) => (
                  <option key={d} value={d}>
                    {DUTY_LABEL[d]}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="outline" size="sm" disabled={!picked} onClick={add}>
              <PlusIcon aria-hidden="true" /> Thêm vào ca
            </Button>
          </fieldset>

          {serverError && (
            <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {serverError}
            </p>
          )}
        </div>

        <DialogFooter className="m-0 flex-row justify-end gap-2 rounded-none border-t p-4">
          <Button variant="outline" disabled={submitting} onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={submitting || !changed}
            title={changed ? undefined : "Chưa có thay đổi nào"}
            onClick={save}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            {submitting && <Spinner />}
            Lưu phân công
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ShiftAssignSheet
