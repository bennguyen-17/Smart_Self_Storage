import { unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"

import type { ConfirmRefundPayload, ManagerRefund, RefundState } from "../types"

export const REFUND_LIST_PATH = "/manager/refunds"

const STATUS_PARAM: Record<RefundState | "ALL", string> = {
  PENDING: "PENDING",
  REFUNDED: "REFUNDED",
  ALL: "ALL",
}

export async function listRefunds(state: RefundState | "ALL"): Promise<ManagerRefund[]> {
  const body = await apiClient.get(REFUND_LIST_PATH, { params: { status: STATUS_PARAM[state] } })
  return unwrapApiData<ManagerRefund[]>(body) ?? []
}

export async function confirmRefund(paymentId: number, payload: ConfirmRefundPayload): Promise<void> {
  const body: ConfirmRefundPayload = {}
  if (payload.receiptImageId) body.receiptImageId = payload.receiptImageId
  const link = payload.evidenceUrl?.trim()
  if (link) body.evidenceUrl = link
  const ref = payload.transactionRef?.trim()
  if (ref) body.transactionRef = ref

  await apiClient.post(`/manager/refunds/${paymentId}/confirm`, body)
}
