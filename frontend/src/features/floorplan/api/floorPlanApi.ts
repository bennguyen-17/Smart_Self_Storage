// API sơ đồ kho 2D (chỉ dùng mock khi bật VITE_USE_MOCK=true, không fallback khi lỗi)

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"

import type { Facility, Floor, UnitDetailResponse, UnitQuery } from "../types"
import {
  mockGetFacilities,
  mockGetFloors,
  mockGetUnits,
} from "./floorPlanApi.mock"

export async function getFacilities(): Promise<Facility[]> {
  if (isMockMode()) return mockGetFacilities()
  return unwrapApiData<Facility[]>(await apiClient.get("/facilities"))
}

// Sắp theo floorId để giữ thứ tự Trệt -> Tầng 1 -> Tầng 2
export async function getFloors(facilityId: number): Promise<Floor[]> {
  const floors = isMockMode()
    ? await mockGetFloors(facilityId)
    : unwrapApiData<Floor[]>(
        await apiClient.get(`/facilities/${facilityId}/floors`)
      )
  return [...floors].sort((a, b) => a.floorId - b.floorId)
}

// BE chưa hỗ trợ lọc theo mã size nên lọc size phía FE
export async function getUnits(
  query: UnitQuery
): Promise<UnitDetailResponse[]> {
  if (isMockMode()) return mockGetUnits(query)
  return unwrapApiData<UnitDetailResponse[]>(
    await apiClient.get("/units", { params: query })
  )
}
