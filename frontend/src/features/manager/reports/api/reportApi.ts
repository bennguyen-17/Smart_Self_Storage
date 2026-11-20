import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { managerHeaders } from "@/features/manager/managerContext"
import type { ManagerContext } from "@/features/manager/units/types"

import type { ReportRange } from "../reportRules"
import type { ManagerDashboard } from "../types"
import { mockGetManagerDashboard } from "./reportApi.mock"

// from/to (YYYY-MM-DD) chỉ áp dụng cho doanh thu, hoàn tiền và ticket; số ô kho và hợp đồng là snapshot hiện tại
export async function getManagerDashboard(ctx: ManagerContext, range?: ReportRange): Promise<ManagerDashboard> {
  if (isMockMode()) return mockGetManagerDashboard()
  const params: Record<string, string> = {}
  if (range?.from) params.from = range.from
  if (range?.to) params.to = range.to
  const body = await apiClient.get("/manager/dashboard/overview", { params, headers: managerHeaders(ctx) })
  return unwrapApiData<ManagerDashboard>(body)
}
