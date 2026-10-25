import { describe, expect, test } from "vitest"

import { barWidths, buildReportSections, donutArcs, percentOf, reportCsvRows, unitMix, isReportRangeValid, presetRange, rangeLabel } from "./reportRules"
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

  test("dòng đầu ghi khoảng thời gian của số liệu", () => {
    expect(reportCsvRows(D)[0]).toEqual(["Phạm vi", "Khoảng thời gian", "Từ trước đến nay"])
    expect(reportCsvRows(D, { from: "2026-10-01", to: "2026-10-23" })[0]).toEqual([
      "Phạm vi",
      "Khoảng thời gian",
      "Từ 01/10/2026 đến 23/10/2026",
    ])
  })
})

describe("unitMix: các phần của thanh ô kho cộng đủ 100%", () => {
  test.each([
    { name: "dữ liệu mẫu", d: D, expected: [80, 4, 12, 4] },
    { name: "chia lẻ 1/3", d: { ...D, occupiedUnits: 1, reservedUnits: 1, availableUnits: 1, maintenanceUnits: 0 }, expected: [33.4, 33.3, 33.3, 0] },
    { name: "cơ sở chưa có ô", d: { ...D, occupiedUnits: 0, reservedUnits: 0, availableUnits: 0, maintenanceUnits: 0 }, expected: [0, 0, 0, 0] },
  ])("$name → $expected", ({ d, expected }) => {
    const mix = unitMix(d)
    expect(mix.map((s) => s.percent)).toEqual(expected)
    expect(mix.map((s) => s.key)).toEqual(["occupied", "reserved", "available", "maintenance"])
  })
})

describe("barWidths: độ dài thanh theo giá trị lớn nhất", () => {
  test.each([
    { values: [110, 55, 0], expected: [100, 50, 0] },
    { values: [100, -50], expected: [100, 50] },
    { values: [1000, 1], expected: [100, 2] },
    { values: [0, 0], expected: [0, 0] },
    { values: [], expected: [] },
  ])("$values → $expected", ({ values, expected }) => {
    expect(barWidths(values)).toEqual(expected)
  })
})

describe("donutArcs: cung của biểu đồ vành khuyên", () => {
  const seg = (key: "occupied" | "reserved" | "available" | "maintenance", percent: number) => ({ key, label: key, count: percent, percent })
  test("4 lát: nối tiếp nhau, mỗi lát trừ 1% khe", () => {
    expect(donutArcs([seg("occupied", 80), seg("reserved", 4), seg("available", 12), seg("maintenance", 4)])).toEqual([
      { key: "occupied", start: 0, length: 79 },
      { key: "reserved", start: 80, length: 3 },
      { key: "available", start: 84, length: 11 },
      { key: "maintenance", start: 96, length: 3 },
    ])
  })
  test("bỏ lát 0%", () => {
    expect(donutArcs([seg("occupied", 50), seg("reserved", 0), seg("available", 50), seg("maintenance", 0)]).map((a) => a.key)).toEqual(["occupied", "available"])
  })
  test("chỉ 1 lát → trọn vòng, không khe", () => {
    expect(donutArcs([seg("occupied", 0), seg("reserved", 0), seg("available", 100), seg("maintenance", 0)])).toEqual([{ key: "available", start: 0, length: 100 }])
  })
  test("lát rất nhỏ vẫn còn thấy (tối thiểu 0,5%)", () => {
    expect(donutArcs([seg("occupied", 99.6), seg("maintenance", 0.4)])[1].length).toBe(0.5)
  })
  test("không có ô nào → không có cung", () => {
    expect(donutArcs([seg("occupied", 0), seg("available", 0)])).toEqual([])
  })
})

describe("Khoảng thời gian của báo cáo", () => {
  test.each([
    { preset: "ALL", today: "2026-10-23", expected: { from: "", to: "" } },
    { preset: "THIS_MONTH", today: "2026-10-23", expected: { from: "2026-10-01", to: "2026-10-23" } },
    { preset: "LAST_MONTH", today: "2026-10-23", expected: { from: "2026-09-01", to: "2026-09-30" } },
    { preset: "LAST_MONTH", today: "2026-01-05", expected: { from: "2025-12-01", to: "2025-12-31" } },
    { preset: "LAST_MONTH", today: "2028-03-10", expected: { from: "2028-02-01", to: "2028-02-29" } },
    { preset: "LAST_30_DAYS", today: "2026-10-23", expected: { from: "2026-09-24", to: "2026-10-23" } },
    { preset: "LAST_30_DAYS", today: "2026-01-10", expected: { from: "2025-12-12", to: "2026-01-10" } },
  ] as const)("$preset ngày $today → $expected.from … $expected.to", ({ preset, today, expected }) => {
    expect(presetRange(preset, today)).toEqual(expected)
  })

  test("Tùy chọn: không tự đổi ngày", () => {
    expect(presetRange("CUSTOM", "2026-10-23")).toBeNull()
  })

  test.each([
    { range: { from: "", to: "" }, ok: true, label: "Từ trước đến nay" },
    { range: { from: "2026-10-01", to: "2026-10-23" }, ok: true, label: "Từ 01/10/2026 đến 23/10/2026" },
    { range: { from: "2026-10-23", to: "2026-10-23" }, ok: true, label: "Từ 23/10/2026 đến 23/10/2026" },
    { range: { from: "2026-10-01", to: "" }, ok: true, label: "Từ 01/10/2026" },
    { range: { from: "", to: "2026-10-23" }, ok: true, label: "Đến 23/10/2026" },
    { range: { from: "2026-10-24", to: "2026-10-23" }, ok: false, label: "Từ 24/10/2026 đến 23/10/2026" },
  ])("$label → hợp lệ: $ok", ({ range, ok, label }) => {
    expect(isReportRangeValid(range)).toBe(ok)
    expect(rangeLabel(range)).toBe(label)
  })
})
