// Manager giao việc cụ thể cho Staff đang trực ca (đề: "Assign facility staff to support handover,
// unit inspection, or problem handling"). Khớp StaffTaskResponse / StaffTaskCreateRequest của BE (/api/manager/tasks).

/** BE hiện nhận 2 loại; 2 loại sau đã đề xuất cho BE (viec-gap-luong-chinh.md, G3) */
export type TaskType = "MAINTENANCE" | "CHECKOUT_INSPECTION" | "CHECKIN_HANDOVER" | "INCIDENT"

export type TaskStatus = "ASSIGNED" | "DONE" | "CANCELED"

export interface StaffTask {
  taskId: number
  facilityId: number
  assignedEmployeeId: number
  employeeName: string | null
  assignedByAccountId: number | null
  taskType: string
  unitCode: string | null
  contractId: number | null
  note: string | null
  status: string
  /** YYYY-MM-DD */
  workDate: string
  shiftId: number
  shiftName: string | null
  createdAt: string
  doneAt: string | null
}

/** Body POST /api/manager/tasks. Bảo trì gửi unitCode; nghiệm thu trả kho gửi contractId */
export interface CreateTaskRequest {
  taskType: TaskType
  employeeId: number
  date: string
  shiftId: number
  unitCode?: string
  contractId?: number
  note?: string
}

export interface TaskFilter {
  query: string
  status: TaskStatus | "ALL"
}

/** Dữ liệu đang nhập trong ngăn "Giao việc mới" (chuỗi rỗng = chưa chọn) */
export interface TaskForm {
  shiftId: string
  employeeId: string
  taskType: "MAINTENANCE" | "CHECKOUT_INSPECTION"
  /** unitCode (bảo trì) hoặc contractId (nghiệm thu trả kho) */
  target: string
  note: string
}
