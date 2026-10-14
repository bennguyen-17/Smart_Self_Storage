// Nhật ký hệ thống mẫu, dùng khi VITE_USE_MOCK=true. Ngày tính theo "hôm nay".

import { addDays, todayInVietnam } from "@/lib/format"

import type { AuditLogEntry } from "../types"

function build(): AuditLogEntry[] {
  const t = todayInVietnam()
  const at = (offset: number, time: string) => `${addDays(t, offset)}T${time}`
  const rows: Omit<AuditLogEntry, "logId">[] = [
    { accountId: 1, actorName: "Quản Trị Viên Hệ Thống", actorRole: "ADMIN", facilityCode: null, action: "ROLE_CHANGED", target: "Lê Thị Quản Lý (#4)", before: "STAFF", after: "MANAGER", createdAt: at(0, "09:30:12"), ipAddress: "10.10.0.5" },
    { accountId: null, actorName: "Không xác định", actorRole: "—", facilityCode: null, action: "LOGIN_FAILED", target: "0900000003", before: null, after: "Sai mật khẩu 5 lần, khóa tạm 30 phút", createdAt: at(0, "08:47:03"), ipAddress: "203.0.113.9" },
    { accountId: 3, actorName: "Trần Văn Quản Lý", actorRole: "MANAGER", facilityCode: "HN-01", action: "FEE_DISCOUNTED", target: "PEN-7001", before: "600.000 ₫", after: "300.000 ₫", createdAt: at(0, "08:15:40"), ipAddress: "10.10.1.20" },
    { accountId: 5, actorName: "Nguyễn Văn Nhân Viên 1", actorRole: "STAFF", facilityCode: "HN-01", action: "MANUAL_GATE_OPEN", target: "Khách #1042", before: null, after: "Khách quên mã PIN", createdAt: at(0, "07:58:11"), ipAddress: "10.10.1.31" },
    { accountId: 5, actorName: "Nguyễn Văn Nhân Viên 1", actorRole: "STAFF", facilityCode: "HN-01", action: "LOGIN", target: null, before: null, after: null, createdAt: at(0, "07:55:02"), ipAddress: "10.10.1.31" },
    { accountId: 3, actorName: "Trần Văn Quản Lý", actorRole: "MANAGER", facilityCode: "HN-01", action: "UNIT_STATUS_CHANGED", target: "HN01-F1-S01", before: "AVAILABLE", after: "UNDER_MAINTENANCE", createdAt: at(-1, "16:20:45"), ipAddress: "10.10.1.20" },
    { accountId: 6, actorName: "Phạm Thị Nhân Viên 2", actorRole: "STAFF", facilityCode: "HCM-01", action: "PAYMENT_COLLECTED", target: "PEN-6880", before: "UNPAID", after: "PAID", createdAt: at(-1, "14:02:19"), ipAddress: "10.20.1.12" },
    { accountId: 2, actorName: "Ngô Thị Ban Giám Đốc", actorRole: "BOM", facilityCode: null, action: "CONFIG_CHANGED", target: "Bảng giá Size L", before: "2.400.000 ₫/tháng", after: "2.520.000 ₫/tháng", createdAt: at(-2, "10:11:00"), ipAddress: "10.0.0.8" },
    { accountId: 1, actorName: "Quản Trị Viên Hệ Thống", actorRole: "ADMIN", facilityCode: null, action: "ACCOUNT_CREATED", target: "staff1.hcm01@selfstorage391.vn", before: null, after: "STAFF · HCM-03", createdAt: at(-3, "09:00:27"), ipAddress: "10.10.0.5" },
    { accountId: 1, actorName: "Quản Trị Viên Hệ Thống", actorRole: "ADMIN", facilityCode: null, action: "ACCOUNT_LOCKED", target: "staff2.hn01@selfstorage391.vn", before: "ACTIVE", after: "LOCKED", createdAt: at(-4, "17:45:00"), ipAddress: "10.10.0.5" },
    { accountId: 6, actorName: "Phạm Thị Nhân Viên 2", actorRole: "STAFF", facilityCode: "HCM-01", action: "CONTRACT_STATUS_CHANGED", target: "CTR-HCM01-0088", before: "ACTIVE", after: "TERMINATED", createdAt: at(-5, "11:30:00"), ipAddress: "10.20.1.12" },
  ]
  return rows.map((r, i) => ({ ...r, logId: 99300 - i }))
}

export function mockListAuditLogs(): Promise<AuditLogEntry[]> {
  return new Promise((resolve) => setTimeout(() => resolve(build()), 300))
}
