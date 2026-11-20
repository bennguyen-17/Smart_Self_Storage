// DTO cho luồng check-in, thu phạt và gia hạn tại quầy (/api/staff/reservations)

export type ContractStatus =
  "PENDING_CHECKIN" | "ACTIVE" | "OVERDUE" | "CANCELLED" | "TERMINATED"

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
  endDate: string | null // YYYY-MM-DD
  // Ngày bắt đầu/kết thúc đơn, dùng khi endDate chưa có
  reservationStartDate?: string | null // YYYY-MM-DD
  reservationEndDate?: string | null // YYYY-MM-DD
  // Nhãn thời gian thuê, vd "1 tháng"
  rentalDuration: string | null
  overdueDays: number | null
  overdueLiquidationDays?: number | null
  unpaidPenaltyAmount: number | null
  monthlyPrice: number | null
  returnRequested?: boolean | null
  desiredReturnDate?: string | null
  cancelReason?: string | null
  unitTypeName?: string | null
  unitSize?: string | null
  depositDate?: string | null
}

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
  // Ẩn nút tải nếu chưa xuất hóa đơn DEP
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
  overdueLiquidationDays?: number | null
}

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
