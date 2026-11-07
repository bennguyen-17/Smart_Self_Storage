// Hoàn tiền cho khách do Quản lý cơ sở xác nhận: phiếu hoàn tiền cọc chờ giải ngân → đã hoàn.
// Khớp RefundListItemResponse hiện có của BE (GET /api/staff/refunds) + các trường đề xuất trong
// plans/261022-manager-admin-sprint3/viec-cho-be-va-fe-khac.md (B1). Trường đề xuất để tùy chọn.

/** Loại phiếu hoàn (đề xuất B1); BE chưa trả thì FE suy ra từ lý do hủy */
export type RefundType = "CANCEL_DEPOSIT" | "COUNTER_CANCEL" | "CHECKOUT_SETTLEMENT" | "EARLY_TERMINATION"

export interface ManagerRefund {
  paymentId: number
  invoiceNumber: string
  contractId: number
  contractCode?: string | null
  reservationCode: string | null
  unitCode: string | null
  customerName: string | null
  customerPhone: string | null
  refundAmount: number
  refundBankName: string | null
  refundAccountNumber: string | null
  refundAccountName: string | null
  refundType?: RefundType | null
  /** "CUSTOMER_REQUEST", "NO_SHOW"… (luồng hủy cọc) */
  cancelReason: string | null
  /** Trạng thái phiếu hoàn: PENDING | REFUNDED | PAID */
  status: string
  issuedAt: string
  refundedAt?: string | null
  transactionCode?: string | null
  /** Link biên lai cũ (dán tay) */
  evidenceUrl?: string | null
  /** Ảnh biên lai do hệ thống lưu ("/api/images/{id}"), cần token để xem */
  receiptImageUrl?: string | null
  confirmedByName?: string | null
}

export type RefundState = "PENDING" | "REFUNDED"

export interface RefundFilter {
  query: string
  state: RefundState | "ALL"
}

/** Gửi ảnh biên lai (receiptImageId, cách chính) hoặc link biên lai (dự phòng); BE nhận một trong hai */
export interface ConfirmRefundPayload {
  receiptImageId?: number | null
  evidenceUrl?: string
  transactionRef?: string
}
