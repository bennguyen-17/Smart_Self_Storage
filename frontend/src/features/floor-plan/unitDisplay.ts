// Quy tắc hiển thị ô kho dùng chung cho lưới, legend và modal.

import type { StatusGroup, UnitDetailResponse, UnitSize } from "./types"

export const UNIT_SIZES: UnitSize[] = ["S", "M", "L", "XL"]

/** Diện tích chuẩn theo BR-06, dùng làm nhãn bộ lọc và giá trị dự phòng */
export const SIZE_AREA_M2: Record<UnitSize, number> = {
  S: 1,
  M: 3,
  L: 6,
  XL: 10,
}

/**
 * Lấy mã size từ typeName ("Size M - Climate (Kho mát VIP)" → "M").
 * Không dựa vào việc chuỗi có chứa "l"/"s", vì "Size S (Locker…)" sẽ bị nhận nhầm.
 */
export function unitSizeOf(unit: UnitDetailResponse): UnitSize | null {
  const match = /size\s*(XL|S|M|L)\b/i.exec(unit.typeName ?? "")
  return match ? (match[1].toUpperCase() as UnitSize) : null
}

export function unitAreaOf(unit: UnitDetailResponse): number | null {
  if (unit.areaM2 != null) return unit.areaM2
  const size = unitSizeOf(unit)
  return size ? SIZE_AREA_M2[size] : null
}

/** Dài × Rộng × Cao (m). Nếu thiếu thì tách từ chuỗi size "2m x 2m x 2.5m". */
export function unitDimensionsOf(
  unit: UnitDetailResponse
): [number, number, number] | null {
  if (unit.lengthM != null && unit.widthM != null && unit.heightM != null) {
    return [unit.lengthM, unit.widthM, unit.heightM]
  }
  const numbers = (unit.size ?? "").match(/\d+(?:[.,]\d+)?/g)
  if (numbers?.length !== 3) return null
  const [l, w, h] = numbers.map((n) => Number(n.replace(",", ".")))
  return [l, w, h]
}

/**
 * Gom trạng thái backend về 4 màu. Enum main: AVAILABLE | HOLD | RENTED | MAINTENANCE | OVERDUE.
 * Chấp nhận thêm tên theo BR (OCCUPIED, RESERVED, UNDER_MAINTENANCE) để không vỡ khi BE đổi enum.
 */
export function statusGroupOf(status: string): StatusGroup {
  switch (status) {
    case "AVAILABLE":
      return "AVAILABLE"
    case "HOLD":
      return "HOLD"
    case "MAINTENANCE":
    case "UNDER_MAINTENANCE":
      return "MAINTENANCE"
    default:
      // RENTED, OVERDUE, OCCUPIED, RESERVED
      return "TAKEN"
  }
}

export const STATUS_STYLES: Record<
  StatusGroup,
  { label: string; cell: string; swatch: string }
> = {
  AVAILABLE: {
    label: "Còn trống",
    cell: "border-emerald-500 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-100 dark:hover:bg-emerald-900",
    swatch: "border-emerald-500 bg-emerald-100 dark:bg-emerald-950",
  },
  HOLD: {
    label: "Đang giữ chỗ",
    cell: "border-amber-500 bg-amber-100 text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-100",
    swatch: "border-amber-500 bg-amber-100 dark:bg-amber-950",
  },
  TAKEN: {
    label: "Đã thuê / đặt",
    cell: "border-rose-500 bg-rose-100 text-rose-900 dark:border-rose-600 dark:bg-rose-950 dark:text-rose-100",
    swatch: "border-rose-500 bg-rose-100 dark:bg-rose-950",
  },
  MAINTENANCE: {
    label: "Bảo trì",
    cell: "border-slate-400 bg-slate-200 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
    swatch: "border-slate-400 bg-slate-200 dark:bg-slate-800",
  },
}

/** "Tầng Trệt (Sảnh & Kho XL)" → "Tầng Trệt" */
export function shortFloorName(floorName: string): string {
  return floorName.split("(")[0].trim()
}
