// API Admin quản lý tài khoản khách (BE đã có: AdminCustomerController).

import { unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"

import type { AdminCustomer } from "../types"

/** GET /api/admin/customers: không gửi từ khóa thì BE trả mọi khách; FE lọc thêm theo trạng thái, tên, SĐT */
export async function listCustomers(): Promise<AdminCustomer[]> {
  return unwrapApiData<AdminCustomer[]>(await apiClient.get("/admin/customers")) ?? []
}

/** PATCH /api/admin/customers/{accountId}/unlock: mở khóa sớm tài khoản bị khóa do sai mật khẩu */
export async function unlockCustomer(accountId: number): Promise<AdminCustomer> {
  return unwrapApiData<AdminCustomer>(await apiClient.patch(`/admin/customers/${accountId}/unlock`))
}
