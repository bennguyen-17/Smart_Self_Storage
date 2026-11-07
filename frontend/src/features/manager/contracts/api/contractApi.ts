// Danh sách hợp đồng của cơ sở dành cho Quản lý cơ sở.
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
 * POST /api/manager/contracts/{contractId}/forfeit-processed  body { note, evidenceImageIds }.
 * Chỉ hợp đồng FORFEITED của cơ sở mình; BE bắt buộc ghi chú và 1–5 ảnh minh chứng (đã tải qua /api/uploads),
 * rồi chuyển ô kho sang bảo trì và ghi nhật ký.
 */
export async function markForfeitProcessed(
  ctx: ManagerContext,
  contractId: number,
  note: string,
  evidenceImageIds: number[]
): Promise<void> {
  if (isMockMode()) return
  await apiClient.post(
    `/manager/contracts/${contractId}/forfeit-processed`,
    { note: note.trim(), evidenceImageIds },
    { headers: managerHeaders(ctx) }
  )
}

/**
 * POST /api/manager/contracts/{contractId}/terminate-violation  body { reason, evidenceImageIds }.
 * Đơn phương chấm dứt hợp đồng do vi phạm lưu trữ hàng cấm hoặc quy chế an ninh nghiêm trọng.
 */
export async function terminateViolationContract(
  ctx: ManagerContext,
  contractId: number,
  reason: string,
  evidenceImageIds?: number[]
): Promise<void> {
  if (isMockMode()) return
  await apiClient.post(
    `/manager/contracts/${contractId}/terminate-violation`,
    { reason: reason.trim(), evidenceImageIds: evidenceImageIds ?? [] },
    { headers: managerHeaders(ctx) }
  )
}
