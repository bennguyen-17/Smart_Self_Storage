// US-33: số liệu tổng quan cơ sở cho Manager.
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { managerHeaders } from "@/features/manager/managerContext"
import type { ManagerContext } from "@/features/manager/units/types"

import type { ReportRange } from "../reportRules"
import type { ManagerDashboard } from "../types"
import { mockGetManagerDashboard } from "./reportApi.mock"

/**
 * GET /api/manager/dashboard/overview?from=&to= (BE lọc theo cơ sở trong header X-Facility-Id).
 * from/to (YYYY-MM-DD) chỉ áp cho doanh thu, hoàn tiền, miễn giảm, ticket; số ô kho và hợp đồng là số hiện tại.
 */
export async function getManagerDashboard(ctx: ManagerContext, range?: ReportRange): Promise<ManagerDashboard> {
  if (isMockMode()) return mockGetManagerDashboard()
  const params: Record<string, string> = {}
  if (range?.from) params.from = range.from
  if (range?.to) params.to = range.to
  const body = await apiClient.get("/manager/dashboard/overview", { params, headers: managerHeaders(ctx) })
  return unwrapApiData<ManagerDashboard>(body)
}
