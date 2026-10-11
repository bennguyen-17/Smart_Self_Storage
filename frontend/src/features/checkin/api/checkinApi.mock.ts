// Mock cho US-16, dùng khi VITE_USE_MOCK=true — trả về đúng shape DTO của BE-16.
// Dữ liệu bám prototype staff.html (tab CHECK-IN).

import { addDays, todayInVietnam } from "@/lib/format"

import type {
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

type Seed = StaffReservationItem & { facilityCode: string }

const today = todayInVietnam()

const SEEDS: Seed[] = [
  {
    facilityCode: "HN-01",
    reservationId: 101,
    reservationCode: "RES-CG-8899-K7X2",
    customerName: "Nguyễn Văn Khách",
    customerPhone: "0988 123 719",
    unitCode: "F2-M205",
    floorName: "Tầng 2",
    reservationStatus: "CONFIRMED",
    checkInDate: today,
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
    unitCode: "F3-S301",
    floorName: "Tầng 3",
    reservationStatus: "CONFIRMED",
    checkInDate: today,
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
    unitCode: "F1-XL104",
    floorName: "Tầng 1",
    reservationStatus: "CONFIRMED",
    checkInDate: addDays(today, -12),
    contractStatus: "ACTIVE",
    depStatus: "PAID",
    depPaymentStatus: "SUCCESS",
    depAmount: 7_500_000,
    depPaidAmount: 7_500_000,
    depRemainingAmount: 0,
  },
  {
    facilityCode: "HN-01",
    reservationId: 104,
    reservationCode: "HD-CG-8812",
    customerName: "Lê Văn C",
    customerPhone: "0938 222 111",
    unitCode: "F1-M102",
    floorName: "Tầng 1",
    reservationStatus: "CONFIRMED",
    checkInDate: addDays(today, -33),
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
    unitCode: "F2-L202",
    floorName: "Tầng 2",
    reservationStatus: "CANCELLED",
    checkInDate: addDays(today, -1),
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
    unitCode: "HN02-1-M03",
    floorName: "Tầng 1",
    reservationStatus: "CONFIRMED",
    checkInDate: today,
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

function toItem(seed: Seed): StaffReservationItem {
  return {
    reservationId: seed.reservationId,
    reservationCode: seed.reservationCode,
    customerName: seed.customerName,
    customerPhone: seed.customerPhone,
    unitCode: seed.unitCode,
    floorName: seed.floorName,
    reservationStatus: seed.reservationStatus,
    checkInDate: seed.checkInDate,
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
    invoicePdfUrl: "/invoices/DEP-HN-01-20261007-4719.pdf",
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
