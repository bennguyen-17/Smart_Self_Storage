import { describe, expect, test } from "vitest"
import { canExtendOnline, extendModeOf } from "./contractRules"

describe("extendModeOf: hiện nút Gia hạn theo trạng thái hợp đồng", () => {
  test.each([
    { status: "ACTIVE", expected: "ONLINE" },
    { status: "OVERDUE", expected: "AT_COUNTER" }, // nút khóa + thông báo đến quầy
    { status: "TERMINATED", expected: "NONE" }, // ẩn hẳn nút
    { status: "COMPLETED", expected: "NONE" },
    { status: "FORFEITED", expected: "NONE" },
    { status: "CANCELED", expected: "NONE" },
    { status: "PENDING_CHECKIN", expected: "NONE" },
    { status: "SUSPENDED", expected: "NONE" },
    { status: "", expected: "NONE" },
    { status: "overdue", expected: "NONE" },
  ])("$status → $expected", ({ status, expected }) => {
    expect(extendModeOf(status)).toBe(expected)
  })
})

describe("canExtendOnline: chỉ hợp đồng ACTIVE mới được gia hạn online", () => {
  test.each([
    { status: "ACTIVE", expected: true },
    { status: "OVERDUE", expected: false },
    { status: "PENDING_CHECKIN", expected: false },
    { status: "TERMINATED", expected: false },
    { status: "COMPLETED", expected: false },
    { status: "FORFEITED", expected: false },
    { status: "CANCELED", expected: false },
    { status: "SUSPENDED", expected: false },
    // Dữ liệu bẩn: rỗng hoặc sai hoa/thường cũng không được gia hạn
    { status: "", expected: false },
    { status: "active", expected: false },
  ])("$status → $expected", ({ status, expected }) => {
    expect(canExtendOnline(status)).toBe(expected)
  })
})
