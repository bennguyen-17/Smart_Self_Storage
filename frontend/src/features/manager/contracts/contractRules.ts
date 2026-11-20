import { matchesQuery } from "@/components/internal/textSearch"

import type { CheckoutStage, ContractStatus, FacilityContract, FeeType } from "./types"

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  PENDING_CHECKIN: "Chờ nhận kho",
  ACTIVE: "Đang hiệu lực",
  OVERDUE: "Quá hạn",
  TERMINATED: "Đã trả kho (Chờ hoàn cọc)",
  COMPLETED: "Đã hoàn tất",
  FORFEITED: "Chờ thanh lý",
  CANCELLED: "Đã hủy",
}

export function normalizeContractStatus(status: string): ContractStatus {
  const s = status.trim().toUpperCase()
  return s as ContractStatus
}

export function isClosedContract(status: ContractStatus | string): boolean {
  return status === "TERMINATED" || status === "COMPLETED" || status === "FORFEITED" || status === "CANCELLED"
}

// Quá hạn đủ 30 ngày thì chuyển FORFEITED để niêm phong và thanh lý tài sản
export const FORFEIT_AFTER_DAYS = 30

export function forfeitAfterDaysOf(
  contract: Pick<FacilityContract, "overdueLiquidationDays" | "forfeitAfterDays">
): number {
  const days = contract.overdueLiquidationDays ?? contract.forfeitAfterDays
  return typeof days === "number" && days > 0 ? days : FORFEIT_AFTER_DAYS
}

export const CHECKOUT_STAGE_LABEL: Record<CheckoutStage, string> = {
  NONE: "Chưa trả kho",
  INSPECTED: "Đã nghiệm thu, chờ bàn giao",
  HANDED_OVER: "Đã bàn giao kho",
}

// Suy tiến độ trả kho từ status vì checkoutStage từ API chưa phản ánh đủ
export const CHECKOUT_PROGRESS_LABEL: Record<ContractStatus, string> = {
  PENDING_CHECKIN: "Khách chưa nhận kho",
  ACTIVE: "Khách đang giữ kho",
  OVERDUE: "Khách đang giữ kho (đã quá hạn)",
  TERMINATED: "Đã bàn giao kho, chờ hoàn cọc",
  COMPLETED: "Đã bàn giao kho, đã hoàn cọc",
  FORFEITED: "Cơ sở thu hồi kho, thanh lý tài sản",
  CANCELLED: "Hủy trước khi nhận kho",
}

export const FEE_TYPE_LABEL: Record<FeeType, string> = {
  PEN: "Phạt trễ hạn",
  CMP: "Truy thu đền bù",
}

const DAY_MS = 86_400_000

// Âm nghĩa là đã quá hạn
export function daysRemaining(endDate: string, today: string): number {
  return Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS)
}

export function overdueDays(contract: Pick<FacilityContract, "status" | "endDate">, today: string): number {
  if (contract.status !== "OVERDUE") return 0
  return Math.max(0, -daysRemaining(contract.endDate, today))
}

// Cần xử lý thanh lý khi đã FORFEITED hoặc vượt hạn thanh lý nhưng batch 00:00 chưa kịp chạy
export function needsForfeitHandling(
  contract: Pick<FacilityContract, "status" | "endDate" | "forfeitProcessed"> & Partial<Pick<FacilityContract, "overdueLiquidationDays" | "forfeitAfterDays">>,
  today: string
): boolean {
  if (contract.status === "FORFEITED") return !contract.forfeitProcessed
  return overdueDays(contract as FacilityContract, today) > forfeitAfterDaysOf(contract as FacilityContract)
}

// BE trả 409 nếu xác nhận xử lý khi HĐ chưa chuyển sang FORFEITED
export function canConfirmForfeitProcessed(contract: Pick<FacilityContract, "status" | "forfeitProcessed">): boolean {
  return contract.status === "FORFEITED" && !contract.forfeitProcessed
}

// WAITING: quá hạn thanh lý nhưng job 00:00 chưa chuyển FORFEITED; READY: đã FORFEITED, có thể xác nhận
export type ForfeitState = "NONE" | "WAITING" | "READY" | "DONE"

export function forfeitState(
  contract: Pick<FacilityContract, "status" | "endDate" | "forfeitProcessed"> & Partial<Pick<FacilityContract, "overdueLiquidationDays" | "forfeitAfterDays">>,
  today: string
): ForfeitState {
  if (contract.forfeitProcessed) return "DONE"
  if (contract.status === "FORFEITED") return "READY"
  if (overdueDays(contract as FacilityContract, today) > forfeitAfterDaysOf(contract as FacilityContract)) return "WAITING"
  return "NONE"
}

export function feeTotals(contract: Pick<FacilityContract, "fees">): { paid: number; unpaid: number; cancelled: number } {
  const sum = (status: string) => contract.fees.filter((f) => f.status === status).reduce((s, f) => s + f.amount, 0)
  return { paid: sum("PAID"), unpaid: sum("UNPAID"), cancelled: sum("CANCELLED") }
}

export const FORFEIT_NOTE_MIN = 10
export const FORFEIT_NOTE_MAX = 500

export function forfeitNoteError(note: string): string | null {
  const n = note.trim().length
  if (n === 0) return "Nhập ghi chú xử lý tài sản"
  if (n < FORFEIT_NOTE_MIN) return `Ghi chú ít nhất ${FORFEIT_NOTE_MIN} ký tự`
  if (n > FORFEIT_NOTE_MAX) return `Ghi chú tối đa ${FORFEIT_NOTE_MAX} ký tự`
  return null
}

export function unpaidTotal(contract: FacilityContract): number {
  return contract.fees.filter((f) => f.status === "UNPAID").reduce((sum, f) => sum + f.amount, 0)
}

export function needsFollowUp(contract: FacilityContract): boolean {
  if (contract.status === "OVERDUE") return true
  if (contract.status === "FORFEITED" && !contract.forfeitProcessed) return true
  if (!isClosedContract(contract.status) && contract.checkoutStage !== "NONE") return true
  return unpaidTotal(contract) > 0
}

// Mốc nhắc gia hạn (trước 7, 3, 1 ngày)
export const RENEWAL_WINDOW_DAYS = 7

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
  // Cần truyền today khi bật
  expiringSoon?: boolean
}

export const STATUS_PRIORITY: Record<ContractStatus, number> = {
  PENDING_CHECKIN: 1,
  ACTIVE: 2,
  OVERDUE: 3,
  TERMINATED: 4,
  FORFEITED: 5,
  COMPLETED: 6,
  CANCELLED: 7,
}

// Sắp theo độ ưu tiên trạng thái, cùng trạng thái thì HĐ hết hạn sớm lên trước
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
    .sort((a, b) => {
      const pA = STATUS_PRIORITY[a.status] ?? 99
      const pB = STATUS_PRIORITY[b.status] ?? 99
      if (pA !== pB) return pA - pB
      return a.endDate.localeCompare(b.endDate)
    })
}
