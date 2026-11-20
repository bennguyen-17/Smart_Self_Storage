import type { PhysicalUnitStatus } from "./types"

// Map cả giá trị cũ trong DB (RENTED, MAINTENANCE, OVERDUE) về bộ trạng thái chuẩn
export function normalizeUnitStatus(status: string | null | undefined): PhysicalUnitStatus | null {
  switch ((status ?? "").trim().toUpperCase()) {
    case "AVAILABLE":
      return "AVAILABLE"
    case "HOLD":
      return "HOLD"
    case "RESERVED":
      return "RESERVED"
    case "OCCUPIED":
    case "RENTED":
    case "OVERDUE": // HĐ quá hạn nhưng ô vẫn đang có đồ của khách
      return "OCCUPIED"
    case "UNDER_MAINTENANCE":
    case "MAINTENANCE":
      return "UNDER_MAINTENANCE"
    default:
      return null
  }
}

// Cặp UnitTypeId Thường <-> Điều hòa cùng kích thước: M (2<->5), L (3<->6), XL (4<->7); S (1) chỉ có kho thường
const CLIMATE_COUNTERPART: Record<number, number> = { 2: 5, 5: 2, 3: 6, 6: 3, 4: 7, 7: 4 }

export function climateCounterpartTypeId(unitTypeId: number | null | undefined): number | null {
  if (unitTypeId == null) return null
  return CLIMATE_COUNTERPART[unitTypeId] ?? null
}

export function canChangeStorageType(status: string, unitTypeId: number | null | undefined): boolean {
  return normalizeUnitStatus(status) === "AVAILABLE" && climateCounterpartTypeId(unitTypeId) !== null
}

export function canStartMaintenance(status: string): boolean {
  return normalizeUnitStatus(status) === "AVAILABLE"
}

export function canEndMaintenance(status: string): boolean {
  return normalizeUnitStatus(status) === "UNDER_MAINTENANCE"
}

export function changeTypeBlockReason(status: string, unitTypeId: number | null | undefined): string | null {
  if (normalizeUnitStatus(status) !== "AVAILABLE") return "Chỉ đổi được loại kho khi ô đang trống"
  if (climateCounterpartTypeId(unitTypeId) === null) return "Size này chưa có phiên bản kho điều hòa"
  return null
}

// Phụ phí mặc định cho kho điều hòa khi bảng giá chưa cấu hình
export const DEFAULT_CLIMATE_SURCHARGE_PERCENT = 20

export interface UnitPrice {
  daily: number
  monthly: number
  deposit: number | null
  surchargePercent: number
}

// Cộng phụ phí kho điều hòa đồng bộ với BE; trả null nếu chưa có bảng giá
export function unitPrice(unit: {
  dailyPrice?: number | null
  monthlyPrice?: number | null
  depositAmount?: number | null
  isClimate?: boolean | null
  climateSurchargePercent?: number | null
}): UnitPrice | null {
  if (unit.dailyPrice == null || unit.monthlyPrice == null) return null
  const surchargePercent = unit.isClimate
    ? unit.climateSurchargePercent && unit.climateSurchargePercent > 0
      ? unit.climateSurchargePercent
      : DEFAULT_CLIMATE_SURCHARGE_PERCENT
    : 0
  const factor = 1 + surchargePercent / 100
  return {
    daily: Math.round(Number(unit.dailyPrice) * factor),
    monthly: Math.round(Number(unit.monthlyPrice) * factor),
    deposit: unit.depositAmount ?? null,
    surchargePercent,
  }
}

export const MAINTENANCE_NOTE_MAX = 500

export function maintenanceNoteError(note?: string | null): string | null {
  if (!note) return null
  const trimmed = note.trim()
  if (trimmed.length > MAINTENANCE_NOTE_MAX) return `Ghi chú tối đa ${MAINTENANCE_NOTE_MAX} ký tự`
  return null
}

export interface UnitEditDraft {
  climate: boolean
  maintenance: boolean
  note: string
}

export type UnitEditOp =
  | { kind: "change-type"; targetTypeId: number }
  | { kind: "maintenance"; note: string }
  | { kind: "end-maintenance" }

interface EditableUnit {
  status: string
  unitTypeId: number | null | undefined
  isClimate?: boolean | null
}

export function initialUnitDraft(unit: EditableUnit): UnitEditDraft {
  return {
    climate: Boolean(unit.isClimate),
    maintenance: normalizeUnitStatus(unit.status) === "UNDER_MAINTENANCE",
    note: "",
  }
}

// Đổi loại kho trước rồi mới chuyển bảo trì vì cả hai đều yêu cầu ô đang trống
export function planUnitEdit(unit: EditableUnit, draft: UnitEditDraft): { ops: UnitEditOp[]; noteError: string | null } {
  const ops: UnitEditOp[] = []
  let noteError: string | null = null

  const target = climateCounterpartTypeId(unit.unitTypeId)
  if (draft.climate !== Boolean(unit.isClimate) && canChangeStorageType(unit.status, unit.unitTypeId) && target !== null) {
    ops.push({ kind: "change-type", targetTypeId: target })
  }

  if (draft.maintenance && canStartMaintenance(unit.status)) {
    noteError = maintenanceNoteError(draft.note)
    ops.push({ kind: "maintenance", note: (draft.note || "").trim() })
  }

  if (!draft.maintenance && canEndMaintenance(unit.status)) {
    ops.push({ kind: "end-maintenance" })
  }

  return { ops, noteError }
}

export const UNIT_STATUS_META: Record<PhysicalUnitStatus, { label: string; className: string }> = {
  AVAILABLE: {
    label: "Còn trống",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  HOLD: {
    label: "Giữ chỗ",
    className: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  },
  RESERVED: {
    label: "Đã đặt cọc",
    className: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  },
  OCCUPIED: {
    label: "Đang thuê",
    className: "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
  },
  UNDER_MAINTENANCE: {
    label: "Bảo trì",
    className: "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
}
