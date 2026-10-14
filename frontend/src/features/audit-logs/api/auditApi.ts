// US-30: đọc nhật ký hệ thống cho Admin. Chỉ có API đọc: bảng log chỉ được thêm, không sửa / xóa.
// BE CHƯA có: path dưới đây là contract FE đề xuất (qa-log), đang chạy mock.
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"

import type { AuditLogEntry } from "../types"
import { mockListAuditLogs } from "./auditApi.mock"

/** GET /api/admin/audit-logs?from=YYYY-MM-DD&to=YYYY-MM-DD (BE lọc theo ngày; FE lọc thêm theo người, hành động) */
export async function listAuditLogs(range: { from: string; to: string }): Promise<AuditLogEntry[]> {
  if (isMockMode()) return mockListAuditLogs()
  const params = Object.fromEntries(Object.entries(range).filter(([, v]) => v))
  return unwrapApiData<AuditLogEntry[]>(await apiClient.get("/admin/audit-logs", { params })) ?? []
}
