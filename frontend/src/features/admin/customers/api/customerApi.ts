import { unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"

import type { AdminCustomer } from "../types"

// Lấy toàn bộ danh sách để lọc theo trạng thái và từ khóa ở FE
export async function listCustomers(): Promise<AdminCustomer[]> {
  return unwrapApiData<AdminCustomer[]>(await apiClient.get("/admin/customers")) ?? []
}

export async function unlockCustomer(accountId: number): Promise<AdminCustomer> {
  return unwrapApiData<AdminCustomer>(await apiClient.patch(`/admin/customers/${accountId}/unlock`))
}
