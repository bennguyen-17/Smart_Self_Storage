import type { GateLog, GateLogFilter } from "./types"

// Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu
function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
}

export function gateLogDate(openedAt: string): string {
  return openedAt ? openedAt.slice(0, 10) : ""
}

export function isDateRangeValid(from: string, to: string): boolean {
  return !from || !to || from <= to
}

export function filterGateLogs(logs: readonly GateLog[], filter: GateLogFilter): GateLog[] {
  if (!isDateRangeValid(filter.from, filter.to)) return []
  const q = normalizeText(filter.query)

  return logs
    .filter((log) => {
      if (filter.method && filter.method !== "ALL") {
        const isManual =
          (log.action && log.action.toUpperCase().includes("MANUAL")) ||
          (log.accessMethod && log.accessMethod.includes("Thẻ Master")) ||
          (log.reason && log.reason.toLowerCase().includes("thẻ master"))
        if (filter.method === "MANUAL" && !isManual) return false
        if (filter.method === "PIN" && isManual) return false
      }

      const day = gateLogDate(log.openedAt)
      if (filter.from && day < filter.from) return false
      if (filter.to && day > filter.to) return false

      if (!q) return true
      const haystack = normalizeText(
        [
          log.personName ?? "",
          log.personPhone ?? "",
          log.identityNumber ?? "",
          log.personRole ?? "",
          log.gateName ?? "",
          log.accessMethod ?? "",
          log.staffName ?? "",
          log.reason ?? "",
          log.action ?? "",
          log.customerId != null ? `KH-${log.customerId}` : "",
          log.accountId != null ? `NV-${log.accountId}` : "",
        ].join(" ")
      )
      return haystack.includes(q)
    })
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
}
