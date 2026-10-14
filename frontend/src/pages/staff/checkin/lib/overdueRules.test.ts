import { describe, expect, test } from "vitest"

import {
  OVERDUE_PENALTY_PER_DAY,
  penaltyTotal,
  renewalAmount,
  renewalDiscountPercent,
  renewalPackageLabel,
} from "./overdueRules"

// US-20: phạt quá hạn 50.000đ/ngày (BR-30) & chiết khấu gói gia hạn (BR-29).
describe("overdueRules: phạt quá hạn (BR-30)", () => {
  test("phí phạt cố định 50.000đ/ngày", () => {
    expect(OVERDUE_PENALTY_PER_DAY).toBe(50_000)
  })

  test("tổng phạt = số ngày × 50.000đ", () => {
    expect(penaltyTotal(3)).toBe(150_000)
    expect(penaltyTotal(0)).toBe(0)
    expect(penaltyTotal(null)).toBe(0)
  })

  test("số ngày âm/không hợp lệ → 0", () => {
    expect(penaltyTotal(-5)).toBe(0)
  })
})

describe("overdueRules: chiết khấu & tiền gia hạn (BR-29)", () => {
  test.each([
    [1, 0],
    [2, 0],
    [3, 5],
    [6, 10],
    [12, 15],
  ])("gói %i tháng → chiết khấu %i%%", (months, percent) => {
    expect(renewalDiscountPercent(months)).toBe(percent)
  })

  test("tiền gia hạn áp chiết khấu đúng", () => {
    // 1.500.000 × 3 = 4.500.000, giảm 5% = 4.275.000
    expect(renewalAmount(1_500_000, 3)).toBe(4_275_000)
    // 1.500.000 × 12 = 18.000.000, giảm 15% = 15.300.000
    expect(renewalAmount(1_500_000, 12)).toBe(15_300_000)
    // 1 tháng không chiết khấu
    expect(renewalAmount(1_500_000, 1)).toBe(1_500_000)
  })

  test("thiếu giá tháng → không tính được", () => {
    expect(renewalAmount(null, 3)).toBeNull()
    expect(renewalAmount(0, 3)).toBeNull()
  })

  test("nhãn gói có chiết khấu", () => {
    expect(renewalPackageLabel(3)).toBe("3 tháng (-5%)")
    expect(renewalPackageLabel(1)).toBe("1 tháng")
  })
})
