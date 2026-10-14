// US-30: đọc nhật ký hoạt động cho Admin. Chỉ có API đọc: nhật ký chỉ được ghi thêm, không sửa / xóa.
// BE đã ghi vào bảng ActivityLog nhưng CHƯA có API đọc: path dưới đây là contract FE đề xuất (qa-log Q-32).
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"

import type { ActivityLogEntry } from "../types"
import { mockListActivityLogs } from "./auditApi.mock"

/** GET /api/admin/activity-logs?from=YYYY-MM-DD&to=YYYY-MM-DD (BE lọc theo ngày; FE lọc thêm theo người, hành động) */
export async function listActivityLogs(range: {
  from: string
  to: string
}): Promise<ActivityLogEntry[]> {
  if (isMockMode()) return mockListActivityLogs()
  const params = Object.fromEntries(Object.entries(range).filter(([, v]) => v))
  return (
    unwrapApiData<ActivityLogEntry[]>(
      await apiClient.get("/admin/activity-logs", { params })
    ) ?? []
  )
}
