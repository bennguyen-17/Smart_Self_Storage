// US-03: API sơ đồ 2D, bám theo endpoint backend hiện có (không /v1).
// VITE_USE_MOCK=true → mock; false → backend. Không tự fallback về mock khi lỗi.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/services/apiClient"

import type { Facility, Floor, UnitDetailResponse, UnitQuery } from "../types"
import {
  mockGetFacilities,
  mockGetFloors,
  mockGetUnits,
} from "./floorPlanApi.mock"

/** GET /api/facilities */
export async function getFacilities(): Promise<Facility[]> {
  if (isMockMode()) return mockGetFacilities()
  return unwrapApiData<Facility[]>(await apiClient.get("/facilities"))
}

/** GET /api/facilities/{facilityId}/floors (sắp theo floorId: Trệt → Tầng 1 → Tầng 2) */
export async function getFloors(facilityId: number): Promise<Floor[]> {
  const floors = isMockMode()
    ? await mockGetFloors(facilityId)
    : unwrapApiData<Floor[]>(
        await apiClient.get(`/facilities/${facilityId}/floors`)
      )
  return [...floors].sort((a, b) => a.floorId - b.floorId)
}

/**
 * GET /api/units/filter?facilityId&floorId&storageCondition
 * Backend chưa lọc được theo mã size (chỉ có unitTypeId) nên size lọc ở FE.
 */
export async function getUnits(
  query: UnitQuery
): Promise<UnitDetailResponse[]> {
  if (isMockMode()) return mockGetUnits(query)
  return unwrapApiData<UnitDetailResponse[]>(
    await apiClient.get("/units/filter", { params: query })
  )
}
