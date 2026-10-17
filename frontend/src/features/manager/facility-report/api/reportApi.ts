// US-33: số liệu tổng quan cơ sở cho Manager.
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { managerHeaders } from "@/features/manager/unit-management/managerContext"
import type { ManagerContext } from "@/features/manager/unit-management/types"

import type { ManagerDashboard } from "../types"
import { mockGetManagerDashboard } from "./reportApi.mock"

/** GET /api/manager/dashboard/overview (BE lọc theo cơ sở trong header X-Facility-Id) */
export async function getManagerDashboard(ctx: ManagerContext): Promise<ManagerDashboard> {
  if (isMockMode()) return mockGetManagerDashboard()
  const body = await apiClient.get("/manager/dashboard/overview", { headers: managerHeaders(ctx) })
  return unwrapApiData<ManagerDashboard>(body)
}
