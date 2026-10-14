// US-32: API phân ca. BE CHƯA có: path và body dưới đây là contract FE đề xuất (qa-log Q-31),
// khớp bảng Shift + StaffShift có sẵn trong DB. Đang chạy mock.
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { managerHeaders } from "@/pages/manager/unit-management/managerContext"
import type { ManagerContext } from "@/pages/manager/unit-management/types"

import type { DaySchedule, FacilityStaff } from "../types"
import {
  mockGetDaySchedule,
  mockListFacilityStaff,
  mockSaveShift,
} from "./shiftApi.mock"

/** GET /api/manager/staff: nhân viên thuộc cơ sở trong header X-Facility-Id */
export async function listFacilityStaff(
  ctx: ManagerContext
): Promise<FacilityStaff[]> {
  if (isMockMode()) return mockListFacilityStaff()
  return (
    unwrapApiData<FacilityStaff[]>(
      await apiClient.get("/manager/staff", { headers: managerHeaders(ctx) })
    ) ?? []
  )
}

/** GET /api/manager/shifts?date=YYYY-MM-DD: các ca (giờ lấy từ bảng Shift) và người trực trong ngày */
export async function getDaySchedule(
  ctx: ManagerContext,
  date: string
): Promise<DaySchedule> {
  if (isMockMode()) return mockGetDaySchedule(date)
  return unwrapApiData<DaySchedule>(
    await apiClient.get("/manager/shifts", {
      params: { date },
      headers: managerHeaders(ctx),
    })
  )
}

/** PUT /api/manager/shifts/{date}/{shiftId}  body { employeeIds: [...] }: thay danh sách người trực của một ca */
export async function saveShift(
  ctx: ManagerContext,
  date: string,
  shiftId: number,
  employeeIds: number[]
): Promise<DaySchedule> {
  if (isMockMode()) return mockSaveShift(date, shiftId, employeeIds)
  return unwrapApiData<DaySchedule>(
    await apiClient.put(
      `/manager/shifts/${date}/${shiftId}`,
      { employeeIds },
      { headers: managerHeaders(ctx) }
    )
  )
}
