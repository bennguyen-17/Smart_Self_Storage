// Lọc và xuất nhật ký hoạt động (US-30). Hàm thuần, kiểm bằng bảng DDT.

import { matchesQuery } from "@/components/internal/textSearch"

import type { ActivityFilter, ActivityLogEntry } from "./types"

/** Nhãn tiếng Việt cho các mã hành động BE đang ghi vào bảng ActivityLog */
export const ACTION_LABEL: Record<string, string> = {
  LOGIN_SUCCESS: "Đăng nhập",
  LOGIN_FAILED: "Đăng nhập thất bại",
  CLICKWRAP_E_CONTRACT_SIGNED: "Khách ký hợp đồng điện tử",
  STAFF_RESERVATION_CHECK_IN: "Nhận kho",
  STAFF_CHANGE_UNIT: "Đổi ô kho cho khách",
  STAFF_CANCEL_RESERVATION: "Nhân viên hủy đặt chỗ",
  NO_SHOW_CANCELLED: "Tự hủy do khách không đến",
  CUSTOMER_CANCEL_DEPOSIT_REFUND: "Khách hủy cọc, hoàn toàn bộ",
  CUSTOMER_CANCEL_DEPOSIT_PARTIAL_REFUND: "Khách hủy cọc, hoàn một phần",
  CONFIRM_REFUND_EXECUTED: "Xác nhận đã hoàn tiền",
  EXTEND_CONTRACT: "Gia hạn hợp đồng",
  EXPIRY_REMINDER: "Nhắc hạn hợp đồng",
  CONFIRM_CHECKOUT_TERMINATED: "Xác nhận trả kho",
  APPROVE_FEE_DISCOUNT: "Duyệt miễn giảm phí",
  RESOLVE_TICKET: "Xử lý yêu cầu hỗ trợ",
  RESOLVE_UNLOCK_TICKET: "Xử lý yêu cầu mở khóa",
  PUT_MAINTENANCE: "Đưa ô kho vào bảo trì",
  COMPLETE_MAINTENANCE: "Hoàn tất bảo trì",
  CHANGE_UNIT_TYPE: "Đổi loại ô kho",
  LOGOUT: "Đăng xuất",
  CREATE_INTERNAL_ACCOUNT: "Tạo tài khoản nội bộ",
  ADMIN_ACCOUNT_ASSIGNMENT_CHANGED: "Đổi vai trò / cơ sở tài khoản",
  ADMIN_CUSTOMER_UNLOCKED: "Mở khóa tài khoản khách",
  CUSTOMER_DEPOSIT_PAID: "Khách đặt cọc",
  CUSTOMER_GATE_PIN_ISSUED: "Khách lấy mã PIN cổng",
  CUSTOMER_TICKET_CREATED: "Khách gửi yêu cầu hỗ trợ",
  GATE_ACCESS_GRANTED: "Mở cổng bằng mã PIN",
  MANUAL_GATE_OPEN: "Mở cổng thủ công (thẻ Master)",
  HOLD_EXPIRED: "Hết hạn giữ chỗ 5 phút",
  EXTEND_CONTRACT_VNPAY: "Gia hạn hợp đồng (VNPay)",
  UPDATE_CUSTOMER_CCCD: "Cập nhật CCCD khách",
  MANAGER_ACCEPT_TICKET: "Quản lý nhận ticket",
  MANAGER_RESOLVE_TICKET: "Quản lý xử lý ticket",
  FORFEIT_ASSET_PROCESSED: "Xác nhận đã xử lý tài sản (thanh lý)",
}

/** Gộp các mã có hậu tố số về một nhóm: "EXPIRY_REMINDER_T7" → "EXPIRY_REMINDER" */
export function actionGroup(action: string): string {
  return action.startsWith("EXPIRY_REMINDER_T") ? "EXPIRY_REMINDER" : action
}

/** Nhãn hiển thị; mã lạ (BE thêm sau) thì giữ nguyên mã để Admin vẫn đọc được */
export function actionLabel(action: string): string {
  const label = ACTION_LABEL[actionGroup(action)]
  if (!label) return action
  return action.startsWith("EXPIRY_REMINDER_T")
    ? `${label} (còn ${action.slice("EXPIRY_REMINDER_T".length)} ngày)`
    : label
}

/** Thao tác cần chú ý (an ninh, tiền) để tô màu nổi bật */
export function isSensitive(action: string): boolean {
  return [
    "LOGIN_FAILED",
    "APPROVE_FEE_DISCOUNT",
    "CONFIRM_REFUND_EXECUTED",
    "STAFF_CANCEL_RESERVATION",
    "NO_SHOW_CANCELLED",
  ].includes(action)
}

/** Người thực hiện: thao tác tự động (không có tài khoản) ghi là "Hệ thống" */
export function actorLabel(log: ActivityLogEntry): string {
  if (log.accountId === null) return "Hệ thống"
  return log.actorName ?? `Tài khoản #${log.accountId}`
}

/** Nhật ký chia 2 loại (nhóm chốt 22/10): hoạt động của khách hàng và hoạt động nội bộ (Staff, Manager, Admin, BOM, hệ thống tự động) */
export type LogAudience = "CUSTOMER" | "INTERNAL"

export const AUDIENCE_LABEL: Record<LogAudience, string> = {
  CUSTOMER: "Khách hàng",
  INTERNAL: "Nội bộ",
}

export function logAudience(log: Pick<ActivityLogEntry, "actorRole">): LogAudience {
  return log.actorRole?.toUpperCase() === "CUSTOMER" ? "CUSTOMER" : "INTERNAL"
}

/** Khoảng ngày hợp lệ khi chưa chọn đủ 2 đầu, hoặc ngày bắt đầu không sau ngày kết thúc */
export function isRangeValid(from: string, to: string): boolean {
  return !from || !to || from <= to
}

/** Lọc theo người (tên, vai trò), mô tả, IP; nhóm hành động; khoảng ngày (gồm 2 đầu). Mới nhất lên đầu */
/** Giá trị bộ lọc "Lịch sử đăng nhập": gộp các mã đăng nhập / đăng xuất (đề: "Track login history") */
export const LOGIN_HISTORY_FILTER = "LOGIN_HISTORY"
export const LOGIN_HISTORY_ACTIONS = ["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT"]

function matchesAction(action: string, filterAction: string): boolean {
  if (filterAction === "ALL") return true
  if (filterAction === LOGIN_HISTORY_FILTER) return LOGIN_HISTORY_ACTIONS.includes(action)
  return actionGroup(action) === filterAction
}

export function filterActivityLogs(
  logs: readonly ActivityLogEntry[],
  filter: ActivityFilter
): ActivityLogEntry[] {
  if (!isRangeValid(filter.from, filter.to)) return []
  return logs
    .filter((l) => matchesAction(l.action, filter.action))
    .filter((l) => {
      const day = l.createdAt.slice(0, 10)
      return (
        (!filter.from || day >= filter.from) && (!filter.to || day <= filter.to)
      )
    })
    .filter((l) =>
      matchesQuery(filter.query, [
        actorLabel(l),
        l.actorRole,
        l.description,
        l.ipAddress,
      ])
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const ACTIVITY_CSV_HEADER = [
  "Thời gian",
  "Người thực hiện",
  "Vai trò",
  "Hành động",
  "Mã hành động",
  "Mô tả",
  "IP",
] as const

export function activityCsvRows(
  logs: readonly ActivityLogEntry[]
): (string | null)[][] {
  return logs.map((l) => [
    l.createdAt.replace("T", " "),
    actorLabel(l),
    l.actorRole,
    actionLabel(l.action),
    l.action,
    l.description,
    l.ipAddress,
  ])
}
