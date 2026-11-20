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

export async function listAccounts(): Promise<InternalAccount[]> {
  if (isMockMode()) return mockListAccounts()
  return unwrapApiData<InternalAccount[]>(await apiClient.get("/admin/accounts")) ?? []
}

// Tài khoản mới được BE gán mật khẩu mặc định và ép đổi ở lần đăng nhập đầu
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

export async function updateAccountAssignment(
  accountId: number,
  values: { role: InternalRole; facilityId: number | "" }
): Promise<InternalAccount> {
  const body = { role: values.role, facilityId: effectiveFacilityId(values) }
  if (isMockMode()) return mockUpdateAccount(accountId, body)
  return unwrapApiData<InternalAccount>(await apiClient.patch(`/admin/accounts/${accountId}`, body))
}

export async function setAccountStatus(accountId: number, status: AccountStatus): Promise<InternalAccount> {
  if (isMockMode()) return mockSetAccountStatus(accountId, status)
  return unwrapApiData<InternalAccount>(await apiClient.patch(`/admin/accounts/${accountId}/status`, { status }))
}
