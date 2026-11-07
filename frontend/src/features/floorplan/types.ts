// Định nghĩa sơ đồ kho 2D khớp DTO backend.
import type {
  Facility,
  Floor,
  StorageCondition,
  UnitDetailResponse,
} from "@/types"

export type { Facility, Floor, StorageCondition, UnitDetailResponse }

export type UnitSize = "S" | "M" | "L" | "XL"

export type SizeFilter = "ALL" | UnitSize
export type ClimateFilter = "ALL" | StorageCondition

/** 4 nhóm màu trạng thái hiển thị trên sơ đồ */
export type StatusGroup = "AVAILABLE" | "HOLD" | "RESERVED" | "RENTED" | "MAINTENANCE"

export interface UnitQuery {
  facilityId: number
  floorId: number
  storageCondition?: StorageCondition
}
