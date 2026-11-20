// API công khai cho trang landing (không cần đăng nhập)

import { unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"

export interface PublicPrice {
  unitTypeId: number
  size: string | null
  name?: string | null
  dailyPrice: number
  monthlyPrice: number
  depositAmount: number
  climateSurchargePercent: number | null
  status?: string | null
}

export interface PublicFacilityRow {
  facilityId: number
  // vd: "HN-01", "HCM-02"
  facilityCode: string
  facilityName: string | null
  address: string | null
  status: string | null
}

export async function getPublicPrices(): Promise<PublicPrice[]> {
  return unwrapApiData<PublicPrice[]>(await apiClient.get("/prices")) ?? []
}

export async function getPublicFacilities(): Promise<PublicFacilityRow[]> {
  return unwrapApiData<PublicFacilityRow[]>(await apiClient.get("/facilities")) ?? []
}

export async function countAvailableUnits(facilityId: number): Promise<number> {
  const units = unwrapApiData<unknown[]>(
    await apiClient.get("/units", { params: { facilityId, status: "AVAILABLE" } })
  )
  return Array.isArray(units) ? units.length : 0
}

// Đếm ô trống theo mã cơ sở; bỏ qua cơ sở lỗi để không làm hỏng trang landing
export async function availabilityByFacility(facilities: readonly PublicFacilityRow[]): Promise<Record<string, number>> {
  const results = await Promise.allSettled(facilities.map((f) => countAvailableUnits(f.facilityId)))
  const map: Record<string, number> = {}
  results.forEach((r, i) => {
    if (r.status === "fulfilled") map[facilities[i].facilityCode] = r.value
  })
  return map
}
