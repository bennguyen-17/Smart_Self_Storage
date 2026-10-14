// Lọc và xuất nhật ký hệ thống (US-30). Hàm thuần, kiểm bằng bảng DDT.

import { matchesQuery } from "@/features/internal-shell/textSearch"

import type { AuditAction, AuditFilter, AuditLogEntry } from "./types"

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  LOGIN: "Đăng nhập",
  LOGIN_FAILED: "Đăng nhập thất bại",
  ACCOUNT_CREATED: "Tạo tài khoản",
  ACCOUNT_LOCKED: "Khóa / mở khóa tài khoản",
  ROLE_CHANGED: "Đổi vai trò",
  CONTRACT_STATUS_CHANGED: "Đổi trạng thái hợp đồng",
  UNIT_STATUS_CHANGED: "Đổi trạng thái ô kho",
  PAYMENT_COLLECTED: "Thu tiền",
  FEE_DISCOUNTED: "Miễn / giảm phí",
  CONFIG_CHANGED: "Đổi cấu hình",
  MANUAL_GATE_OPEN: "Mở cổng thủ công",
}

/** Hành động cần chú ý (an ninh, tiền, quyền) để tô màu nổi bật */
export function isSensitive(action: string): boolean {
  return ["LOGIN_FAILED", "ROLE_CHANGED", "ACCOUNT_LOCKED", "FEE_DISCOUNTED", "CONFIG_CHANGED", "MANUAL_GATE_OPEN"].includes(action)
}

export function actionLabel(action: string): string {
  return AUDIT_ACTION_LABEL[action as AuditAction] ?? action
}

/** Khoảng ngày hợp lệ khi chưa chọn đủ 2 đầu, hoặc ngày bắt đầu không sau ngày kết thúc */
export function isRangeValid(from: string, to: string): boolean {
  return !from || !to || from <= to
}

/** Lọc theo người (tên, vai trò), đối tượng, IP; loại hành động; khoảng ngày (gồm 2 đầu). Mới nhất lên đầu */
export function filterAuditLogs(logs: readonly AuditLogEntry[], filter: AuditFilter): AuditLogEntry[] {
  if (!isRangeValid(filter.from, filter.to)) return []
  return logs
    .filter((l) => filter.action === "ALL" || l.action === filter.action)
    .filter((l) => {
      const day = l.createdAt.slice(0, 10)
      return (!filter.from || day >= filter.from) && (!filter.to || day <= filter.to)
    })
    .filter((l) => matchesQuery(filter.query, [l.actorName, l.actorRole, l.target, l.ipAddress, l.facilityCode]))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const AUDIT_CSV_HEADER = [
  "Thời gian",
  "Người thực hiện",
  "Vai trò",
  "Cơ sở",
  "Hành động",
  "Đối tượng",
  "Trước",
  "Sau",
  "IP",
] as const

export function auditCsvRows(logs: readonly AuditLogEntry[]): (string | null)[][] {
  return logs.map((l) => [
    l.createdAt.replace("T", " "),
    l.actorName,
    l.actorRole,
    l.facilityCode,
    actionLabel(l.action),
    l.target,
    l.before,
    l.after,
    l.ipAddress,
  ])
}
