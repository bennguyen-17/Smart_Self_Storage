// Mock cho US-16/US-17/US-20, dùng khi VITE_USE_MOCK=true — trả về đúng shape DTO của BE.
// Dữ liệu bám prototype staff.html (tab CHECK-IN).

import { addDays, todayInVietnam } from "@/lib/format"

import { penaltyTotal, renewalAmount } from "../lib/overdueRules"
import type {
  CollectPenaltyResponse,
  RenewAtCounterRequest,
  RenewAtCounterResponse,
  StaffCancelReservationResponse,
  StaffChangeUnitResponse,
  StaffCheckInRequest,
  StaffCheckInResponse,
  StaffReservationItem,
  StaffReservationLookup,
} from "../types"

const MOCK_LATENCY_MS = 400
/** Cơ sở của Staff đang đăng nhập (BE thật suy ra từ JWT + EmployeeProfile). */
const MOCK_STAFF_FACILITY = "HN-01"
/** Mã cơ sở dùng để sinh mã hóa đơn PEN/EXT trong mock. */
const MOCK_FACILITY_CODE = "HN-01"

type Seed = StaffReservationItem & { facilityCode: string }

const today = todayInVietnam()

const SEEDS: Seed[] = [
  {
    facilityCode: "HN-01",
    reservationId: 101,
    reservationCode: "RES-CG-8899-K7X2",
    customerName: "Nguyễn Văn Khách",
    customerPhone: "0988 123 719",
    customerIdNumber: "079201008899",
    customerEmail: "khach.nguyen@gmail.com",
    rentalDuration: "1 tháng",
    unitCode: "F2-M205",
    floorName: "Tầng 2",
    reservationStatus: "CONFIRMED",
    checkInDate: today,
    endDate: addDays(today, 30),
    overdueDays: 0,
    unpaidPenaltyAmount: 0,
    monthlyPrice: 1_500_000,
    contractStatus: "PENDING_CHECKIN",
    depStatus: "PARTIALLY_PAID",
    depPaymentStatus: "SUCCESS",
    depAmount: 3_500_000,
    depPaidAmount: 1_000_000,
    depRemainingAmount: 2_500_000,
  },
  {
    facilityCode: "HN-01",
    reservationId: 102,
    reservationCode: "RES-CG-9900-M12",
    customerName: "Phạm Minh Hoàng",
    customerPhone: "0909 555 246",
    customerIdNumber: "079198007766",
    customerEmail: "hoang.pham@gmail.com",
    rentalDuration: "1 tháng",
    unitCode: "F3-S301",
    floorName: "Tầng 3",
    reservationStatus: "CONFIRMED",
    checkInDate: today,
    endDate: addDays(today, 30),
    overdueDays: 0,
    unpaidPenaltyAmount: 0,
    monthlyPrice: 800_000,
    contractStatus: "PENDING_CHECKIN",
    depStatus: "PARTIALLY_PAID",
    depPaymentStatus: "SUCCESS",
    depAmount: 1_300_000,
    depPaidAmount: 800_000,
    depRemainingAmount: 500_000,
  },
  {
    facilityCode: "HN-01",
    reservationId: 103,
    reservationCode: "HD-CG-2026-902",
    customerName: "Trần Thị Bích",
    customerPhone: "0912 777 333",
    customerIdNumber: "079195006655",
    customerEmail: "bich.tran@gmail.com",
    rentalDuration: "1 tháng",
    unitCode: "F1-XL104",
    floorName: "Tầng 1",
    reservationStatus: "CONFIRMED",
    checkInDate: addDays(today, -12),
    endDate: addDays(today, 18),
    overdueDays: 0,
    unpaidPenaltyAmount: 0,
    monthlyPrice: 3_000_000,
    contractStatus: "ACTIVE",
    depStatus: "PAID",
    depPaymentStatus: "SUCCESS",
    depAmount: 7_500_000,
    depPaidAmount: 7_500_000,
    depRemainingAmount: 0,
  },
  {
    // HĐ quá hạn 3 ngày — dùng cho luồng Thu phạt & Gia hạn tại quầy (US-20)
    facilityCode: "HN-01",
    reservationId: 104,
    reservationCode: "HD-CG-8812",
    customerName: "Lê Văn C",
    customerPhone: "0938 222 111",
    customerIdNumber: "079199005544",
    customerEmail: "c.le@gmail.com",
    rentalDuration: "1 tháng",
    unitCode: "F1-M102",
    floorName: "Tầng 1",
    reservationStatus: "CONFIRMED",
    checkInDate: addDays(today, -33),
    endDate: addDays(today, -3),
    overdueDays: 3,
    unpaidPenaltyAmount: penaltyTotal(3),
    monthlyPrice: 1_500_000,
    contractStatus: "OVERDUE",
    depStatus: "PAID",
    depPaymentStatus: "SUCCESS",
    depAmount: 2_000_000,
    depPaidAmount: 2_000_000,
    depRemainingAmount: 0,
  },
  {
    facilityCode: "HN-01",
    reservationId: 105,
    reservationCode: "HD-CG-2026-701",
    customerName: "Vũ Thùy Linh",
    customerPhone: "0977 888 999",
    customerIdNumber: "079200004433",
    customerEmail: "linh.vu@gmail.com",
    rentalDuration: "1 tháng",
    unitCode: "F2-L202",
    floorName: "Tầng 2",
    reservationStatus: "CANCELLED",
    checkInDate: addDays(today, -1),
    endDate: addDays(today, 29),
    overdueDays: 0,
    unpaidPenaltyAmount: 0,
    monthlyPrice: 2_200_000,
    contractStatus: "CANCELED",
    depStatus: "CANCELLED",
    depPaymentStatus: "FAILED",
    depAmount: 3_800_000,
    depPaidAmount: 3_800_000,
    depRemainingAmount: 0,
  },
  {
    // Cơ sở KHÁC — dùng để test "khác cơ sở → không tìm thấy"
    facilityCode: "HN-02",
    reservationId: 106,
    reservationCode: "RES-TX-2211-B8NC",
    customerName: "Võ Thị Hạnh",
    customerPhone: "0977 111 222",
    customerIdNumber: "079193003322",
    customerEmail: "hanh.vo@gmail.com",
    rentalDuration: "1 tháng",
    unitCode: "HN02-1-M03",
    floorName: "Tầng 1",
    reservationStatus: "CONFIRMED",
    checkInDate: today,
    endDate: addDays(today, 30),
    overdueDays: 0,
    unpaidPenaltyAmount: 0,
    monthlyPrice: 1_200_000,
    contractStatus: "PENDING_CHECKIN",
    depStatus: "PARTIALLY_PAID",
    depPaymentStatus: "SUCCESS",
    depAmount: 2_500_000,
    depPaidAmount: 800_000,
    depRemainingAmount: 1_700_000,
  },
]

const store: Seed[] = SEEDS.map((seed) => ({ ...seed }))

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(structuredClone(value)), MOCK_LATENCY_MS)
  )
}

function fail(message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), MOCK_LATENCY_MS)
  )
}

function randomInvoiceNumber(prefix: string): string {
  const dateStr = today.replace(/-/g, "")
  const suffix = 1000 + Math.floor(Math.random() * 9000)
  return `${prefix}-${MOCK_FACILITY_CODE}-${dateStr}-${suffix}`
}

function toItem(seed: Seed): StaffReservationItem {
  return {
    reservationId: seed.reservationId,
    reservationCode: seed.reservationCode,
    customerName: seed.customerName,
    customerIdNumber: seed.customerIdNumber,
    customerEmail: seed.customerEmail,
    rentalDuration: seed.rentalDuration,
    customerPhone: seed.customerPhone,
    unitCode: seed.unitCode,
    floorName: seed.floorName,
    reservationStatus: seed.reservationStatus,
    checkInDate: seed.checkInDate,
    endDate: seed.endDate,
    reservationStartDate: seed.checkInDate,
    reservationEndDate: seed.endDate,
    overdueDays: seed.overdueDays,
    unpaidPenaltyAmount: seed.unpaidPenaltyAmount,
    monthlyPrice: seed.monthlyPrice,
    contractStatus: seed.contractStatus,
    depStatus: seed.depStatus,
    depPaymentStatus: seed.depPaymentStatus,
    depAmount: seed.depAmount,
    depPaidAmount: seed.depPaidAmount,
    depRemainingAmount: seed.depRemainingAmount,
  }
}

function findIndex(reservationId: number): number {
  return store.findIndex((s) => s.reservationId === reservationId)
}

export function mockListReservations(): Promise<StaffReservationItem[]> {
  const items = store
    .filter((s) => s.facilityCode === MOCK_STAFF_FACILITY)
    .map(toItem)
    .sort((a, b) => {
      const aPending = a.contractStatus === "PENDING_CHECKIN" ? 0 : 1
      const bPending = b.contractStatus === "PENDING_CHECKIN" ? 0 : 1
      if (aPending !== bPending) return aPending - bPending
      return (a.checkInDate ?? "").localeCompare(b.checkInDate ?? "")
    })
  return delay(items)
}

export function mockLookupReservation(
  code: string
): Promise<StaffReservationLookup> {
  const normalized = code.trim().toUpperCase()
  const seed = store.find((s) => s.reservationCode.toUpperCase() === normalized)
  if (!seed || seed.facilityCode !== MOCK_STAFF_FACILITY) {
    return fail("Reservation was not found.")
  }
  return delay({
    ...toItem(seed),
    success: true,
    message: "Reservation found.",
    unitStatus:
      seed.contractStatus === "PENDING_CHECKIN" ? "RESERVED" : "RENTED",
    contractPdfUrl: null,
  })
}

export function mockCheckIn(
  reservationId: number,
  payload: StaffCheckInRequest
): Promise<StaffCheckInResponse> {
  const index = findIndex(reservationId)
  if (index === -1) return fail("Reservation was not found.")
  store[index] = { ...store[index], contractStatus: "ACTIVE" }
  return delay({
    success: true,
    message: "Check-in completed.",
    reservationId,
    reservationCode: store[index].reservationCode,
    contractStatus: "ACTIVE",
    unitStatus: "RENTED",
    collectedAmount: payload.collectedAmount,
    gatePin: "839201",
    remainingDue: 0,
    invoicePdfUrl: null,
  })
}

export function mockChangeUnit(
  reservationId: number,
  newUnitCode: string
): Promise<StaffChangeUnitResponse> {
  const index = findIndex(reservationId)
  if (index === -1) return fail("Reservation was not found.")
  store[index] = { ...store[index], unitCode: newUnitCode }
  return delay({
    success: true,
    message: "Storage unit changed.",
    reservationId,
    newUnitCode,
    remainingDue: 0,
    refundAmount: 0,
  })
}

export function mockCancelReservation(
  reservationId: number
): Promise<StaffCancelReservationResponse> {
  const index = findIndex(reservationId)
  if (index === -1) return fail("Reservation was not found.")
  const paid = store[index].depPaidAmount ?? 0
  const refundAmount = Math.round(paid * 0.5)
  store[index] = { ...store[index], contractStatus: "CANCELED" }
  return delay({
    success: true,
    message: "Reservation cancelled.",
    reservationId,
    reservationCode: store[index].reservationCode,
    refundAmount,
    penaltyAmount: paid - refundAmount,
  })
}

/** US-20: thu phạt quá hạn tại quầy — gộp phạt thành hóa đơn PEN (PAID), HĐ vẫn OVERDUE. */
export function mockCollectPenalty(
  reservationId: number
): Promise<CollectPenaltyResponse> {
  const index = findIndex(reservationId)
  if (index === -1) return fail("Reservation was not found.")
  const seed = store[index]
  if (seed.contractStatus !== "OVERDUE") {
    return fail("Contract must be OVERDUE to collect the overdue penalty.")
  }
  const amount = seed.unpaidPenaltyAmount ?? 0
  if (amount <= 0) {
    return fail("No unpaid overdue penalty was found.")
  }
  store[index] = { ...seed, unpaidPenaltyAmount: 0 }
  return delay({
    success: true,
    message: "Overdue penalty collected.",
    reservationId,
    reservationCode: seed.reservationCode,
    contractStatus: "OVERDUE",
    unitStatus: "RENTED",
    invoiceNumber: randomInvoiceNumber("PEN"),
    collectedAmount: amount,
    overdueDays: seed.overdueDays ?? 0,
  })
}

/** US-20: gia hạn tại quầy — chặn khi còn phạt UNPAID, đưa HĐ về ACTIVE + hóa đơn EXT. */
export function mockRenewAtCounter(
  reservationId: number,
  payload: RenewAtCounterRequest
): Promise<RenewAtCounterResponse> {
  const index = findIndex(reservationId)
  if (index === -1) return fail("Reservation was not found.")
  const seed = store[index]
  if (seed.contractStatus !== "OVERDUE") {
    return fail("Contract must be OVERDUE to renew at the counter.")
  }
  if ((seed.unpaidPenaltyAmount ?? 0) > 0) {
    return fail(
      "Cannot renew at the counter while unpaid overdue penalties remain."
    )
  }

  const months = payload.months
  const amount = renewalAmount(seed.monthlyPrice, months) ?? 0
  const newExpiry = addDays(seed.endDate ?? today, months * 30)
  store[index] = {
    ...seed,
    contractStatus: "ACTIVE",
    endDate: newExpiry,
    overdueDays: 0,
    unpaidPenaltyAmount: 0,
  }
  return delay({
    success: true,
    message: "Contract renewed at counter.",
    reservationId,
    reservationCode: seed.reservationCode,
    contractStatus: "ACTIVE",
    unitStatus: "RENTED",
    invoiceNumber: randomInvoiceNumber("EXT"),
    amount,
    discountPercent: months >= 12 ? 15 : months >= 6 ? 10 : months >= 3 ? 5 : 0,
    newExpiryDate: newExpiry,
    gatePin: "839201",
  })
}
