import { describe, expect, test } from "vitest"

import {
  acceptTimeLabel,
  dayTotals,
  filterFacilityLogs,
  isLateToShift,
  shiftsWithStaff,
  staffOptions,
  vietnamTime,
} from "./activityRules"
import type { FacilityLogEntry, StaffActivity, StaffActivityDay } from "./types"

function person(over: Partial<StaffActivity>): StaffActivity {
  return {
    employeeId: 8,
    accountId: 10,
    fullName: "Nguyễn Văn Hùng",
    attended: true,
    checkIns: 0,
    checkouts: 0,
    ticketsResolved: 0,
    maintenanceDone: 0,
    tasksDone: 0,
    avgTicketAcceptMinutes: null,
    ...over,
  }
}

const DAY: StaffActivityDay = {
  date: "2026-10-26",
  shifts: [
    {
      shiftId: 1,
      shiftName: "Ca Sáng",
      startTime: "08:00",
      endTime: "12:00",
      staff: [
        person({ checkIns: 2, tasksDone: 1 }),
        person({ employeeId: 9, accountId: 11, fullName: "Bùi Tuấn Kiệt", attended: false, ticketsResolved: 3 }),
      ],
    },
    { shiftId: 2, shiftName: "Ca Chiều", startTime: "12:00", endTime: "16:00", staff: [] },
    {
      shiftId: 3,
      shiftName: "Ca Tối",
      startTime: "16:00",
      endTime: "20:00",
      staff: [person({ checkouts: 1, maintenanceDone: 2 })],
    },
  ],
}

describe("dayTotals", () => {
  test("cộng theo từng lượt trực; một người trực 2 ca tính 2 lượt", () => {
    expect(dayTotals(DAY)).toEqual({
      scheduled: 3,
      attended: 2,
      counts: { checkIns: 2, checkouts: 1, ticketsResolved: 3, maintenanceDone: 2 },
    })
  })

  test("chưa có dữ liệu thì toàn 0", () => {
    expect(dayTotals(undefined).scheduled).toBe(0)
  })
})

test("shiftsWithStaff bỏ ca trống", () => {
  expect(shiftsWithStaff(DAY).map((s) => s.shiftId)).toEqual([1, 3])
})

test("staffOptions: mỗi tài khoản một lần, sắp theo tên", () => {
  expect(staffOptions(DAY)).toEqual([
    { accountId: 11, fullName: "Bùi Tuấn Kiệt" },
    { accountId: 10, fullName: "Nguyễn Văn Hùng" },
  ])
})

describe("acceptTimeLabel", () => {
  test.each([
    [null, "—"],
    [0.4, "< 1 phút"],
    [3, "3 phút"],
    [12.345, "12.3 phút"],
  ])("%s → %s", (minutes, label) => {
    expect(acceptTimeLabel(minutes)).toBe(label)
  })
})

describe("isLateToShift", () => {
  test.each([
    [false, "08:15", true],
    [false, "07:59", false],
    [true, "09:00", false],
  ])("vào ca=%s lúc %s → trễ=%s", (attended, now, late) => {
    expect(isLateToShift({ startTime: "08:00" }, { attended }, now)).toBe(late)
  })
})

test("vietnamTime đổi sang giờ Việt Nam (UTC+7)", () => {
  expect(vietnamTime(new Date("2026-10-26T01:05:00Z"))).toBe("08:05")
})

describe("filterFacilityLogs", () => {
  const log = (over: Partial<FacilityLogEntry>): FacilityLogEntry => ({
    activityLogId: 1,
    accountId: 10,
    actorName: "Nguyễn Văn Hùng",
    actorRole: "STAFF",
    action: "COMPLETE_MAINTENANCE",
    description: "Hoàn tất bảo trì ô HN01-G-XL05",
    createdAt: "2026-10-26T09:00:00",
    ipAddress: null,
    facilityId: 1,
    facilityCode: "HN-01",
    ...over,
  })
  const logs = [
    log({ activityLogId: 1 }),
    log({ activityLogId: 2, accountId: 11, actorName: "Bùi Tuấn Kiệt", action: "RESOLVE_TICKET", description: "Đóng ticket TCK-202610-006", createdAt: "2026-10-26T10:00:00" }),
  ]

  test.each([
    [{ accountId: "ALL", query: "" }, [2, 1]],
    [{ accountId: "10", query: "" }, [1]],
    [{ accountId: "ALL", query: "xu ly yeu cau" }, [2]],
    [{ accountId: "11", query: "bao tri" }, []],
  ])("%o → %o (mới nhất trước, tìm cả nhãn tiếng Việt không dấu)", (filter, ids) => {
    expect(filterFacilityLogs(logs, filter).map((l) => l.activityLogId)).toEqual(ids)
  })
})
