import type { StorageCondition, UnitDetailResponse } from "@/types"

// Trạng thái vật lý của ô (tách khỏi trạng thái hợp đồng như OVERDUE)
export type PhysicalUnitStatus =
  | "AVAILABLE"
  | "HOLD"
  | "RESERVED"
  | "OCCUPIED"
  | "UNDER_MAINTENANCE"

export type ManagerUnit = UnitDetailResponse

export interface ManagerUnitFilter {
  floorId?: number
  status?: PhysicalUnitStatus
  storageCondition?: StorageCondition
}

// Gửi kèm qua header X-Facility-Id và X-Account-Id
export interface ManagerContext {
  facilityId: number | null
  accountId: number | null
  fullName: string | null
  isDemo: boolean
}
