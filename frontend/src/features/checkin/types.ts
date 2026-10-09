// US-16: Check-in tại quầy — types khớp DTO BE-16 (StaffReservationController).
// BE: /api/staff/reservations (list, lookup, check-in, change-unit, cancel)

/** Trạng thái hợp đồng (Contract.status) */
export type ContractStatus =
  | "PENDING_CHECKIN"
  | "ACTIVE"
  | "OVERDUE"
  | "CANCELED"

/** Dòng danh sách trả về từ BE (StaffReservationListItemResponse). */
export interface StaffReservationItem {
  reservationId: number
  reservationCode: string
  customerName: string | null
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
