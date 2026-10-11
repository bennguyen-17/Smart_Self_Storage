import type { ContractStatus } from "./types"

export type CheckinTabKey =
  "all" | "pending" | "active" | "overdue" | "canceled"

export interface CheckinTab {
  key: CheckinTabKey
  label: string
  contractStatus?: ContractStatus
}

export const CHECKIN_TABS: CheckinTab[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ Check-in", contractStatus: "PENDING_CHECKIN" },
  { key: "active", label: "Đang thuê", contractStatus: "ACTIVE" },
  { key: "overdue", label: "Quá hạn", contractStatus: "OVERDUE" },
  { key: "canceled", label: "Đã hủy", contractStatus: "CANCELED" },
]

export function findCheckinTab(key: string | null): CheckinTab {
  return CHECKIN_TABS.find((tab) => tab.key === key) ?? CHECKIN_TABS[0]
}

/** BR-19: khung giờ check-in bàn giao 08:00 – 20:00 hằng ngày */
export const CHECKIN_HOURS = { start: 8, end: 20 }

/** BR-17: hủy tại quầy (0 ngày < 4 ngày) → khách mất 50% cọc */
export const CANCEL_FORFEIT_RATE = 0.5

export const CANCEL_POLICY_TEXT = [
  "Hủy tại quầy áp dụng theo BR-17: khách mất 50% tiền cọc đã nộp.",
  "Hệ thống hoàn lại 50% tiền cọc cho khách và ghi nhận 50% còn lại vào quỹ phạt giữ chỗ.",
  "Hợp đồng chuyển sang CANCELED và ô kho được trả về AVAILABLE ngay lập tức.",
]

/** Kiểm tra thời điểm hiện tại có nằm trong khung giờ check-in không (BR-19). */
export function isWithinCheckinHours(now: Date = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now)
  )
  return hour >= CHECKIN_HOURS.start && hour < CHECKIN_HOURS.end
}
