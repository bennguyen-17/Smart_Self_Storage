import { useEffect, useMemo, useState } from "react"

import { todayInVietnam } from "@/lib/format"
import { listFacilityLogs } from "@/features/manager/activity/api/activityApi"
import { listManualGateOpenLogs } from "@/features/manager/gate-logs/api/gateLogApi"
import { getManagerContext } from "@/features/manager/managerContext"
import { listRefunds } from "@/features/manager/refunds/api/refundApi"
import { listManagerTickets } from "@/features/manager/tickets/api/ticketApi"
import type { ManagerContext } from "@/features/manager/units/types"

import { countNewSince, markSeen, readLastSeen, UNREAD_TABS, type UnreadTab } from "./unreadRules"

export const UNREAD_POLL_MS = 30_000

const LOADERS: Record<UnreadTab, (ctx: ManagerContext) => Promise<(string | null | undefined)[]>> = {
  refunds: async () => (await listRefunds("PENDING")).map((r) => r.issuedAt),
  // Chỉ đếm thao tác của nhân viên trong ngày, không tính thao tác của Manager hoặc khách
  activity: async (ctx) =>
    (await listFacilityLogs(ctx, todayInVietnam())).filter((l) => l.actorRole === "STAFF").map((l) => l.createdAt),
  tickets: async (ctx) => (await listManagerTickets(ctx.facilityId)).map((t) => t.createdAt),
  "gate-logs": async () => (await listManualGateOpenLogs()).map((g) => g.openedAt || g.createdAt),
}

// Poll số mục chưa đọc mỗi 30s và khi quay lại tab; lỗi tab nào thì giữ nguyên số cũ của tab đó
export function useUnreadCounts(activeTab: string | undefined): Partial<Record<UnreadTab, number>> {
  const ctx = useMemo(() => getManagerContext(), [])
  const [counts, setCounts] = useState<Partial<Record<UnreadTab, number>>>({})

  useEffect(() => {
    let ignore = false
    const check = () => {
      for (const tab of UNREAD_TABS) {
        LOADERS[tab](ctx).then(
          (times) => {
            if (ignore) return
            const lastSeen = readLastSeen(ctx.accountId, tab)
            // Lần đầu mở hoặc đang ở đúng tab thì lấy hiện tại làm mốc đã xem
            if (lastSeen === null || tab === activeTab) {
              markSeen(ctx.accountId, tab)
              setCounts((c) => ({ ...c, [tab]: 0 }))
              return
            }
            setCounts((c) => ({ ...c, [tab]: countNewSince(times, lastSeen) }))
          },
          () => {
            // Lỗi mạng/quyền thì giữ số cũ, thử lại ở lần poll sau
          }
        )
      }
    }
    check()
    const timer = setInterval(check, UNREAD_POLL_MS)
    // Browser throttle timer khi ẩn tab nên kiểm tra ngay lúc quay lại
    const onVisible = () => {
      if (document.visibilityState === "visible") check()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)
    return () => {
      ignore = true
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
  }, [ctx, activeTab])

  // Đánh dấu đã xem khi vào và khi rời tab
  useEffect(() => {
    if (!activeTab || !(UNREAD_TABS as readonly string[]).includes(activeTab)) return
    const tab = activeTab as UnreadTab
    markSeen(ctx.accountId, tab)
    return () => markSeen(ctx.accountId, tab)
  }, [ctx, activeTab])

  return activeTab && activeTab in counts ? { ...counts, [activeTab]: 0 } : counts
}
