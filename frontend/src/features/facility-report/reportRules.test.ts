import { describe, expect, test } from "vitest"

import { buildReportSections, percentOf, reportCsvRows } from "./reportRules"
import type { ManagerDashboard } from "./types"

const D: ManagerDashboard = {
  facilityId: 1, facilityName: "SmartStorage Cầu Giấy (HN-01)", facilityCode: "HN-01",
  totalUnits: 50, availableUnits: 6, occupiedUnits: 40, reservedUnits: 2, maintenanceUnits: 2, occupancyRate: 84,
  activeContracts: 40, pendingCheckinContracts: 2, overdueContracts: 1, terminatedContracts: 12,
  rentalRevenue: 110_000_000, extensionRevenue: 4_000_000, penaltyRevenue: 1_500_000, compensationRevenue: 2_000_000,
  totalRefunds: 3_000_000, netRevenue: 114_500_000,
  depositHolding: 15_000_000, forfeitedDeposit: 1_000_000, waivedAmount: 500_000,
  totalTickets: 20, submittedTickets: 3, inProgressTickets: 2, resolvedTickets: 15, slaBreachedTickets: 1,
}

const section = (key: string) => buildReportSections(D).find((s) => s.key === key)!
const value = (key: string, label: string) => section(key).rows.find((r) => r.label === label)?.value

describe("percentOf", () => {
  test.each([
    { part: 1, total: 20, expected: 5 },
    { part: 1, total: 3, expected: 33.3 },
    { part: 0, total: 0, expected: 0 },
    { part: 5, total: 0, expected: 0 },
  ])("$part/$total → $expected%", ({ part, total, expected }) => {
    expect(percentOf(part, total)).toBe(expected)
  })
})

describe("buildReportSections: đúng AC về doanh thu và tiền cọc", () => {
  test("bảng doanh thu cộng các khoản rồi trừ hoàn tiền, khớp doanh thu thuần của BE", () => {
    const rows = section("revenue").rows.filter((r) => !r.emphasis)
    const sum = rows.reduce((acc, r) => acc + r.value, 0)
    expect(sum).toBe(D.netRevenue)
    expect(value("revenue", "Đã hoàn tiền")).toBe(-3_000_000)
  })

  test("cọc đang giữ KHÔNG nằm trong bảng doanh thu", () => {
    expect(section("revenue").rows.some((r) => /cọc/i.test(r.label))).toBe(false)
    expect(value("deposits", "Cọc đang giữ")).toBe(15_000_000)
  })

  test("cọc bị tịch thu và miễn/giảm là dòng riêng", () => {
    expect(value("deposits", "Cọc bị tịch thu")).toBe(1_000_000)
    expect(value("deposits", "Đã miễn / giảm phí")).toBe(500_000)
  })

  test.each([
    { overdue: 0, breached: 0, overdueEmphasis: false, slaRate: 100 },
    { overdue: 3, breached: 4, overdueEmphasis: true, slaRate: 80 },
  ])("quá hạn=$overdue, trễ SLA=$breached → nhấn mạnh=$overdueEmphasis, đúng SLA $slaRate%", ({ overdue, breached, overdueEmphasis, slaRate }) => {
    const sections = buildReportSections({ ...D, overdueContracts: overdue, slaBreachedTickets: breached })
    const contracts = sections.find((s) => s.key === "contracts")!
    expect(contracts.rows.find((r) => r.label === "Quá hạn")?.emphasis).toBe(overdueEmphasis)
    expect(sections.find((s) => s.key === "tickets")!.rows.find((r) => r.label === "Tỷ lệ đúng SLA")?.value).toBe(slaRate)
  })
})

describe("reportCsvRows: file CSV đúng số liệu đang xem", () => {
  test("mỗi dòng gồm Nhóm, Chỉ số, Giá trị (số thô)", () => {
    const rows = reportCsvRows(D)
    expect(rows).toContainEqual(["Doanh thu", "Doanh thu thuần", 114_500_000])
    expect(rows).toContainEqual(["Ô kho", "Tỷ lệ lấp đầy", 84])
    expect(rows.every((r) => r.length === 3)).toBe(true)
  })
})
