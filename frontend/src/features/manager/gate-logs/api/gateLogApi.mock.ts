// Dữ liệu mẫu nhật ký mở cổng thủ công của cơ sở HN-01, dùng khi VITE_USE_MOCK=true.
// Ngày tính theo "hôm nay" để lúc demo luôn có log gần đây.

import { addDays, todayInVietnam } from "@/lib/format"

import type { GateLog } from "../types"

const MOCK_LATENCY_MS = 300

const SEEDS: Array<{ dayOffset: number; time: string; customerId: number; accountId: number; reason: string }> = [
  { dayOffset: 0, time: "09:12:00", customerId: 1042, accountId: 5, reason: "Khách quên mã PIN, xác minh CCCD rồi mở bằng Thẻ Master" },
  { dayOffset: -1, time: "21:47:00", customerId: 1017, accountId: 6, reason: "Mất điện đầu đọc mã, mở bằng chìa cơ" },
  { dayOffset: -2, time: "07:05:00", customerId: 1042, accountId: 5, reason: "Cổng kẹt khi khách lấy đồ sớm, mở thủ công" },
  { dayOffset: -6, time: "16:30:00", customerId: 1088, accountId: 6, reason: "Khách quên mã PIN" },
]

function buildLogs(): GateLog[] {
  const today = todayInVietnam()
  return SEEDS.map((s, index) => {
    const openedAt = `${addDays(today, s.dayOffset)}T${s.time}`
    return {
      auditLogId: 501 + index,
      accountId: s.accountId,
      facilityId: 1,
      customerId: s.customerId,
      action: "MANUAL_GATE_OPEN",
      openedAt,
      reason: s.reason,
      createdAt: openedAt,
    }
  })
}

export function mockListManualGateOpenLogs(): Promise<GateLog[]> {
  return new Promise((resolve) => setTimeout(() => resolve(buildLogs()), MOCK_LATENCY_MS))
}
