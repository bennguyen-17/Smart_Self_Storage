// US-16: API check-in tại quầy.
// VITE_USE_MOCK=true → dùng mock; false → gọi backend. Không tự fallback về mock khi lỗi.
// Đề xuất endpoint cho BE (Khánh): /api/staff/checkins...

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import { getUnits } from "@/features/floor-plan/api/floorPlanApi"
import type { UnitQuery } from "@/features/floor-plan/types"
import type { UnitDetailResponse } from "@/types"

import type {
  ChangeUnitRequest,
  CheckinContract,
  CheckinFilter,
  CounterCancelResult,
  PageResponse,
} from "../types"
import {
  mockChangeUnit,
  mockConfirmCheckin,
  mockCounterCancel,
  mockListCheckinContracts,
  mockLookupContract,
} from "./checkinApi.mock"

/** GET /api/staff/checkins?status&page&size — BE tự lọc theo cơ sở của Staff (BR-06). */
export async function listCheckinContracts(
  filter: CheckinFilter
): Promise<PageResponse<CheckinContract>> {
  if (isMockMode()) return mockListCheckinContracts(filter)
  const body = await apiClient.get("/staff/checkins", { params: filter })
  return unwrapApiData<PageResponse<CheckinContract>>(body)
}

/** GET /api/staff/checkins/lookup?code= — 404 nếu không thuộc cơ sở, 409 nếu sai trạng thái. */
export async function lookupContract(code: string): Promise<CheckinContract> {
  if (isMockMode()) return mockLookupContract(code)
  const body = await apiClient.get("/staff/checkins/lookup", {
    params: { code },
  })
  return unwrapApiData<CheckinContract>(body)
}

/** POST /api/staff/checkins/{code}/confirm — thu tiền thuê tại quầy, HĐ → ACTIVE (BR-20). */
export async function confirmCheckin(
  code: string,
  payload: { collectedAmount: number; paymentMethod: string }
): Promise<CheckinContract> {
  if (isMockMode()) return mockConfirmCheckin(code, payload)
  const body = await apiClient.post(
    `/staff/checkins/${encodeURIComponent(code)}/confirm`,
    payload
  )
  return unwrapApiData<CheckinContract>(body)
}

/** POST /api/staff/checkins/{code}/change-unit — đổi ô kho, tính lại hóa đơn (BR-20). */
export async function changeUnit(
  code: string,
  payload: ChangeUnitRequest
): Promise<CheckinContract> {
  if (isMockMode()) return mockChangeUnit(code, payload)
  const body = await apiClient.post(
    `/staff/checkins/${encodeURIComponent(code)}/change-unit`,
    payload
  )
  return unwrapApiData<CheckinContract>(body)
}

/** POST /api/staff/checkins/{code}/cancel — hủy tại quầy, hoàn 50% cọc (BR-17). */
export async function counterCancel(
  code: string,
  payload: { reason: string }
): Promise<CounterCancelResult> {
  if (isMockMode()) return mockCounterCancel(code)
  const body = await apiClient.post(
    `/staff/checkins/${encodeURIComponent(code)}/cancel`,
    payload
  )
  return unwrapApiData<CounterCancelResult>(body)
}

/** Danh sách ô còn trống để chọn khi đổi ô — tái dùng API sơ đồ 2D (US-03). */
export function getAvailableUnits(
  query: UnitQuery
): Promise<UnitDetailResponse[]> {
  return getUnits(query)
}
