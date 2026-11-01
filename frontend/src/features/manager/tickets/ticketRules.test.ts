import { describe, expect, test } from "vitest"

import { isWaitingForReturnDate, ticketProgress } from "./ticketRules"

const TODAY = "2026-11-02"

describe("ticketProgress: Manager thấy ticket đang ở bước nào", () => {
  test.each([
    { name: "chờ, chưa ai phụ trách", t: { status: "SUBMITTED", type: "MAINTENANCE" }, expected: "Chờ nhân viên trong ca tiếp nhận" },
    { name: "sự cố tự phân, chưa nhận", t: { status: "SUBMITTED", type: "INCIDENT", assignedStaffId: 10 }, expected: "Đã phân cho nhân viên trong ca, chờ tiếp nhận" },
    { name: "trả kho sớm, chưa tới ngày hẹn", t: { status: "SUBMITTED", type: "EARLY_TERMINATION", desiredDate: "2026-11-05" }, expected: "Chờ đến ngày hẹn 05/11/2026" },
    { name: "trả kho sớm, đúng ngày hẹn", t: { status: "SUBMITTED", type: "EARLY_TERMINATION", desiredDate: "2026-11-02" }, expected: "Chờ nhân viên trong ca tiếp nhận" },
    { name: "đang xử lý", t: { status: "IN_PROGRESS", type: "UNLOCK", assignedStaffId: 10 }, expected: "Nhân viên đang xử lý" },
    { name: "đã xong", t: { status: "RESOLVED", type: "UNLOCK" }, expected: "Nhân viên đã giải quyết xong" },
    { name: "khách hủy", t: { status: "CANCELLED", type: "UNLOCK" }, expected: "Khách đã hủy yêu cầu" },
  ] as const)("$name → $expected", ({ t, expected }) => {
    expect(ticketProgress(t, TODAY)).toBe(expected)
  })
})

describe("isWaitingForReturnDate: chỉ ticket trả kho sớm có hẹn sau hôm nay", () => {
  test.each([
    { type: "EARLY_TERMINATION", desiredDate: "2026-11-03", expected: true },
    { type: "EARLY_TERMINATION", desiredDate: "2026-11-02T09:00:00", expected: false },
    { type: "EARLY_TERMINATION", desiredDate: null, expected: false },
    { type: "MAINTENANCE", desiredDate: "2026-11-10", expected: false },
  ] as const)("$type hẹn $desiredDate → $expected", ({ type, desiredDate, expected }) => {
    expect(isWaitingForReturnDate({ status: "SUBMITTED", type, desiredDate }, TODAY)).toBe(expected)
  })
})
