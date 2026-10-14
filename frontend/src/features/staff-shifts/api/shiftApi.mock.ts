// Dữ liệu mẫu phân ca cơ sở HN-01, dùng khi VITE_USE_MOCK=true.

import type { DaySchedule, FacilityStaff, ShiftAssignment, ShiftKey } from "../types"

const LATENCY = 250

const STAFF: FacilityStaff[] = [
  { accountId: 5, fullName: "Nguyễn Văn Nhân Viên 1", phone: "0933444555", facilityId: 1, status: "ACTIVE" },
  { accountId: 8, fullName: "Bùi Thị Lan", phone: "0933111222", facilityId: 1, status: "ACTIVE" },
  { accountId: 10, fullName: "Hoàng Minh Tuấn", phone: "0933777888", facilityId: 1, status: "ACTIVE" },
  { accountId: 11, fullName: "Đặng Văn Khoa", phone: null, facilityId: 1, status: "LOCKED" },
  // Nhân viên cơ sở khác: không được hiện trong danh sách chọn (AC US-32)
  { accountId: 6, fullName: "Phạm Thị Nhân Viên 2", phone: null, facilityId: 2, status: "ACTIVE" },
]

let schedules = new Map<string, DaySchedule>()

function emptyDay(date: string): DaySchedule {
  return {
    date,
    shifts: [
      { shift: "MORNING", assignments: [{ accountId: 5, fullName: "Nguyễn Văn Nhân Viên 1", duty: "CHECKIN" }, { accountId: 8, fullName: "Bùi Thị Lan", duty: "INSPECTION" }] },
      { shift: "AFTERNOON", assignments: [{ accountId: 10, fullName: "Hoàng Minh Tuấn", duty: "INCIDENT" }] },
      { shift: "EVENING", assignments: [] },
    ],
  }
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), LATENCY))
}

export function mockListFacilityStaff(): Promise<FacilityStaff[]> {
  return delay(STAFF)
}

export function mockGetDaySchedule(date: string): Promise<DaySchedule> {
  if (!schedules.has(date)) schedules.set(date, emptyDay(date))
  return delay(schedules.get(date)!)
}

export function mockSaveShift(date: string, shift: ShiftKey, assignments: ShiftAssignment[]): Promise<DaySchedule> {
  const outsider = assignments.find((a) => STAFF.find((s) => s.accountId === a.accountId)?.facilityId !== 1)
  if (outsider) return Promise.reject(new Error("Chỉ được phân công nhân viên thuộc cơ sở của bạn"))
  const day = schedules.get(date) ?? emptyDay(date)
  day.shifts = day.shifts.map((s) => (s.shift === shift ? { shift, assignments } : s))
  schedules.set(date, day)
  return delay(day)
}

/** Chỉ dùng trong test */
export function resetShiftsMock() {
  schedules = new Map()
}
