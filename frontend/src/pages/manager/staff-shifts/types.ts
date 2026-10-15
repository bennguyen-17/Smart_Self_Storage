// US-32: phân ca nhân viên tại cơ sở (Facility Manager): chỉ cần biết AI trực CA NÀO, NGÀY NÀO.
// Không chia việc trong ca (góp ý của Bảo 14/10): nhân viên vào cổng Staff sẽ xử lý mọi việc của ca.
// Khớp bảng có sẵn trong DB: Shift (ca) và StaffShift (employeeId, facilityId, shiftId, workDate).
// BE CHƯA có API: path dưới đây là contract FE đề xuất (qa-log Q-31).

/** Nhân viên thuộc cơ sở (EmployeeProfile + Account) */
export interface FacilityStaff {
  employeeId: number
  fullName: string
  phone: string | null
  facilityId: number
  /** Tài khoản bị khóa thì không phân ca được */
  status: "ACTIVE" | "LOCKED"
}

export interface ShiftAssignment {
  employeeId: number
  fullName: string
}

/** Một ca trong ngày: giờ ca lấy từ bảng Shift (FE không ghi cứng) */
export interface DayShift {
  shiftId: number
  shiftName: string
  /** "HH:mm", ca qua đêm thì endTime < startTime (ví dụ 22:00 → 06:00) */
  startTime: string
  endTime: string
  staff: ShiftAssignment[]
}

/** GET /api/manager/shifts?date=YYYY-MM-DD */
export interface DaySchedule {
  date: string
  shifts: DayShift[]
}
