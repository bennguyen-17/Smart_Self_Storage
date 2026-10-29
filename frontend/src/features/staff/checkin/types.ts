// US-16: Check-in tại quầy — types khớp DTO BE-16 (StaffReservationController).
// BE: /api/staff/reservations (list, lookup, check-in, change-unit, cancel)

/** Trạng thái hợp đồng (Contract.status) */
export type ContractStatus =
  "PENDING_CHECKIN" | "ACTIVE" | "OVERDUE" | "CANCELLED" | "TERMINATED"

/** Dòng danh sách trả về từ BE (StaffReservationListItemResponse). */
export interface StaffReservationItem {
  contractId?: number | null
  reservationId: number
  reservationCode: string
  customerName: string | null
  customerIdNumber: string | null // CCCD / CMND
  customerEmail: string | null
  customerPhone: string | null
  unitCode: string | null
  floorName: string | null
  reservationStatus: string | null
  checkInDate: string | null // YYYY-MM-DD
  contractStatus: string | null
  depStatus: string | null
  depPaymentStatus: string | null
  depAmount: number | null
  depPaidAmount: number | null
  depRemainingAmount: number | null
  depositAmount?: number | null
  rentalAmount?: number | null
  // US-20: thông tin quá hạn & phạt cho tab CHECK-IN
  endDate: string | null // YYYY-MM-DD
  /** BE-16 gửi ngày bắt đầu/kết thúc thật của đơn (endDate phía trên có thể không có) */
  reservationStartDate?: string | null // YYYY-MM-DD
  reservationEndDate?: string | null // YYYY-MM-DD
  /** BE-16 bổ sung: nhãn thời gian thuê (vd "1 tháng") */
  rentalDuration: string | null
  overdueDays: number | null
  unpaidPenaltyAmount: number | null
  monthlyPrice: number | null
  returnRequested?: boolean | null
  desiredReturnDate?: string | null
  cancelReason?: string | null
  unitTypeName?: string | null
  unitSize?: string | null
  depositDate?: string | null
}

/** Kết quả tra cứu (StaffReservationLookupResponse = item + unitStatus + contractPdfUrl). */
export interface StaffReservationLookup extends StaffReservationItem {
  success: boolean
  message: string
  unitStatus: string | null
  contractPdfUrl: string | null
}

export interface StaffReservationListResponse {
  success: boolean
  message: string
  data: StaffReservationItem[] | null
}

export interface StaffCheckInRequest {
  collectedAmount: number
  paymentMethod: string // CASH | BANK_TRANSFER
}

export interface StaffCheckInResponse {
  success: boolean
  message: string
  reservationId: number | null
  reservationCode: string | null
  contractStatus: string | null
  unitStatus: string | null
  collectedAmount: number | null
  gatePin: string | null
  remainingDue: number | null
  /** Link PDF hóa đơn DEP (BE bổ sung khi bàn giao). Chưa có thì ẩn. */
  invoicePdfUrl?: string | null
}

export interface StaffChangeUnitResponse {
  success: boolean
  message: string
  reservationId: number | null
  newUnitCode: string | null
  remainingDue: number | null
  refundAmount: number | null
}

export interface StaffCancelReservationResponse {
  success: boolean
  message: string
  reservationId: number | null
  reservationCode: string | null
  refundAmount: number | null
  penaltyAmount: number | null
}

// --- US-20: Thu phạt quá hạn tại quầy ---
export interface CollectPenaltyRequest {
  paymentMethod: string // CASH | BANK_TRANSFER
}

export interface CollectPenaltyResponse {
  success: boolean
  message: string
  reservationId: number | null
  reservationCode: string | null
  contractStatus: string | null
  unitStatus: string | null
  invoiceNumber: string | null // Hóa đơn gộp PEN (PAID)
  collectedAmount: number | null
  overdueDays: number | null
}

// --- US-20: Gia hạn tại quầy ---
export interface RenewAtCounterRequest {
  months?: number // 1 | 2 | 3 | 6 | 12
  days?: number
  paymentMethod: string // CASH | BANK_TRANSFER
}

export interface RenewAtCounterResponse {
  success: boolean
  message: string
  reservationId: number | null
  reservationCode: string | null
  contractStatus: string | null
  unitStatus: string | null
  invoiceNumber: string | null // Hóa đơn EXT (PAID)
  amount: number | null
  discountPercent: number | null
  newExpiryDate: string | null // YYYY-MM-DD
  gatePin: string | null
}
