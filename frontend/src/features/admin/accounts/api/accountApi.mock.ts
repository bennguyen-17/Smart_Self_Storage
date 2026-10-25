// Dữ liệu mẫu tài khoản nội bộ, dùng khi VITE_USE_MOCK=true (BE chưa có API US-29).

import { roleNeedsFacility } from "../accountRules"
import type { AccountStatus, InternalAccount, InternalRole } from "../types"

const MOCK_LATENCY_MS = 350

const SEED: InternalAccount[] = [
  { accountId: 1, fullName: "Quản Trị Viên Hệ Thống", email: "admin@selfstorage391.vn", phone: "0901888999", role: "ADMIN", facilityId: null, status: "ACTIVE", mustChangePassword: false, lastLoginAt: "2026-10-13T08:02:00" },
  { accountId: 2, fullName: "Ngô Thị Ban Giám Đốc", email: "bom@selfstorage391.vn", phone: "0912000111", role: "BOM", facilityId: null, status: "ACTIVE", mustChangePassword: false, lastLoginAt: "2026-10-12T17:45:00" },
  { accountId: 3, fullName: "Trần Văn Quản Lý", email: "manager.hn01@selfstorage391.vn", phone: "0987123456", role: "MANAGER", facilityId: 1, status: "ACTIVE", mustChangePassword: false, lastLoginAt: "2026-10-13T07:30:00" },
  { accountId: 4, fullName: "Lê Thị Quản Lý", email: "manager.hn02@selfstorage391.vn", phone: null, role: "MANAGER", facilityId: 2, status: "ACTIVE", mustChangePassword: false, lastLoginAt: "2026-10-11T09:10:00" },
  { accountId: 5, fullName: "Nguyễn Văn Nhân Viên 1", email: "staff1.hn01@selfstorage391.vn", phone: "0933444555", role: "STAFF", facilityId: 1, status: "ACTIVE", mustChangePassword: false, lastLoginAt: "2026-10-13T06:55:00" },
  { accountId: 6, fullName: "Phạm Thị Nhân Viên 2", email: "staff2.hn01@selfstorage391.vn", phone: null, role: "STAFF", facilityId: 1, status: "LOCKED", mustChangePassword: false, lastLoginAt: "2026-09-30T18:20:00" },
  { accountId: 7, fullName: "Đỗ Minh Nhân Viên", email: "staff1.hcm01@selfstorage391.vn", phone: "0977666555", role: "STAFF", facilityId: 5, status: "ACTIVE", mustChangePassword: true, lastLoginAt: null },
]

let store: InternalAccount[] = SEED.map((a) => ({ ...a }))

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), MOCK_LATENCY_MS))
}

function fail(message: string): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), MOCK_LATENCY_MS))
}

function find(accountId: number): number {
  return store.findIndex((a) => a.accountId === accountId)
}

export function mockListAccounts(): Promise<InternalAccount[]> {
  return delay(store)
}

export function mockCreateAccount(input: {
  fullName: string
  email: string
  phone: string | null
  role: InternalRole
  facilityId: number | null
}): Promise<InternalAccount> {
  if (store.some((a) => a.email.toLowerCase() === input.email.toLowerCase())) {
    return fail("Email đã được dùng cho một tài khoản khác")
  }
  if (roleNeedsFacility(input.role) && input.facilityId === null) {
    return fail("Nhân viên và quản lý cơ sở phải được gán một cơ sở")
  }
  const created: InternalAccount = {
    ...input,
    accountId: Math.max(...store.map((a) => a.accountId)) + 1,
    status: "ACTIVE",
    mustChangePassword: true,
    lastLoginAt: null,
  }
  store = [...store, created]
  return delay(created)
}

export function mockUpdateAccount(
  accountId: number,
  patch: { role: InternalRole; facilityId: number | null }
): Promise<InternalAccount> {
  const i = find(accountId)
  if (i < 0) return fail("Không tìm thấy tài khoản")
  if (roleNeedsFacility(patch.role) && patch.facilityId === null) {
    return fail("Nhân viên và quản lý cơ sở phải được gán một cơ sở")
  }
  store[i] = { ...store[i], ...patch }
  return delay(store[i])
}

export function mockSetAccountStatus(accountId: number, status: AccountStatus): Promise<InternalAccount> {
  const i = find(accountId)
  if (i < 0) return fail("Không tìm thấy tài khoản")
  store[i] = { ...store[i], status }
  return delay(store[i])
}

/** Chỉ dùng trong test: đưa dữ liệu mẫu về ban đầu */
export function resetAccountsMock() {
  store = SEED.map((a) => ({ ...a }))
}
