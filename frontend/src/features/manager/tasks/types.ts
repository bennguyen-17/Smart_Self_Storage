// Manager giao việc cụ thể cho Staff đang trực ca (đề: "Assign facility staff to support handover,
// unit inspection, or problem handling"). Khớp StaffTaskResponse / StaffTaskCreateRequest của BE (/api/manager/tasks).

/** 4 loại việc BE nhận (2 loại sau BE thêm 26/10, PR #94) */
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

/**
 * Body POST /api/manager/tasks. Bảo trì gửi unitCode; nghiệm thu trả kho và hỗ trợ bàn giao gửi contractId;
 * xử lý sự cố gửi unitCode của ticket (BE chưa có trường ticketId, mã ticket ghi vào note)
 */
export interface CreateTaskRequest {
  taskType: TaskType
  employeeId: number
  date: string
  shiftId: number
  unitCode?: string
  contractId?: number
  note?: string
}

/** Phần ticket dùng khi giao việc xử lý sự cố */
export interface IncidentTicket {
  id: number
  ticketCode: string
  unitCode?: string | null
  title?: string | null
  customerName?: string | null
  status: string
}

export interface TaskFilter {
  query: string
  status: TaskStatus | "ALL"
}

/** Dữ liệu đang nhập trong ngăn "Giao việc mới" (chuỗi rỗng = chưa chọn) */
export interface TaskForm {
  shiftId: string
  employeeId: string
  taskType: TaskType
  /** unitCode (bảo trì), contractId (nghiệm thu, bàn giao) hoặc id ticket (sự cố) */
  target: string
  note: string
}
