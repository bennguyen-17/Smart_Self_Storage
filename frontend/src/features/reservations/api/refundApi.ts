// US-26: API hoàn tiền cọc back-office (Staff).
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.
// BE ghi nhận nhân viên xác nhận qua header X-Account-Id (gắn ở đây, component không cần biết).

import { getStoredUser } from "@/hooks/useAuthSession"
import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"

import type { RefundItem } from "../types"
import { mockConfirmRefundPayment, mockListPendingRefunds } from "./reservationApi.mock"

export interface ConfirmRefundPayload {
  /** Link biên lai chuyển khoản (BE lưu tối đa 255 ký tự) */
  evidenceUrl: string
  /** Mã giao dịch ngân hàng, tùy chọn */
  transactionRef?: string
}

function accountHeader(): Record<string, string> {
  const id = Number(getStoredUser()?.id)
  return Number.isInteger(id) && id > 0 ? { "X-Account-Id": String(id) } : {}
}

/** GET /api/staff/refunds?status=PENDING: các phiếu hoàn cọc đang chờ chuyển khoản */
export async function listPendingRefunds(): Promise<RefundItem[]> {
  if (isMockMode()) return mockListPendingRefunds()
  const body = await apiClient.get("/staff/refunds", { params: { status: "PENDING" } })
  return unwrapApiData<RefundItem[]>(body) ?? []
}

/** POST /api/staff/settlements/{paymentId}/confirm-refund  body { evidenceUrl, transactionRef? } */
export async function confirmRefundPayment(
  paymentId: number,
  payload: ConfirmRefundPayload
): Promise<void> {
  const body: ConfirmRefundPayload = { evidenceUrl: payload.evidenceUrl.trim() }
  const ref = payload.transactionRef?.trim()
  if (ref) body.transactionRef = ref

  if (isMockMode()) {
    await mockConfirmRefundPayment(paymentId, { ...body, staffName: getStoredUser()?.fullName ?? null })
    return
  }
  await apiClient.post(`/staff/settlements/${paymentId}/confirm-refund`, body, {
    headers: accountHeader(),
  })
}
