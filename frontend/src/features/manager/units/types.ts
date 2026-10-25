// US-13 / US-14: quản lý ô kho tại cơ sở (Facility Manager) và bảo trì.
import type { StorageCondition, UnitDetailResponse } from "@/types"

/** Trạng thái vật lý của ô kho (tách khỏi trạng thái hợp đồng như OVERDUE) */
export type PhysicalUnitStatus =
  | "AVAILABLE"
  | "HOLD"
  | "RESERVED"
  | "OCCUPIED"
  | "UNDER_MAINTENANCE"

/** BE trả cùng DTO với sơ đồ 2D */
export type ManagerUnit = UnitDetailResponse

export interface ManagerUnitFilter {
  floorId?: number
  status?: PhysicalUnitStatus
  storageCondition?: StorageCondition
}

/** Ai đang thao tác, ở cơ sở nào: BE đọc qua header X-Facility-Id, X-Account-Id */
export interface ManagerContext {
  facilityId: number | null
  accountId: number | null
  fullName: string | null
  /** true khi đang chạy dữ liệu mẫu (VITE_USE_MOCK) */
  isDemo: boolean
}
