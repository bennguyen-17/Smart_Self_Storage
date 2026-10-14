import { describe, expect, test } from "vitest"

import { addAssignment, assignableStaff, missingDuties, otherShiftsOf } from "./shiftRules"
import type { DaySchedule, FacilityStaff, ShiftAssignment } from "./types"

const staff = (accountId: number, fullName: string, facilityId = 1, status: FacilityStaff["status"] = "ACTIVE"): FacilityStaff => ({
  accountId,
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
    { name: "loại người đã có trong ca", facilityId: 1, current: [{ accountId: 5, fullName: "", duty: "CHECKIN" }], expected: [8] },
    { name: "cơ sở 2 chỉ thấy nhân viên cơ sở 2", facilityId: 2, current: [], expected: [6] },
    { name: "chưa biết cơ sở → không cho chọn ai", facilityId: null, current: [], expected: [] },
  ] as { name: string; facilityId: number | null; current: ShiftAssignment[]; expected: number[] }[])("$name", ({ facilityId, current, expected }) => {
    expect(assignableStaff(STAFF, facilityId, current).map((s) => s.accountId)).toEqual(expected)
  })

  test("tài khoản bị khóa không xuất hiện", () => {
    expect(assignableStaff(STAFF, 1, []).some((s) => s.accountId === 9)).toBe(false)
  })
})

describe("otherShiftsOf / missingDuties / addAssignment", () => {
  const SCHEDULE: DaySchedule = {
    date: "2026-10-14",
    shifts: [
      { shift: "MORNING", assignments: [{ accountId: 5, fullName: "A", duty: "CHECKIN" }] },
      { shift: "AFTERNOON", assignments: [{ accountId: 5, fullName: "A", duty: "INCIDENT" }, { accountId: 8, fullName: "B", duty: "INSPECTION" }] },
      { shift: "EVENING", assignments: [] },
    ],
  }

  test.each([
    { accountId: 5, except: "EVENING", expected: ["MORNING", "AFTERNOON"] },
    { accountId: 5, except: "MORNING", expected: ["AFTERNOON"] },
    { accountId: 8, except: "AFTERNOON", expected: [] },
    { accountId: 99, except: "MORNING", expected: [] },
  ] as const)("NV $accountId ngoài $except → $expected", ({ accountId, except, expected }) => {
    expect(otherShiftsOf(SCHEDULE, accountId, except)).toEqual(expected)
  })

  test.each([
    { name: "ca trống", shift: 2, expected: ["CHECKIN", "INSPECTION", "INCIDENT"] },
    { name: "chỉ có check-in", shift: 0, expected: ["INSPECTION", "INCIDENT"] },
    { name: "có sự cố + nghiệm thu", shift: 1, expected: ["CHECKIN"] },
  ])("missingDuties: $name → $expected", ({ shift, expected }) => {
    expect(missingDuties(SCHEDULE.shifts[shift].assignments)).toEqual(expected)
  })

  test("addAssignment: thêm mới, không thêm trùng", () => {
    const once = addAssignment([], STAFF[1], "INSPECTION")
    expect(once).toEqual([{ accountId: 8, fullName: "Bùi Thị Lan", duty: "INSPECTION" }])
    expect(addAssignment(once, STAFF[1], "CHECKIN")).toEqual(once)
  })
})
