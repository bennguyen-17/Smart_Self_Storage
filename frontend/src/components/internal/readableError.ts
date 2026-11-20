// Chuyển lỗi kỹ thuật (SQL/Hibernate/Spring) sang câu tiếng Việt, giữ nguyên lỗi nghiệp vụ từ BE

import { getErrorMessage } from "@/lib/api"

export const GENERIC_ERROR = "Hệ thống gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại; nếu vẫn lỗi, báo quản trị hệ thống."

const TECHNICAL = /could not execute|SQL \[|constraint \[|Duplicate entry|Data too long|Data truncat|foreign key|JDBC|Hibernate|java\.|org\.springframework|Exception|Failed to convert|Required request|Cannot invoke|NullPointer/i

export function sanitizeErrorMessage(message: string | null | undefined): string {
  const text = (message ?? "").trim()
  if (!text) return "Không xử lý được yêu cầu. Vui lòng thử lại."
  if (/^Network Error$|ERR_NETWORK|ECONNREFUSED/i.test(text)) {
    return "Không kết nối được máy chủ. Kiểm tra mạng hoặc máy chủ đang tắt rồi thử lại."
  }
  if (!TECHNICAL.test(text)) return text

  const dup = /Duplicate entry '([^']*)' for key '[^']*?(phone|email)'/i.exec(text)
  if (dup) {
    return dup[2].toLowerCase() === "phone"
      ? `Số điện thoại ${dup[1]} đã được dùng cho một tài khoản khác.`
      : `Email ${dup[1]} đã được dùng cho một tài khoản khác.`
  }
  if (/Duplicate entry/i.test(text)) return "Dữ liệu bị trùng với bản ghi đã có. Kiểm tra lại rồi thử lại."
  if (/Data too long/i.test(text)) return "Nội dung nhập quá dài. Vui lòng rút gọn rồi thử lại."
  if (/foreign key/i.test(text)) return "Dữ liệu liên quan không còn tồn tại (ví dụ cơ sở đã bị xóa). Tải lại trang rồi thử lại."
  return GENERIC_ERROR
}

export function readableError(err: unknown): string {
  return sanitizeErrorMessage(getErrorMessage(err))
}
