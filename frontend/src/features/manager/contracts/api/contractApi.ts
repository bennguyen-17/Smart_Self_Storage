// Hợp đồng của cơ sở cho Manager (US-24, 25, 26).
// Miễn / giảm phí đã bỏ (nhóm chốt 28/10, BE xóa API ở PR #100).
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { managerHeaders } from "@/features/manager/managerContext"
import type { ManagerContext } from "@/features/manager/units/types"

import { normalizeContractStatus } from "../contractRules"
import type { FacilityContract } from "../types"
import { mockListFacilityContracts } from "./contractApi.mock"

/** GET /api/manager/contracts (đề xuất): hợp đồng của cơ sở trong header X-Facility-Id, kèm các khoản phí PEN/CMP */
export async function listFacilityContracts(ctx: ManagerContext): Promise<FacilityContract[]> {
  if (isMockMode()) return mockListFacilityContracts()
  const body = await apiClient.get("/manager/contracts", { headers: managerHeaders(ctx) })
  // DB có thể trả "CANCELLED" (2 chữ L): gộp về một cách viết trước khi tới giao diện
  return (unwrapApiData<FacilityContract[]>(body) ?? []).map((c) => ({ ...c, status: normalizeContractStatus(c.status) }))
}

/**
 * POST /api/manager/contracts/{contractId}/forfeit-processed  body { note } (K1).
 * Chỉ hợp đồng FORFEITED của cơ sở mình; BE chuyển ô kho sang bảo trì và ghi nhật ký.
 */
export async function markForfeitProcessed(ctx: ManagerContext, contractId: number, note: string): Promise<void> {
  if (isMockMode()) return
  await apiClient.post(`/manager/contracts/${contractId}/forfeit-processed`, { note: note.trim() }, { headers: managerHeaders(ctx) })
}
