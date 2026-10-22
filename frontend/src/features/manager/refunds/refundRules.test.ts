import { describe, expect, test } from "vitest"

import {
  bankAccountLabel,
  filterRefunds,
  hoursWaiting,
  pendingSummary,
  refundReasonLabel,
  refundState,
} from "./refundRules"
import type { ManagerRefund, RefundFilter } from "./types"

function refund(paymentId: number, issuedAt: string, patch: Partial<ManagerRefund> = {}): ManagerRefund {
  return {
    paymentId,
    invoiceNumber: `REF-HN-01-${paymentId}`,
    contractId: paymentId,
    reservationCode: `RES-HN-01-${paymentId}`,
    unitCode: "HN01-F1-S01",
    customerName: "Nguyễn Văn An",
    customerPhone: "0912345678",
    refundAmount: 500_000,
    refundBankName: "Vietcombank",
    refundAccountNumber: "0123456789",
    refundAccountName: "NGUYEN VAN AN",
    cancelReason: "CUSTOMER_REQUEST",
    status: "PENDING",
    issuedAt,
    ...patch,
  }
}

describe("refundState: BE cũ trả PAID, BE mới trả REFUNDED, đều là 'Đã hoàn'", () => {
  test.each([
    { status: "PENDING", expected: "PENDING" },
    { status: "PAID", expected: "REFUNDED" },
    { status: "REFUNDED", expected: "REFUNDED" },
    { status: "refunded", expected: "REFUNDED" },
  ])("$status → $expected", ({ status, expected }) => {
    expect(refundState(status)).toBe(expected)
  })
})

describe("refundReasonLabel: ưu tiên loại phiếu của BE, chưa có thì suy từ lý do hủy", () => {
  test.each([
    { name: "BE trả loại hoàn cọc khi trả kho", patch: { refundType: "CHECKOUT_SETTLEMENT" as const }, expected: "Hoàn cọc khi trả kho" },
    { name: "BE trả loại trả kho trước hạn", patch: { refundType: "EARLY_TERMINATION" as const }, expected: "Trả kho trước hạn" },
    { name: "khách tự hủy", patch: { cancelReason: "CUSTOMER_REQUEST" }, expected: "Khách hủy cọc" },
    { name: "hủy tại quầy", patch: { cancelReason: "STAFF_CANCEL" }, expected: "Hủy tại quầy" },
    { name: "lý do lạ", patch: { cancelReason: "OTHER" }, expected: "Hủy đặt chỗ" },
    { name: "không có lý do", patch: { cancelReason: null }, expected: "Hoàn tiền" },
  ])("$name → $expected", ({ patch, expected }) => {
    expect(refundReasonLabel({ refundType: null, cancelReason: null, ...patch })).toBe(expected)
  })
})

describe("bankAccountLabel: thiếu số tài khoản thì null để giao diện báo khách chưa cung cấp", () => {
  test.each([
    { name: "đủ", patch: {}, expected: "0123456789 · Vietcombank · NGUYEN VAN AN" },
    { name: "thiếu ngân hàng", patch: { refundBankName: null }, expected: "0123456789 · NGUYEN VAN AN" },
    { name: "thiếu số tài khoản", patch: { refundAccountNumber: "  " }, expected: null },
  ])("$name", ({ patch, expected }) => {
    expect(bankAccountLabel({ ...refund(1, "2026-10-20T08:00:00"), ...patch })).toBe(expected)
  })
})

describe("filterRefunds: phiếu chờ hoàn tồn lâu nhất lên đầu, sau đó phiếu đã hoàn mới nhất", () => {
  const LIST = [
    refund(1, "2026-10-20T08:00:00", { status: "PAID" }),
    refund(2, "2026-10-21T09:00:00"),
    refund(3, "2026-10-19T10:00:00", { customerName: "Trần Thị Bích", customerPhone: "0987654321" }),
    refund(4, "2026-10-22T07:00:00", { status: "REFUNDED", unitCode: "HN01-G-XL02" }),
  ]
  const ALL: RefundFilter = { query: "", state: "ALL" }
  const ids = (f: RefundFilter) => filterRefunds(LIST, f).map((r) => r.paymentId)

  test.each([
    { name: "tất cả", filter: ALL, expected: [3, 2, 4, 1] },
    { name: "chỉ chờ hoàn", filter: { ...ALL, state: "PENDING" }, expected: [3, 2] },
    { name: "chỉ đã hoàn (PAID và REFUNDED)", filter: { ...ALL, state: "REFUNDED" }, expected: [4, 1] },
    { name: "tìm tên không dấu", filter: { ...ALL, query: "tran thi bich" }, expected: [3] },
    { name: "tìm theo SĐT", filter: { ...ALL, query: "0987" }, expected: [3] },
    { name: "tìm theo mã ô", filter: { ...ALL, query: "xl02" }, expected: [4] },
  ] as { name: string; filter: RefundFilter; expected: number[] }[])("$name", ({ filter, expected }) => {
    expect(ids(filter)).toEqual(expected)
  })
})

describe("hoursWaiting / pendingSummary: cam kết hoàn trong 48 giờ", () => {
  const NOW = new Date("2026-10-22T10:00:00")

  test.each([
    { issuedAt: "2026-10-22T09:00:00", expected: 1 },
    { issuedAt: "2026-10-20T10:00:00", expected: 48 },
    { issuedAt: "2026-10-20T09:59:00", expected: 48 },
    { issuedAt: "2026-10-23T00:00:00", expected: 0 },
    { issuedAt: "không phải ngày", expected: 0 },
  ])("$issuedAt → chờ $expected giờ", ({ issuedAt, expected }) => {
    expect(hoursWaiting(issuedAt, NOW)).toBe(expected)
  })

  test("đếm phiếu chờ, tổng tiền, số phiếu quá 48 giờ (đúng 48 giờ chưa tính là quá)", () => {
    const list = [
      refund(1, "2026-10-22T08:00:00", { refundAmount: 500_000 }),
      refund(2, "2026-10-20T10:00:00", { refundAmount: 1_000_000 }),
      refund(3, "2026-10-19T10:00:00", { refundAmount: 250_000 }),
      refund(4, "2026-10-18T10:00:00", { refundAmount: 9_999_000, status: "PAID" }),
    ]
    expect(pendingSummary(list, NOW)).toEqual({ count: 3, amount: 1_750_000, late: 1 })
  })
})
