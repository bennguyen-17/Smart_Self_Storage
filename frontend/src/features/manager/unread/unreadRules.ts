export const UNREAD_TABS = ["refunds", "activity", "tickets", "gate-logs"] as const
export type UnreadTab = (typeof UNREAD_TABS)[number]

// Chưa có mốc (lần đầu) trả 0 để tránh báo chưa đọc toàn bộ dữ liệu cũ
export function countNewSince(times: readonly (string | null | undefined)[], lastSeen: number | null): number {
  if (lastSeen === null) return 0
  return times.filter((t) => {
    if (!t) return false
    // BE trả giờ VN không có timezone offset nên Date.parse đọc theo giờ local
    const ms = Date.parse(t)
    return !Number.isNaN(ms) && ms > lastSeen
  }).length
}

export function badgeText(count: number): string | null {
  if (count <= 0) return null
  return count > 99 ? "99+" : String(count)
}

function seenKey(accountId: number | null, tab: UnreadTab): string {
  return `manager-last-seen:${accountId ?? "unknown"}:${tab}`
}

export function readLastSeen(accountId: number | null, tab: UnreadTab): number | null {
  try {
    const raw = localStorage.getItem(seenKey(accountId, tab))
    const n = raw === null ? NaN : Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function markSeen(accountId: number | null, tab: UnreadTab, at: number = Date.now()): void {
  try {
    localStorage.setItem(seenKey(accountId, tab), String(at))
  } catch {
    // Bỏ qua nếu localStorage bị chặn
  }
}
