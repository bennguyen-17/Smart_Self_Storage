import { describe, expect, test } from "vitest"

import { calcRentalTotal, clampRentalDays, getCheckInDates } from "./bookingRules"

describe("getCheckInDates: ngày Check-in chỉ từ Hôm nay+1 đến Hôm nay+7, giờ Việt Nam (US-07, BR-17)", () => {
  test.each([
    { now: "2026-10-07T03:00:00Z", vn: "10:00 07/10", first: "2026-10-08", last: "2026-10-14" },
    // 06:30 sáng giờ VN vẫn là ngày 06/10 theo UTC → lỗi cũ dùng toISOString() lệch 1 ngày ở đây
    { now: "2026-10-06T23:30:00Z", vn: "06:30 07/10", first: "2026-10-08", last: "2026-10-14" },
    { now: "2026-10-07T16:59:00Z", vn: "23:59 07/10", first: "2026-10-08", last: "2026-10-14" },
    { now: "2026-10-07T17:00:00Z", vn: "00:00 08/10", first: "2026-10-09", last: "2026-10-15" },
    { now: "2026-12-28T03:00:00Z", vn: "qua năm mới", first: "2026-12-29", last: "2027-01-04" },
  ])("$vn → $first … $last", ({ now, first, last }) => {
    const dates = getCheckInDates(new Date(now))
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe(first)
    expect(dates[6]).toBe(last)
  })

  test("không bao giờ chứa ngày hôm nay", () => {
    const now = new Date("2026-10-07T03:00:00Z")
    expect(getCheckInDates(now)).not.toContain("2026-10-07")
  })
})

describe("clampRentalDays: thuê theo ngày từ 7 đến 29 (US-07, BR-13)", () => {
  test.each([
    { input: "7", expected: 7 },
    { input: "15", expected: 15 },
    { input: "29", expected: 29 },
    { input: "30", expected: 29 },
    { input: "100", expected: 29 },
    { input: "6", expected: 7 },
    { input: "0", expected: 7 },
    { input: "-5", expected: 7 },
    { input: "", expected: 7 },
    { input: "abc", expected: 7 },
    { input: "10.7", expected: 10 },
  ])("'$input' → $expected", ({ input, expected }) => {
    expect(clampRentalDays(input)).toBe(expected)
  })
})

describe("calcRentalTotal: tổng tiền thuê theo gói và chiết khấu (US-07, BR-13, BR-09)", () => {
  // Size M theo BR-08: 60.000đ/ngày, 1.200.000đ/tháng. Kho điều hòa +20%: 72.000đ/ngày, 1.440.000đ/tháng.
  const M = { dailyPrice: 60_000, monthlyPrice: 1_200_000 }
  const M_CLIMATE = { dailyPrice: 72_000, monthlyPrice: 1_440_000 }

  test.each([
    { name: "10 ngày lẻ", unit: M, days: 10, raw: 600_000, rate: 0, total: 600_000 },
    { name: "29 ngày lẻ (tối đa)", unit: M, days: 29, raw: 1_740_000, rate: 0, total: 1_740_000 },
    { name: "gói 1 tháng", unit: M, days: 30, raw: 1_200_000, rate: 0, total: 1_200_000 },
    { name: "gói 2 tháng", unit: M, days: 60, raw: 2_400_000, rate: 0, total: 2_400_000 },
    { name: "gói 3 tháng −5%", unit: M, days: 90, raw: 3_600_000, rate: 0.05, total: 3_420_000 },
    { name: "gói 6 tháng −10%", unit: M, days: 180, raw: 7_200_000, rate: 0.1, total: 6_480_000 },
    { name: "gói 12 tháng −15%", unit: M, days: 360, raw: 14_400_000, rate: 0.15, total: 12_240_000 },
    { name: "điều hòa, gói 12 tháng −15%", unit: M_CLIMATE, days: 360, raw: 17_280_000, rate: 0.15, total: 14_688_000 },
  ])("$name → $total", ({ unit, days, raw, rate, total }) => {
    const result = calcRentalTotal({ ...unit, days })
    expect(result.raw).toBe(raw)
    expect(result.discountRate).toBe(rate)
    expect(result.total).toBe(total)
    expect(result.discount).toBe(raw - total)
  })
})
