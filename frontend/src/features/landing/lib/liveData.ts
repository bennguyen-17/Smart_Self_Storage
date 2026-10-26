// Ghép dữ liệu thật (BE) vào nội dung có sẵn của Landing. Hàm thuần, kiểm bằng bảng DDT.
// Nội dung viết sẵn (ảnh, mô tả, sức chứa, điểm nổi bật) giữ nguyên; chỉ giá, tên, địa chỉ, trạng thái lấy từ BE.

import type { PublicFacilityRow, PublicPrice } from "../api/landingApi"
import type { PublicFacility } from "../content/facilities"
import type { LandingUnit } from "../content/units"

/** "HN-01" và "HN01" là cùng một cơ sở */
export function facilityKey(code: string): string {
  return code.replace(/-/g, "").toUpperCase()
}

/** Dòng giá kho thường của một cỡ (bỏ dòng kho điều hòa: dòng đó có phụ phí riêng) */
function normalPriceOf(prices: readonly PublicPrice[], size: string): PublicPrice | undefined {
  return prices.find(
    (p) => p.size?.toUpperCase() === size && !(p.climateSurchargePercent && p.climateSurchargePercent > 0) && p.status !== "INACTIVE"
  )
}

/** Thay giá ngày / tháng / cọc của 4 cỡ bằng bảng giá thật; cỡ nào BE không có thì giữ giá viết sẵn */
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
  /** null khi chưa tải được số ô trống */
  available: number | null
  /** Cơ sở đang tạm ngưng hoạt động (BOM vô hiệu hóa) */
  paused: boolean
}

/**
 * Tên, địa chỉ, trạng thái lấy từ BE theo mã cơ sở; điểm nổi bật giữ nội dung viết sẵn.
 * Cơ sở BE không còn trả về (đã xóa) vẫn hiện như cũ để trang không trống.
 */
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

/** Chữ trên thẻ cơ sở: tạm ngưng / hết ô / còn N ô */
export function availabilityLabel(f: Pick<LiveFacility, "available" | "paused">): string | null {
  if (f.paused) return "Tạm ngưng nhận khách"
  if (f.available === null) return null
  if (f.available === 0) return "Đang hết ô trống"
  return `Còn ${f.available} ô trống`
}
