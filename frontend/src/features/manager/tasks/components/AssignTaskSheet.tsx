import { useState } from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { listFacilityContracts } from "@/features/manager/contracts/api/contractApi"
import { getDaySchedule } from "@/features/manager/shifts/api/shiftApi"
import { getManagerUnits } from "@/features/manager/units/api/unitManagementApi"
import type { ManagerContext } from "@/features/manager/units/types"
import { useAsyncData } from "@/hooks/useAsyncData"
import { getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"

import { createTask } from "../api/taskApi"
import {
  CREATABLE_TASK_TYPES,
  inspectionTargets,
  maintenanceTargets,
  staffedShifts,
  TASK_NOTE_MAX,
  TASK_TYPE_LABEL,
  taskFormErrors,
  toCreateRequest,
} from "../taskRules"
import type { StaffTask, TaskForm } from "../types"

const EMPTY_FORM: TaskForm = { shiftId: "", employeeId: "", taskType: "MAINTENANCE", target: "", note: "" }

const SELECT_CLASS =
  "inner-box text-title w-full cursor-pointer rounded-lg border px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-rose-500"

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
      {message}
    </p>
  )
}

/**
 * Ngăn bên phải "Giao việc mới": chọn ca → người đang trực ca đó → loại việc → ô kho / hợp đồng.
 * Chỉ liệt kê đối tượng hợp lệ (ô đang bảo trì, hợp đồng đang thuê hoặc quá hạn) để Manager khỏi chọn sai.
 */
function AssignTaskSheet({
  ctx,
  date,
  tasks,
  onClose,
  onDone,
}: {
  ctx: ManagerContext
  date: string
  /** Việc đã có trong ngày, để ẩn đối tượng đang có việc chờ (BE báo trùng) */
  tasks: readonly StaffTask[]
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [form, setForm] = useState<TaskForm>(EMPTY_FORM)
  const [showErrors, setShowErrors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const schedule = useAsyncData(`task-shifts:${date}`, () => getDaySchedule(ctx, date))
  const units = useAsyncData(
    form.taskType === "MAINTENANCE" ? "task-units" : null,
    () => getManagerUnits(ctx, {})
  )
  const contracts = useAsyncData(
    form.taskType === "CHECKOUT_INSPECTION" ? "task-contracts" : null,
    () => listFacilityContracts(ctx)
  )

  const shifts = staffedShifts(schedule.data)
  const shift = shifts.find((s) => String(s.shiftId) === form.shiftId)
  const unitOptions = maintenanceTargets(units.data ?? [], tasks, shift?.shiftId ?? null)
  const contractOptions = inspectionTargets(contracts.data ?? [], tasks)
  const targetsLoading = form.taskType === "MAINTENANCE" ? units.isLoading : contracts.isLoading
  const targetsError = form.taskType === "MAINTENANCE" ? units.error : contracts.error
  const errors = showErrors ? taskFormErrors(form) : {}

  const update = (patch: Partial<TaskForm>) => {
    setForm((f) => ({ ...f, ...patch }))
    setServerError(null)
  }

  async function submit() {
    setShowErrors(true)
    if (Object.keys(taskFormErrors(form)).length > 0) return
    setSubmitting(true)
    setServerError(null)
    try {
      const task = await createTask(ctx, toCreateRequest(form, date))
      onDone(`Đã giao "${TASK_TYPE_LABEL[form.taskType]}" cho ${task.employeeName ?? "nhân viên"}`)
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
          <DialogTitle className="text-base font-black">Giao việc mới</DialogTitle>
          <DialogDescription>Ngày làm việc {formatDate(date)}. Chỉ giao được cho nhân viên đang được xếp vào ca.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
          {schedule.error ? (
            <p role="alert" className="font-semibold text-rose-600 dark:text-rose-400">
              Không tải được lịch ca: {schedule.error}
            </p>
          ) : !schedule.isLoading && shifts.length === 0 ? (
            <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              Ngày này chưa có ca nào được xếp người. Vào trang <b>Phân công</b> xếp người trực trước, rồi quay lại giao việc.
            </p>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor="task-shift" className="font-bold">
              Ca làm việc <span className="text-rose-500">*</span>
            </label>
            <select
              id="task-shift"
              value={form.shiftId}
              disabled={submitting || schedule.isLoading || shifts.length === 0}
              onChange={(e) => update({ shiftId: e.target.value, employeeId: "", target: "" })}
              aria-invalid={Boolean(errors.shiftId)}
              aria-describedby="task-shift-error"
              className={SELECT_CLASS}
            >
              <option value="">{schedule.isLoading ? "Đang tải ca…" : "Chọn ca"}</option>
              {shifts.map((s) => (
                <option key={s.shiftId} value={s.shiftId}>
                  {s.shiftName} ({s.startTime}–{s.endTime}) · {s.staff.length} người
                </option>
              ))}
            </select>
            <FieldError id="task-shift-error" message={errors.shiftId} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="task-employee" className="font-bold">
              Nhân viên <span className="text-rose-500">*</span>
            </label>
            <select
              id="task-employee"
              value={form.employeeId}
              disabled={submitting || !shift}
              onChange={(e) => update({ employeeId: e.target.value })}
              aria-invalid={Boolean(errors.employeeId)}
              aria-describedby="task-employee-error"
              className={SELECT_CLASS}
            >
              <option value="">{shift ? "Chọn nhân viên" : "Chọn ca trước"}</option>
              {shift?.staff.map((p) => (
                <option key={p.employeeId} value={p.employeeId}>
                  {p.fullName}
                </option>
              ))}
            </select>
            <FieldError id="task-employee-error" message={errors.employeeId} />
          </div>

          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 font-bold">Loại việc</legend>
            <div className="grid grid-cols-2 gap-2">
              {CREATABLE_TASK_TYPES.map((type) => (
                <label
                  key={type}
                  className={cn(
                    "inner-box flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 font-semibold",
                    form.taskType === type && "border-blue-500 ring-2 ring-blue-500/30"
                  )}
                >
                  <input
                    type="radio"
                    name="task-type"
                    value={type}
                    checked={form.taskType === type}
                    disabled={submitting}
                    onChange={() => update({ taskType: type, target: "" })}
                    className="accent-blue-600"
                  />
                  {TASK_TYPE_LABEL[type]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label htmlFor="task-target" className="font-bold">
              {form.taskType === "MAINTENANCE" ? "Ô kho cần bảo trì" : "Hợp đồng cần nghiệm thu trả kho"}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <select
              id="task-target"
              value={form.target}
              disabled={submitting || targetsLoading}
              onChange={(e) => update({ target: e.target.value })}
              aria-invalid={Boolean(errors.target)}
              aria-describedby="task-target-hint"
              className={SELECT_CLASS}
            >
              <option value="">{targetsLoading ? "Đang tải…" : "Chọn"}</option>
              {form.taskType === "MAINTENANCE"
                ? unitOptions.map((u) => (
                    <option key={u.unitCode} value={u.unitCode}>
                      {u.unitCode}
                      {u.floorName ? ` · ${u.floorName}` : ""}
                    </option>
                  ))
                : contractOptions.map((c) => (
                    <option key={c.contractId} value={c.contractId}>
                      {c.contractCode} · {c.customerName} · Ô {c.unitCode} · hết hạn {formatDate(c.endDate)}
                    </option>
                  ))}
            </select>
            {targetsError ? (
              <p id="task-target-hint" role="alert" className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                Không tải được danh sách: {targetsError}
              </p>
            ) : errors.target ? (
              <FieldError id="task-target-hint" message={errors.target} />
            ) : (
              <p id="task-target-hint" className="text-muted-foreground text-[11px]">
                {form.taskType === "MAINTENANCE"
                  ? "Chỉ hiện ô đang ở trạng thái bảo trì và chưa có việc bảo trì trong ca này."
                  : "Chỉ hiện hợp đồng đang thuê hoặc quá hạn, chưa có ai được giao nghiệm thu."}
                {!targetsLoading &&
                  (form.taskType === "MAINTENANCE" ? unitOptions : contractOptions).length === 0 &&
                  " Hiện không có mục nào phù hợp."}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="task-note" className="font-bold">
              Ghi chú cho nhân viên
            </label>
            <Textarea
              id="task-note"
              rows={3}
              value={form.note}
              disabled={submitting}
              onChange={(e) => update({ note: e.target.value })}
              aria-invalid={Boolean(errors.note)}
              aria-describedby="task-note-hint"
              placeholder="VD: Kiểm tra ray cửa cuốn, thay bóng đèn trước 15:00."
              className="placeholder:text-slate-400"
            />
            <p
              id="task-note-hint"
              className={cn("text-[11px]", errors.note ? "font-semibold text-rose-600 dark:text-rose-400" : "text-muted-foreground")}
            >
              {errors.note ?? `Không bắt buộc, tối đa ${TASK_NOTE_MAX} ký tự.`}
            </p>
          </div>

          {serverError && (
            <p role="alert" className="font-semibold text-rose-600 dark:text-rose-400">
              {serverError}
            </p>
          )}
        </div>

        <DialogFooter className="m-0 flex-row justify-end gap-2 rounded-none border-t p-4">
          <Button variant="outline" disabled={submitting} onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={submitting} onClick={submit} className="bg-blue-600 text-white hover:bg-blue-500">
            {submitting && <Spinner />}
            Giao việc
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AssignTaskSheet
