import { describe, expect, test } from "vitest"

import { filterGateLogs, isDateRangeValid } from "./gateLogRules"
import type { GateLog, GateLogFilter } from "./types"

function log(id: number, openedAt: string, customerId: number, reason: string, accountId = 5): GateLog {
  return {
    auditLogId: id,
    accountId,
    facilityId: 1,
    customerId,
    action: "MANUAL_GATE_OPEN",
    openedAt,
    reason,
    createdAt: openedAt,
  }
}

const LOGS: GateLog[] = [
  log(1, "2026-10-10T08:15:00", 101, "Khách quên mã PIN, dùng Thẻ Master"),
  log(2, "2026-10-11T23:59:00", 102, "Mất điện đầu đọc, mở bằng chìa cơ"),
  log(3, "2026-10-12T00:00:00", 101, "Cổng kẹt, mở thủ công", 7),
  log(4, "2026-10-13T17:40:00", 205, "Khách quên mã PIN"),
]

const ALL: GateLogFilter = { query: "", from: "", to: "" }
const ids = (filter: GateLogFilter) => filterGateLogs(LOGS, filter).map((l) => l.auditLogId)

describe("filterGateLogs: Manager tìm và lọc nhật ký mở cổng thủ công", () => {
  test.each([
    { name: "không lọc → mới nhất lên đầu", filter: ALL, expected: [4, 3, 2, 1] },
    { name: "theo mã khách 101", filter: { ...ALL, query: "101" }, expected: [3, 1] },
    { name: "theo lý do, không phân biệt hoa thường", filter: { ...ALL, query: "QUÊN MÃ PIN" }, expected: [4, 1] },
    { name: "theo lý do, gõ không dấu", filter: { ...ALL, query: "the master" }, expected: [1] },
    { name: "theo mã nhân viên 7", filter: { ...ALL, query: "7" }, expected: [3] },
    { name: "từ khóa chỉ có khoảng trắng = không lọc", filter: { ...ALL, query: "   " }, expected: [4, 3, 2, 1] },
    { name: "không khớp gì", filter: { ...ALL, query: "xyz" }, expected: [] },
    // Biên ngày: 23:59 thuộc ngày 11, 00:00 thuộc ngày 12; gồm cả 2 đầu
    { name: "chỉ ngày 11/10 (gồm 23:59)", filter: { ...ALL, from: "2026-10-11", to: "2026-10-11" }, expected: [2] },
    { name: "từ 12/10 (gồm 00:00)", filter: { ...ALL, from: "2026-10-12" }, expected: [4, 3] },
    { name: "đến 11/10", filter: { ...ALL, to: "2026-10-11" }, expected: [2, 1] },
    { name: "ngày + từ khóa", filter: { query: "quen ma pin", from: "2026-10-11", to: "" }, expected: [4] },
    { name: "khoảng ngày ngược → không có kết quả", filter: { ...ALL, from: "2026-10-13", to: "2026-10-10" }, expected: [] },
  ])("$name", ({ filter, expected }) => {
    expect(ids(filter)).toEqual(expected)
  })

  test("không làm đổi thứ tự mảng gốc", () => {
    const copy = [...LOGS]
    filterGateLogs(LOGS, ALL)
    expect(LOGS).toEqual(copy)
  })
})

describe("isDateRangeValid", () => {
  test.each([
    { from: "", to: "", ok: true },
    { from: "2026-10-10", to: "", ok: true },
    { from: "", to: "2026-10-10", ok: true },
    { from: "2026-10-10", to: "2026-10-10", ok: true },
    { from: "2026-10-10", to: "2026-10-11", ok: true },
    { from: "2026-10-11", to: "2026-10-10", ok: false },
  ])("$from → $to: $ok", ({ from, to, ok }) => {
    expect(isDateRangeValid(from, to)).toBe(ok)
  })
})
