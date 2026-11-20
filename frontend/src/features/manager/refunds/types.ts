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
  // CUSTOMER_REQUEST, NO_SHOW...
  cancelReason: string | null
  // PENDING | REFUNDED | PAID
  status: string
  issuedAt: string
  refundedAt?: string | null
  transactionCode?: string | null
  evidenceUrl?: string | null
  // URL dạng /api/images/{id}, cần token khi tải
  receiptImageUrl?: string | null
  confirmedByName?: string | null
}

export type RefundState = "PENDING" | "REFUNDED"

export interface RefundFilter {
  query: string
  state: RefundState | "ALL"
}

// Gửi receiptImageId hoặc evidenceUrl, BE nhận một trong hai
export interface ConfirmRefundPayload {
  receiptImageId?: number | null
  evidenceUrl?: string
  transactionRef?: string
}
