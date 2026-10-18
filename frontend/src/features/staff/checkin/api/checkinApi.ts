// US-16: API check-in tại quầy — gọi BE-16 thật (/api/staff/reservations...).
// VITE_USE_MOCK=true → dùng mock; false → gọi backend. Không tự fallback về mock khi lỗi.

import { isAxiosError } from "axios"

import { getErrorMessage, unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"
import type { UnitDetailResponse } from "@/types"

import type {
  CollectPenaltyRequest,
  CollectPenaltyResponse,
  RenewAtCounterRequest,
  RenewAtCounterResponse,
  StaffCancelReservationResponse,
  StaffChangeUnitResponse,
  StaffCheckInRequest,
  StaffCheckInResponse,
  StaffReservationItem,
  StaffReservationLookup,
} from "../types"

/** GET /api/staff/reservations — BE tự lọc theo cơ sở của Staff. */
export async function listCheckinContracts(): Promise<StaffReservationItem[]> {
  const body = await apiClient.get("/staff/reservations")
  return unwrapApiData<StaffReservationItem[]>(body) ?? []
}

/** GET /api/staff/reservations/lookup?code= — 404 nếu không thuộc cơ sở. */
export async function lookupContract(
  code: string
): Promise<StaffReservationLookup> {
  const body = await apiClient.get("/staff/reservations/lookup", {
    params: { code },
  })
  return unwrapApiData<StaffReservationLookup>(body)
}

/** POST /api/staff/reservations/{id}/check-in — thu tiền, HĐ → ACTIVE, ô → RENTED. */
export async function confirmCheckin(
  reservationId: number,
  payload: StaffCheckInRequest
): Promise<StaffCheckInResponse> {
  const body = await apiClient.post(
    `/staff/reservations/${reservationId}/check-in`,
    payload
  )
  return unwrapApiData<StaffCheckInResponse>(body)
}

/** POST /api/staff/reservations/{id}/change-unit — đổi ô, BE tính lại tiền/cọc. */
export async function changeUnit(
  reservationId: number,
  payload: { newUnitCode: string }
): Promise<StaffChangeUnitResponse> {
  const body = await apiClient.post(
    `/staff/reservations/${reservationId}/change-unit`,
    payload
  )
  return unwrapApiData<StaffChangeUnitResponse>(body)
}

/** POST /api/staff/reservations/{id}/cancel — hủy tại quầy. */
export async function counterCancel(
  reservationId: number
): Promise<StaffCancelReservationResponse> {
  const body = await apiClient.post(
    `/staff/reservations/${reservationId}/cancel`,
    {}
  )
  return unwrapApiData<StaffCancelReservationResponse>(body)
}

/**
 * US-20: POST /api/staff/reservations/{id}/collect-penalty — thu phạt quá hạn tại quầy.
 * Gộp toàn bộ phạt UNPAID thành 1 hóa đơn PEN (PAID); HĐ vẫn OVERDUE, PIN vẫn khóa.
 */
export async function collectPenalty(
  reservationId: number,
  payload: CollectPenaltyRequest
): Promise<CollectPenaltyResponse> {
  const body = await apiClient.post(
    `/staff/reservations/${reservationId}/collect-penalty`,
    payload
  )
  return unwrapApiData<CollectPenaltyResponse>(body)
}

/**
 * US-20: POST /api/staff/reservations/{id}/renew-at-counter — gia hạn tại quầy khi OVERDUE.
 * HĐ về ACTIVE, hóa đơn EXT, khôi phục quyền sinh PIN. BE chặn nếu còn phạt UNPAID.
 */
export async function renewAtCounter(
  reservationId: number,
  payload: RenewAtCounterRequest
): Promise<RenewAtCounterResponse> {
  const body = await apiClient.post(
    `/staff/reservations/${reservationId}/renew-at-counter`,
    payload
  )
  return unwrapApiData<RenewAtCounterResponse>(body)
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
    const serverMessage = (
      error.response?.data as { message?: string } | undefined
    )?.message
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

export interface StaffGatePinData {
  success: boolean
  pin: string
  rawPin: string
  ttlSeconds: number
  facilityId: number
  facilityName: string
  facilityCode: string
  message: string
}

/** GET /api/staff/reservations/gate-pin — Mã PIN động 15s mở cổng cơ sở 24/7 của Staff */
export async function fetchStaffGatePin(): Promise<StaffGatePinData> {
  const body = await apiClient.get("/staff/reservations/gate-pin")
  return unwrapApiData<StaffGatePinData>(body)
}
