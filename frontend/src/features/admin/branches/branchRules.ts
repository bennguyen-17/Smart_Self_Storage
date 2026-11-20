import { matchesQuery } from "@/components/internal/textSearch"
import type { Facility, FacilityStatus } from "@/types"

export type Region = "HN" | "HCM" | "DN" | "CT" | "OTHER"

export const REGION_LABEL: Record<Region, string> = {
  HN: "Hà Nội",
  HCM: "TP. Hồ Chí Minh",
  DN: "Đà Nẵng",
  CT: "Cần Thơ",
  OTHER: "Khác",
}

export const FACILITY_STATUS_LABEL: Record<FacilityStatus, string> = {
  ACTIVE: "Đang hoạt động",
  MAINTENANCE: "Đang bảo trì",
  INACTIVE: "Tạm ngưng",
}

// Xác định khu vực theo tiền tố mã cơ sở (vd: HCM-02 -> HCM)
export function regionOf(facilityCode: string): Region {
  const norm = facilityCode.trim().toUpperCase().replace("-", "")
  if (norm.startsWith("HCM")) return "HCM"
  if (norm.startsWith("HN")) return "HN"
  if (norm.startsWith("DN")) return "DN"
  if (norm.startsWith("CT")) return "CT"
  return "OTHER"
}

export interface BranchFilter {
  query: string
  region: Region | "ALL"
  status: FacilityStatus | "ALL"
}

export function filterBranches(list: readonly Facility[], filter: BranchFilter): Facility[] {
  return list
    .filter((f) => filter.region === "ALL" || regionOf(f.facilityCode) === filter.region)
    .filter((f) => filter.status === "ALL" || f.status === filter.status)
    .filter((f) => matchesQuery(filter.query, [f.facilityCode, f.facilityName, f.address, f.phone]))
    .sort((a, b) => a.facilityCode.localeCompare(b.facilityCode))
}
