import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"

import type { ActivityLogEntry } from "../types"
import { mockListActivityLogs } from "./auditApi.mock"

// BE lọc theo khoảng ngày (YYYY-MM-DD), phần tìm kiếm còn lại lọc ở FE
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
