// Điều kiện để nhân viên back-office được bấm "Xác nhận đã chuyển khoản" khi hoàn cọc.
// Hàm thuần: không đọc state React, kiểm bằng bảng test DDT trong refundRules.test.ts.

/** BE lưu link biên lai vào cột VARCHAR(255), nên link dài hơn sẽ bị từ chối */
export const EVIDENCE_URL_MAX = 255

export interface RefundFormInput {
  /** Mã phiếu hoàn tiền (paymentId của hóa đơn REF) mà BE dùng để xác nhận */
  paymentId?: number | null
  /** Số tài khoản thụ hưởng của khách (lấy từ BE, không được tự bịa) */
  bankAccount?: string | null
  /** Biên lai chuyển khoản: link (khi chạy thật) hoặc ảnh data URL (chỉ khi demo) */
  evidenceUrl: string
  /** Chỉ demo mới cho dùng ảnh data URL, vì BE chưa có API tải ảnh và cột lưu chỉ 255 ký tự */
  allowDataUrl?: boolean
  /** Mã giao dịch ngân hàng (TÙY CHỌN, chốt với nhóm 12/10): có thì lưu để đối soát, không có vẫn xác nhận được */
  transactionRef?: string
  /** Họ tên nhân viên đang đăng nhập (lấy từ phiên, không cho gõ tay) */
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

/** Link biên lai dùng được với BE thật: http(s) và không quá 255 ký tự */
export function isValidEvidenceLink(value: string): boolean {
  const trimmed = value.trim()
  return /^https?:\/\/\S+$/i.test(trimmed) && trimmed.length <= EVIDENCE_URL_MAX
}

/**
 * Trả về danh sách điều kiện còn thiếu. Rỗng nghĩa là được phép xác nhận hoàn tiền.
 * Thiếu dữ liệu thì phải chặn, tuyệt đối không tự điền giá trị mẫu thay cho dữ liệu thật.
 */
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

/** Ghép thông tin tài khoản nhận hoàn cọc để hiển thị; thiếu số tài khoản thì trả null */
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
