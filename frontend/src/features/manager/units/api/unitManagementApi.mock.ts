// Dữ liệu mẫu US-13 cho cơ sở HN-01 (3 tầng), dùng khi VITE_USE_MOCK=true.
// Trạng thái dùng bộ chuẩn mới; luật đổi loại kho / bảo trì giống BE để demo đúng hành vi.

import type { Floor } from "@/types"

import { canEndMaintenance, canStartMaintenance, climateCounterpartTypeId, normalizeUnitStatus } from "../unitRules"
import type { ManagerUnit, ManagerUnitFilter } from "../types"

const MOCK_LATENCY_MS = 300

const FLOORS: Floor[] = [
  { floorId: 1, facilityId: 1, floorName: "Tầng Trệt", maxLoadPerM2: 1000, status: "ACTIVE" },
  { floorId: 2, facilityId: 1, floorName: "Tầng 1", maxLoadPerM2: 500, status: "ACTIVE" },
  { floorId: 3, facilityId: 1, floorName: "Tầng 2", maxLoadPerM2: 500, status: "ACTIVE" },
]

const TYPES: Record<number, { typeName: string; dims: [number, number]; climate: boolean; daily: number; monthly: number; deposit: number }> = {
  1: { typeName: "Size S (Tủ cá nhân)", dims: [1, 1], climate: false, daily: 30_000, monthly: 600_000, deposit: 500_000 },
  2: { typeName: "Size M (Phòng vừa)", dims: [1.5, 2], climate: false, daily: 60_000, monthly: 1_200_000, deposit: 1_000_000 },
  3: { typeName: "Size L (Phòng lớn)", dims: [2, 3], climate: false, daily: 120_000, monthly: 2_400_000, deposit: 2_000_000 },
  4: { typeName: "Size XL (Kho doanh nghiệp)", dims: [2.5, 4], climate: false, daily: 200_000, monthly: 4_000_000, deposit: 3_000_000 },
  5: { typeName: "Size M - Climate (Kho mát VIP)", dims: [1.5, 2], climate: true, daily: 72_000, monthly: 1_440_000, deposit: 1_000_000 },
  6: { typeName: "Size L - Climate (Kho mát VIP)", dims: [2, 3], climate: true, daily: 144_000, monthly: 2_880_000, deposit: 2_000_000 },
  7: { typeName: "Size XL - Climate (Kho mát VIP)", dims: [2.5, 4], climate: true, daily: 240_000, monthly: 4_800_000, deposit: 3_000_000 },
}

// [mã ô, tầng, loại kho, trạng thái]
const SEED: [string, number, number, string][] = [
  ["HN01-G-XL01", 1, 4, "AVAILABLE"], ["HN01-G-XL02", 1, 4, "OCCUPIED"], ["HN01-G-XL03", 1, 4, "RESERVED"],
  ["HN01-G-XL04", 1, 4, "AVAILABLE"], ["HN01-G-XL05", 1, 4, "UNDER_MAINTENANCE"], ["HN01-G-XL06", 1, 7, "AVAILABLE"],
  ["HN01-F1-S01", 2, 1, "AVAILABLE"], ["HN01-F1-S02", 2, 1, "HOLD"], ["HN01-F1-S03", 2, 1, "OCCUPIED"],
  ["HN01-F1-M01", 2, 2, "AVAILABLE"], ["HN01-F1-M02", 2, 2, "OCCUPIED"], ["HN01-F1-M03", 2, 5, "AVAILABLE"],
  ["HN01-F1-L01", 2, 3, "AVAILABLE"], ["HN01-F1-L02", 2, 6, "RESERVED"],
  ["HN01-F2-S01", 3, 1, "AVAILABLE"], ["HN01-F2-M01", 3, 2, "UNDER_MAINTENANCE"], ["HN01-F2-L01", 3, 3, "OCCUPIED"],
]

function buildUnit([unitCode, floorId, unitTypeId, status]: [string, number, number, string], index: number): ManagerUnit {
  const t = TYPES[unitTypeId]
  const floor = FLOORS.find((f) => f.floorId === floorId)!
  return {
    unitId: index + 1,
    unitCode,
    floorId,
    floorName: floor.floorName,
    unitTypeId,
    typeName: t.typeName,
    size: `${t.dims[0]}m x ${t.dims[1]}m x 2m`,
    lengthM: t.dims[1],
    widthM: t.dims[0],
    heightM: 2,
    areaM2: t.dims[0] * t.dims[1],
    maxLoadKgM2: floor.maxLoadPerM2,
    storageCondition: t.climate ? "CLIMATE_CONTROLLED" : "NORMAL",
    isClimate: t.climate,
    dailyPrice: t.daily,
    monthlyPrice: t.monthly,
    depositAmount: t.deposit,
    climateSurchargePercent: t.climate ? 20 : 0,
    status: status as ManagerUnit["status"],
  }
}

let store: ManagerUnit[] = SEED.map(buildUnit)

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), MOCK_LATENCY_MS))
}
function fail(message: string): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), MOCK_LATENCY_MS))
}

export function mockGetManagerFloors(): Promise<Floor[]> {
  return delay(FLOORS)
}

export function mockGetManagerUnits(filter: ManagerUnitFilter): Promise<ManagerUnit[]> {
  return delay(
    store
      .filter((u) => !filter.floorId || u.floorId === filter.floorId)
      .filter((u) => !filter.status || normalizeUnitStatus(u.status) === filter.status)
      .filter((u) => !filter.storageCondition || u.storageCondition === filter.storageCondition)
  )
}

export function mockChangeUnitType(unitCode: string, unitTypeId: number): Promise<ManagerUnit> {
  const index = store.findIndex((u) => u.unitCode === unitCode)
  if (index < 0) return fail(`Không tìm thấy ô kho: ${unitCode}`)
  const unit = store[index]
  if (normalizeUnitStatus(unit.status) !== "AVAILABLE") {
    return fail(`Chỉ được đổi loại kho khi ô đang trống! Trạng thái hiện tại: ${unit.status}`)
  }
  if (climateCounterpartTypeId(unit.unitTypeId) !== unitTypeId) {
    return fail("Chỉ được chuyển đổi giữa Kho Thường và Kho Điều Hòa cùng Size.")
  }
  store[index] = { ...buildUnit([unit.unitCode, unit.floorId, unitTypeId, unit.status], index), unitId: unit.unitId }
  return delay(store[index])
}

export function mockStartMaintenance(unitCode: string): Promise<ManagerUnit> {
  const index = store.findIndex((u) => u.unitCode === unitCode)
  if (index < 0) return fail(`Không tìm thấy ô kho: ${unitCode}`)
  if (!canStartMaintenance(store[index].status)) {
    return fail(`Không thể đưa vào bảo trì khi ô kho đang có khách đặt hoặc đang thuê! Trạng thái: ${store[index].status}`)
  }
  store[index] = { ...store[index], status: "UNDER_MAINTENANCE" as ManagerUnit["status"] }
  return delay(store[index])
}

export function mockEndMaintenance(unitCode: string): Promise<ManagerUnit> {
  const index = store.findIndex((u) => u.unitCode === unitCode)
  if (index < 0) return fail(`Không tìm thấy ô kho: ${unitCode}`)
  if (!canEndMaintenance(store[index].status)) {
    return fail(`Chỉ có thể nghiệm thu ô kho đang ở trạng thái bảo trì (MAINTENANCE)! Trạng thái hiện tại: ${store[index].status}`)
  }
  store[index] = { ...store[index], status: "AVAILABLE" as ManagerUnit["status"] }
  return delay(store[index])
}

/** Chỉ dùng trong test: đưa dữ liệu mẫu về ban đầu */
export function resetManagerUnitsMock() {
  store = SEED.map(buildUnit)
}
