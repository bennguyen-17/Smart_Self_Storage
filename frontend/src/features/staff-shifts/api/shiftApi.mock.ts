// Dữ liệu mẫu phân ca cơ sở HN-01, dùng khi VITE_USE_MOCK=true.
// Giờ ca chép đúng bảng Shift trong database/db-script.sql. Dữ liệu chỉ nằm trong bộ nhớ:
// tải lại trang là về ban đầu (nhóm chốt 14/10: không lưu tạm, chờ BE làm API Q-31).

import type {
  DaySchedule,
  DayShift,
  FacilityStaff,
  ShiftAssignment,
} from "../types"

const LATENCY = 250

const SHIFTS: Omit<DayShift, "staff">[] = [
  { shiftId: 1, shiftName: "Ca Sáng", startTime: "06:00", endTime: "14:00" },
  { shiftId: 2, shiftName: "Ca Chiều", startTime: "14:00", endTime: "22:00" },
  { shiftId: 3, shiftName: "Ca Đêm", startTime: "22:00", endTime: "06:00" },
]

const STAFF: FacilityStaff[] = [
  {
    employeeId: 1,
    fullName: "Nguyễn Văn Nhân Viên 1",
    phone: "0933444555",
    facilityId: 1,
    status: "ACTIVE",
  },
  {
    employeeId: 4,
    fullName: "Bùi Thị Lan",
    phone: "0933111222",
    facilityId: 1,
    status: "ACTIVE",
  },
  {
    employeeId: 5,
    fullName: "Hoàng Minh Tuấn",
    phone: "0933777888",
    facilityId: 1,
    status: "ACTIVE",
  },
  {
    employeeId: 6,
    fullName: "Đặng Văn Khoa",
    phone: null,
    facilityId: 1,
    status: "LOCKED",
  },
  // Nhân viên cơ sở khác: không được hiện trong danh sách chọn (AC US-32)
  {
    employeeId: 2,
    fullName: "Phạm Thị Nhân Viên 2",
    phone: null,
    facilityId: 2,
    status: "ACTIVE",
  },
]

const SEED: Record<number, ShiftAssignment[]> = {
  1: [
    { employeeId: 1, fullName: "Nguyễn Văn Nhân Viên 1" },
    { employeeId: 4, fullName: "Bùi Thị Lan" },
  ],
  2: [{ employeeId: 5, fullName: "Hoàng Minh Tuấn" }],
  3: [],
}

let schedules = new Map<string, DaySchedule>()

function seedDay(date: string): DaySchedule {
  return {
    date,
    shifts: SHIFTS.map((s) => ({ ...s, staff: [...SEED[s.shiftId]] })),
  }
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(structuredClone(value)), LATENCY)
  )
}

export function mockListFacilityStaff(): Promise<FacilityStaff[]> {
  return delay(STAFF)
}

export function mockGetDaySchedule(date: string): Promise<DaySchedule> {
  if (!schedules.has(date)) schedules.set(date, seedDay(date))
  return delay(schedules.get(date)!)
}

export function mockSaveShift(
  date: string,
  shiftId: number,
  employeeIds: number[]
): Promise<DaySchedule> {
  const outsider = employeeIds.find(
    (id) => STAFF.find((s) => s.employeeId === id)?.facilityId !== 1
  )
  if (outsider !== undefined)
    return Promise.reject(
      new Error("Chỉ được phân công nhân viên thuộc cơ sở của bạn")
    )
  const day = schedules.get(date) ?? seedDay(date)
  day.shifts = day.shifts.map((s) =>
    s.shiftId === shiftId
      ? {
          ...s,
          staff: employeeIds.map((id) => ({
            employeeId: id,
            fullName: STAFF.find((x) => x.employeeId === id)!.fullName,
          })),
        }
      : s
  )
  schedules.set(date, day)
  return delay(day)
}

/** Chỉ dùng trong test */
export function resetShiftsMock() {
  schedules = new Map()
}
