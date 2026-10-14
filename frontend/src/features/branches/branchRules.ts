// Admin › Chi nhánh: phân vùng và lọc danh sách cơ sở. Hàm thuần, kiểm bằng bảng DDT.

import { matchesQuery } from "@/features/internal-shell/textSearch"
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

/** Vùng lấy theo tiền tố mã cơ sở: "HCM-02" → HCM */
export function regionOf(facilityCode: string): Region {
  const prefix = facilityCode.trim().toUpperCase().split("-")[0]
  return prefix === "HN" || prefix === "HCM" || prefix === "DN" || prefix === "CT" ? prefix : "OTHER"
}

export interface BranchFilter {
  query: string
  region: Region | "ALL"
  status: FacilityStatus | "ALL"
}

/** Lọc theo từ khóa (mã, tên, địa chỉ, SĐT), vùng, trạng thái; giữ thứ tự theo mã cơ sở */
export function filterBranches(list: readonly Facility[], filter: BranchFilter): Facility[] {
  return list
    .filter((f) => filter.region === "ALL" || regionOf(f.facilityCode) === filter.region)
    .filter((f) => filter.status === "ALL" || f.status === filter.status)
    .filter((f) => matchesQuery(filter.query, [f.facilityCode, f.facilityName, f.address, f.phone]))
    .sort((a, b) => a.facilityCode.localeCompare(b.facilityCode))
}
