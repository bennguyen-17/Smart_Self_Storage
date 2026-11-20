// Quy tắc hiển thị ô kho dùng chung cho lưới, legend và modal.

import type { StatusGroup, UnitDetailResponse, UnitSize } from "./types"

export const UNIT_SIZES: UnitSize[] = ["S", "M", "L", "XL"]

// Diện tích chuẩn theo size, dùng cho bộ lọc và fallback
export const SIZE_AREA_M2: Record<UnitSize, number> = {
  S: 1,
  M: 3,
  L: 6,
  XL: 10,
}

// Tách size sau chữ "Size" để tránh nhận nhầm chữ L/S trong từ khác (vd "Locker")
export function unitSizeOf(unit: UnitDetailResponse): UnitSize | null {
  const match = /size\s*(XL|S|M|L)\b/i.exec(unit.typeName ?? "")
  return match ? (match[1].toUpperCase() as UnitSize) : null
}

export function unitAreaOf(unit: UnitDetailResponse): number | null {
  if (unit.areaM2 != null) return unit.areaM2
  const size = unitSizeOf(unit)
  return size ? SIZE_AREA_M2[size] : null
}

// Fallback suy size từ mã ô (vd "HN01-G-XL05" -> "XL") khi chưa có dữ liệu API
export function unitSizeFromCode(unitCode: string): UnitSize | null {
  const match = /([A-Za-z]{1,2})\d+$/.exec(unitCode.trim())
  const size = match?.[1]?.toUpperCase() as UnitSize | undefined
  return size && UNIT_SIZES.includes(size) ? size : null
}

// Trả về [dài, rộng, cao] theo mét, fallback parse từ chuỗi size
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

// Gom trạng thái BE về nhóm hiển thị; giữ thêm alias cũ (OCCUPIED, UNDER_MAINTENANCE) để tương thích
export function statusGroupOf(status: string): StatusGroup {
  switch (status) {
    case "AVAILABLE":
      return "AVAILABLE"
    case "HOLD":
      return "HOLD"
    case "RESERVED":
      return "RESERVED"
    case "RENTED":
    case "OCCUPIED":
    case "OVERDUE":
      return "RENTED"
    case "MAINTENANCE":
    case "UNDER_MAINTENANCE":
      return "MAINTENANCE"
    default:
      return "AVAILABLE"
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
    label: "Giữ chỗ",
    cell: "border-amber-500 bg-amber-100 text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-100",
    swatch: "border-amber-500 bg-amber-100 dark:bg-amber-950",
  },
  RESERVED: {
    label: "Đã cọc",
    cell: "border-purple-500 bg-purple-100 text-purple-900 dark:border-purple-600 dark:bg-purple-950 dark:text-purple-100",
    swatch: "border-purple-500 bg-purple-100 dark:bg-purple-950",
  },
  RENTED: {
    label: "Đang thuê",
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
