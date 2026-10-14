// Luật lọc nhật ký mở cổng thủ công cho Manager (US-18). Hàm thuần, kiểm bằng bảng DDT.

import type { GateLog, GateLogFilter } from "./types"

/** Bỏ dấu tiếng Việt và viết thường để tìm "thẻ master" khớp cả "The Master" */
function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
}

/** Ngày (YYYY-MM-DD) của chuỗi thời gian BE trả về, đã là giờ Việt Nam */
export function gateLogDate(openedAt: string): string {
  return openedAt.slice(0, 10)
}

/** Khoảng ngày hợp lệ khi chưa chọn đủ 2 đầu, hoặc ngày bắt đầu không sau ngày kết thúc */
export function isDateRangeValid(from: string, to: string): boolean {
  return !from || !to || from <= to
}

/** Lọc theo từ khóa và khoảng ngày, mới nhất lên đầu. Khoảng ngày sai thì không trả kết quả nào. */
export function filterGateLogs(logs: readonly GateLog[], filter: GateLogFilter): GateLog[] {
  if (!isDateRangeValid(filter.from, filter.to)) return []
  const q = normalizeText(filter.query)
  return logs
    .filter((log) => {
      const day = gateLogDate(log.openedAt)
      if (filter.from && day < filter.from) return false
      if (filter.to && day > filter.to) return false
      if (!q) return true
      const haystack = normalizeText(
        [log.customerId ?? "", log.accountId ?? "", log.reason ?? ""].join(" ")
      )
      return haystack.includes(q)
    })
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
}
