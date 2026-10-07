// Mock cho US-16, dùng khi VITE_USE_MOCK=true (backend chưa có API check-in).
// Dữ liệu bám sát prototype staff.html (tab CHECK-IN) để demo đủ Acceptance Criteria.

import { addDays, todayInVietnam } from "@/lib/format"

import { STAFF_FACILITY } from "../constants"
import type {
  CheckinContract,
  CheckinFilter,
  ChangeUnitRequest,
  CounterCancelResult,
  PageResponse,
} from "../types"
import { CheckinApiError } from "../types"

const MOCK_LATENCY_MS = 400

type Seed = Omit<CheckinContract, "remainingAmount">

function withRemaining(seed: Seed): CheckinContract {
  return {
    ...seed,
    remainingAmount: seed.rentalAmount + seed.depositAmount - seed.paidAmount,
  }
}

const today = todayInVietnam()

const SEEDS: Seed[] = [
  // Cơ sở của Staff (HN-01) — chờ check-in
  {
    code: "RES-CG-8899-K7X2",
    customerName: "Nguyễn Văn Khách",
    customerPhone: "0988 123 719",
    email: "khach.demo@swp391.vn",
    cccd: "001098004719",
    facilityId: 1,
    facilityCode: "HN-01",
    facilityName: "SmartStorage Cầu Giấy (HN-01)",
    floorId: 3,
    floorName: "Tầng 2",
    unitCode: "F2-M205",
    unitTypeId: 2,
    unitTypeName: "Size M (Phòng vừa)",
    sizeLabel: "Size M (3m²)",
    areaM2: 3,
    storageCondition: "NORMAL",
    rentalType: "MONTHLY",
    startDate: today,
    endDate: addDays(today, 30),
    checkinDate: today,
    invoiceNumber: "DEP-HN01-20261006-4719",
    rentalAmount: 2_000_000,
    depositAmount: 2_000_000,
    paidAmount: 2_000_000,
    status: "PENDING_CHECKIN",
  },
  {
    code: "RES-CG-9900-M12",
    customerName: "Phạm Minh Hoàng",
    customerPhone: "0909 555 246",
    email: "hoang.pham@swp391.vn",
    cccd: "001096003344",
    facilityId: 1,
    facilityCode: "HN-01",
    facilityName: "SmartStorage Cầu Giấy (HN-01)",
    floorId: 3,
    floorName: "Tầng 3",
    unitCode: "F3-S301",
    unitTypeId: 1,
    unitTypeName: "Size S (Locker mini)",
    sizeLabel: "Size S (1.5m²)",
    areaM2: 1.5,
    storageCondition: "NORMAL",
    rentalType: "MONTHLY",
    startDate: today,
    endDate: addDays(today, 30),
    checkinDate: today,
    invoiceNumber: "DEP-HN01-20261006-8821",
    rentalAmount: 800_000,
    depositAmount: 800_000,
    paidAmount: 800_000,
    status: "PENDING_CHECKIN",
  },
  // Cơ sở của Staff — đã check-in (đang thuê)
  {
    code: "HD-CG-2026-902",
    customerName: "Trần Thị Bích",
    customerPhone: "0912 777 333",
    email: "bich.tran@swp391.vn",
    cccd: "001197004455",
    facilityId: 1,
    facilityCode: "HN-01",
    facilityName: "SmartStorage Cầu Giấy (HN-01)",
    floorId: 2,
    floorName: "Tầng 1",
    unitCode: "F1-XL104",
    unitTypeId: 4,
    unitTypeName: "Size XL (Kho doanh nghiệp)",
    sizeLabel: "Size XL (10m²)",
    areaM2: 10,
    storageCondition: "NORMAL",
    rentalType: "MONTHLY",
    startDate: addDays(today, -12),
    endDate: addDays(today, 18),
    checkinDate: addDays(today, -12),
    invoiceNumber: "DEP-HN01-20260924-0902",
    rentalAmount: 7_500_000,
    depositAmount: 7_500_000,
    paidAmount: 12_000_000,
    status: "ACTIVE",
    gatePin: "902902",
  },
  // Cơ sở của Staff — quá hạn
  {
    code: "HD-CG-8812",
    customerName: "Lê Văn C",
    customerPhone: "0938 222 111",
    email: "c.le@swp391.vn",
    cccd: "001095006677",
    facilityId: 1,
    facilityCode: "HN-01",
    facilityName: "SmartStorage Cầu Giấy (HN-01)",
    floorId: 2,
    floorName: "Tầng 1",
    unitCode: "F1-M102",
    unitTypeId: 2,
    unitTypeName: "Size M (Phòng vừa)",
    sizeLabel: "Size M (3m²)",
    areaM2: 3,
    storageCondition: "NORMAL",
    rentalType: "MONTHLY",
    startDate: addDays(today, -33),
    endDate: addDays(today, -3),
    checkinDate: addDays(today, -33),
    invoiceNumber: "DEP-HN01-20260903-8812",
    rentalAmount: 2_000_000,
    depositAmount: 2_000_000,
    paidAmount: 2_000_000,
    status: "OVERDUE",
  },
  // Cơ sở của Staff — đã hủy (đã hoàn tiền cọc)
  {
    code: "HD-CG-2026-701",
    customerName: "Vũ Thùy Linh",
    customerPhone: "0977 888 999",
    email: "linh.vu@swp391.vn",
    cccd: "001198005566",
    facilityId: 1,
    facilityCode: "HN-01",
    facilityName: "SmartStorage Cầu Giấy (HN-01)",
    floorId: 3,
    floorName: "Tầng 2",
    unitCode: "F2-L202",
    unitTypeId: 3,
    unitTypeName: "Size L (Phòng lớn)",
    sizeLabel: "Size L (6m²)",
    areaM2: 6,
    storageCondition: "NORMAL",
    rentalType: "MONTHLY",
    startDate: addDays(today, -1),
    endDate: addDays(today, 29),
    checkinDate: addDays(today, -1),
    invoiceNumber: "DEP-HN01-20260930-7010",
    rentalAmount: 3_800_000,
    depositAmount: 3_800_000,
    paidAmount: 3_800_000,
    status: "CANCELED",
  },
  // Cơ sở KHÁC (HN-02) — dùng để test "khác cơ sở → không tìm thấy"
  {
    code: "RES-TX-2211-B8NC",
    customerName: "Võ Thị Hạnh",
    customerPhone: "0977 111 222",
    email: "hanh.vo@swp391.vn",
    cccd: "001302009911",
    facilityId: 2,
    facilityCode: "HN-02",
    facilityName: "SmartStorage Thanh Xuân (HN-02)",
    floorId: 5,
    floorName: "Tầng 1",
    unitCode: "HN02-1-M03",
    unitTypeId: 2,
    unitTypeName: "Size M (Phòng vừa)",
    sizeLabel: "Size M (3m²)",
    areaM2: 3,
    storageCondition: "NORMAL",
    rentalType: "MONTHLY",
    startDate: today,
    endDate: addDays(today, 30),
    checkinDate: today,
    invoiceNumber: "DEP-HN02-20261006-2211",
    rentalAmount: 2_000_000,
    depositAmount: 2_000_000,
    paidAmount: 2_000_000,
    status: "PENDING_CHECKIN",
  },
]

const STATUS_ORDER: Record<string, number> = {
  PENDING_CHECKIN: 0,
  ACTIVE: 1,
  OVERDUE: 2,
  CANCELED: 3,
}

const store: CheckinContract[] = SEEDS.map(withRemaining)

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(structuredClone(value)), MOCK_LATENCY_MS)
  )
}

function fail(code: CheckinApiError["code"], message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new CheckinApiError(code, message)), MOCK_LATENCY_MS)
  )
}

function findIndex(code: string): number {
  const normalized = code.trim().toUpperCase()
  return store.findIndex((c) => c.code.toUpperCase() === normalized)
}

function randomPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** BR-06: chỉ trả hợp đồng thuộc đúng cơ sở của Staff. */
function staffContracts(): CheckinContract[] {
  return store.filter((c) => c.facilityCode === STAFF_FACILITY.facilityCode)
}

export function mockListCheckinContracts(
  filter: CheckinFilter
): Promise<PageResponse<CheckinContract>> {
  const matched = staffContracts()
    .filter((c) => !filter.status || c.status === filter.status)
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        a.code.localeCompare(b.code)
    )
  const start = filter.page * filter.size
  return delay({
    content: matched.slice(start, start + filter.size),
    page: filter.page,
    size: filter.size,
    totalElements: matched.length,
    totalPages: Math.max(1, Math.ceil(matched.length / filter.size)),
  })
}

/** Tra cứu mã: chỉ trả hợp đồng PENDING_CHECKIN thuộc đúng cơ sở của Staff. */
export function mockLookupContract(code: string): Promise<CheckinContract> {
  const index = findIndex(code)
  if (index === -1) {
    return fail("NOT_FOUND", `Không tìm thấy mã đặt chỗ "${code.trim()}".`)
  }
  const contract = store[index]
  // BR-06: dữ liệu cô lập theo cơ sở → mã cơ sở khác coi như không tìm thấy.
  if (contract.facilityCode !== STAFF_FACILITY.facilityCode) {
    return fail("NOT_FOUND", `Không tìm thấy mã đặt chỗ "${code.trim()}".`)
  }
  if (contract.status !== "PENDING_CHECKIN") {
    const label: Record<string, string> = {
      ACTIVE: "ĐANG THUÊ",
      OVERDUE: "QUÁ HẠN",
      CANCELED: "ĐÃ HỦY",
    }
    return fail(
      "WRONG_STATUS",
      `Hợp đồng "${contract.code}" đang ở trạng thái ${label[contract.status] ?? contract.status}, không thể check-in.`
    )
  }
  return delay(contract)
}

export function mockConfirmCheckin(
  code: string,
  payload: { collectedAmount: number; paymentMethod: string }
): Promise<CheckinContract> {
  const index = findIndex(code)
  if (index === -1) {
    return fail("NOT_FOUND", `Không tìm thấy mã đặt chỗ "${code.trim()}".`)
  }
  const current = store[index]
  const paidAmount = current.paidAmount + payload.collectedAmount
  const updated: CheckinContract = {
    ...current,
    status: "ACTIVE",
    paidAmount,
    remainingAmount: current.rentalAmount + current.depositAmount - paidAmount,
    gatePin: randomPin(),
  }
  store[index] = updated
  return delay(updated)
}

/** Đổi ô kho: tính lại tổng = tiền thuê mới + cọc mới; còn phải thu = tổng mới - đã thu. */
export function mockChangeUnit(
  code: string,
  payload: ChangeUnitRequest
): Promise<CheckinContract> {
  const index = findIndex(code)
  if (index === -1) {
    return fail("NOT_FOUND", `Không tìm thấy mã đặt chỗ "${code.trim()}".`)
  }
  const current = store[index]
  const newTotal = payload.newRentalAmount + payload.newDepositAmount
  const remaining = newTotal - current.paidAmount
  const updated: CheckinContract = {
    ...current,
    unitCode: payload.newUnitCode,
    rentalAmount: payload.newRentalAmount,
    depositAmount: payload.newDepositAmount,
    // Nếu tổng mới < đã thu → sinh lệnh hoàn phần dư, còn phải thu = 0.
    remainingAmount: Math.max(remaining, 0),
  }
  store[index] = updated
  return delay(updated)
}

/** Hủy tại quầy (BR-17): hoàn 50% cọc, giữ 50% vào quỹ phạt giữ chỗ. */
export function mockCounterCancel(code: string): Promise<CounterCancelResult> {
  const index = findIndex(code)
  if (index === -1) {
    return fail("NOT_FOUND", `Không tìm thấy mã đặt chỗ "${code.trim()}".`)
  }
  const current = store[index]
  const refundAmount = Math.round(current.depositAmount * 0.5)
  const forfeitedAmount = current.depositAmount - refundAmount
  store[index] = { ...current, status: "CANCELED" }
  return delay({ refundAmount, forfeitedAmount })
}
