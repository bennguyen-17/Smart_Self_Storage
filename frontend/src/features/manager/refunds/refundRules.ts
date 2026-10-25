// Luật hiển thị và lọc phiếu hoàn tiền của Manager. Hàm thuần, kiểm bằng bảng DDT.

import { matchesQuery } from "@/components/internal/textSearch"

import type { ManagerRefund, RefundFilter, RefundState, RefundType } from "./types"

/** BE cũ trả PAID cho phiếu đã hoàn; theo BR-37 là REFUNDED. Cả hai đều là "Đã hoàn" */
export function refundState(status: string): RefundState {
  const s = status.toUpperCase()
  return s === "PAID" || s === "REFUNDED" || s === "SUCCESS" ? "REFUNDED" : "PENDING"
}

export const REFUND_STATE_LABEL: Record<RefundState, string> = {
  PENDING: "Chờ hoàn",
  REFUNDED: "Đã hoàn",
}

export const REFUND_TYPE_LABEL: Record<RefundType, string> = {
  CANCEL_DEPOSIT: "Khách hủy cọc",
  COUNTER_CANCEL: "Hủy tại quầy",
  CHECKOUT_SETTLEMENT: "Hoàn cọc khi trả kho",
  EARLY_TERMINATION: "Trả kho trước hạn",
}

/** Lý do hoàn: ưu tiên loại BE trả; chưa có thì suy từ lý do hủy cọc */
export function refundReasonLabel(refund: Pick<ManagerRefund, "refundType" | "cancelReason">): string {
  if (refund.refundType && REFUND_TYPE_LABEL[refund.refundType]) return REFUND_TYPE_LABEL[refund.refundType]
  const reason = (refund.cancelReason ?? "").toUpperCase()
  if (reason === "CUSTOMER_REQUEST") return REFUND_TYPE_LABEL.CANCEL_DEPOSIT
  if (reason === "COUNTER_CANCEL" || reason === "STAFF_CANCEL") return REFUND_TYPE_LABEL.COUNTER_CANCEL
  if (reason) return "Hủy đặt chỗ"
  return "Hoàn tiền"
}

/** "0123456789 · Vietcombank · NGUYEN VAN A"; thiếu số tài khoản thì null (khách chưa cung cấp) */
export function bankAccountLabel(
  refund: Pick<ManagerRefund, "refundAccountNumber" | "refundBankName" | "refundAccountName">
): string | null {
  const number = refund.refundAccountNumber?.trim()
  if (!number) return null
  return [number, refund.refundBankName?.trim(), refund.refundAccountName?.trim()].filter(Boolean).join(" · ")
}

/** Lọc theo trạng thái và từ khóa (khách, SĐT, mã phiếu, mã đặt chỗ, mã hợp đồng, mã ô); phiếu cũ nhất lên đầu khi đang chờ */
export function filterRefunds(refunds: readonly ManagerRefund[], filter: RefundFilter): ManagerRefund[] {
  return refunds
    .filter((r) => filter.state === "ALL" || refundState(r.status) === filter.state)
    .filter((r) =>
      matchesQuery(filter.query, [
        r.customerName,
        r.customerPhone,
        r.invoiceNumber,
        r.reservationCode,
        r.contractCode,
        r.unitCode,
      ])
    )
    .sort((a, b) => {
      // Phiếu chờ hoàn: tồn lâu nhất lên đầu (hạn 24–48 giờ); phiếu đã hoàn: mới nhất lên đầu
      const pendingA = refundState(a.status) === "PENDING"
      const pendingB = refundState(b.status) === "PENDING"
      if (pendingA !== pendingB) return pendingA ? -1 : 1
      return pendingA ? a.issuedAt.localeCompare(b.issuedAt) : b.issuedAt.localeCompare(a.issuedAt)
    })
}

/** Số giờ một phiếu đã chờ, tính từ lúc tạo phiếu */
export function hoursWaiting(issuedAt: string, now: Date = new Date()): number {
  const issued = new Date(issuedAt).getTime()
  if (Number.isNaN(issued)) return 0
  return Math.max(0, Math.floor((now.getTime() - issued) / 3_600_000))
}

/** Quá hạn cam kết hoàn tiền 48 giờ làm việc (BR-35) */
export const REFUND_SLA_HOURS = 48

export function pendingSummary(refunds: readonly ManagerRefund[], now: Date = new Date()) {
  const pending = refunds.filter((r) => refundState(r.status) === "PENDING")
  return {
    count: pending.length,
    amount: pending.reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0),
    late: pending.filter((r) => hoursWaiting(r.issuedAt, now) > REFUND_SLA_HOURS).length,
  }
}

/** BE lưu link biên lai vào cột VARCHAR(255), nên link dài hơn sẽ bị từ chối */
export const EVIDENCE_URL_MAX = 255

export interface RefundFormInput {
  paymentId?: number | null
  bankAccount?: string | null
  evidenceUrl: string
  allowDataUrl?: boolean
  transactionRef?: string
  staffName?: string | null
}

export type RefundBlocker = "PAYMENT" | "BANK_ACCOUNT" | "EVIDENCE" | "EVIDENCE_LINK" | "STAFF"

export const REFUND_BLOCKER_LABEL: Record<RefundBlocker, string> = {
  PAYMENT: "Chưa có phiếu hoàn tiền trong hệ thống cho đơn này",
  BANK_ACCOUNT: "Khách chưa có số tài khoản nhận hoàn cọc",
  EVIDENCE: "Chưa có biên lai chuyển khoản",
  EVIDENCE_LINK: `Link biên lai phải bắt đầu bằng http:// hoặc https:// và tối đa ${EVIDENCE_URL_MAX} ký tự`,
  STAFF: "Chưa xác định nhân viên thực hiện (hãy đăng nhập)",
}

const isBlank = (value: string | null | undefined) => !value || value.trim() === ""

export function isValidEvidenceLink(value: string): boolean {
  const trimmed = value.trim()
  return /^https?:\/\/\S+$/i.test(trimmed) && trimmed.length <= EVIDENCE_URL_MAX
}

export function getRefundBlockers(input: RefundFormInput): RefundBlocker[] {
  const blockers: RefundBlocker[] = []
  if (!input.paymentId) blockers.push("PAYMENT")
  if (isBlank(input.bankAccount)) blockers.push("BANK_ACCOUNT")
  if (isBlank(input.evidenceUrl)) {
    blockers.push("EVIDENCE")
  } else {
    const isDemoImage = input.allowDataUrl === true && input.evidenceUrl.startsWith("data:image/")
    if (!isDemoImage && !isValidEvidenceLink(input.evidenceUrl)) blockers.push("EVIDENCE_LINK")
  }
  if (isBlank(input.staffName)) blockers.push("STAFF")
  return blockers
}

export function formatBankAccount(
  accountNumber: string | null | undefined,
  bankName: string | null | undefined,
  accountName: string | null | undefined
): string | null {
  if (isBlank(accountNumber)) return null
  let label = accountNumber!.trim()
  if (!isBlank(bankName)) label += ` (${bankName!.trim()})`
  if (!isBlank(accountName)) label += ` - ${accountName!.trim()}`
  return label
}
