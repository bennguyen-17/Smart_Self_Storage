// Các ngân hàng tiêu biểu tại Việt Nam, dùng chung cho thông tin thụ hưởng hoàn cọc.
export const VIETNAM_BANKS = [
  "Vietcombank",
  "VietinBank",
  "BIDV",
  "NCB",
  "Sacombank",
  "Techcombank",
  "VPBank",
  "ACB",
] as const

export const OTHER_BANK = "Khác"

export const isKnownBank = (name: string) =>
  (VIETNAM_BANKS as readonly string[]).includes(name)

/** Tách giá trị lưu trong DB thành lựa chọn trong danh sách + tên ngân hàng khác. */
export function splitBankName(value?: string | null) {
  const trimmed = (value || "").trim()
  if (!trimmed || trimmed.toLowerCase() === "chưa cập nhật") {
    return { bankName: "", customBankName: "" }
  }

  if (isKnownBank(trimmed)) {
    return { bankName: trimmed, customBankName: "" }
  }

  return { bankName: OTHER_BANK, customBankName: trimmed }
}

/** Ghép lựa chọn trong danh sách thành tên ngân hàng cuối cùng để gửi backend. */
export function resolveBankName(bankName: string, customBankName: string) {
  const selection = bankName.trim()
  return selection === OTHER_BANK ? customBankName.trim() : selection
}
