import { matchesQuery } from "@/components/internal/textSearch"
import { actionLabel, actorLabel } from "@/features/admin/audit-logs/auditRules"

import type { FacilityLogEntry, ShiftActivity, StaffActivity, StaffActivityDay } from "./types"

export const WORK_COUNTS = [
  { key: "checkIns", label: "Nhận kho" },
  { key: "checkouts", label: "Trả kho" },
  { key: "ticketsResolved", label: "Ticket xử lý" },
  { key: "maintenanceDone", label: "Bảo trì xong" },
] as const satisfies readonly { key: keyof StaffActivity; label: string }[]

export type WorkCountKey = (typeof WORK_COUNTS)[number]["key"]

export interface DayTotals {
  // Tính theo lượt trực (1 người trực 2 ca tính là 2)
  scheduled: number
  attended: number
  counts: Record<WorkCountKey, number>
}

export function dayTotals(day: StaffActivityDay | undefined): DayTotals {
  const counts = Object.fromEntries(WORK_COUNTS.map((c) => [c.key, 0])) as Record<WorkCountKey, number>
  let scheduled = 0
  let attended = 0
  for (const shift of day?.shifts ?? []) {
    for (const s of shift.staff) {
      scheduled += 1
      if (s.attended) attended += 1
      for (const c of WORK_COUNTS) counts[c.key] += s[c.key]
    }
  }
  return { scheduled, attended, counts }
}

export function shiftsWithStaff(day: StaffActivityDay | undefined): ShiftActivity[] {
  return (day?.shifts ?? []).filter((s) => s.staff.length > 0)
}

export function acceptTimeLabel(minutes: number | null): string {
  if (minutes === null) return "—"
  if (minutes < 1) return "< 1 phút"
  return `${Math.round(minutes * 10) / 10} phút`
}

// Trả về HH:mm theo giờ VN để so với giờ bắt đầu ca
export function vietnamTime(at: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(at)
}

export function isLateToShift(shift: Pick<ShiftActivity, "startTime">, staff: Pick<StaffActivity, "attended">, now: string): boolean {
  return !staff.attended && now >= shift.startTime
}

export function staffOptions(day: StaffActivityDay | undefined): { accountId: number; fullName: string }[] {
  const seen = new Map<number, string>()
  for (const shift of day?.shifts ?? []) {
    for (const s of shift.staff) seen.set(s.accountId, s.fullName)
  }
  return [...seen].map(([accountId, fullName]) => ({ accountId, fullName })).sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"))
}

export function filterFacilityLogs(
  logs: readonly FacilityLogEntry[],
  filter: { accountId: string; query: string }
): FacilityLogEntry[] {
  return logs
    .filter((l) => filter.accountId === "ALL" || String(l.accountId) === filter.accountId)
    .filter((l) => matchesQuery(filter.query, [actorLabel(l), actionLabel(l.action), l.description]))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
