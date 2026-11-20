import { unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"
import { managerHeaders } from "@/features/manager/managerContext"
import type { ManagerContext } from "@/features/manager/units/types"

import type { FacilityLogEntry, StaffActivityDay } from "../types"

export async function getStaffActivity(ctx: ManagerContext, date: string): Promise<StaffActivityDay> {
  return unwrapApiData<StaffActivityDay>(
    await apiClient.get("/manager/activity-logs/staff", { params: { date }, headers: managerHeaders(ctx) })
  )
}

export async function listFacilityLogs(ctx: ManagerContext, date: string): Promise<FacilityLogEntry[]> {
  return (
    unwrapApiData<FacilityLogEntry[]>(
      await apiClient.get("/manager/activity-logs", { params: { date }, headers: managerHeaders(ctx) })
    ) ?? []
  )
}
