// US-29: API quản lý tài khoản nội bộ cho Admin.
// BE CHƯA có các API này: path và body dưới đây là contract FE đề xuất (đã ghi vào qa-log để BE làm theo).
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"

import { effectiveFacilityId } from "../accountRules"
import type { AccountFormValues, AccountStatus, InternalAccount, InternalRole } from "../types"
import {
  mockCreateAccount,
  mockListAccounts,
  mockSetAccountStatus,
  mockUpdateAccount,
} from "./accountApi.mock"

/** GET /api/admin/accounts: mọi tài khoản nội bộ (không gồm khách hàng) */
export async function listAccounts(): Promise<InternalAccount[]> {
  if (isMockMode()) return mockListAccounts()
  return unwrapApiData<InternalAccount[]>(await apiClient.get("/admin/accounts")) ?? []
}

/**
 * POST /api/admin/accounts  body { fullName, email, phone, role, facilityId }
 * BE đặt mật khẩu ban đầu cố định (INITIAL_INTERNAL_PASSWORD), chưa gửi email, và đặt mustChangePassword = true.
 */
export async function createAccount(values: AccountFormValues): Promise<InternalAccount> {
  const phone = values.phone.replace(/\s/g, "")
  const body = {
    fullName: values.fullName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: phone || null,
    role: values.role,
    facilityId: effectiveFacilityId(values),
  }
  if (isMockMode()) return mockCreateAccount(body)
  return unwrapApiData<InternalAccount>(await apiClient.post("/admin/accounts", body))
}

/** PATCH /api/admin/accounts/{id}  body { role, facilityId }: đổi vai trò / đổi cơ sở */
export async function updateAccountAssignment(
  accountId: number,
  values: { role: InternalRole; facilityId: number | "" }
): Promise<InternalAccount> {
  const body = { role: values.role, facilityId: effectiveFacilityId(values) }
  if (isMockMode()) return mockUpdateAccount(accountId, body)
  return unwrapApiData<InternalAccount>(await apiClient.patch(`/admin/accounts/${accountId}`, body))
}

/** PATCH /api/admin/accounts/{id}/status  body { status }: khóa / mở khóa */
export async function setAccountStatus(accountId: number, status: AccountStatus): Promise<InternalAccount> {
  if (isMockMode()) return mockSetAccountStatus(accountId, status)
  return unwrapApiData<InternalAccount>(await apiClient.patch(`/admin/accounts/${accountId}/status`, { status }))
}
