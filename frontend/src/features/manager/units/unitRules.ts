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
 * Theo bảng UnitType trong database/db-script.sql: Size M (2 ↔ 5), Size L (3 ↔ 6), Size XL (4 ↔ 7).
 * Size S (1) chỉ có kho thường.
 * Khi BE có API danh mục loại kho thì thay bảng này bằng dữ liệu API.
 */
const CLIMATE_COUNTERPART: Record<number, number> = { 2: 5, 5: 2, 3: 6, 6: 3, 4: 7, 7: 4 }

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

/** BE mặc định phụ phí kho điều hòa 20% khi bảng giá chưa đặt (StorageService.calculateRentalPrice) */
export const DEFAULT_CLIMATE_SURCHARGE_PERCENT = 20

export interface UnitPrice {
  daily: number
  monthly: number
  deposit: number | null
  /** % phụ phí đã cộng vào giá ngày / tháng (0 với kho thường) */
  surchargePercent: number
}

/**
 * Giá khách thực trả của ô (chỉ xem, giá do BOM đặt theo loại kho): kho điều hòa cộng phụ phí giống cách BE tính tiền.
 * Thiếu giá trong bảng giá thì trả null để giao diện ghi "Chưa có giá".
 */
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

/** Ghi chú sự cố khi đưa ô vào bảo trì: không bắt buộc, tối đa 500 ký tự nếu có nhập */
export const MAINTENANCE_NOTE_MAX = 500

export function maintenanceNoteError(note?: string | null): string | null {
  if (!note) return null
  const trimmed = note.trim()
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
    ops.push({ kind: "maintenance", note: (draft.note || "").trim() })
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
    label: "Bảo trì",
    className: "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
}
