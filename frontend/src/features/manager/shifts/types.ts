export interface FacilityStaff {
  employeeId: number
  fullName: string
  phone: string | null
  facilityId: number
  // Tài khoản bị khóa không phân ca được
  status: "ACTIVE" | "LOCKED"
}

export interface ShiftAssignment {
  employeeId: number
  fullName: string
}

export interface DayShift {
  shiftId: number
  shiftName: string
  // HH:mm, ca qua đêm có endTime < startTime
  startTime: string
  endTime: string
  staff: ShiftAssignment[]
}

export interface DaySchedule {
  // YYYY-MM-DD
  date: string
  shifts: DayShift[]
}
