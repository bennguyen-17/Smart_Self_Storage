// Luật của trang Giao việc. Hàm thuần, kiểm bằng bảng DDT.

import type { BadgeTone } from "@/components/internal/components/PanelKit"
import { matchesQuery } from "@/components/internal/textSearch"
import type { DaySchedule, DayShift } from "@/features/manager/shifts/types"
import type { FacilityContract } from "@/features/manager/contracts/types"
import { normalizeUnitStatus } from "@/features/manager/units/unitRules"
import type { ManagerUnit } from "@/features/manager/units/types"

import type { CreateTaskRequest, StaffTask, TaskFilter, TaskForm, TaskStatus } from "./types"

export const TASK_TYPE_LABEL: Record<string, string> = {
  MAINTENANCE: "Bảo trì / vệ sinh ô kho",
  CHECKOUT_INSPECTION: "Nghiệm thu trả kho",
  CHECKIN_HANDOVER: "Hỗ trợ bàn giao (nhận kho)",
  INCIDENT: "Xử lý sự cố",
}

/** Loại BE đang nhận khi tạo việc; thêm loại mới ở đây khi BE hỗ trợ */
export const CREATABLE_TASK_TYPES = ["MAINTENANCE", "CHECKOUT_INSPECTION"] as const

export function taskTypeLabel(type: string): string {
  return TASK_TYPE_LABEL[type] ?? type
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  ASSIGNED: "Đang chờ làm",
  DONE: "Đã xong",
  CANCELED: "Đã hủy",
}

const STATUS_TONE: Record<TaskStatus, BadgeTone> = {
  ASSIGNED: "amber",
  DONE: "green",
  CANCELED: "slate",
}

/** BE có lúc viết CANCELLED; gộp về một cách viết. Trạng thái lạ coi như đang chờ để Manager vẫn thấy */
export function taskStatus(status: string): TaskStatus {
  const s = status.trim().toUpperCase()
  if (s === "DONE") return "DONE"
  if (s === "CANCELED" || s === "CANCELLED") return "CANCELED"
  return "ASSIGNED"
}

export function taskStatusTone(status: string): BadgeTone {
  return STATUS_TONE[taskStatus(status)]
}

/** Lọc theo trạng thái và từ khóa (tên nhân viên, ca, mã ô, ghi chú). Việc đang chờ lên trước, rồi theo ca */
export function filterTasks(tasks: readonly StaffTask[], filter: TaskFilter): StaffTask[] {
  const order: Record<TaskStatus, number> = { ASSIGNED: 0, DONE: 1, CANCELED: 2 }
  return tasks
    .filter((t) => filter.status === "ALL" || taskStatus(t.status) === filter.status)
    .filter((t) =>
      matchesQuery(filter.query, [t.employeeName, t.shiftName, t.unitCode, t.note, taskTypeLabel(t.taskType)])
    )
    .sort(
      (a, b) =>
        order[taskStatus(a.status)] - order[taskStatus(b.status)] ||
        a.shiftId - b.shiftId ||
        a.taskId - b.taskId
    )
}

export function taskSummary(tasks: readonly StaffTask[]): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = { ASSIGNED: 0, DONE: 0, CANCELED: 0 }
  for (const t of tasks) counts[taskStatus(t.status)] += 1
  return counts
}

/** Chỉ giao việc được cho ca đã có người trực (BE chặn người chưa được xếp vào ca) */
export function staffedShifts(schedule: DaySchedule | undefined): DayShift[] {
  return (schedule?.shifts ?? []).filter((s) => s.staff.length > 0)
}

/** Ô kho đang bảo trì, chưa có việc bảo trì đang chờ trong cùng ca (BE báo trùng) */
export function maintenanceTargets(
  units: readonly ManagerUnit[],
  tasks: readonly StaffTask[],
  shiftId: number | null
): ManagerUnit[] {
  const busy = new Set(
    tasks
      .filter((t) => t.taskType === "MAINTENANCE" && taskStatus(t.status) === "ASSIGNED" && t.shiftId === shiftId)
      .map((t) => t.unitCode)
  )
  return units
    .filter((u) => normalizeUnitStatus(u.status) === "UNDER_MAINTENANCE" && !busy.has(u.unitCode))
    .sort((a, b) => a.unitCode.localeCompare(b.unitCode))
}

/**
 * Hợp đồng giao nghiệm thu trả kho được: đang hiệu lực hoặc quá hạn, chưa có việc nghiệm thu đang chờ.
 * Hết hạn sớm nhất lên trước (khách sắp trả kho).
 */
export function inspectionTargets(
  contracts: readonly FacilityContract[],
  tasks: readonly StaffTask[]
): FacilityContract[] {
  const busy = new Set(
    tasks
      .filter((t) => t.taskType === "CHECKOUT_INSPECTION" && taskStatus(t.status) === "ASSIGNED")
      .map((t) => t.contractId)
  )
  return contracts
    .filter((c) => (c.status === "ACTIVE" || c.status === "OVERDUE") && !busy.has(c.contractId))
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
}

export const TASK_NOTE_MAX = 500

export type TaskFormErrors = Partial<Record<keyof TaskForm, string>>

export function taskFormErrors(form: TaskForm): TaskFormErrors {
  const errors: TaskFormErrors = {}
  if (!form.shiftId) errors.shiftId = "Chọn ca làm việc"
  if (!form.employeeId) errors.employeeId = "Chọn nhân viên trong ca"
  if (!form.target) {
    errors.target = form.taskType === "MAINTENANCE" ? "Chọn ô kho cần bảo trì" : "Chọn hợp đồng cần nghiệm thu"
  }
  if (form.note.trim().length > TASK_NOTE_MAX) errors.note = `Ghi chú tối đa ${TASK_NOTE_MAX} ký tự`
  return errors
}

/** Đổi dữ liệu form sang body BE: bảo trì gửi unitCode, nghiệm thu gửi contractId (BE từ chối nếu gửi cả hai) */
export function toCreateRequest(form: TaskForm, date: string): CreateTaskRequest {
  const note = form.note.trim()
  return {
    taskType: form.taskType,
    employeeId: Number(form.employeeId),
    date,
    shiftId: Number(form.shiftId),
    ...(form.taskType === "MAINTENANCE" ? { unitCode: form.target } : { contractId: Number(form.target) }),
    ...(note ? { note } : {}),
  }
}
