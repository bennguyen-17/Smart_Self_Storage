// API check-in, đổi ô, thu phạt và gia hạn tại quầy.

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

// BE tự lọc danh sách theo cơ sở của staff
export async function listCheckinContracts(): Promise<StaffReservationItem[]> {
  const body = await apiClient.get("/staff/reservations")
  return unwrapApiData<StaffReservationItem[]>(body) ?? []
}

export async function lookupContract(
  code: string
): Promise<StaffReservationLookup> {
  const body = await apiClient.get("/staff/reservations/lookup", {
    params: { code },
  })
  return unwrapApiData<StaffReservationLookup>(body)
}

export async function getReservationDetail(
  reservationId: number
): Promise<StaffReservationLookup> {
  const body = await apiClient.get(`/staff/reservations/${reservationId}`)
  return unwrapApiData<StaffReservationLookup>(body)
}

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

export async function calculateRentalPrice(payload: {
  unitTypeId: number
  rentalType: string
  duration: number
}): Promise<{
  success: boolean
  message?: string
  finalRentalAmount: number
  depositAmount: number
  totalInitialPayment: number
}> {
  const body = await apiClient.post("/pricing/calculate", payload)
  return unwrapApiData(body)
}

export async function counterCancel(
  reservationId: number
): Promise<StaffCancelReservationResponse> {
  const body = await apiClient.post(
    `/staff/reservations/${reservationId}/cancel`,
    {}
  )
  return unwrapApiData<StaffCancelReservationResponse>(body)
}

// Gộp phạt UNPAID thành 1 hóa đơn PEN; HĐ vẫn OVERDUE và PIN vẫn khóa cho tới khi gia hạn
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

// Đưa HĐ về ACTIVE và mở lại quyền sinh PIN; BE chặn nếu còn phạt chưa đóng
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

// BE không trả facilityId của staff nên FE gợi ý theo tầng của ô hiện tại, BE sẽ kiểm tra lại khi đổi
export async function fetchAllUnits(): Promise<UnitDetailResponse[]> {
  const body = await apiClient.get("/units")
  return unwrapApiData<UnitDetailResponse[]>(body) ?? []
}

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

// Mã PIN mở cổng của staff, xoay vòng mỗi 15 giây
export async function fetchStaffGatePin(): Promise<StaffGatePinData> {
  const body = await apiClient.get("/staff/gate-pins/live")
  return unwrapApiData<StaffGatePinData>(body)
}

export async function updateCustomerCccd(
  reservationId: number,
  identityNumber: string,
  fullName?: string
): Promise<{ success: boolean; message: string }> {
  const body = await apiClient.put(
    `/staff/reservations/${reservationId}/customer-cccd`,
    { identityNumber, fullName }
  )
  return unwrapApiData<{ success: boolean; message: string }>(body)
}
