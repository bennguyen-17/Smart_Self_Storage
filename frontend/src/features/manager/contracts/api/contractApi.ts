import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { managerHeaders } from "@/features/manager/managerContext"
import type { ManagerContext } from "@/features/manager/units/types"

import { normalizeContractStatus } from "../contractRules"
import type { FacilityContract } from "../types"
import { mockListFacilityContracts } from "./contractApi.mock"

export async function listFacilityContracts(ctx: ManagerContext): Promise<FacilityContract[]> {
  if (isMockMode()) return mockListFacilityContracts()
  const body = await apiClient.get("/manager/contracts", { headers: managerHeaders(ctx) })
  return (unwrapApiData<FacilityContract[]>(body) ?? []).map((c) => ({ ...c, status: normalizeContractStatus(c.status) }))
}

// BE yêu cầu note và 1–5 ảnh minh chứng, sau đó chuyển ô sang bảo trì
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
