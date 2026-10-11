// US-16: API check-in tại quầy — gọi BE-16 thật (/api/staff/reservations...).
// VITE_USE_MOCK=true → dùng mock; false → gọi backend. Không tự fallback về mock khi lỗi.

import { isAxiosError } from "axios"

import { getErrorMessage, unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"
import type { UnitDetailResponse } from "@/types"

import type {
  StaffCancelReservationResponse,
  StaffChangeUnitResponse,
  StaffCheckInRequest,
  StaffCheckInResponse,
  StaffReservationItem,
  StaffReservationLookup,
} from "../types"
import {
  mockCancelReservation,
  mockChangeUnit,
  mockCheckIn,
  mockListReservations,
  mockLookupReservation,
} from "./checkinApi.mock"

/** GET /api/staff/reservations — BE tự lọc theo cơ sở của Staff (BR-06). */
export async function listCheckinContracts(): Promise<StaffReservationItem[]> {
  if (isMockMode()) return mockListReservations()
  const body = await apiClient.get("/staff/reservations")
  return unwrapApiData<StaffReservationItem[]>(body) ?? []
}

/** GET /api/staff/reservations/lookup?code= — 404 nếu không thuộc cơ sở. */
export async function lookupContract(
  code: string
): Promise<StaffReservationLookup> {
  if (isMockMode()) return mockLookupReservation(code)
  const body = await apiClient.get("/staff/reservations/lookup", {
    params: { code },
  })
  return unwrapApiData<StaffReservationLookup>(body)
}

/** POST /api/staff/reservations/{id}/check-in — thu tiền, HĐ → ACTIVE, ô → RENTED (BR-20). */
export async function confirmCheckin(
  reservationId: number,
  payload: StaffCheckInRequest
): Promise<StaffCheckInResponse> {
  if (isMockMode()) return mockCheckIn(reservationId, payload)
  const body = await apiClient.post(
    `/staff/reservations/${reservationId}/check-in`,
    payload
  )
  return unwrapApiData<StaffCheckInResponse>(body)
}

/** POST /api/staff/reservations/{id}/change-unit — đổi ô, BE tính lại tiền/cọc (BR-20). */
export async function changeUnit(
  reservationId: number,
  payload: { newUnitCode: string }
): Promise<StaffChangeUnitResponse> {
  if (isMockMode()) return mockChangeUnit(reservationId, payload.newUnitCode)
  const body = await apiClient.post(
    `/staff/reservations/${reservationId}/change-unit`,
    payload
  )
  return unwrapApiData<StaffChangeUnitResponse>(body)
}

/** POST /api/staff/reservations/{id}/cancel — hủy tại quầy, hoàn theo BR-17. */
export async function counterCancel(
  reservationId: number
): Promise<StaffCancelReservationResponse> {
  if (isMockMode()) return mockCancelReservation(reservationId)
  const body = await apiClient.post(
    `/staff/reservations/${reservationId}/cancel`,
    {}
  )
  return unwrapApiData<StaffCancelReservationResponse>(body)
}

/**
 * Lấy toàn bộ ô kho (GET /api/units/filter) để gợi ý ô trống cùng tầng khi đổi ô.
 * BE không trả facilityId của Staff nên FE chỉ gợi ý theo tầng của ô hiện tại;
 * ô cuối cùng vẫn do BE validate.
 */
export async function fetchAllUnits(): Promise<UnitDetailResponse[]> {
  const body = await apiClient.get("/units/filter")
  return unwrapApiData<UnitDetailResponse[]>(body) ?? []
}

/** Thông báo lỗi thân thiện theo HTTP status của BE (404 = không thuộc cơ sở, 409 = sai trạng thái). */
export function checkinErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status
    const serverMessage = (error.response?.data as { message?: string } | undefined)
      ?.message
    if (status === 404) {
      return "Không tìm thấy mã đặt chỗ (mã sai hoặc thuộc cơ sở khác)."
    }
    if (status === 409) {
      return (
        serverMessage ??
        "Hợp đồng không ở trạng thái hợp lệ để thao tác (đã check-in hoặc đã hủy)."
      )
    }
    if (serverMessage) return serverMessage
  }
  return getErrorMessage(error)
}
