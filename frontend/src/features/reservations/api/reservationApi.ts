// US-06: API quản lý đơn đặt cọc & No-Show.
// VITE_USE_MOCK=true → dùng mock; false → gọi backend. Không tự fallback về mock khi lỗi.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"

import type {
  NoShowScanResult,
  PageResponse,
  Reservation,
  ReservationFilter,
} from "../types"
import {
  mockGetReservation,
  mockListReservations,
  mockRunNoShowScan,
} from "./reservationApi.mock"

/** GET /api/reservations?status&reason&page&size (Staff/Manager, BE lọc theo cơ sở được phân quyền) */
export async function listReservations(
  filter: ReservationFilter
): Promise<PageResponse<Reservation>> {
  if (isMockMode()) return mockListReservations(filter)
  const body = await apiClient.get("/reservations", { params: filter })
  return unwrapApiData<PageResponse<Reservation>>(body)
}

/** GET /api/reservations/{code} */
export async function getReservation(code: string): Promise<Reservation> {
  if (isMockMode()) return mockGetReservation(code)
  const body = await apiClient.get(`/reservations/${encodeURIComponent(code)}`)
  return unwrapApiData<Reservation>(body)
}

/** POST /api/admin/jobs/no-show-scan (chỉ ADMIN + profile dev/demo): chạy tay cron BR-13 */
export async function runNoShowScan(): Promise<NoShowScanResult> {
  if (isMockMode()) return mockRunNoShowScan()
  const body = await apiClient.post("/admin/jobs/no-show-scan")
  return unwrapApiData<NoShowScanResult>(body)
}
