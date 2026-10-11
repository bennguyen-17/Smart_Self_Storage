import { describe, expect, test } from "vitest"
import { canExtendOnline } from "./contractRules"

describe("canExtendOnline: chỉ hợp đồng ACTIVE mới được gia hạn online (US-12, BR-29)", () => {
  test.each([
    { status: "ACTIVE", expected: true },
    { status: "OVERDUE", expected: false },
    { status: "PENDING_CHECKIN", expected: false },
    { status: "TERMINATED", expected: false },
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
