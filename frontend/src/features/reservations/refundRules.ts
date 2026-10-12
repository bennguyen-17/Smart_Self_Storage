// Điều kiện để nhân viên back-office được bấm "Xác nhận đã chuyển khoản" khi hoàn cọc.
// Hàm thuần: không đọc state React, kiểm bằng bảng test DDT trong refundRules.test.ts.

export interface RefundFormInput {
  /** Số tài khoản thụ hưởng của khách (lấy từ BE, không được tự bịa) */
  bankAccount?: string | null
  /** Ảnh biên lai chuyển khoản (data URL hoặc link) */
  evidenceUrl: string
  /** Mã giao dịch ngân hàng (TÙY CHỌN, chốt với nhóm 12/10): có thì lưu để đối soát, không có vẫn xác nhận được */
  transactionRef?: string
  /** Họ tên nhân viên đang đăng nhập (lấy từ phiên, không cho gõ tay) */
  staffName?: string | null
}

export type RefundBlocker = "BANK_ACCOUNT" | "EVIDENCE" | "STAFF"

export const REFUND_BLOCKER_LABEL: Record<RefundBlocker, string> = {
  BANK_ACCOUNT: "Khách chưa có số tài khoản nhận hoàn cọc",
  EVIDENCE: "Chưa tải ảnh biên lai chuyển khoản",
  STAFF: "Chưa xác định nhân viên thực hiện (hãy đăng nhập)",
}

const isBlank = (value: string | null | undefined) => !value || value.trim() === ""

/**
 * Trả về danh sách điều kiện còn thiếu. Rỗng nghĩa là được phép xác nhận hoàn tiền.
 * Thiếu dữ liệu thì phải chặn, tuyệt đối không tự điền giá trị mẫu thay cho dữ liệu thật.
 */
export function getRefundBlockers(input: RefundFormInput): RefundBlocker[] {
  const blockers: RefundBlocker[] = []
  if (isBlank(input.bankAccount)) blockers.push("BANK_ACCOUNT")
  if (isBlank(input.evidenceUrl)) blockers.push("EVIDENCE")
  if (isBlank(input.staffName)) blockers.push("STAFF")
  return blockers
}
