// US-06: Đơn đặt cọc giữ chỗ & xử lý No-Show (BR-13).
// Contract FE đề xuất, chờ Bảo chốt DTO backend.

/** PENDING_CHECKIN: đã cọc, chờ khách đến nhận kho. ACTIVE: đã check-in. */
export type ReservationStatus = "PENDING_CHECKIN" | "ACTIVE" | "CANCELED"

/** NO_SHOW: hệ thống tự hủy do quá hạn check-in (BR-13). */
export type CancelReason = "NO_SHOW" | "CUSTOMER_REQUEST"

export interface Reservation {
  reservationCode: string // RES-CG-8899-K7X2
  customerName: string
  customerEmail: string
  cccd: string
  facilityCode: string // HN-01
  facilityName: string
  unitCode: string
  checkinDate: string // YYYY-MM-DD, ngày hẹn nhận kho
  depositAmount: number // VND
  status: ReservationStatus
  cancelReason: CancelReason | null
  forfeitedAmount: number | null // Tiền cọc bị tịch thu (VND)
  canceledAt: string | null // ISO datetime
  createdAt: string // ISO datetime
}

export interface ReservationFilter {
  status?: ReservationStatus
  reason?: CancelReason
  page: number // bắt đầu từ 0
  size: number
}

/** Dạng phân trang của Spring Data */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface NoShowScanResult {
  scannedAt: string
  canceledCount: number
  reservationCodes: string[]
}
