import { describe, expect, test } from "vitest"

import {
  ACTIVITY_CSV_HEADER,
  activityCsvRows,
  actionGroup,
  actionLabel,
  actorLabel,
  filterActivityLogs,
  isRangeValid,
  isSensitive,
} from "./auditRules"
import type { ActivityFilter, ActivityLogEntry } from "./types"

function log(
  activityLogId: number,
  createdAt: string,
  action: string,
  actorName: string | null,
  patch: Partial<ActivityLogEntry> = {}
): ActivityLogEntry {
  return {
    activityLogId,
    accountId: actorName === null ? null : activityLogId,
    actorName,
    actorRole: actorName === null ? null : "STAFF",
    action,
    description: null,
    createdAt,
    ipAddress: "10.0.0.1",
    ...patch,
  }
}

const LOGS = [
  log(1, "2026-10-12T08:00:00", "LOGIN_SUCCESS", "Nguyễn Văn Nhân Viên 1"),
  log(2, "2026-10-13T23:59:00", "APPROVE_FEE_DISCOUNT", "Trần Văn Quản Lý", {
    actorRole: "MANAGER",
    description: "Duyệt miễn giảm hóa đơn PEN-7001",
  }),
  log(3, "2026-10-14T00:00:00", "LOGIN_FAILED", "Lê Thị Khách", {
    ipAddress: "203.0.113.9",
    actorRole: "CUSTOMER",
  }),
  log(4, "2026-10-14T00:05:00", "EXPIRY_REMINDER_T7", null, {
    ipAddress: null,
  }),
  log(5, "2026-10-14T09:30:00", "EXPIRY_REMINDER_T3", null, {
    ipAddress: null,
  }),
]
const ALL: ActivityFilter = { query: "", action: "ALL", from: "", to: "" }
const ids = (f: ActivityFilter) =>
  filterActivityLogs(LOGS, f).map((l) => l.activityLogId)

describe("filterActivityLogs: Admin lọc theo người, thời gian, loại hành động", () => {
  test.each([
    {
      name: "không lọc → mới nhất lên đầu",
      filter: ALL,
      expected: [5, 4, 3, 2, 1],
    },
    {
      name: "theo người (không dấu)",
      filter: { ...ALL, query: "tran van quan ly" },
      expected: [2],
    },
    {
      name: "theo vai trò",
      filter: { ...ALL, query: "customer" },
      expected: [3],
    },
    {
      name: "theo mô tả",
      filter: { ...ALL, query: "pen-7001" },
      expected: [2],
    },
    { name: "theo IP", filter: { ...ALL, query: "203.0.113" }, expected: [3] },
    {
      name: "thao tác tự động tìm bằng 'hệ thống'",
      filter: { ...ALL, query: "he thong" },
      expected: [5, 4],
    },
    {
      name: "loại hành động",
      filter: { ...ALL, action: "LOGIN_SUCCESS" },
      expected: [1],
    },
    {
      name: "nhắc hạn gộp mọi mốc ngày",
      filter: { ...ALL, action: "EXPIRY_REMINDER" },
      expected: [5, 4],
    },
    {
      name: "chỉ ngày 13/10 (gồm 23:59)",
      filter: { ...ALL, from: "2026-10-13", to: "2026-10-13" },
      expected: [2],
    },
    {
      name: "từ 14/10 (gồm 00:00)",
      filter: { ...ALL, from: "2026-10-14" },
      expected: [5, 4, 3],
    },
    {
      name: "khoảng ngày ngược → rỗng",
      filter: { ...ALL, from: "2026-10-14", to: "2026-10-12" },
      expected: [],
    },
  ] as { name: string; filter: ActivityFilter; expected: number[] }[])(
    "$name",
    ({ filter, expected }) => {
      expect(ids(filter)).toEqual(expected)
    }
  )
})

describe("nhãn hành động, mức nhạy cảm, người thực hiện", () => {
  test.each([
    {
      action: "LOGIN_SUCCESS",
      label: "Đăng nhập",
      group: "LOGIN_SUCCESS",
      sensitive: false,
    },
    {
      action: "LOGIN_FAILED",
      label: "Đăng nhập thất bại",
      group: "LOGIN_FAILED",
      sensitive: true,
    },
    {
      action: "APPROVE_FEE_DISCOUNT",
      label: "Duyệt miễn giảm phí",
      group: "APPROVE_FEE_DISCOUNT",
      sensitive: true,
    },
    {
      action: "EXPIRY_REMINDER_T7",
      label: "Nhắc hạn hợp đồng (còn 7 ngày)",
      group: "EXPIRY_REMINDER",
      sensitive: false,
    },
    {
      action: "SOMETHING_NEW",
      label: "SOMETHING_NEW",
      group: "SOMETHING_NEW",
      sensitive: false,
    },
  ])("$action → '$label'", ({ action, label, group, sensitive }) => {
    expect(actionLabel(action)).toBe(label)
    expect(actionGroup(action)).toBe(group)
    expect(isSensitive(action)).toBe(sensitive)
  })

  test.each([
    { name: "có tên", entry: LOGS[1], expected: "Trần Văn Quản Lý" },
    {
      name: "không có tài khoản → Hệ thống",
      entry: LOGS[3],
      expected: "Hệ thống",
    },
    {
      name: "có tài khoản nhưng BE chưa trả tên",
      entry: { ...LOGS[0], actorName: null },
      expected: "Tài khoản #1",
    },
  ])("actorLabel: $name", ({ entry, expected }) => {
    expect(actorLabel(entry)).toBe(expected)
  })

  test.each([
    { from: "", to: "", ok: true },
    { from: "2026-10-12", to: "2026-10-12", ok: true },
    { from: "2026-10-13", to: "2026-10-12", ok: false },
  ])("isRangeValid($from, $to) → $ok", ({ from, to, ok }) => {
    expect(isRangeValid(from, to)).toBe(ok)
  })
})

describe("activityCsvRows: xuất đúng các dòng đang lọc", () => {
  test("mỗi dòng đủ cột như tiêu đề, thời gian dễ đọc, có cả nhãn và mã hành động", () => {
    const rows = activityCsvRows([LOGS[1]])
    expect(rows[0]).toHaveLength(ACTIVITY_CSV_HEADER.length)
    expect(rows[0][0]).toBe("2026-10-13 23:59:00")
    expect(rows[0][3]).toBe("Duyệt miễn giảm phí")
    expect(rows[0][4]).toBe("APPROVE_FEE_DISCOUNT")
  })
})
