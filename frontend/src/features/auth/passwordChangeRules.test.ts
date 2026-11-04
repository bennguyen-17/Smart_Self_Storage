import { describe, expect, test } from "vitest"

import { isPasswordChangeRequired, validatePasswordChange, type PasswordChangeValues } from "./passwordChangeRules"

const VALID: PasswordChangeValues = {
  currentPassword: "123456@Test",
  newPassword: "BaoMat@2026",
  confirmPassword: "BaoMat@2026",
}

describe("isPasswordChangeRequired: cờ mustChangePassword từ BE", () => {
  test.each([
    { name: "tài khoản mới tạo", user: { mustChangePassword: true }, expected: true },
    { name: "đã đổi mật khẩu", user: { mustChangePassword: false }, expected: false },
    { name: "BE chưa trả cờ", user: {}, expected: false },
    { name: "chưa đăng nhập", user: null, expected: false },
  ])("$name → $expected", ({ user, expected }) => {
    expect(isPasswordChangeRequired(user)).toBe(expected)
  })
})

describe("validatePasswordChange: chặn mật khẩu mới không hợp lệ", () => {
  test.each([
    { name: "hợp lệ", values: VALID, expected: null },
    { name: "mật khẩu hiện tại trống", values: { ...VALID, currentPassword: "" }, expected: "Vui lòng nhập mật khẩu hiện tại." },
    { name: "mật khẩu mới trống", values: { ...VALID, newPassword: "   ", confirmPassword: "   " }, expected: "Vui lòng nhập mật khẩu mới." },
    { name: "mật khẩu mới trùng mật khẩu tạm", values: { ...VALID, newPassword: "123456@Test", confirmPassword: "123456@Test" }, expected: "Mật khẩu mới phải khác mật khẩu hiện tại." },
    { name: "thiếu chữ hoa", values: { ...VALID, newPassword: "baomat@2026", confirmPassword: "baomat@2026" }, expected: "Mật khẩu mới chưa đạt yêu cầu: có chữ hoa." },
    { name: "thiếu ký tự đặc biệt", values: { ...VALID, newPassword: "BaoMat2026", confirmPassword: "BaoMat2026" }, expected: "Mật khẩu mới chưa đạt yêu cầu: có ký tự đặc biệt." },
    { name: "dưới 8 ký tự", values: { ...VALID, newPassword: "Ab@1", confirmPassword: "Ab@1" }, expected: "Mật khẩu mới chưa đạt yêu cầu: ít nhất 8 ký tự." },
    { name: "xác nhận không khớp", values: { ...VALID, confirmPassword: "BaoMat@2027" }, expected: "Mật khẩu xác nhận không khớp." },
    { name: "khoảng trắng 2 đầu được trim", values: { ...VALID, newPassword: "  BaoMat@2026  ", confirmPassword: "BaoMat@2026" }, expected: null },
  ] as { name: string; values: PasswordChangeValues; expected: string | null }[])("$name → $expected", ({ values, expected }) => {
    expect(validatePasswordChange(values)).toBe(expected)
  })
})
