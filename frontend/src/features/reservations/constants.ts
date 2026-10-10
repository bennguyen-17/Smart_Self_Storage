import type { CancelReason, ReservationStatus } from "./types"

export const PAGE_SIZE = 10

export type ReservationTabKey =
  "all" | "pending" | "active" | "no-show" | "customer-canceled"

export interface ReservationTab {
  key: ReservationTabKey
  label: string
  status?: ReservationStatus
  reason?: CancelReason
}

export const RESERVATION_TABS: ReservationTab[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ nhận kho", status: "PENDING_CHECKIN" },
  { key: "active", label: "Đã nhận kho", status: "ACTIVE" },
  {
    key: "no-show",
    label: "Đã hủy do No-Show",
    status: "CANCELED",
    reason: "NO_SHOW",
  },
  {
    key: "customer-canceled",
    label: "Khách tự hủy",
    status: "CANCELED",
    reason: "CUSTOMER_REQUEST",
  },
]

export function findTab(key: string | null): ReservationTab {
  return RESERVATION_TABS.find((tab) => tab.key === key) ?? RESERVATION_TABS[0]
}

export const NO_SHOW_REASON_TEXT =
  "Đơn bị hủy tự động do khách hàng không đến nhận kho đúng ngày hẹn theo quy định BR-17."

/** Tóm tắt quy định No-Show của BR-17 */
export const NO_SHOW_RULES = [
  "Khách phải đến nhận kho trong khung giờ 08:00 – 20:00 của ngày hẹn.",
  "Đến 00:00 ngày kế tiếp mà khách chưa check-in và không báo gia hạn, hệ thống tự động hủy đơn.",
  "Khách bị tịch thu 100% tiền cọc, ô kho được trả về trạng thái AVAILABLE ngay lập tức.",
]

export const DEPOSIT_POLICY_PATH = "/chinh-sach/dat-coc"
