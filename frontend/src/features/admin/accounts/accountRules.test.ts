import { describe, expect, test } from "vitest"

import {
  effectiveFacilityId,
  filterAccounts,
  isSelf,
  roleNeedsFacility,
  validateAccountForm,
} from "./accountRules"
import type { AccountFilter, AccountFormValues, InternalAccount } from "./types"

const VALID: AccountFormValues = {
  fullName: "Nguyễn Văn Nhân Viên",
  email: "nv1.hn01@selfstorage391.vn",
  phone: "0901888999",
  role: "STAFF",
  facilityId: 1,
}

describe("roleNeedsFacility: Staff/Manager gắn cơ sở, BOM/Admin toàn hệ thống", () => {
  test.each([
    { role: "STAFF", expected: true },
    { role: "MANAGER", expected: true },
    { role: "BOM", expected: false },
    { role: "ADMIN", expected: false },
  ] as const)("$role → $expected", ({ role, expected }) => {
    expect(roleNeedsFacility(role)).toBe(expected)
  })
})

describe("validateAccountForm: chặn tạo tài khoản sai", () => {
  test.each([
    { name: "hợp lệ", values: VALID, fields: [] },
    { name: "Staff chưa gán cơ sở", values: { ...VALID, facilityId: "" }, fields: ["facilityId"] },
    { name: "Manager chưa gán cơ sở", values: { ...VALID, role: "MANAGER", facilityId: "" }, fields: ["facilityId"] },
    { name: "BOM không cần cơ sở", values: { ...VALID, role: "BOM", facilityId: "" }, fields: [] },
    { name: "Admin không cần cơ sở", values: { ...VALID, role: "ADMIN", facilityId: "" }, fields: [] },
    { name: "tên trống", values: { ...VALID, fullName: "  " }, fields: ["fullName"] },
    { name: "tên 1 ký tự", values: { ...VALID, fullName: "A" }, fields: ["fullName"] },
    { name: "email thiếu @", values: { ...VALID, email: "nv1.selfstorage391.vn" }, fields: ["email"] },
    { name: "email có khoảng trắng 2 đầu vẫn hợp lệ", values: { ...VALID, email: "  a@b.vn " }, fields: [] },
    { name: "SĐT để trống (tùy chọn)", values: { ...VALID, phone: "" }, fields: [] },
    { name: "SĐT có dấu cách", values: { ...VALID, phone: "0901 888 999" }, fields: [] },
    { name: "SĐT 9 số", values: { ...VALID, phone: "090188899" }, fields: ["phone"] },
    { name: "SĐT không bắt đầu bằng 0", values: { ...VALID, phone: "8901888999" }, fields: ["phone"] },
    {
      name: "trống hết, vai trò Staff",
      values: { fullName: "", email: "", phone: "", role: "STAFF", facilityId: "" },
      fields: ["email", "facilityId", "fullName"],
    },
  ] as { name: string; values: AccountFormValues; fields: string[] }[])("$name → lỗi: $fields", ({ values, fields }) => {
    expect(Object.keys(validateAccountForm(values)).sort()).toEqual([...fields].sort())
  })
})

describe("effectiveFacilityId: BOM/Admin luôn lưu là toàn hệ thống", () => {
  test.each([
    { role: "STAFF", facilityId: 2, expected: 2 },
    { role: "MANAGER", facilityId: 3, expected: 3 },
    { role: "BOM", facilityId: 2, expected: null },
    { role: "ADMIN", facilityId: 2, expected: null },
    { role: "STAFF", facilityId: "", expected: null },
  ] as const)("$role + $facilityId → $expected", ({ role, facilityId, expected }) => {
    expect(effectiveFacilityId({ role, facilityId })).toBe(expected)
  })
})

function account(id: number, patch: Partial<InternalAccount> = {}): InternalAccount {
  return {
    accountId: id,
    fullName: `Người ${id}`,
    email: `user${id}@selfstorage391.vn`,
    phone: null,
    role: "STAFF",
    facilityId: 1,
    status: "ACTIVE",
    mustChangePassword: false,
    lastLoginAt: null,
    ...patch,
  }
}

describe("isSelf: Admin không tự khóa / tự đổi vai trò", () => {
  test.each([
    { current: 1, target: 1, expected: true },
    { current: 1, target: 2, expected: false },
    { current: null, target: 1, expected: false },
  ])("đang đăng nhập $current, tài khoản $target → $expected", ({ current, target, expected }) => {
    expect(isSelf(account(target), current)).toBe(expected)
  })
})

describe("filterAccounts", () => {
  const LIST = [
    account(1, { fullName: "Trịnh Minh Tâm", role: "ADMIN", facilityId: null, phone: "0901888999" }),
    account(2, { fullName: "Lê Thị Đào", role: "MANAGER", facilityId: 1 }),
    account(3, { fullName: "Phạm Văn Đức", role: "STAFF", facilityId: 2, status: "LOCKED" }),
    account(4, { fullName: "Ngô Bảo", role: "BOM", facilityId: null }),
  ]
  const ALL: AccountFilter = { query: "", role: "ALL", facilityId: "ALL", status: "ALL" }
  const ids = (f: AccountFilter) => filterAccounts(LIST, f).map((a) => a.accountId)

  test.each([
    { name: "không lọc", filter: ALL, expected: [1, 2, 3, 4] },
    { name: "tên không dấu", filter: { ...ALL, query: "dao" }, expected: [2] },
    { name: "chữ đ", filter: { ...ALL, query: "đức" }, expected: [3] },
    { name: "theo email", filter: { ...ALL, query: "user4@" }, expected: [4] },
    { name: "theo SĐT", filter: { ...ALL, query: "0901888" }, expected: [1] },
    { name: "vai trò Manager", filter: { ...ALL, role: "MANAGER" }, expected: [2] },
    { name: "cơ sở 2", filter: { ...ALL, facilityId: 2 }, expected: [3] },
    { name: "đã khóa", filter: { ...ALL, status: "LOCKED" }, expected: [3] },
    { name: "kết hợp không khớp", filter: { ...ALL, role: "STAFF", status: "ACTIVE" }, expected: [] },
  ] as { name: string; filter: AccountFilter; expected: number[] }[])("$name", ({ filter, expected }) => {
    expect(ids(filter)).toEqual(expected)
  })
})
