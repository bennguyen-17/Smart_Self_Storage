import { describe, expect, test } from "vitest"

import { getRoleDestination, normalizeRole } from "./roles"

// Test cho file dùng chung của nhóm (lib/roles.ts do Bảo viết): RoleProtectedRoute và đăng nhập nội bộ
// đều dựa vào đây, nên khóa hành vi lại để ai sửa nhầm thì test báo ngay.
describe("normalizeRole: chuẩn hóa vai trò BE trả về (tên hoặc mã số)", () => {
  test.each([
    { input: "MANAGER", expected: "MANAGER" },
    { input: "3", expected: "MANAGER" },
    { input: 3, expected: "MANAGER" },
    { input: "manager", expected: "MANAGER" },
    { input: " ROLE_ADMIN ", expected: "ADMIN" },
    { input: "1", expected: "ADMIN" },
    { input: "2", expected: "BOM" },
    { input: "4", expected: "STAFF" },
    { input: "5", expected: "CUSTOMER" },
    // Giá trị lạ hoặc thiếu → CUSTOMER: không bao giờ tự nâng thành vai trò nội bộ
    { input: "SUPERUSER", expected: "CUSTOMER" },
    { input: "9", expected: "CUSTOMER" },
    { input: "", expected: "CUSTOMER" },
    { input: null, expected: "CUSTOMER" },
    { input: undefined, expected: "CUSTOMER" },
  ])("$input → $expected", ({ input, expected }) => {
    expect(normalizeRole(input)).toBe(expected)
  })
})

describe("getRoleDestination: đăng nhập xong vào đúng cổng", () => {
  test.each([
    { role: "MANAGER", expected: "/manager" },
    { role: "STAFF", expected: "/staff/checkin" },
    { role: "BOM", expected: "/bom" },
    { role: "ADMIN", expected: "/admin" },
    { role: "CUSTOMER", expected: "/portal" },
  ] as const)("$role → $expected", ({ role, expected }) => {
    expect(getRoleDestination(role)).toBe(expected)
  })
})
