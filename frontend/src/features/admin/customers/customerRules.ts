// Luật của trang Khách hàng (Admin). Hàm thuần, kiểm bằng bảng DDT.

import type { BadgeTone } from "@/components/internal/components/PanelKit"
import { matchesQuery } from "@/components/internal/textSearch"

import type { AdminCustomer, CustomerFilter } from "./types"

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: "Đang hoạt động", tone: "green" },
  LOCKED: { label: "Đang bị khóa", tone: "red" },
  UNVERIFIED: { label: "Chưa xác thực email", tone: "amber" },
  SUSPENDED: { label: "Tạm khóa", tone: "amber" },
  CLOSED: { label: "Đã đóng", tone: "slate" },
}

export function customerStatus(status: string): { label: string; tone: BadgeTone } {
  return STATUS[status.trim().toUpperCase()] ?? { label: status, tone: "slate" }
}

export function isLocked(c: Pick<AdminCustomer, "status">): boolean {
  return c.status.trim().toUpperCase() === "LOCKED"
}

/** Lọc theo trạng thái và từ khóa (tên, số điện thoại, email). Người đang bị khóa lên đầu */
export function filterCustomers(customers: readonly AdminCustomer[], filter: CustomerFilter): AdminCustomer[] {
  return customers
    .filter((c) => {
      const s = c.status.trim().toUpperCase()
      if (filter.status === "ALL") return true
      if (filter.status === "OTHER") return s !== "LOCKED" && s !== "ACTIVE"
      return s === filter.status
    })
    .filter((c) => matchesQuery(filter.query, [c.fullName, c.phone, c.email]))
    .sort(
      (a, b) =>
        Number(isLocked(b)) - Number(isLocked(a)) || (a.fullName ?? "").localeCompare(b.fullName ?? "", "vi")
    )
}

/** Còn bao nhiêu phút nữa thì tự mở (BR-03 khóa 15 phút); hết hạn rồi thì 0 */
export function minutesUntilUnlock(lockUntil: string | null, now: Date): number {
  if (!lockUntil) return 0
  const ms = new Date(lockUntil).getTime() - now.getTime()
  return ms > 0 ? Math.ceil(ms / 60_000) : 0
}
