// Hợp đồng của cơ sở cho Manager (US-24, 25, 26, 31).
// - Danh sách: BE CHƯA có. Path dưới đây là contract FE đề xuất (qa-log), đang chạy mock.
// - Miễn / giảm phí: BE ĐÃ có POST /api/manager/payments/{paymentId}/discount.
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { managerHeaders } from "@/features/manager/managerContext"
import type { ManagerContext } from "@/features/manager/units/types"

import { normalizeContractStatus } from "../contractRules"
import type { FacilityContract, FeeDiscountRequest } from "../types"
import { mockApplyFeeDiscount, mockListFacilityContracts } from "./contractApi.mock"

/** GET /api/manager/contracts (đề xuất): hợp đồng của cơ sở trong header X-Facility-Id, kèm các khoản phí PEN/CMP */
export async function listFacilityContracts(ctx: ManagerContext): Promise<FacilityContract[]> {
  if (isMockMode()) return mockListFacilityContracts()
  const body = await apiClient.get("/manager/contracts", { headers: managerHeaders(ctx) })
  // DB có thể trả "CANCELLED" (2 chữ L): gộp về một cách viết trước khi tới giao diện
  return (unwrapApiData<FacilityContract[]>(body) ?? []).map((c) => ({ ...c, status: normalizeContractStatus(c.status) }))
}

/** POST /api/manager/payments/{paymentId}/discount  body { discountPercent | discountAmount, reason } */
export async function applyFeeDiscount(ctx: ManagerContext, paymentId: number, req: FeeDiscountRequest): Promise<void> {
  if (isMockMode()) {
    await mockApplyFeeDiscount(paymentId, req)
    return
  }
  await apiClient.post(`/manager/payments/${paymentId}/discount`, req, { headers: managerHeaders(ctx) })
}

/**
 * POST /api/manager/contracts/{contractId}/forfeit-processed  body { note } (K1).
 * Chỉ hợp đồng FORFEITED của cơ sở mình; BE chuyển ô kho sang bảo trì và ghi nhật ký.
 */
export async function markForfeitProcessed(ctx: ManagerContext, contractId: number, note: string): Promise<void> {
  if (isMockMode()) return
  await apiClient.post(`/manager/contracts/${contractId}/forfeit-processed`, { note: note.trim() }, { headers: managerHeaders(ctx) })
}
