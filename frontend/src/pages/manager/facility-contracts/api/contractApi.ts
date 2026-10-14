// Hợp đồng của cơ sở cho Manager (US-24, 25, 26, 31).
// - Danh sách: BE CHƯA có. Path dưới đây là contract FE đề xuất (qa-log), đang chạy mock.
// - Miễn / giảm phí: BE ĐÃ có POST /api/manager/payments/{paymentId}/discount.
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { managerHeaders } from "@/pages/manager/unit-management/managerContext"
import type { ManagerContext } from "@/pages/manager/unit-management/types"

import type { FacilityContract, FeeDiscountRequest } from "../types"
import { mockApplyFeeDiscount, mockListFacilityContracts } from "./contractApi.mock"

/** GET /api/manager/contracts (đề xuất): hợp đồng của cơ sở trong header X-Facility-Id, kèm các khoản phí PEN/CMP */
export async function listFacilityContracts(ctx: ManagerContext): Promise<FacilityContract[]> {
  if (isMockMode()) return mockListFacilityContracts()
  const body = await apiClient.get("/manager/contracts", { headers: managerHeaders(ctx) })
  return unwrapApiData<FacilityContract[]>(body) ?? []
}

/** POST /api/manager/payments/{paymentId}/discount  body { discountPercent | discountAmount, reason } */
export async function applyFeeDiscount(ctx: ManagerContext, paymentId: number, req: FeeDiscountRequest): Promise<void> {
  if (isMockMode()) {
    await mockApplyFeeDiscount(paymentId, req)
    return
  }
  await apiClient.post(`/manager/payments/${paymentId}/discount`, req, { headers: managerHeaders(ctx) })
}
