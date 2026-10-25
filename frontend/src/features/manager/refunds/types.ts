// Hoàn tiền cho khách do Manager xác nhận (BR-35, US-26): phiếu REF chờ chuyển khoản → đã hoàn.
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
  /** BE hiện trả PENDING | PAID; theo BR-37 sẽ là PENDING | REFUNDED */
  status: string
  issuedAt: string
  refundedAt?: string | null
  transactionCode?: string | null
  evidenceUrl?: string | null
  confirmedByName?: string | null
}

export type RefundState = "PENDING" | "REFUNDED"

export interface RefundFilter {
  query: string
  state: RefundState | "ALL"
}

export interface ConfirmRefundPayload {
  evidenceUrl: string
  transactionRef?: string
}
