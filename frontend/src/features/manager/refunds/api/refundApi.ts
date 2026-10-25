// Hoàn tiền cho khách do Manager xác nhận (BR-35, US-26).
// Đã kết nối API B1: /api/manager/refunds và /api/manager/refunds/{paymentId}/confirm


import { unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"

import type { ConfirmRefundPayload, ManagerRefund, RefundState } from "../types"

export const REFUND_LIST_PATH = "/manager/refunds"

/** Trạng thái phiếu hoàn: PENDING | REFUNDED | ALL */
const STATUS_PARAM: Record<RefundState | "ALL", string> = {
  PENDING: "PENDING",
  REFUNDED: "REFUNDED",
  ALL: "ALL",
}

/** GET danh sách phiếu hoàn (REF) theo trạng thái, tự động lọc theo X-Facility-Id qua apiClient */
export async function listRefunds(state: RefundState | "ALL"): Promise<ManagerRefund[]> {
  const body = await apiClient.get(REFUND_LIST_PATH, { params: { status: STATUS_PARAM[state] } })
  return unwrapApiData<ManagerRefund[]>(body) ?? []
}

/** Xác nhận đã chuyển khoản hoàn tiền, kèm biên lai (POST /api/manager/refunds/{paymentId}/confirm) */
export async function confirmRefund(paymentId: number, payload: ConfirmRefundPayload): Promise<void> {
  const body: ConfirmRefundPayload = { evidenceUrl: payload.evidenceUrl.trim() }
  const ref = payload.transactionRef?.trim()
  if (ref) body.transactionRef = ref

  await apiClient.post(`/manager/refunds/${paymentId}/confirm`, body)
}
