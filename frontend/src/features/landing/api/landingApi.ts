// Dữ liệu thật cho Landing: bảng giá, cơ sở, số ô còn trống. Cả 3 API đều công khai (khách chưa đăng nhập gọi được).
// Đề: khách "view storage facilities, unit types, unit sizes, rental prices, and available units".

import { unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"

/** Một dòng GET /api/prices (bảng giá BOM đặt theo loại kho) */
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

/** Một dòng GET /api/facilities */
export interface PublicFacilityRow {
  facilityId: number
  /** "HN-01", "HCM-02"… */
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

/** Số ô còn trống của một cơ sở (GET /api/units/filter?facilityId&status=AVAILABLE) */
export async function countAvailableUnits(facilityId: number): Promise<number> {
  const units = unwrapApiData<unknown[]>(
    await apiClient.get("/units/filter", { params: { facilityId, status: "AVAILABLE" } })
  )
  return Array.isArray(units) ? units.length : 0
}

/** Số ô trống theo mã cơ sở; cơ sở nào gọi lỗi thì bỏ qua (Landing vẫn hiện, chỉ không ghi số ô) */
export async function availabilityByFacility(facilities: readonly PublicFacilityRow[]): Promise<Record<string, number>> {
  const results = await Promise.allSettled(facilities.map((f) => countAvailableUnits(f.facilityId)))
  const map: Record<string, number> = {}
  results.forEach((r, i) => {
    if (r.status === "fulfilled") map[facilities[i].facilityCode] = r.value
  })
  return map
}
