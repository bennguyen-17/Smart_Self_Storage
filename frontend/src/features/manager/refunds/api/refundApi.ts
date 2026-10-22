// Hoàn tiền cho khách do Manager xác nhận (BR-35, US-26).
// TẠM gọi API của Staff đang có, vì BE chưa có /api/manager/refunds (đề xuất B1 trong
// plans/261022-manager-admin-sprint3/viec-cho-be-va-fe-khac.md). Lưu ý: API tạm CHƯA lọc theo cơ sở.
// BE xong B1 thì chỉ đổi 2 hằng số đường dẫn và tham số trạng thái bên dưới.

import { confirmRefundPayment, type ConfirmRefundPayload } from "@/features/staff/reservations/api/refundApi"
import { unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"

import type { ManagerRefund, RefundState } from "../types"

export const REFUND_LIST_PATH = "/staff/refunds"

/** BE tạm: phiếu đã hoàn có trạng thái PAID; API đề xuất dùng REFUNDED */
const STATUS_PARAM: Record<RefundState | "ALL", string> = {
  PENDING: "PENDING",
  REFUNDED: "PAID",
  ALL: "ALL",
}

/** GET danh sách phiếu hoàn (REF) theo trạng thái */
export async function listRefunds(state: RefundState | "ALL"): Promise<ManagerRefund[]> {
  const body = await apiClient.get(REFUND_LIST_PATH, { params: { status: STATUS_PARAM[state] } })
  return unwrapApiData<ManagerRefund[]>(body) ?? []
}

/** Xác nhận đã chuyển khoản hoàn tiền, kèm biên lai (POST …/confirm-refund, gửi kèm X-Account-Id) */
export async function confirmRefund(paymentId: number, payload: ConfirmRefundPayload): Promise<void> {
  await confirmRefundPayment(paymentId, payload)
}
