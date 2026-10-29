import { describe, expect, test } from "vitest"

import {
  daysRemaining,
  filterContracts,
  canConfirmForfeitProcessed,
  forfeitNoteError,
  isClosedContract,
  isExpiringSoon,
  normalizeContractStatus,
  needsFollowUp,
  needsForfeitHandling,
  overdueDays,
  unpaidTotal,
  type ContractFilter,
} from "./contractRules"
import type { FacilityContract, FeeInvoice } from "./types"

function fee(paymentId: number, amount: number, status: FeeInvoice["status"] = "UNPAID", type: FeeInvoice["type"] = "PEN"): FeeInvoice {
  return { paymentId, invoiceNumber: `${type}-${paymentId}`, type, amount, status, issuedAt: "2026-10-10T08:00:00" }
}

function contract(id: number, patch: Partial<FacilityContract> = {}): FacilityContract {
  return {
    contractId: id,
    contractCode: `CTR-${id}`,
    customerName: `Khách ${id}`,
    customerPhone: `09000000${id}`,
    unitCode: `HN01-F1-M0${id}`,
    startDate: "2026-09-01",
    endDate: "2026-12-01",
    status: "ACTIVE",
    depositAmount: 1_000_000,
    checkoutStage: "NONE",
    fees: [],
    ...patch,
  }
}

describe("daysRemaining: theo ngày lịch", () => {
  test.each([
    { end: "2026-10-14", today: "2026-10-14", expected: 0 },
    { end: "2026-10-15", today: "2026-10-14", expected: 1 },
    { end: "2026-11-13", today: "2026-10-14", expected: 30 },
    { end: "2026-10-10", today: "2026-10-14", expected: -4 },
    { end: "2027-01-01", today: "2026-12-31", expected: 1 },
  ])("hết hạn $end, hôm nay $today → $expected", ({ end, today, expected }) => {
    expect(daysRemaining(end, today)).toBe(expected)
  })
})

describe("unpaidTotal / needsFollowUp", () => {
  test.each([
    { name: "không phí", c: contract(1), total: 0, follow: false },
    { name: "phí đã thu", c: contract(1, { fees: [fee(1, 500_000, "PAID")] }), total: 0, follow: false },
    { name: "phí đã miễn", c: contract(1, { fees: [fee(1, 500_000, "CANCELLED")] }), total: 0, follow: false },
    { name: "còn 2 phí chưa thu", c: contract(1, { fees: [fee(1, 500_000), fee(2, 300_000, "UNPAID", "CMP")] }), total: 800_000, follow: true },
    { name: "quá hạn, không phí", c: contract(1, { status: "OVERDUE" }), total: 0, follow: true },
    { name: "đã nghiệm thu, chờ bàn giao", c: contract(1, { checkoutStage: "INSPECTED" }), total: 0, follow: true },
    { name: "đã thanh lý, hết nợ", c: contract(1, { status: "TERMINATED", checkoutStage: "HANDED_OVER" }), total: 0, follow: false },
  ])("$name → nợ $total, cần theo dõi: $follow", ({ c, total, follow }) => {
    expect(unpaidTotal(c)).toBe(total)
    expect(needsFollowUp(c)).toBe(follow)
  })
})

describe("filterContracts", () => {
  const LIST = [
    contract(1, { customerName: "Nguyễn Văn An", endDate: "2026-12-01" }),
    contract(2, { customerName: "Trần Thị Bích", status: "OVERDUE", endDate: "2026-10-01", fees: [fee(1, 600_000)] }),
    contract(3, { customerName: "Lê Hoàng", status: "PENDING_CHECKIN", endDate: "2026-11-01" }),
  ]
  const ALL: ContractFilter = { query: "", status: "ALL", payment: "ALL" }
  const ids = (f: ContractFilter) => filterContracts(LIST, f).map((c) => c.contractId)

  test.each([
    { name: "không lọc → hết hạn sớm nhất lên đầu", filter: ALL, expected: [2, 3, 1] },
    { name: "tên không dấu", filter: { ...ALL, query: "bich" }, expected: [2] },
    { name: "theo mã ô", filter: { ...ALL, query: "m03" }, expected: [3] },
    { name: "quá hạn", filter: { ...ALL, status: "OVERDUE" }, expected: [2] },
    { name: "còn nợ", filter: { ...ALL, payment: "DEBT" }, expected: [2] },
    { name: "không nợ", filter: { ...ALL, payment: "CLEAR" }, expected: [3, 1] },
  ] as { name: string; filter: ContractFilter; expected: number[] }[])("$name", ({ filter, expected }) => {
    expect(ids(filter)).toEqual(expected)
  })

  test("sắp hết hạn: chỉ hợp đồng đang hiệu lực còn 0–7 ngày", () => {
    const soon = [
      contract(4, { endDate: "2026-10-27" }),
      contract(5, { endDate: "2026-11-03" }),
      contract(6, { endDate: "2026-11-04" }),
      contract(7, { status: "OVERDUE", endDate: "2026-10-26" }),
    ]
    expect(filterContracts(soon, { ...ALL, expiringSoon: true }, "2026-10-27").map((c) => c.contractId)).toEqual([4, 5])
  })
})

describe("isExpiringSoon", () => {
  test.each([
    ["hết hạn hôm nay", "ACTIVE", "2026-10-27", true],
    ["còn 7 ngày", "ACTIVE", "2026-11-03", true],
    ["còn 8 ngày", "ACTIVE", "2026-11-04", false],
    ["đã qua ngày hết hạn, BE chưa kịp chuyển quá hạn", "ACTIVE", "2026-10-26", false],
    ["đã quá hạn", "OVERDUE", "2026-10-20", false],
    ["chờ nhận kho", "PENDING_CHECKIN", "2026-10-30", false],
  ] as const)("%s → %s", (_, status, endDate, expected) => {
    expect(isExpiringSoon({ status, endDate }, "2026-10-27")).toBe(expected)
  })
})

describe("Trạng thái đã đóng và quá hạn trên 30 ngày (thanh lý tài sản)", () => {
  test.each([
    { status: "PENDING_CHECKIN", closed: false },
    { status: "ACTIVE", closed: false },
    { status: "OVERDUE", closed: false },
    { status: "TERMINATED", closed: true },
    { status: "COMPLETED", closed: true },
    { status: "FORFEITED", closed: true },
    { status: "CANCELLED", closed: true },
  ] as const)("isClosedContract($status) → $closed", ({ status, closed }) => {
    expect(isClosedContract(status)).toBe(closed)
  })

  const TODAY = "2026-10-22"
  test.each([
    { name: "đang hiệu lực dù đã qua ngày", status: "ACTIVE", endDate: "2026-09-01", days: 0, forfeit: false },
    { name: "quá hạn 12 ngày", status: "OVERDUE", endDate: "2026-10-10", days: 12, forfeit: false },
    { name: "quá hạn 29 ngày: chưa thanh lý", status: "OVERDUE", endDate: "2026-09-23", days: 29, forfeit: false },
    { name: "quá hạn đủ 30 ngày: cần thanh lý", status: "OVERDUE", endDate: "2026-09-22", days: 30, forfeit: true },
    { name: "quá hạn 31 ngày: cần thanh lý", status: "OVERDUE", endDate: "2026-09-21", days: 31, forfeit: true },
    { name: "BE đã chuyển FORFEITED", status: "FORFEITED", endDate: "2026-08-01", days: 0, forfeit: true },
    { name: "đã hoàn tất", status: "COMPLETED", endDate: "2026-08-01", days: 0, forfeit: false },
  ] as const)("$name → quá $days ngày, cần thanh lý: $forfeit", ({ status, endDate, days, forfeit }) => {
    expect(overdueDays({ status, endDate }, TODAY)).toBe(days)
    expect(needsForfeitHandling({ status, endDate }, TODAY)).toBe(forfeit)
  })

  test.each([
    { name: "FORFEITED luôn cần theo dõi", patch: { status: "FORFEITED" as const }, expected: true },
    { name: "COMPLETED hết nợ thì không", patch: { status: "COMPLETED" as const, checkoutStage: "HANDED_OVER" as const }, expected: false },
    { name: "CANCELLED hết nợ thì không", patch: { status: "CANCELLED" as const }, expected: false },
  ])("needsFollowUp: $name", ({ patch, expected }) => {
    expect(needsFollowUp(contract(9, patch))).toBe(expected)
  })
})

describe("normalizeContractStatus: gộp 2 cách viết của trạng thái hủy", () => {
  test.each([
    { input: "CANCELLED", expected: "CANCELLED" },

    { input: "cancelled", expected: "CANCELLED" },
    { input: "COMPLETED", expected: "COMPLETED" },
    { input: " active ", expected: "ACTIVE" },
  ])("$input → $expected", ({ input, expected }) => {
    expect(normalizeContractStatus(input)).toBe(expected)
  })
})

describe("Xác nhận đã xử lý tài sản (hợp đồng FORFEITED)", () => {
  const TODAY = "2026-10-23"
  test.each([
    { name: "FORFEITED chưa xử lý", c: { status: "FORFEITED", forfeitProcessed: false }, can: true, handling: true },
    { name: "FORFEITED đã xử lý", c: { status: "FORFEITED", forfeitProcessed: true }, can: false, handling: false },
    { name: "OVERDUE đủ 30 ngày, BE chưa chuyển", c: { status: "OVERDUE", forfeitProcessed: false }, can: false, handling: true },
    { name: "ACTIVE", c: { status: "ACTIVE" }, can: false, handling: false },
  ] as const)("$name → được xác nhận: $can, còn cần xử lý: $handling", ({ c, can, handling }) => {
    expect(canConfirmForfeitProcessed(c)).toBe(can)
    expect(needsForfeitHandling({ ...c, endDate: "2026-09-22" }, TODAY)).toBe(handling)
  })

  test("FORFEITED đã xử lý và hết nợ thì không còn trong danh sách cần theo dõi", () => {
    expect(needsFollowUp(contract(5, { status: "FORFEITED", forfeitProcessed: false }))).toBe(true)
    expect(needsFollowUp(contract(5, { status: "FORFEITED", forfeitProcessed: true }))).toBe(false)
  })

  test.each([
    { note: "", error: "Nhập ghi chú xử lý tài sản" },
    { note: "   ", error: "Nhập ghi chú xử lý tài sản" },
    { note: "Đã cắt", error: "Ghi chú ít nhất 10 ký tự" },
    { note: "Đã cắt khóa, có camera", error: null },
    { note: "x".repeat(501), error: "Ghi chú tối đa 500 ký tự" },
  ])("ghi chú '$note' → $error", ({ note, error }) => {
    expect(forfeitNoteError(note)).toBe(error)
  })
})
