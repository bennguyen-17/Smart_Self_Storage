// Lấy cơ sở từ phiên đăng nhập; thiếu facilityId trả null để UI báo lỗi, chỉ chế độ mock mới dùng cơ sở mẫu

import { getStoredUser } from "@/hooks/useAuthSession"
import { isMockMode } from "@/lib/apiClient"

import type { ManagerContext } from "./units/types"
export type { ManagerContext }

export const DEMO_FACILITY_ID = 1

function toId(value: unknown): number | null {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}

export class MissingFacilityError extends Error {
  constructor() {
    super("Tài khoản quản lý chưa được gắn cơ sở, nên chưa xem được dữ liệu. Vui lòng liên hệ quản trị hệ thống.")
    this.name = "MissingFacilityError"
  }
}

export function managerHeaders(ctx: ManagerContext): Record<string, string> {
  if (ctx.facilityId === null) throw new MissingFacilityError()
  const headers: Record<string, string> = { "X-Facility-Id": String(ctx.facilityId) }
  if (ctx.accountId !== null) headers["X-Account-Id"] = String(ctx.accountId)
  return headers
}

export function getManagerContext(): ManagerContext {
  const user = getStoredUser()
  const isDemo = isMockMode()
  const facilityId = toId(user?.facilityId) ?? (isDemo ? DEMO_FACILITY_ID : null)
  return {
    facilityId,
    accountId: toId(user?.id ?? user?.accountId),
    fullName: user?.fullName ?? null,
    isDemo,
  }
}
