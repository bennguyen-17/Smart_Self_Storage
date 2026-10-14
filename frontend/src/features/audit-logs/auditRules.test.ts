import { describe, expect, test } from "vitest"

import { actionLabel, auditCsvRows, AUDIT_CSV_HEADER, filterAuditLogs, isRangeValid, isSensitive } from "./auditRules"
import type { AuditFilter, AuditLogEntry } from "./types"

function log(logId: number, createdAt: string, action: string, actorName: string, patch: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    logId,
    accountId: logId,
    actorName,
    actorRole: "STAFF",
    facilityCode: "HN-01",
    action,
    target: null,
    before: null,
    after: null,
    createdAt,
    ipAddress: "10.0.0.1",
    ...patch,
  }
}

const LOGS = [
  log(1, "2026-10-12T08:00:00", "LOGIN", "Nguyễn Văn Nhân Viên 1"),
  log(2, "2026-10-13T23:59:00", "FEE_DISCOUNTED", "Trần Văn Quản Lý", { actorRole: "MANAGER", target: "PEN-7001" }),
  log(3, "2026-10-14T00:00:00", "LOGIN_FAILED", "Không rõ", { ipAddress: "203.0.113.9", facilityCode: null }),
  log(4, "2026-10-14T09:30:00", "ROLE_CHANGED", "Quản Trị Viên", { actorRole: "ADMIN", target: "account #12" }),
]
const ALL: AuditFilter = { query: "", action: "ALL", from: "", to: "" }
const ids = (f: AuditFilter) => filterAuditLogs(LOGS, f).map((l) => l.logId)

describe("filterAuditLogs: Admin lọc theo người, thời gian, loại hành động", () => {
  test.each([
    { name: "không lọc → mới nhất lên đầu", filter: ALL, expected: [4, 3, 2, 1] },
    { name: "theo người (không dấu)", filter: { ...ALL, query: "tran van quan ly" }, expected: [2] },
    { name: "theo vai trò", filter: { ...ALL, query: "admin" }, expected: [4] },
    { name: "theo đối tượng", filter: { ...ALL, query: "pen-7001" }, expected: [2] },
    { name: "theo IP", filter: { ...ALL, query: "203.0.113" }, expected: [3] },
    { name: "loại hành động", filter: { ...ALL, action: "LOGIN" }, expected: [1] },
    { name: "chỉ ngày 13/10 (gồm 23:59)", filter: { ...ALL, from: "2026-10-13", to: "2026-10-13" }, expected: [2] },
    { name: "từ 14/10 (gồm 00:00)", filter: { ...ALL, from: "2026-10-14" }, expected: [4, 3] },
    { name: "khoảng ngày ngược → rỗng", filter: { ...ALL, from: "2026-10-14", to: "2026-10-12" }, expected: [] },
  ] as { name: string; filter: AuditFilter; expected: number[] }[])("$name", ({ filter, expected }) => {
    expect(ids(filter)).toEqual(expected)
  })
})

describe("nhãn, mức nhạy cảm, khoảng ngày", () => {
  test.each([
    { action: "LOGIN", label: "Đăng nhập", sensitive: false },
    { action: "LOGIN_FAILED", label: "Đăng nhập thất bại", sensitive: true },
    { action: "FEE_DISCOUNTED", label: "Miễn / giảm phí", sensitive: true },
    { action: "SOMETHING_NEW", label: "SOMETHING_NEW", sensitive: false },
  ])("$action → '$label', nhạy cảm: $sensitive", ({ action, label, sensitive }) => {
    expect(actionLabel(action)).toBe(label)
    expect(isSensitive(action)).toBe(sensitive)
  })

  test.each([
    { from: "", to: "", ok: true },
    { from: "2026-10-12", to: "2026-10-12", ok: true },
    { from: "2026-10-13", to: "2026-10-12", ok: false },
  ])("isRangeValid($from, $to) → $ok", ({ from, to, ok }) => {
    expect(isRangeValid(from, to)).toBe(ok)
  })
})

describe("auditCsvRows: xuất đúng các dòng đang lọc", () => {
  test("mỗi dòng đủ cột như tiêu đề, thời gian dễ đọc, hành động bằng chữ", () => {
    const rows = auditCsvRows([LOGS[1]])
    expect(rows[0]).toHaveLength(AUDIT_CSV_HEADER.length)
    expect(rows[0][0]).toBe("2026-10-13 23:59:00")
    expect(rows[0][4]).toBe("Miễn / giảm phí")
  })
})
