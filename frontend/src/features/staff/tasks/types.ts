export type StaffTaskType = "MAINTENANCE" | "CHECKOUT_INSPECTION"

export type StaffTaskStatus = "ASSIGNED" | "DONE" | "CANCELLED"

/** Việc Manager giao cho Staff trong một ca (BR-50 / US-32). */
export interface StaffTask {
  taskId: number
  facilityId?: number | null
  assignedEmployeeId?: number | null
  assignedByAccountId?: number | null
  taskType: StaffTaskType
  unitCode?: string | null
  contractId?: number | null
  contractCode?: string | null
  note?: string | null
  status: StaffTaskStatus
  workDate: string
  shiftId?: number | null
  shiftName?: string | null
  createdAt?: string | null
  doneAt?: string | null
}
