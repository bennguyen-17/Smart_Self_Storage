// Dữ liệu mẫu cho US-03, bám theo seed của database/db-script.sql
// (7 cơ sở, 18 tầng, 6 loại kho, bảng giá). Dùng khi VITE_USE_MOCK=true.

import type {
  Facility,
  Floor,
  StorageCondition,
  UnitDetailResponse,
  UnitQuery,
} from "../types"

const MOCK_LATENCY_MS = 350

const FACILITIES: Facility[] = [
  {
    facilityId: 1,
    facilityCode: "HN-01",
    shortCode: "CG",
    facilityName: "SmartStorage Cầu Giấy (HN-01)",
    address: "Số 391 Cầu Giấy, Q. Cầu Giấy, Hà Nội",
    phone: "02439100001",
    floorCount: 3,
    layoutType: "A",
    isAllClimate: false,
    status: "ACTIVE",
  },
  {
    facilityId: 2,
    facilityCode: "HN-02",
    shortCode: "TX",
    facilityName: "SmartStorage Thanh Xuân (HN-02)",
    address: "Số 120 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội",
    phone: "02439100002",
    floorCount: 3,
    layoutType: "B",
    isAllClimate: false,
    status: "ACTIVE",
  },
  {
    facilityId: 3,
    facilityCode: "HCM-01",
    shortCode: "Q1",
    facilityName: "SmartStorage Quận 1 (HCM-01)",
    address: "Số 123 Nguyễn Huệ, Quận 1, TP.HCM",
    phone: "02839100001",
    floorCount: 3,
    layoutType: "A",
    isAllClimate: true,
    status: "ACTIVE",
  },
  {
    facilityId: 4,
    facilityCode: "HCM-02",
    shortCode: "Q7",
    facilityName: "SmartStorage Quận 7 (HCM-02)",
    address: "Số 456 Nguyễn Thị Thập, Quận 7, TP.HCM",
    phone: "02839100002",
    floorCount: 2,
    layoutType: "B",
    isAllClimate: false,
    status: "ACTIVE",
  },
  {
    facilityId: 5,
    facilityCode: "HCM-03",
    shortCode: "TD",
    facilityName: "SmartStorage Thủ Đức (HCM-03)",
    address: "Số 789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM",
    phone: "02839100003",
    floorCount: 3,
    layoutType: "B",
    isAllClimate: false,
    status: "ACTIVE",
  },
  {
    facilityId: 6,
    facilityCode: "DN-01",
    shortCode: "HC",
    facilityName: "SmartStorage Hải Châu (DN-01)",
    address: "Số 68 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng",
    phone: "02369100001",
    floorCount: 2,
    layoutType: "A",
    isAllClimate: false,
    status: "ACTIVE",
  },
  {
    facilityId: 7,
    facilityCode: "CT-01",
    shortCode: "NK",
    facilityName: "SmartStorage Ninh Kiều (CT-01)",
    address: "Số 12 Đại lộ Hòa Bình, Q. Ninh Kiều, Cần Thơ",
    phone: "02929100001",
    floorCount: 2,
    layoutType: "B",
    isAllClimate: false,
    status: "ACTIVE",
  },
]

const FLOORS: Floor[] = [
  [1, 1, "Tầng Trệt (Sảnh & Kho XL)", 1500],
  [2, 1, "Tầng 1 (Kho S, M, L)", 500],
  [3, 1, "Tầng 2 (Kho S, M, L)", 500],
  [4, 2, "Tầng Trệt (Logistics Mặt tiền)", 2000],
  [5, 2, "Tầng 1", 1000],
  [6, 2, "Tầng 2", 800],
  [7, 3, "Tầng Trệt (Sảnh VIP & Kho Mát)", 1200],
  [8, 3, "Tầng 1 (Kho Mát VIP)", 600],
  [9, 3, "Tầng 2 (Kho Mát VIP)", 600],
  [10, 4, "Tầng Trệt (Kho Pallet Cảng)", 2500],
  [11, 4, "Tầng 1 (Kho Hàng E-Commerce)", 1000],
  [12, 5, "Tầng Trệt (Grid Matrix Hub)", 2000],
  [13, 5, "Tầng 1", 1000],
  [14, 5, "Tầng 2", 800],
  [15, 6, "Tầng Trệt (Đồ Homestay/Nội Thất)", 1000],
  [16, 6, "Tầng 1 (Tủ Du Lịch Vali S)", 400],
  [17, 7, "Tầng Trệt (Kho Hàng Nông Sản Mẫu)", 1500],
  [18, 7, "Tầng 1 (Tủ Cá Nhân Sinh Viên/Hồ Sơ)", 400],
].map(([floorId, facilityId, floorName, maxLoadPerM2]) => ({
  floorId: floorId as number,
  facilityId: facilityId as number,
  floorName: floorName as string,
  maxLoadPerM2: maxLoadPerM2 as number,
  status: "ACTIVE" as const,
}))

interface MockUnitType {
  unitTypeId: number
  typeName: string
  sizeCode: "S" | "M" | "L" | "XL"
  dims: [number, number, number]
  storageCondition: StorageCondition
  dailyPrice: number
  monthlyPrice: number
  depositAmount: number
  climateSurchargePercent: number
}

// Giá lấy theo bảng Price trong seed DB. FE chỉ hiển thị, không tự tính.
const UNIT_TYPES: Record<number, MockUnitType> = {
  1: {
    unitTypeId: 1,
    typeName: "Size S (Locker mini)",
    sizeCode: "S",
    dims: [1, 1, 2],
    storageCondition: "NORMAL",
    dailyPrice: 50_000,
    monthlyPrice: 800_000,
    depositAmount: 800_000,
    climateSurchargePercent: 0,
  },
  2: {
    unitTypeId: 2,
    typeName: "Size M (Phòng vừa)",
    sizeCode: "M",
    dims: [2, 1.5, 2],
    storageCondition: "NORMAL",
    dailyPrice: 120_000,
    monthlyPrice: 2_000_000,
    depositAmount: 2_000_000,
    climateSurchargePercent: 0,
  },
  3: {
    unitTypeId: 3,
    typeName: "Size L (Phòng lớn)",
    sizeCode: "L",
    dims: [3, 2, 2],
    storageCondition: "NORMAL",
    dailyPrice: 220_000,
    monthlyPrice: 3_800_000,
    depositAmount: 3_800_000,
    climateSurchargePercent: 0,
  },
  4: {
    unitTypeId: 4,
    typeName: "Size XL (Kho doanh nghiệp)",
    sizeCode: "XL",
    dims: [4, 2.5, 2],
    storageCondition: "NORMAL",
    dailyPrice: 450_000,
    monthlyPrice: 7_500_000,
    depositAmount: 7_500_000,
    climateSurchargePercent: 0,
  },
  5: {
    unitTypeId: 5,
    typeName: "Size M - Climate (Kho mát VIP)",
    sizeCode: "M",
    dims: [2, 1.5, 2],
    storageCondition: "CLIMATE_CONTROLLED",
    dailyPrice: 150_000,
    monthlyPrice: 2_400_000,
    depositAmount: 2_400_000,
    climateSurchargePercent: 20,
  },
  6: {
    unitTypeId: 6,
    typeName: "Size L - Climate (Kho mát VIP)",
    sizeCode: "L",
    dims: [3, 2, 2],
    storageCondition: "CLIMATE_CONTROLLED",
    dailyPrice: 270_000,
    monthlyPrice: 4_500_000,
    depositAmount: 4_500_000,
    climateSurchargePercent: 20,
  },
}

// Vòng trạng thái để mỗi tầng có đủ 4 màu
const STATUS_CYCLE = [
  "AVAILABLE",
  "AVAILABLE",
  "RENTED",
  "AVAILABLE",
  "HOLD",
  "AVAILABLE",
  "MAINTENANCE",
  "AVAILABLE",
  "RENTED",
  "AVAILABLE",
  "OVERDUE",
  "AVAILABLE",
] as const

/** Số ô theo loại kho cho từng tầng: [unitTypeId, số lượng][] */
function floorComposition(
  floor: Floor,
  facility: Facility
): [number, number][] {
  const isGround = floor.floorName.toLowerCase().includes("trệt")
  if (facility.isAllClimate)
    return isGround
      ? [[6, 6]]
      : [
          [5, 6],
          [6, 4],
        ]
  if (isGround) return [[4, 6]]
  return [
    [1, 8],
    [2, 5],
    [5, 2],
    [3, 3],
  ]
}

function buildUnits(floor: Floor): UnitDetailResponse[] {
  const facility = FACILITIES.find((f) => f.facilityId === floor.facilityId)!
  const floorPrefix = floor.floorName.toLowerCase().includes("trệt")
    ? "G"
    : (/\d/.exec(floor.floorName)?.[0] ?? "1")
  const facCode = facility.facilityCode.replace("-", "")
  const counters: Record<string, number> = {}
  let index = 0

  return floorComposition(floor, facility).flatMap(([typeId, count]) =>
    Array.from({ length: count }, () => {
      const type = UNIT_TYPES[typeId]
      counters[type.sizeCode] = (counters[type.sizeCode] ?? 0) + 1
      const status = STATUS_CYCLE[(index + floor.floorId) % STATUS_CYCLE.length]
      const [lengthM, widthM, heightM] = type.dims
      const unitId = floor.floorId * 100 + index++
      return {
        unitId,
        unitCode: `${facCode}-${floorPrefix}-${type.sizeCode}${String(counters[type.sizeCode]).padStart(2, "0")}`,
        floorId: floor.floorId,
        floorName: floor.floorName,
        unitTypeId: type.unitTypeId,
        typeName: type.typeName,
        size: `${lengthM}m x ${widthM}m x ${heightM}m`,
        lengthM,
        widthM,
        heightM,
        areaM2: lengthM * widthM,
        maxLoadKgM2: floor.maxLoadPerM2,
        storageCondition: type.storageCondition,
        isClimate: type.storageCondition === "CLIMATE_CONTROLLED",
        dailyPrice: type.dailyPrice,
        monthlyPrice: type.monthlyPrice,
        depositAmount: type.depositAmount,
        climateSurchargePercent: type.climateSurchargePercent,
        status,
        holdExpiresAt:
          status === "HOLD"
            ? new Date(Date.now() + 3 * 60_000).toISOString()
            : undefined,
      }
    })
  )
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(structuredClone(value)), MOCK_LATENCY_MS)
  )
}

export function mockGetFacilities(): Promise<Facility[]> {
  return delay(FACILITIES)
}

export function mockGetFloors(facilityId: number): Promise<Floor[]> {
  return delay(FLOORS.filter((f) => f.facilityId === facilityId))
}

export function mockGetUnits(query: UnitQuery): Promise<UnitDetailResponse[]> {
  const floor = FLOORS.find(
    (f) => f.floorId === query.floorId && f.facilityId === query.facilityId
  )
  const units = floor ? buildUnits(floor) : []
  return delay(
    units.filter(
      (u) =>
        !query.storageCondition || u.storageCondition === query.storageCondition
    )
  )
}
