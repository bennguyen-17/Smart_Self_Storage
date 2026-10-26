// API hoạt động nhân viên và nhật ký nội bộ của cơ sở (BE đã có: ManagerActivityController).
// BE xác định cơ sở qua header X-Facility-Id (gắn ở đây, component không cần biết).

import { unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"
import { managerHeaders } from "@/features/manager/managerContext"
import type { ManagerContext } from "@/features/manager/units/types"

import type { FacilityLogEntry, StaffActivityDay } from "../types"

/** GET /api/manager/staff-activity?date=YYYY-MM-DD: theo từng ca, mỗi người trực làm được gì */
export async function getStaffActivity(ctx: ManagerContext, date: string): Promise<StaffActivityDay> {
  return unwrapApiData<StaffActivityDay>(
    await apiClient.get("/manager/staff-activity", { params: { date }, headers: managerHeaders(ctx) })
  )
}

/** GET /api/manager/activity-logs?date=YYYY-MM-DD: nhật ký thao tác của cơ sở trong ngày (lọc người ở FE) */
export async function listFacilityLogs(ctx: ManagerContext, date: string): Promise<FacilityLogEntry[]> {
  return (
    unwrapApiData<FacilityLogEntry[]>(
      await apiClient.get("/manager/activity-logs", { params: { date }, headers: managerHeaders(ctx) })
    ) ?? []
  )
}
