import { describe, expect, test } from "vitest"
import { formatDate, maskCccd, todayInVietnam } from "./format"

describe("maskCccd: che số CCCD khi hiển thị trong bảng", () => {
  test.each([
    { input: "001099012345", expected: "0010******45" },
    { input: "079301006677", expected: "0793******77" },
    { input: "123456", expected: "******" },
    { input: "", expected: "—" },
    { input: null, expected: "—" },
  ])("$input → $expected", ({ input, expected }) => {
    expect(maskCccd(input)).toBe(expected)
  })
})

describe("formatDate: YYYY-MM-DD → DD/MM/YYYY", () => {
  test.each([
    { input: "2026-09-26", expected: "26/09/2026" },
    { input: "2026-09-26T17:00:00Z", expected: "26/09/2026" },
    { input: "26/09/2026", expected: "26/09/2026" },
    { input: null, expected: "—" },
  ])("$input → $expected", ({ input, expected }) => {
    expect(formatDate(input)).toBe(expected)
  })
})

describe("todayInVietnam: ngày hôm nay theo giờ Việt Nam (UTC+7)", () => {
  test.each([
    { now: "2026-09-26T16:59:00Z", expected: "2026-09-26" },
    { now: "2026-09-26T17:00:00Z", expected: "2026-09-27" },
    { now: "2026-09-26T18:30:00Z", expected: "2026-09-27" },
  ])("UTC $now → VN $expected", ({ now, expected }) => {
    expect(todayInVietnam(new Date(now))).toBe(expected)
  })
})
