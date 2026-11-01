// Chấm đếm "mới" trên thanh điều hướng Manager (giống số thư mới của Gmail / tin nhắn Zalo).
// Mỗi mục nhớ mốc "lần cuối xem" theo từng tài khoản; số = mục có thời gian sau mốc đó. Hàm thuần, kiểm bằng DDT.

/** Các trang có chấm đếm: đều là dữ liệu có thời điểm phát sinh */
export const UNREAD_TABS = ["refunds", "activity", "tickets", "gate-logs"] as const
export type UnreadTab = (typeof UNREAD_TABS)[number]

/** Đếm mục có thời gian sau mốc đã xem. Chưa có mốc (lần đầu) → 0, không dội toàn bộ dữ liệu cũ */
export function countNewSince(times: readonly (string | null | undefined)[], lastSeen: number | null): number {
  if (lastSeen === null) return 0
  return times.filter((t) => {
    if (!t) return false
    // BE trả giờ Việt Nam không kèm múi giờ ("2026-11-01T17:54:27") → trình duyệt đọc theo giờ máy
    const ms = Date.parse(t)
    return !Number.isNaN(ms) && ms > lastSeen
  }).length
}

/** Chữ trong chấm tròn: không hiện khi 0, quá 99 thì "99+" */
export function badgeText(count: number): string | null {
  if (count <= 0) return null
  return count > 99 ? "99+" : String(count)
}

function seenKey(accountId: number | null, tab: UnreadTab): string {
  return `manager-last-seen:${accountId ?? "unknown"}:${tab}`
}

/** Mốc đã xem (ms). Trình duyệt chặn lưu trữ thì coi như chưa có mốc */
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
    // Không lưu được thì lần sau vẫn đếm từ mốc cũ, không làm hỏng trang
  }
}
