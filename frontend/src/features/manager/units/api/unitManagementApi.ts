import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { getFloors } from "@/features/floorplan/api/floorPlanApi"
import type { Floor } from "@/types"

import { managerHeaders as contextHeaders, MissingFacilityError } from "@/features/manager/managerContext"
import type { ManagerContext, ManagerUnit, ManagerUnitFilter } from "../types"
import {
  mockChangeUnitType,
  mockGetManagerFloors,
  mockGetManagerUnits,
  mockEndMaintenance,
  mockStartMaintenance,
} from "./unitManagementApi.mock"

export { MissingFacilityError }

export async function getManagerFloors(ctx: ManagerContext): Promise<Floor[]> {
  if (isMockMode()) return mockGetManagerFloors()
  if (ctx.facilityId === null) throw new MissingFacilityError()
  return getFloors(ctx.facilityId)
}

// BE chưa hỗ trợ lọc theo size nên FE tự lọc phía client
export async function getManagerUnits(
  ctx: ManagerContext,
  filter: ManagerUnitFilter
): Promise<ManagerUnit[]> {
  if (isMockMode()) return mockGetManagerUnits(filter)
  const body = await apiClient.get("/manager/units", {
    params: filter,
    headers: contextHeaders(ctx),
  })
  return unwrapApiData<ManagerUnit[]>(body)
}

export async function changeUnitType(
  ctx: ManagerContext,
  unitCode: string,
  unitTypeId: number
): Promise<ManagerUnit> {
  if (isMockMode()) return mockChangeUnitType(unitCode, unitTypeId)
  const body = await apiClient.patch(
    `/manager/units/${encodeURIComponent(unitCode)}/type`,
    { unitTypeId },
    { headers: contextHeaders(ctx) }
  )
  return unwrapApiData<ManagerUnit>(body)
}

export async function startMaintenance(
  ctx: ManagerContext,
  unitCode: string,
  note: string
): Promise<ManagerUnit> {
  if (isMockMode()) return mockStartMaintenance(unitCode)
  const body = await apiClient.post(
    `/manager/units/${encodeURIComponent(unitCode)}/maintenance`,
    { note: note.trim() },
    { headers: contextHeaders(ctx) }
  )
  return unwrapApiData<ManagerUnit>(body)
}

export async function endMaintenance(ctx: ManagerContext, unitCode: string): Promise<ManagerUnit> {
  if (isMockMode()) return mockEndMaintenance(unitCode)
  const body = await apiClient.post(`/manager/units/${encodeURIComponent(unitCode)}/complete-maintenance`, null, {
    headers: contextHeaders(ctx),
  })
  return unwrapApiData<ManagerUnit>(body)
}
