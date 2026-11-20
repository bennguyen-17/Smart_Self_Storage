// Ghép giá và trạng thái cơ sở từ BE vào nội dung tĩnh của trang landing

import type { PublicFacilityRow, PublicPrice } from "../api/landingApi"
import type { PublicFacility } from "../content/facilities"
import type { LandingUnit } from "../content/units"

// Chuẩn hóa mã cơ sở để "HN-01" và "HN01" khớp nhau
export function facilityKey(code: string): string {
  return code.replace(/-/g, "").toUpperCase()
}

// Chỉ lấy giá kho thường, bỏ dòng kho điều hòa vì tính phụ phí riêng
function normalPriceOf(prices: readonly PublicPrice[], size: string): PublicPrice | undefined {
  return prices.find(
    (p) => p.size?.toUpperCase() === size && !(p.climateSurchargePercent && p.climateSurchargePercent > 0) && p.status !== "INACTIVE"
  )
}

// Ghi đè giá từ BE, giữ giá mặc định cho cỡ kho chưa có trên BE
export function mergeUnitPrices(units: readonly LandingUnit[], prices: readonly PublicPrice[] | undefined): LandingUnit[] {
  if (!prices || prices.length === 0) return [...units]
  return units.map((u) => {
    const p = normalPriceOf(prices, u.size)
    if (!p) return u
    return {
      ...u,
      pricePerDay: Number(p.dailyPrice),
      pricePerMonth: Number(p.monthlyPrice),
      deposit: Number(p.depositAmount),
    }
  })
}

export interface LiveFacility extends PublicFacility {
  // null khi chưa tải được số ô trống
  available: number | null
  // true khi cơ sở bị tạm ngưng hoạt động
  paused: boolean
}

// Giữ dữ liệu tĩnh làm fallback nếu cơ sở không có trong danh sách BE trả về
export function mergeFacilities(
  facilities: readonly PublicFacility[],
  rows: readonly PublicFacilityRow[] | undefined,
  available: Record<string, number> | undefined
): LiveFacility[] {
  const byKey = new Map((rows ?? []).map((r) => [facilityKey(r.facilityCode), r]))
  const countByKey = new Map(Object.entries(available ?? {}).map(([code, n]) => [facilityKey(code), n]))
  return facilities.map((f) => {
    const row = byKey.get(facilityKey(f.code))
    return {
      ...f,
      name: row?.facilityName || f.name,
      address: row?.address || f.address,
      paused: Boolean(row?.status && row.status.toUpperCase() !== "ACTIVE"),
      available: countByKey.get(facilityKey(f.code)) ?? null,
    }
  })
}

export function availabilityLabel(f: Pick<LiveFacility, "available" | "paused">): string | null {
  if (f.paused) return "Tạm ngưng nhận khách"
  if (f.available === null) return null
  if (f.available === 0) return "Đang hết ô trống"
  return `Còn ${f.available} ô trống`
}
