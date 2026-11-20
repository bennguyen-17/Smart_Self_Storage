import type { StoredImage } from "@/components/internal/images/imageApi"

// TERMINATED: đã trả kho chờ hoàn cọc; COMPLETED: đã tất toán; FORFEITED: quá hạn tịch thu cọc & thanh lý
export type ContractStatus =
  | "PENDING_CHECKIN"
  | "ACTIVE"
  | "OVERDUE"
  | "TERMINATED"
  | "COMPLETED"
  | "FORFEITED"
  | "CANCELLED"

export type CheckoutStage = "NONE" | "INSPECTED" | "HANDED_OVER"

// PEN: phạt trễ hạn, CMP: truy thu đền bù
export type FeeType = "PEN" | "CMP"

export type FeeStatus = "UNPAID" | "PAID" | "CANCELLED"

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
  customerEmail?: string
  customerIdNumber?: string
  unitCode: string
  // YYYY-MM-DD
  startDate: string
  endDate: string
  status: ContractStatus
  depositAmount: number
  checkoutStage: CheckoutStage
  // Đã xác nhận cắt khóa, xử lý tài sản cho HĐ FORFEITED
  forfeitProcessed?: boolean
  fees: FeeInvoice[]
  rentalAmount?: number | null
  rentalType?: "DAILY" | "MONTHLY" | null
  reservationCode?: string | null
  inspectionImages?: StoredImage[]
  forfeitEvidenceImages?: StoredImage[]
  overdueLiquidationDays?: number | null
  forfeitAfterDays?: number | null
  dailyOverdueFee?: number | null
}
