// US-32: phân ca và phân công nhân viên tại cơ sở (Facility Manager).
// BE CHƯA có API: kiểu dưới đây là contract FE đề xuất (xem qa-log).

/** 3 ca trong khung trực chuẩn 08:00–20:00 */
export type ShiftKey = "MORNING" | "AFTERNOON" | "EVENING"

/** Việc được giao trong ca */
export type Duty = "CHECKIN" | "INSPECTION" | "INCIDENT"

export interface FacilityStaff {
  accountId: number
  fullName: string
  phone: string | null
  facilityId: number
  /** Tài khoản bị khóa thì không phân ca được */
  status: "ACTIVE" | "LOCKED"
}

export interface ShiftAssignment {
  accountId: number
  fullName: string
  duty: Duty
}

export interface DayShift {
  shift: ShiftKey
  assignments: ShiftAssignment[]
}

/** GET /api/manager/shifts?date=YYYY-MM-DD */
export interface DaySchedule {
  date: string
  shifts: DayShift[]
}
