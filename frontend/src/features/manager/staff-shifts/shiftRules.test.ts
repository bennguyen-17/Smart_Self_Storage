import { describe, expect, test } from "vitest"

import {
  addAssignment,
  assignableStaff,
  otherShiftsOf,
  shiftPeriod,
  shiftTimeLabel,
  weekDays,
} from "./shiftRules"
import type { DaySchedule, FacilityStaff, ShiftAssignment } from "./types"

const staff = (
  employeeId: number,
  fullName: string,
  facilityId = 1,
  status: FacilityStaff["status"] = "ACTIVE"
): FacilityStaff => ({
  employeeId,
  fullName,
  phone: null,
  facilityId,
  status,
})

const STAFF = [
  staff(5, "Nguyễn Văn Nhân Viên 1"),
  staff(8, "Bùi Thị Lan"),
  staff(9, "Đặng Văn Khoa", 1, "LOCKED"),
  staff(6, "Phạm Thị Nhân Viên 2", 2),
]

describe("assignableStaff: Manager chỉ chọn được nhân viên của cơ sở mình", () => {
  test.each([
    { name: "cơ sở 1, ca trống", facilityId: 1, current: [], expected: [8, 5] },
    {
      name: "loại người đã có trong ca",
      facilityId: 1,
      current: [{ employeeId: 5, fullName: "" }],
      expected: [8],
    },
    {
      name: "cơ sở 2 chỉ thấy nhân viên cơ sở 2",
      facilityId: 2,
      current: [],
      expected: [6],
    },
    {
      name: "chưa biết cơ sở → không cho chọn ai",
      facilityId: null,
      current: [],
      expected: [],
    },
  ] as {
    name: string
    facilityId: number | null
    current: ShiftAssignment[]
    expected: number[]
  }[])("$name", ({ facilityId, current, expected }) => {
    expect(
      assignableStaff(STAFF, facilityId, current).map((s) => s.employeeId)
    ).toEqual(expected)
  })

  test("tài khoản bị khóa không xuất hiện", () => {
    expect(assignableStaff(STAFF, 1, []).some((s) => s.employeeId === 9)).toBe(
      false
    )
  })
})

describe("otherShiftsOf / addAssignment", () => {
  const SCHEDULE: DaySchedule = {
    date: "2026-10-14",
    shifts: [
      {
        shiftId: 1,
        shiftName: "Ca Sáng",
        startTime: "06:00",
        endTime: "14:00",
        staff: [{ employeeId: 5, fullName: "A" }],
      },
      {
        shiftId: 2,
        shiftName: "Ca Chiều",
        startTime: "14:00",
        endTime: "22:00",
        staff: [
          { employeeId: 5, fullName: "A" },
          { employeeId: 8, fullName: "B" },
        ],
      },
      {
        shiftId: 3,
        shiftName: "Ca Đêm",
        startTime: "22:00",
        endTime: "06:00",
        staff: [],
      },
    ],
  }

  test.each([
    { employeeId: 5, except: 3, expected: ["Ca Sáng", "Ca Chiều"] },
    { employeeId: 5, except: 1, expected: ["Ca Chiều"] },
    { employeeId: 8, except: 2, expected: [] },
    { employeeId: 99, except: 1, expected: [] },
  ])(
    "NV $employeeId ngoài ca $except → $expected",
    ({ employeeId, except, expected }) => {
      expect(otherShiftsOf(SCHEDULE, employeeId, except)).toEqual(expected)
    }
  )

  test("addAssignment: thêm mới, không thêm trùng", () => {
    const once = addAssignment([], STAFF[1])
    expect(once).toEqual([{ employeeId: 8, fullName: "Bùi Thị Lan" }])
    expect(addAssignment(once, STAFF[1])).toEqual(once)
  })
})

describe("giờ ca lấy từ DB: nhãn và biểu tượng", () => {
  test.each([
    {
      start: "06:00:00",
      end: "14:00:00",
      label: "06:00 – 14:00",
      period: "morning",
    },
    {
      start: "14:00",
      end: "22:00",
      label: "14:00 – 22:00",
      period: "afternoon",
    },
    {
      start: "22:00",
      end: "06:00",
      label: "22:00 – 06:00 (qua đêm)",
      period: "night",
    },
    { start: "08:00", end: "12:00", label: "08:00 – 12:00", period: "morning" },
    {
      start: "16:00",
      end: "20:00",
      label: "16:00 – 20:00",
      period: "afternoon",
    },
    { start: "00:00", end: "08:00", label: "00:00 – 08:00", period: "night" },
  ])("$start → $end: '$label', $period", ({ start, end, label, period }) => {
    expect(shiftTimeLabel(start, end)).toBe(label)
    expect(shiftPeriod(start)).toBe(period)
  })
})

describe("weekDays: 7 ngày thứ 2 → chủ nhật của tuần chứa ngày chọn", () => {
  test.each([
    {
      date: "2026-10-14",
      first: "2026-10-12",
      last: "2026-10-18",
      note: "thứ 4",
    },
    {
      date: "2026-10-12",
      first: "2026-10-12",
      last: "2026-10-18",
      note: "đúng thứ 2",
    },
    {
      date: "2026-10-18",
      first: "2026-10-12",
      last: "2026-10-18",
      note: "chủ nhật thuộc tuần trước đó",
    },
    {
      date: "2026-12-31",
      first: "2026-12-28",
      last: "2027-01-03",
      note: "tuần vắt qua năm mới",
    },
  ])("$date ($note) → $first … $last", ({ date, first, last }) => {
    const week = weekDays(date)
    expect(week).toHaveLength(7)
    expect(week[0]).toMatchObject({ date: first, weekday: "T2" })
    expect(week[6]).toMatchObject({ date: last, weekday: "CN" })
  })

  test("nhãn ngày/tháng", () => {
    expect(weekDays("2026-10-14")[2]).toEqual({
      date: "2026-10-14",
      weekday: "T4",
      dayMonth: "14/10",
    })
  })
})
