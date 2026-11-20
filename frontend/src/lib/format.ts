// Format hiển thị dùng chung theo múi giờ Việt Nam

export const VN_TIME_ZONE = "Asia/Ho_Chi_Minh"

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VN_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

export function formatVnd(amount: number | null | undefined): string {
  return amount == null ? "—" : vndFormatter.format(amount)
}

// Tách chuỗi trực tiếp từ YYYY-MM-DD để không bị lệch ngày do timezone
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—"
  if (isoDate.includes('/')) return isoDate;
  const parts = isoDate.slice(0, 10).split("-")
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts
  return `${day}/${month}/${year}`
}

export function formatDateTime(isoDateTime: string | null | undefined): string {
  if (!isoDateTime) return "—"
  const date = new Date(isoDateTime)
  if (Number.isNaN(date.getTime())) return "—"
  // vi-VN mặc định in "00:00 27/09/2026", ghép lại cho thống nhất "27/09/2026 00:00"
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    dateTimeFormatter.formatToParts(date).find((p) => p.type === type)?.value
  return `${part("day")}/${part("month")}/${part("year")} ${part("hour")}:${part("minute")}`
}

export function todayInVietnam(now: Date = new Date()): string {
  // en-CA cho sẵn định dạng YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: VN_TIME_ZONE }).format(
    now
  )
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

// Che phần giữa số CCCD khi hiển thị (vd: 0010******45)
export function maskCccd(cccd: string | null | undefined): string {
  if (!cccd) return "—"
  if (cccd.length <= 6) return "*".repeat(cccd.length)
  return `${cccd.slice(0, 4)}${"*".repeat(cccd.length - 6)}${cccd.slice(-2)}`
}
