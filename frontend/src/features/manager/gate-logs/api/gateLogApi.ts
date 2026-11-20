// BE tự xác định cơ sở của Manager từ JWT

import { unwrapApiData } from "@/lib/api"
import apiClient, { isMockMode } from "@/lib/apiClient"

import type { GateLog } from "../types"
import { mockListManualGateOpenLogs } from "./gateLogApi.mock"

export const MANUAL_GATE_OPEN_LOGS_PATH = "/manager/gate-logs"

export async function listManualGateOpenLogs(): Promise<GateLog[]> {
  if (isMockMode()) return mockListManualGateOpenLogs()
  const body = await apiClient.get(MANUAL_GATE_OPEN_LOGS_PATH)
  return unwrapApiData<GateLog[]>(body) ?? []
}
