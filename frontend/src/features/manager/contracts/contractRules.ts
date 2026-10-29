// Luật cho 2 trang Manager: "Khách & hợp đồng" và "Trả kho & công nợ". Hàm thuần, kiểm bằng DDT.

import { matchesQuery } from "@/components/internal/textSearch"

import type { CheckoutStage, ContractStatus, FacilityContract, FeeType } from "./types"

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  PENDING_CHECKIN: "Chờ nhận kho",
  ACTIVE: "Đang hiệu lực",
  OVERDUE: "Quá hạn",
  TERMINATED: "Đã trả kho, chờ tất toán",
  COMPLETED: "Đã hoàn tất",
  FORFEITED: "Đã tịch thu, thanh lý tài sản",
  CANCELLED: "Đã hủy",
}

/**
 * Trạng thái hợp đồng chuẩn hóa CANCELLED (2 chữ L).
 * Trạng thái khác giữ nguyên, viết hoa.
 */
export function normalizeContractStatus(status: string): ContractStatus {
  const s = status.trim().toUpperCase()
  return s as ContractStatus
}

/** Hợp đồng đã kết thúc (không còn tính ngày còn lại, không còn trả kho) */
export function isClosedContract(status: ContractStatus | string): boolean {
  return status === "TERMINATED" || status === "COMPLETED" || status === "FORFEITED" || status === "CANCELLED"
}

/** Quá hạn đủ số ngày này thì hợp đồng chuyển FORFEITED, cơ sở được niêm phong và thanh lý tài sản (BE chuyển đúng ngày thứ 30) */
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
 * đủ 30 ngày mà tác vụ tự động 00:00 của BE chưa kịp chuyển.
 */
export function needsForfeitHandling(
  contract: Pick<FacilityContract, "status" | "endDate" | "forfeitProcessed">,
  today: string
): boolean {
  if (contract.status === "FORFEITED") return !contract.forfeitProcessed
  return overdueDays(contract, today) >= FORFEIT_AFTER_DAYS
}

/** Chỉ hợp đồng BE đã chuyển FORFEITED mới được xác nhận (BE trả 409 với trạng thái khác) */
export function canConfirmForfeitProcessed(contract: Pick<FacilityContract, "status" | "forfeitProcessed">): boolean {
  return contract.status === "FORFEITED" && !contract.forfeitProcessed
}

export const FORFEIT_NOTE_MIN = 10
export const FORFEIT_NOTE_MAX = 500

/** Ghi chú xử lý tài sản: bắt buộc, đủ chi tiết để đối soát (cắt khóa, niêm phong, xử lý tài sản thế nào) */
export function forfeitNoteError(note: string): string | null {
  const n = note.trim().length
  if (n === 0) return "Nhập ghi chú xử lý tài sản"
  if (n < FORFEIT_NOTE_MIN) return `Ghi chú ít nhất ${FORFEIT_NOTE_MIN} ký tự`
  if (n > FORFEIT_NOTE_MAX) return `Ghi chú tối đa ${FORFEIT_NOTE_MAX} ký tự`
  return null
}

/** Tổng phí chưa thu của hợp đồng */
export function unpaidTotal(contract: FacilityContract): number {
  return contract.fees.filter((f) => f.status === "UNPAID").reduce((sum, f) => sum + f.amount, 0)
}

/** Hợp đồng cần Manager để mắt ở trang "Trả kho & công nợ": quá hạn, đang trả kho, hoặc còn phí chưa thu */
export function needsFollowUp(contract: FacilityContract): boolean {
  if (contract.status === "OVERDUE") return true
  if (contract.status === "FORFEITED" && !contract.forfeitProcessed) return true
  if (!isClosedContract(contract.status) && contract.checkoutStage !== "NONE") return true
  return unpaidTotal(contract) > 0
}

/** Mốc nhắc gia hạn xa nhất của hệ thống (nhắc trước 7, 3, 1 ngày) */
export const RENEWAL_WINDOW_DAYS = 7

/** Hợp đồng đang hiệu lực, còn 0–7 ngày là hết hạn: khách cần gia hạn hoặc chuẩn bị trả kho */
export function isExpiringSoon(contract: Pick<FacilityContract, "status" | "endDate">, today: string): boolean {
  if (contract.status !== "ACTIVE") return false
  const left = daysRemaining(contract.endDate, today)
  return left >= 0 && left <= RENEWAL_WINDOW_DAYS
}

export type PaymentFilter = "ALL" | "CLEAR" | "DEBT"

export interface ContractFilter {
  query: string
  status: ContractStatus | "ALL"
  payment: PaymentFilter
  /** Chỉ hợp đồng sắp hết hạn (cần theo dõi gia hạn); cần truyền `today` khi bật */
  expiringSoon?: boolean
}

/** Lọc theo từ khóa (khách, SĐT, mã HĐ, mã ô), trạng thái HĐ, công nợ, sắp hết hạn; hết hạn sớm nhất lên đầu */
export function filterContracts(
  list: readonly FacilityContract[],
  filter: ContractFilter,
  today = ""
): FacilityContract[] {
  return list
    .filter((c) => filter.status === "ALL" || c.status === filter.status)
    .filter((c) => filter.payment === "ALL" || (filter.payment === "DEBT") === unpaidTotal(c) > 0)
    .filter((c) => !filter.expiringSoon || isExpiringSoon(c, today))
    .filter((c) => matchesQuery(filter.query, [c.customerName, c.customerPhone, c.contractCode, c.unitCode]))
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
}
