// Luật cho 2 trang Manager: "Khách & hợp đồng" và "Trả kho & công nợ". Hàm thuần, kiểm bằng DDT.

import { matchesQuery } from "@/components/internal/textSearch"

import type { CheckoutStage, ContractStatus, FacilityContract, FeeDiscountRequest, FeeType } from "./types"

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  PENDING_CHECKIN: "Chờ nhận kho",
  ACTIVE: "Đang hiệu lực",
  OVERDUE: "Quá hạn",
  TERMINATED: "Đã trả kho, chờ tất toán",
  COMPLETED: "Đã hoàn tất",
  FORFEITED: "Đã tịch thu, thanh lý tài sản",
  CANCELED: "Đã hủy",
}

/** Hợp đồng đã kết thúc (không còn tính ngày còn lại, không còn trả kho) */
export function isClosedContract(status: ContractStatus | string): boolean {
  return status === "TERMINATED" || status === "COMPLETED" || status === "FORFEITED" || status === "CANCELED"
}

/** Quá hạn trên số ngày này thì cơ sở được niêm phong và thanh lý tài sản */
export const FORFEIT_AFTER_DAYS = 30

export const CHECKOUT_STAGE_LABEL: Record<CheckoutStage, string> = {
  NONE: "Chưa trả kho",
  INSPECTED: "Đã nghiệm thu, chờ bàn giao",
  HANDED_OVER: "Đã bàn giao kho",
}

export const FEE_TYPE_LABEL: Record<FeeType, string> = {
  PEN: "Phạt trễ hạn",
  CMP: "Truy thu đền bù",
}

const DAY_MS = 86_400_000

/** Số ngày còn lại tới ngày hết hạn (âm nghĩa là đã quá hạn), tính theo ngày lịch */
export function daysRemaining(endDate: string, today: string): number {
  return Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS)
}

/** Số ngày đã quá hạn của hợp đồng đang OVERDUE (0 nếu không quá hạn) */
export function overdueDays(contract: Pick<FacilityContract, "status" | "endDate">, today: string): number {
  if (contract.status !== "OVERDUE") return 0
  return Math.max(0, -daysRemaining(contract.endDate, today))
}

/**
 * Cần Manager lập hồ sơ niêm phong, thanh lý tài sản: BE đã chuyển FORFEITED, hoặc đã quá hạn
 * hơn 30 ngày mà BE chưa kịp chuyển (chưa có tác vụ tự động).
 */
export function needsForfeitHandling(contract: Pick<FacilityContract, "status" | "endDate">, today: string): boolean {
  return contract.status === "FORFEITED" || overdueDays(contract, today) > FORFEIT_AFTER_DAYS
}

/** Tổng phí chưa thu của hợp đồng */
export function unpaidTotal(contract: FacilityContract): number {
  return contract.fees.filter((f) => f.status === "UNPAID").reduce((sum, f) => sum + f.amount, 0)
}

/** Hợp đồng cần Manager để mắt ở trang "Trả kho & công nợ": quá hạn, đang trả kho, hoặc còn phí chưa thu */
export function needsFollowUp(contract: FacilityContract): boolean {
  if (contract.status === "OVERDUE" || contract.status === "FORFEITED") return true
  if (!isClosedContract(contract.status) && contract.checkoutStage !== "NONE") return true
  return unpaidTotal(contract) > 0
}

export type PaymentFilter = "ALL" | "CLEAR" | "DEBT"

export interface ContractFilter {
  query: string
  status: ContractStatus | "ALL"
  payment: PaymentFilter
}

/** Lọc theo từ khóa (khách, SĐT, mã HĐ, mã ô), trạng thái HĐ, tình trạng công nợ; hết hạn sớm nhất lên đầu */
export function filterContracts(list: readonly FacilityContract[], filter: ContractFilter): FacilityContract[] {
  return list
    .filter((c) => filter.status === "ALL" || c.status === filter.status)
    .filter((c) => filter.payment === "ALL" || (filter.payment === "DEBT") === unpaidTotal(c) > 0)
    .filter((c) => matchesQuery(filter.query, [c.customerName, c.customerPhone, c.contractCode, c.unitCode]))
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
}

// ---- Miễn / giảm phí (US-31) ----

export type DiscountMode = "PERCENT" | "AMOUNT" | "WAIVE"

export interface DiscountDraft {
  mode: DiscountMode
  /** Chuỗi người dùng gõ, có thể rỗng */
  value: string
  reason: string
}

export type DiscountErrors = Partial<Record<"value" | "reason", string>>

export const DISCOUNT_REASON_MIN = 10

/** Số tiền được giảm (VND) theo bản nháp; trả null nếu chưa hợp lệ */
export function discountValue(draft: DiscountDraft, feeAmount: number): number | null {
  if (draft.mode === "WAIVE") return feeAmount
  const n = Number(draft.value.replace(/[.\s]/g, ""))
  if (!Number.isFinite(n) || n <= 0) return null
  if (draft.mode === "PERCENT") return Number.isInteger(n) && n <= 100 ? Math.round((feeAmount * n) / 100) : null
  return Number.isInteger(n) && n <= feeAmount ? n : null
}

/**
 * Kiểm form miễn/giảm: bắt buộc lý do; mức giảm không vượt quá số tiền của khoản phí.
 * Mức giảm tối đa theo chính sách (US-28) chưa có API đọc, nên tạm chặn ở 100% khoản phí (qa-log Q-23).
 */
export function validateDiscount(draft: DiscountDraft, feeAmount: number): DiscountErrors {
  const errors: DiscountErrors = {}
  if (draft.reason.trim().length < DISCOUNT_REASON_MIN) {
    errors.reason = `Nhập lý do miễn / giảm (ít nhất ${DISCOUNT_REASON_MIN} ký tự)`
  }
  if (discountValue(draft, feeAmount) === null) {
    errors.value =
      draft.mode === "PERCENT"
        ? "Nhập phần trăm là số nguyên từ 1 đến 100"
        : "Nhập số tiền là số nguyên dương, không vượt quá số tiền của khoản phí"
  }
  return errors
}

/** Body gửi BE: miễn toàn bộ = giảm 100% */
export function toDiscountRequest(draft: DiscountDraft, feeAmount: number): FeeDiscountRequest {
  const reason = draft.reason.trim()
  if (draft.mode === "WAIVE") return { discountPercent: 100, reason }
  if (draft.mode === "PERCENT") return { discountPercent: Number(draft.value), reason }
  return { discountAmount: discountValue(draft, feeAmount) ?? 0, reason }
}
