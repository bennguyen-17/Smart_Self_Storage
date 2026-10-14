// US-13: API quản lý ô kho của Facility Manager.
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.
// BE xác định cơ sở và người thao tác qua header X-Facility-Id, X-Account-Id (gắn ở đây, component không cần biết).

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { getFloors } from "@/features/floor-plan/api/floorPlanApi"
import type { Floor } from "@/types"

import type { ManagerContext, ManagerUnit, ManagerUnitFilter } from "../types"
import {
  mockChangeUnitType,
  mockGetManagerFloors,
  mockGetManagerUnits,
  mockStartMaintenance,
} from "./unitManagementApi.mock"

export class MissingFacilityError extends Error {
  constructor() {
    super("Tài khoản quản lý chưa được gắn cơ sở, nên chưa xem được ô kho. Vui lòng liên hệ quản trị hệ thống.")
    this.name = "MissingFacilityError"
  }
}

function contextHeaders(ctx: ManagerContext): Record<string, string> {
  if (ctx.facilityId === null) throw new MissingFacilityError()
  const headers: Record<string, string> = { "X-Facility-Id": String(ctx.facilityId) }
  if (ctx.accountId !== null) headers["X-Account-Id"] = String(ctx.accountId)
  return headers
}

/** GET /api/facilities/{facilityId}/floors */
export async function getManagerFloors(ctx: ManagerContext): Promise<Floor[]> {
  if (isMockMode()) return mockGetManagerFloors()
  if (ctx.facilityId === null) throw new MissingFacilityError()
  return getFloors(ctx.facilityId)
}

/** GET /api/manager/units?floorId&status&storageCondition (BE chưa lọc theo size, FE tự lọc) */
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

/** PATCH /api/manager/units/{unitCode}/type  body { unitTypeId } */
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

/** POST /api/manager/units/{unitCode}/maintenance  body { note }: ghi chú sự cố, BE lưu vào nhật ký */
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
