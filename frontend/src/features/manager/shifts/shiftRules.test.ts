import { describe, expect, test } from "vitest"

import {
  onDutyOf,
  otherShiftsOf,
  pickableStaff,
  planWeekCopy,
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

describe("pickableStaff: Manager chỉ chọn được nhân viên của cơ sở mình, đang hoạt động", () => {
  test.each([
    { name: "cơ sở 1 (sắp theo tên, bỏ tài khoản khóa)", facilityId: 1, expected: [8, 5] },
    { name: "cơ sở 2 chỉ thấy nhân viên cơ sở 2", facilityId: 2, expected: [6] },
    { name: "chưa biết cơ sở → không cho chọn ai", facilityId: null, expected: [] },
  ])("$name", ({ facilityId, expected }) => {
    expect(pickableStaff(STAFF, facilityId).map((s) => s.employeeId)).toEqual(expected)
  })
})

describe("onDutyOf: mỗi ca 1 người trực", () => {
  test.each([
    { name: "ca trống", staff: [], expected: null },
    { name: "1 người", staff: [{ employeeId: 5, fullName: "A" }], expected: 5 },
    { name: "dữ liệu cũ 2 người → lấy người đầu", staff: [{ employeeId: 8, fullName: "B" }, { employeeId: 5, fullName: "A" }], expected: 8 },
  ] as { name: string; staff: ShiftAssignment[]; expected: number | null }[])("$name → $expected", ({ staff: list, expected }) => {
    expect(onDutyOf({ staff: list })?.employeeId ?? null).toBe(expected)
  })
})

describe("planWeekCopy: áp dụng lịch một ngày cho cả tuần (T2 → CN), ghi đè, bỏ ngày đã qua", () => {
  // 2026-11-04 là thứ 4; tuần đó T2 02/11 → CN 08/11
  const SOURCE: DaySchedule = {
    date: "2026-11-04",
    shifts: [
      { shiftId: 1, shiftName: "Ca Sáng", startTime: "08:00", endTime: "12:00", staff: [{ employeeId: 5, fullName: "A" }] },
      { shiftId: 2, shiftName: "Ca Chiều", startTime: "12:00", endTime: "16:00", staff: [{ employeeId: 8, fullName: "B" }, { employeeId: 5, fullName: "A" }] },
      { shiftId: 3, shiftName: "Ca Tối", startTime: "16:00", endTime: "20:00", staff: [] },
    ],
  }

  test("hôm nay là T3: chép sang T3, T5, T6, T7, CN (bỏ T2 đã qua và chính ngày nguồn), đủ 3 ca mỗi ngày", () => {
    const plan = planWeekCopy(SOURCE, "2026-11-03")
    expect([...new Set(plan.map((w) => w.date))]).toEqual(["2026-11-03", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"])
    expect(plan).toHaveLength(5 * 3)
  })

  test("mỗi ca ghi đúng 1 người (dữ liệu cũ nhiều người lấy người đầu); ca nguồn trống thì để trống", () => {
    const sat = planWeekCopy(SOURCE, "2026-11-03").filter((w) => w.date === "2026-11-07")
    expect(sat).toEqual([
      { date: "2026-11-07", shiftId: 1, employeeIds: [5] },
      { date: "2026-11-07", shiftId: 2, employeeIds: [8] },
      { date: "2026-11-07", shiftId: 3, employeeIds: [] },
    ])
  })

  test("ngày nguồn là CN và các ngày khác đã qua → không còn gì để chép", () => {
    expect(planWeekCopy({ ...SOURCE, date: "2026-11-08" }, "2026-11-08")).toEqual([])
  })
})

describe("otherShiftsOf", () => {
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
