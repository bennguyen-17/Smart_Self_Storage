// Hợp đồng của một cơ sở, nhìn từ phía Facility Manager (US-24, US-25, US-26, US-31).
// BE CHƯA có API liệt kê: kiểu dưới đây là contract FE đề xuất (GET /api/manager/contracts, xem qa-log).

/**
 * TERMINATED = đã bàn giao trả kho, chờ tất toán (hoàn tiền); COMPLETED = đã tất toán xong;
 * FORFEITED = quá hạn > 30 ngày, tịch thu cọc và thanh lý tài sản; CANCELED = hủy trước khi nhận kho.
 * BE hiện chỉ trả 4 trạng thái đầu; 3 trạng thái sau đã đề xuất (B2, K1 trong plans/261022-manager-admin-sprint3).
 */
export type ContractStatus =
  | "PENDING_CHECKIN"
  | "ACTIVE"
  | "OVERDUE"
  | "TERMINATED"
  | "COMPLETED"
  | "FORFEITED"
  | "CANCELED"

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
