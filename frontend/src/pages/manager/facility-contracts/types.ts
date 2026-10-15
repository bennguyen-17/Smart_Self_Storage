// Hợp đồng của một cơ sở, nhìn từ phía Facility Manager (US-24, US-25, US-26, US-31).
// BE CHƯA có API liệt kê: kiểu dưới đây là contract FE đề xuất (GET /api/manager/contracts, xem qa-log).

export type ContractStatus = "PENDING_CHECKIN" | "ACTIVE" | "OVERDUE" | "TERMINATED"

/** Tiến độ trả kho: chưa trả → đã lập biên bản nghiệm thu (US-24) → đã bàn giao, thu chìa (US-25) */
export type CheckoutStage = "NONE" | "INSPECTED" | "HANDED_OVER"

/** Khoản phí có thể miễn/giảm: phạt trễ hạn (PEN) hoặc truy thu đền bù (CMP) */
export type FeeType = "PEN" | "CMP"

export type FeeStatus = "UNPAID" | "PAID" | "CANCELED"

export interface FeeInvoice {
  paymentId: number
  invoiceNumber: string
  type: FeeType
  amount: number
  status: FeeStatus
  issuedAt: string
}

export interface FacilityContract {
  contractId: number
  contractCode: string
  customerName: string
  customerPhone: string
  unitCode: string
  /** YYYY-MM-DD */
  startDate: string
  endDate: string
  status: ContractStatus
  depositAmount: number
  checkoutStage: CheckoutStage
  fees: FeeInvoice[]
}

/** Body của POST /api/manager/payments/{paymentId}/discount (BE đã có) */
export interface FeeDiscountRequest {
  discountPercent?: number
  discountAmount?: number
  reason: string
}
