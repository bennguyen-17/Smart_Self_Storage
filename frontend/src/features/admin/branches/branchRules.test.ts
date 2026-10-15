import { describe, expect, test } from "vitest"

import type { Facility } from "@/types"

import { filterBranches, regionOf, type BranchFilter } from "./branchRules"

describe("regionOf: vùng theo tiền tố mã cơ sở", () => {
  test.each([
    { code: "HN-01", expected: "HN" },
    { code: "hcm-02", expected: "HCM" },
    { code: " DN-01 ", expected: "DN" },
    { code: "CT-01", expected: "CT" },
    { code: "HP-01", expected: "OTHER" },
    { code: "", expected: "OTHER" },
  ])("$code → $expected", ({ code, expected }) => {
    expect(regionOf(code)).toBe(expected)
  })
})

function facility(facilityId: number, facilityCode: string, facilityName: string, patch: Partial<Facility> = {}): Facility {
  return {
    facilityId,
    facilityCode,
    shortCode: "",
    facilityName,
    address: "",
    phone: "",
    floorCount: 3,
    layoutType: "A",
    isAllClimate: false,
    status: "ACTIVE",
    ...patch,
  }
}

const LIST = [
  facility(3, "HCM-01", "SmartStorage Quận 1", { address: "Số 123 Nguyễn Huệ, Quận 1" }),
  facility(1, "HN-01", "SmartStorage Cầu Giấy", { phone: "02439100001" }),
  facility(2, "HN-02", "SmartStorage Thanh Xuân", { status: "MAINTENANCE" }),
  facility(6, "DN-01", "SmartStorage Hải Châu"),
]
const ALL: BranchFilter = { query: "", region: "ALL", status: "ALL" }
const codes = (f: BranchFilter) => filterBranches(LIST, f).map((x) => x.facilityCode)

describe("filterBranches", () => {
  test.each([
    { name: "không lọc → sắp theo mã", filter: ALL, expected: ["DN-01", "HCM-01", "HN-01", "HN-02"] },
    { name: "vùng Hà Nội", filter: { ...ALL, region: "HN" }, expected: ["HN-01", "HN-02"] },
    { name: "đang bảo trì", filter: { ...ALL, status: "MAINTENANCE" }, expected: ["HN-02"] },
    { name: "tên không dấu", filter: { ...ALL, query: "cau giay" }, expected: ["HN-01"] },
    { name: "theo địa chỉ", filter: { ...ALL, query: "nguyễn huệ" }, expected: ["HCM-01"] },
    { name: "theo SĐT", filter: { ...ALL, query: "0243910" }, expected: ["HN-01"] },
    { name: "kết hợp không khớp", filter: { ...ALL, region: "DN", status: "MAINTENANCE" }, expected: [] },
  ] as { name: string; filter: BranchFilter; expected: string[] }[])("$name", ({ filter, expected }) => {
    expect(codes(filter)).toEqual(expected)
  })
})
