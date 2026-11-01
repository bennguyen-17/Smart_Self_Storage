// US-13: API quản lý ô kho của Facility Manager.
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.
// BE xác định cơ sở và người thao tác qua header X-Facility-Id, X-Account-Id (gắn ở đây, component không cần biết).

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

/**
 * POST /api/staff/units/{unitCode}/complete-maintenance: sửa / vệ sinh xong, mở lại ô thành AVAILABLE.
 * BE dùng chung endpoint cho Staff và Manager (SecurityConfig cho MANAGER gọi /api/staff/**),
 * cơ sở lấy từ tài khoản đăng nhập; ghi nhật ký COMPLETE_MAINTENANCE.
 */
export async function endMaintenance(ctx: ManagerContext, unitCode: string): Promise<ManagerUnit> {
  if (isMockMode()) return mockEndMaintenance(unitCode)
  const body = await apiClient.post(`/staff/units/${encodeURIComponent(unitCode)}/complete-maintenance`, null, {
    headers: contextHeaders(ctx),
  })
  return unwrapApiData<ManagerUnit>(body)
}
