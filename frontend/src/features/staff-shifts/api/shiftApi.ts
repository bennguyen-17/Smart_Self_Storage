// US-32: API phân ca. BE CHƯA có: path và body dưới đây là contract FE đề xuất (qa-log), đang chạy mock.
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { managerHeaders } from "@/features/unit-management/managerContext"
import type { ManagerContext } from "@/features/unit-management/types"

import type { DaySchedule, FacilityStaff, ShiftAssignment, ShiftKey } from "../types"
import { mockGetDaySchedule, mockListFacilityStaff, mockSaveShift } from "./shiftApi.mock"

/** GET /api/manager/staff: nhân viên thuộc cơ sở trong header X-Facility-Id */
export async function listFacilityStaff(ctx: ManagerContext): Promise<FacilityStaff[]> {
  if (isMockMode()) return mockListFacilityStaff()
  return unwrapApiData<FacilityStaff[]>(await apiClient.get("/manager/staff", { headers: managerHeaders(ctx) })) ?? []
}

/** GET /api/manager/shifts?date=YYYY-MM-DD */
export async function getDaySchedule(ctx: ManagerContext, date: string): Promise<DaySchedule> {
  if (isMockMode()) return mockGetDaySchedule(date)
  return unwrapApiData<DaySchedule>(await apiClient.get("/manager/shifts", { params: { date }, headers: managerHeaders(ctx) }))
}

/** PUT /api/manager/shifts/{date}/{shift}  body { assignments: [{ accountId, duty }] } */
export async function saveShift(ctx: ManagerContext, date: string, shift: ShiftKey, assignments: ShiftAssignment[]): Promise<DaySchedule> {
  if (isMockMode()) return mockSaveShift(date, shift, assignments)
  const body = { assignments: assignments.map(({ accountId, duty }) => ({ accountId, duty })) }
  return unwrapApiData<DaySchedule>(await apiClient.put(`/manager/shifts/${date}/${shift}`, body, { headers: managerHeaders(ctx) }))
}
