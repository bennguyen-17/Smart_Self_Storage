// Luật nghiệp vụ quản lý ô kho (US-13, US-14). Hàm thuần, kiểm bằng bảng test trong unitRules.test.ts.

import type { PhysicalUnitStatus } from "./types"

/**
 * Chuẩn hóa trạng thái ô kho về bộ chuẩn. DB vẫn còn giá trị cũ (RENTED, MAINTENANCE, OVERDUE)
 * nên FE đọc được cả hai bộ. Giá trị lạ → null (không tự đoán).
 */
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

/**
 * Loại kho tương ứng khi đổi Thường ↔ Điều hòa (cùng kích thước).
 * Theo bảng UnitType trong database/db-script.sql: chỉ Size M (2 ↔ 5) và Size L (3 ↔ 6) có bản điều hòa.
 * Khi BE có API danh mục loại kho thì thay bảng này bằng dữ liệu API.
 */
const CLIMATE_COUNTERPART: Record<number, number> = { 2: 5, 5: 2, 3: 6, 6: 3 }

export function climateCounterpartTypeId(unitTypeId: number | null | undefined): number | null {
  if (unitTypeId == null) return null
  return CLIMATE_COUNTERPART[unitTypeId] ?? null
}

/** Chỉ ô đang trống mới được đổi loại kho, và phải có loại tương ứng cùng size */
export function canChangeStorageType(status: string, unitTypeId: number | null | undefined): boolean {
  return normalizeUnitStatus(status) === "AVAILABLE" && climateCounterpartTypeId(unitTypeId) !== null
}

/** Ô có khách giữ chỗ / đặt / đang thuê thì không được đưa vào bảo trì; chỉ ô trống mới được */
export function canStartMaintenance(status: string): boolean {
  return normalizeUnitStatus(status) === "AVAILABLE"
}

/** Lý do không thao tác được, để hiện tooltip thay vì nút bị khóa mà không giải thích */
export function changeTypeBlockReason(status: string, unitTypeId: number | null | undefined): string | null {
  if (normalizeUnitStatus(status) !== "AVAILABLE") return "Chỉ đổi được loại kho khi ô đang trống"
  if (climateCounterpartTypeId(unitTypeId) === null) return "Size này chưa có phiên bản kho điều hòa"
  return null
}

/** Ghi chú sự cố khi đưa ô vào bảo trì: bắt buộc (AC US-13), tối đa 500 ký tự */
export const MAINTENANCE_NOTE_MAX = 500

export function maintenanceNoteError(note: string): string | null {
  const trimmed = note.trim()
  if (trimmed.length === 0) return "Vui lòng ghi chú sự cố hoặc lý do bảo trì"
  if (trimmed.length > MAINTENANCE_NOTE_MAX) return `Ghi chú tối đa ${MAINTENANCE_NOTE_MAX} ký tự`
  return null
}

/** Những gì Manager chỉnh trong ngăn "Sửa ô kho" */
export interface UnitEditDraft {
  climate: boolean
  maintenance: boolean
  note: string
}

export type UnitEditOp =
  | { kind: "change-type"; targetTypeId: number }
  | { kind: "maintenance"; note: string }

interface EditableUnit {
  status: string
  unitTypeId: number | null | undefined
  isClimate?: boolean | null
}

/** Bản nháp ban đầu khớp đúng hiện trạng ô */
export function initialUnitDraft(unit: EditableUnit): UnitEditDraft {
  return {
    climate: Boolean(unit.isClimate),
    maintenance: normalizeUnitStatus(unit.status) === "UNDER_MAINTENANCE",
    note: "",
  }
}

/**
 * Từ bản nháp suy ra cần gọi API nào, theo thứ tự: đổi loại kho trước rồi mới đưa vào bảo trì
 * (cả hai đều yêu cầu ô đang trống). Thay đổi không hợp lệ với trạng thái ô thì bỏ qua,
 * vì giao diện đã khóa lựa chọn đó. `noteError` khác null nghĩa là chưa được lưu.
 */
export function planUnitEdit(unit: EditableUnit, draft: UnitEditDraft): { ops: UnitEditOp[]; noteError: string | null } {
  const ops: UnitEditOp[] = []
  let noteError: string | null = null

  const target = climateCounterpartTypeId(unit.unitTypeId)
  if (draft.climate !== Boolean(unit.isClimate) && canChangeStorageType(unit.status, unit.unitTypeId) && target !== null) {
    ops.push({ kind: "change-type", targetTypeId: target })
  }

  if (draft.maintenance && canStartMaintenance(unit.status)) {
    noteError = maintenanceNoteError(draft.note)
    ops.push({ kind: "maintenance", note: draft.note.trim() })
  }

  return { ops, noteError }
}

export const UNIT_STATUS_META: Record<PhysicalUnitStatus, { label: string; className: string }> = {
  AVAILABLE: {
    label: "Còn trống",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  HOLD: {
    label: "Đang giữ chỗ",
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
    label: "Bảo trì / vệ sinh",
    className: "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
}
