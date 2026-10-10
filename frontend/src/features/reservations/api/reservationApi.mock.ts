// Dữ liệu mẫu cho US-06, dùng khi VITE_USE_MOCK=true.
// Ngày được tính tương đối theo "hôm nay" để lúc demo luôn có sẵn đơn quá hạn cho nút quét.

import { addDays, todayInVietnam } from "@/lib/format"

import type {
  NoShowScanResult,
  PageResponse,
  RefundStatus,
  Reservation,
  ReservationFilter,
} from "../types"

const MOCK_LATENCY_MS = 400

type Seed = Omit<
  Reservation,
  "checkinDate" | "canceledAt" | "createdAt" | "forfeitedAmount"
> & { checkinOffsetDays: number; forfeitRate?: number }

const SEEDS: Seed[] = [
  {
    reservationCode: "RES-CG-8899-K7X2",
    customerName: "Nguyễn Văn An",
    customerEmail: "an.nguyen@example.com",
    cccd: "001099012345",
    facilityCode: "HN-01",
    facilityName: "SmartStorage Cầu Giấy",
    unitCode: "U-104",
    depositAmount: 500_000,
    status: "CANCELED",
    cancelReason: "NO_SHOW",
    checkinOffsetDays: -3,
  },
  {
    reservationCode: "RES-Q7-1234-P9QA",
    customerName: "Trần Thị Bích",
    customerEmail: "bich.tran@example.com",
    cccd: "079198004567",
    facilityCode: "HCM-02",
    facilityName: "SmartStorage Quận 7",
    unitCode: "U-203",
    depositAmount: 1_000_000,
    status: "CANCELED",
    cancelReason: "NO_SHOW",
    checkinOffsetDays: -6,
  },
  {
    reservationCode: "RES-HC-5566-Z3MD",
    customerName: "Lê Hoàng Cường",
    customerEmail: "cuong.le@example.com",
    cccd: "048095007788",
    facilityCode: "DN-01",
    facilityName: "SmartStorage Hải Châu",
    unitCode: "U-001",
    depositAmount: 3_000_000,
    status: "CANCELED",
    cancelReason: "NO_SHOW",
    checkinOffsetDays: -10,
  },
  {
    reservationCode: "RES-HC-8080-W2PO",
    customerName: "Phạm Minh Đức",
    customerEmail: "duc.pham@example.com",
    cccd: "048201003344",
    facilityCode: "DN-01",
    facilityName: "SmartStorage Hải Châu",
    unitCode: "U-108",
    depositAmount: 500_000,
    status: "CANCELED",
    cancelReason: "NO_SHOW",
    checkinOffsetDays: -20,
  },
  // 2 đơn quá hạn chưa bị quét, để demo nút "Chạy quét No-Show"
  {
    reservationCode: "RES-TX-2211-B8NC",
    customerName: "Võ Thị Hạnh",
    customerEmail: "hanh.vo@example.com",
    cccd: "001302009911",
    facilityCode: "HN-02",
    facilityName: "SmartStorage Thanh Xuân",
    unitCode: "U-110",
    depositAmount: 1_000_000,
    status: "PENDING_CHECKIN",
    cancelReason: null,
    checkinOffsetDays: -1,
  },
  {
    reservationCode: "RES-NK-7788-H2LE",
    customerName: "Đặng Quốc Huy",
    customerEmail: "huy.dang@example.com",
    cccd: "092097001122",
    facilityCode: "CT-01",
    facilityName: "SmartStorage Ninh Kiều",
    unitCode: "U-005",
    depositAmount: 2_000_000,
    status: "PENDING_CHECKIN",
    cancelReason: null,
    checkinOffsetDays: -2,
  },
  {
    reservationCode: "RES-Q1-3344-R5TW",
    customerName: "Bùi Thanh Hương",
    customerEmail: "huong.bui@example.com",
    cccd: "079300005566",
    facilityCode: "HCM-01",
    facilityName: "SmartStorage Quận 1",
    unitCode: "U-106",
    depositAmount: 500_000,
    status: "PENDING_CHECKIN",
    cancelReason: null,
    checkinOffsetDays: 2,
  },
  {
    reservationCode: "RES-TD-9900-M1KV",
    customerName: "Hồ Gia Khánh",
    customerEmail: "khanh.ho@example.com",
    cccd: "075099008899",
    facilityCode: "HCM-03",
    facilityName: "SmartStorage Thủ Đức",
    unitCode: "U-201",
    depositAmount: 2_000_000,
    status: "PENDING_CHECKIN",
    cancelReason: null,
    checkinOffsetDays: 5,
  },
  {
    reservationCode: "RES-Q7-3030-L8XB",
    customerName: "Ngô Thùy Linh",
    customerEmail: "linh.ngo@example.com",
    cccd: "079205002233",
    facilityCode: "HCM-02",
    facilityName: "SmartStorage Quận 7",
    unitCode: "U-102",
    depositAmount: 500_000,
    status: "PENDING_CHECKIN",
    cancelReason: null,
    checkinOffsetDays: 1,
  },
  {
    reservationCode: "RES-CG-4455-D6FJ",
    customerName: "Đỗ Văn Mạnh",
    customerEmail: "manh.do@example.com",
    cccd: "001096004455",
    facilityCode: "HN-01",
    facilityName: "SmartStorage Cầu Giấy",
    unitCode: "U-202",
    depositAmount: 1_000_000,
    status: "ACTIVE",
    cancelReason: null,
    checkinOffsetDays: -4,
  },
  {
    reservationCode: "RES-Q1-6677-S4GH",
    customerName: "Trương Mỹ Ngọc",
    customerEmail: "ngoc.truong@example.com",
    cccd: "079301006677",
    facilityCode: "HCM-01",
    facilityName: "SmartStorage Quận 1",
    unitCode: "U-003",
    depositAmount: 3_000_000,
    status: "ACTIVE",
    cancelReason: null,
    checkinOffsetDays: -15,
  },
  // Khách tự hủy < 4 ngày trước ngày hẹn → mất 50% cọc (BR-17) - Đang chờ kế toán hoàn 50%
  // (hủy hôm qua, hẹn hôm nay + 2 → hủy trước 3 ngày)
  {
    reservationCode: "RES-TX-1100-C7YU",
    customerName: "Lý Hải Phong",
    customerEmail: "phong.ly@example.com",
    cccd: "001094001100",
    facilityCode: "HN-02",
    facilityName: "SmartStorage Thanh Xuân",
    unitCode: "U-205",
    depositAmount: 1_000_000,
    status: "CANCELED",
    cancelReason: "CUSTOMER_REQUEST",
    checkinOffsetDays: 2,
    forfeitRate: 0.5,
    refundStatus: "PENDING",
    bankAccount: "190367891234 (Techcombank) - Lý Hải Phong",
    bankName: "Techcombank",
  },
  // Khách hủy ≥ 4 ngày trước ngày hẹn → hoàn 100% cọc (BR-17/BR-35) - Đã đối soát & hoàn tiền (REFUNDED)
  {
    reservationCode: "RES-CG-9922-OKRF",
    customerName: "Nguyễn Hoàng Mai",
    customerEmail: "mai.nguyen@example.com",
    cccd: "001198007722",
    facilityCode: "HN-01",
    facilityName: "SmartStorage Cầu Giấy",
    unitCode: "U-102",
    depositAmount: 1_000_000,
    status: "CANCELED",
    cancelReason: "CUSTOMER_REQUEST",
    checkinOffsetDays: 8,
    forfeitRate: 0,
    refundStatus: "REFUNDED",
    refundAmount: 1_000_000,
    refundEvidenceUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    refundedAt: "2026-10-02T14:20:00.000Z",
    refundStaffName: "Trần Thị Thu (Kế toán Back-office)",
    refundNote: "FT2610028891 - Đã chuyển hoàn 100% qua Internet Banking VCB",
    bankAccount: "0011004567890 (Vietcombank) - Nguyễn Hoàng Mai",
    bankName: "Vietcombank",
  },
]

/** 00:00 giờ Việt Nam của một ngày, dạng ISO UTC */
function vnMidnightIso(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00+07:00`).toISOString()
}

function buildStore(): Reservation[] {
  const today = todayInVietnam()
  return SEEDS.map(({ checkinOffsetDays, forfeitRate, ...seed }) => {
    const checkinDate = addDays(today, checkinOffsetDays)
    const createdAt = vnMidnightIso(addDays(checkinDate, -7))
    let canceledAt: string | null = null
    let forfeitedAmount: number | null = null
    let refundAmount: number | null = seed.refundAmount ?? null
    let refundStatus: RefundStatus = seed.refundStatus ?? "NONE"

    if (seed.cancelReason === "NO_SHOW") {
      // Cron 00:00 ngày kế tiếp ngày hẹn
      canceledAt = vnMidnightIso(addDays(checkinDate, 1))
      forfeitedAmount = seed.depositAmount
      refundAmount = 0
      refundStatus = "NONE"
    } else if (seed.cancelReason === "CUSTOMER_REQUEST") {
      canceledAt = vnMidnightIso(addDays(today, -1))
      forfeitedAmount = seed.depositAmount * (forfeitRate ?? 0)
      const calculatedRefund = seed.depositAmount - forfeitedAmount
      refundAmount = seed.refundAmount ?? calculatedRefund
      refundStatus = seed.refundStatus ?? (refundAmount > 0 ? "PENDING" : "NONE")
    }
    return {
      ...seed,
      checkinDate,
      createdAt,
      canceledAt,
      forfeitedAmount,
      refundAmount,
      refundStatus,
    }
  })
}

let store: Reservation[] = buildStore()

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(structuredClone(value)), MOCK_LATENCY_MS)
  )
}

function sortKey(r: Reservation): string {
  return r.canceledAt ?? r.createdAt
}

export function mockListReservations(
  filter: ReservationFilter
): Promise<PageResponse<Reservation>> {
  const matched = store
    .filter((r) => !filter.status || r.status === filter.status)
    .filter((r) => !filter.reason || r.cancelReason === filter.reason)
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)))
  const start = filter.page * filter.size
  return delay({
    content: matched.slice(start, start + filter.size),
    page: filter.page,
    size: filter.size,
    totalElements: matched.length,
    totalPages: Math.max(1, Math.ceil(matched.length / filter.size)),
  })
}

export function mockGetReservation(code: string): Promise<Reservation> {
  const found = store.find((r) => r.reservationCode === code)
  if (!found) {
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Không tìm thấy đơn ${code}`)),
        MOCK_LATENCY_MS
      )
    )
  }
  return delay(found)
}

/** Giả lập cron BR-17: hủy các đơn PENDING_CHECKIN có ngày hẹn trước hôm nay */
export function mockRunNoShowScan(): Promise<NoShowScanResult> {
  const today = todayInVietnam()
  const scannedAt = new Date().toISOString()
  const reservationCodes: string[] = []
  store = store.map((r) => {
    if (r.status !== "PENDING_CHECKIN" || r.checkinDate >= today) return r
    reservationCodes.push(r.reservationCode)
    return {
      ...r,
      status: "CANCELED",
      cancelReason: "NO_SHOW",
      forfeitedAmount: r.depositAmount,
      canceledAt: scannedAt,
    }
  })
  return delay({
    scannedAt,
    canceledCount: reservationCodes.length,
    reservationCodes,
  })
}

/** Giả lập quy trình Back-office hoàn tiền cọc & lưu biên lai (BR-35) */
export function mockConfirmRefund(
  code: string,
  payload: { evidenceUrl: string; note?: string; staffName?: string }
): Promise<Reservation> {
  const index = store.findIndex((r) => r.reservationCode === code)
  if (index === -1) {
    return Promise.reject(new Error(`Không tìm thấy đơn ${code}`))
  }
  const updated: Reservation = {
    ...store[index],
    refundStatus: "REFUNDED",
    refundEvidenceUrl: payload.evidenceUrl,
    refundedAt: new Date().toISOString(),
    refundStaffName: payload.staffName || "Trần Thị Thu (Kế toán Back-office)",
    refundNote: payload.note || "Đã chuyển khoản ngoài và lưu biên lai đối soát thành công",
  }
  store[index] = updated
  return delay(updated)
}
