import type { ActivityLogEntry } from "@/features/admin/audit-logs/types"

export interface StaffActivity {
  employeeId: number
  accountId: number
  fullName: string
  attended: boolean
  checkIns: number
  checkouts: number
  ticketsResolved: number
  maintenanceDone: number
  tasksDone?: number
  // Phút trung bình từ lúc tạo đến lúc nhận ticket, null nếu chưa nhận
  avgTicketAcceptMinutes: number | null
}

export interface ShiftActivity {
  shiftId: number
  shiftName: string
  startTime: string
  endTime: string
  staff: StaffActivity[]
}

export interface StaffActivityDay {
  date: string
  shifts: ShiftActivity[]
}

export interface FacilityLogEntry extends ActivityLogEntry {
  facilityId: number | null
  facilityCode: string | null
}
