// US-18: API nhật ký mở cổng thủ công cho Manager.
// VITE_USE_MOCK=true → mock; false → BE. Không tự fallback về mock khi lỗi.
// BE xác định cơ sở của Manager từ JWT (không cần header), chỉ trả log của cơ sở đó.

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"

import type { GateLog } from "../types"
import { mockListManualGateOpenLogs } from "./gateLogApi.mock"

/**
 * Path hiện tại của BE bị lồng tiền tố controller (/api/staff/audit-logs + /manager/audit-logs/…).
 * Đã báo nhóm BE (qa-log); khi BE sửa thành /manager/audit-logs/manual-gate-open thì chỉ cần đổi hằng này.
 */
export const MANUAL_GATE_OPEN_LOGS_PATH = "/staff/audit-logs/manager/audit-logs/manual-gate-open"

/** GET nhật ký mở cổng thủ công của cơ sở Manager đang phụ trách (chỉ đọc) */
export async function listManualGateOpenLogs(): Promise<GateLog[]> {
  if (isMockMode()) return mockListManualGateOpenLogs()
  const body = await apiClient.get(MANUAL_GATE_OPEN_LOGS_PATH)
  return unwrapApiData<GateLog[]>(body) ?? []
}
