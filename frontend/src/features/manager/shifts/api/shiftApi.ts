import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { managerHeaders } from "@/features/manager/managerContext"
import type { ManagerContext } from "@/features/manager/units/types"

import type { DaySchedule, FacilityStaff } from "../types"
import {
  mockGetDaySchedule,
  mockListFacilityStaff,
  mockSaveShift,
} from "./shiftApi.mock"

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
