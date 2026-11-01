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

/** Mỗi trang lấy danh sách thời điểm phát sinh của dữ liệu "mới" */
const LOADERS: Record<UnreadTab, (ctx: ManagerContext) => Promise<(string | null | undefined)[]>> = {
  // Phiếu hoàn cọc mới cần Manager chuyển khoản
  refunds: async () => (await listRefunds("PENDING")).map((r) => r.issuedAt),
  // Thao tác mới của nhân viên trong ngày (không đếm thao tác của chính Manager hay của khách)
  activity: async (ctx) =>
    (await listFacilityLogs(ctx, todayInVietnam())).filter((l) => l.actorRole === "STAFF").map((l) => l.createdAt),
  // Ticket mới của khách
  tickets: async (ctx) => (await listManagerTickets(ctx.facilityId)).map((t) => t.createdAt),
  // Lượt ra vào cổng mới
  "gate-logs": async () => (await listManualGateOpenLogs()).map((g) => g.openedAt || g.createdAt),
}

/**
 * Số mục mới của từng trang so với lần cuối Manager mở trang đó; tự kiểm tra lại mỗi 30 giây.
 * Trang đang mở luôn là 0 và được đánh dấu đã xem. Một API lỗi thì giữ số cũ của trang đó, không ảnh hưởng trang khác.
 */
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
            // Lần đầu, hoặc đang đứng ở trang này: lấy "bây giờ" làm mốc đã xem
            if (lastSeen === null || tab === activeTab) {
              markSeen(ctx.accountId, tab)
              setCounts((c) => ({ ...c, [tab]: 0 }))
              return
            }
            setCounts((c) => ({ ...c, [tab]: countNewSince(times, lastSeen) }))
          },
          () => {
            // Không tải được (mất mạng, chưa có quyền): giữ số cũ, lần kiểm tra sau thử lại
          }
        )
      }
    }
    check()
    const timer = setInterval(check, UNREAD_POLL_MS)
    return () => {
      ignore = true
      clearInterval(timer)
    }
  }, [ctx, activeTab])

  // Rời trang: đánh dấu đã xem tới lúc rời, để dữ liệu đã thấy không tính là mới
  useEffect(() => {
    if (!activeTab || !(UNREAD_TABS as readonly string[]).includes(activeTab)) return
    const tab = activeTab as UnreadTab
    markSeen(ctx.accountId, tab)
    return () => markSeen(ctx.accountId, tab)
  }, [ctx, activeTab])

  // Trang đang mở không hiện chấm
  return activeTab && activeTab in counts ? { ...counts, [activeTab]: 0 } : counts
}
