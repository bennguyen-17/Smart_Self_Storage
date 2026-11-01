import { afterEach, describe, expect, test } from "vitest"

import { badgeText, countNewSince, markSeen, readLastSeen } from "./unreadRules"

const SEEN = Date.parse("2026-11-01T10:00:00")

describe("countNewSince: đếm mục phát sinh sau lần cuối xem", () => {
  test.each([
    { name: "chưa có mốc (lần đầu) → không dội dữ liệu cũ", times: ["2026-11-01T11:00:00"], lastSeen: null, expected: 0 },
    { name: "2 mục sau mốc, 1 mục trước", times: ["2026-11-01T09:59:59", "2026-11-01T10:00:01", "2026-11-01T12:00:00"], lastSeen: SEEN, expected: 2 },
    { name: "đúng bằng mốc thì đã xem", times: ["2026-11-01T10:00:00"], lastSeen: SEEN, expected: 0 },
    { name: "bỏ qua thời gian trống hoặc sai định dạng", times: [null, undefined, "", "không phải ngày", "2026-11-01T10:30:00"], lastSeen: SEEN, expected: 1 },
    { name: "danh sách rỗng", times: [], lastSeen: SEEN, expected: 0 },
  ])("$name → $expected", ({ times, lastSeen, expected }) => {
    expect(countNewSince(times, lastSeen)).toBe(expected)
  })
})

describe("badgeText: chữ trong chấm tròn", () => {
  test.each([
    { count: 0, expected: null },
    { count: -1, expected: null },
    { count: 1, expected: "1" },
    { count: 99, expected: "99" },
    { count: 100, expected: "99+" },
  ])("$count → $expected", ({ count, expected }) => {
    expect(badgeText(count)).toBe(expected)
  })
})

describe("mốc đã xem lưu theo từng tài khoản và từng trang", () => {
  afterEach(() => localStorage.clear())

  test("lưu rồi đọc lại đúng; tài khoản khác, trang khác không dùng chung", () => {
    markSeen(3, "tickets", SEEN)
    expect(readLastSeen(3, "tickets")).toBe(SEEN)
    expect(readLastSeen(3, "refunds")).toBeNull()
    expect(readLastSeen(4, "tickets")).toBeNull()
  })
})
