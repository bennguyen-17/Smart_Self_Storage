// US-16: Check-in tại quầy (tra cứu mã đặt chỗ, đổi ô kho, hủy tại quầy).
// Contract FE đề xuất, chờ Khánh chốt DTO backend tại /api/staff/checkins.

import type { StorageCondition, UnitDetailResponse } from "@/types"

/** Trạng thái hợp đồng dùng cho màn check-in (khớp ReservationStatus đang dùng). */
export type ContractStatus =
  | "PENDING_CHECKIN"
  | "ACTIVE"
  | "OVERDUE"
  | "CANCELED"

export type RentalType = "DAILY" | "MONTHLY"

/** Mã lỗi tra cứu để render đúng thông báo theo Acceptance Criteria. */
export type LookupErrorCode = "NOT_FOUND" | "WRONG_STATUS"

export interface CheckinContract {
  code: string // Mã đặt chỗ / mã hợp đồng, VD: RES-CG-8899-K7X2
  customerName: string
  customerPhone: string
  email: string
  cccd: string
  facilityId: number
  facilityCode: string // HN-01
  facilityName: string
  floorId: number
  floorName: string
  unitCode: string
  unitTypeId: number
  unitTypeName: string
  sizeLabel: string // "Size M (3m²)"
  areaM2: number
  storageCondition: StorageCondition
  rentalType: RentalType
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  checkinDate: string // YYYY-MM-DD, ngày hẹn nhận kho
  invoiceNumber: string // DEP-...
  rentalAmount: number // 100% tiền thuê lần đầu
  depositAmount: number // tiền cọc
  paidAmount: number // đã thu (cọc online)
  remainingAmount: number // còn phải thu tại quầy = (rental + deposit) - paid
  status: ContractStatus
  gatePin?: string | null // PIN mở cổng sinh ra sau khi check-in
}

export interface CheckinFilter {
  status?: ContractStatus
  page: number // bắt đầu từ 0
  size: number
}

/** Dạng phân trang của Spring Data (dùng chung cho các màn staff). */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ChangeUnitRequest {
  newUnitCode: string
  newRentalAmount: number
  newDepositAmount: number
}

/** Kết quả tính chênh lệch khi đổi ô, hiển thị trước khi xác nhận (BR-20). */
export interface ChangeUnitPreview {
  newUnit: UnitDetailResponse
  newRentalAmount: number
  newDepositAmount: number
  newTotal: number
  paidAmount: number
  remainingAmount: number
  refundAmount: number // > 0 khi tổng mới < số đã thu → hoàn phần dư
}

export interface CounterCancelResult {
  refundAmount: number
  forfeitedAmount: number
}

/** Lỗi tra cứu có mã để FE phân biệt "không tìm thấy" và "sai trạng thái". */
export class CheckinApiError extends Error {
  code: LookupErrorCode

  constructor(code: LookupErrorCode, message: string) {
    super(message)
    this.name = "CheckinApiError"
    this.code = code
  }
}
