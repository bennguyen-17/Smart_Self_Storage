// US-20: Quy tắc tính phạt quá hạn & tiền gia hạn tại quầy (BR-29, BR-30).
// Bám sát công thức backend: 30 ngày/tháng, chiết khấu 3/6/12 tháng = 5/10/15%.

/** BR-30: phí phạt trễ hạn cố định 50.000đ/ngày. */
export const OVERDUE_PENALTY_PER_DAY = 50_000

/** BR-13/BR-29: chuẩn hóa 30 ngày mỗi tháng. */
export const DAYS_PER_MONTH = 30

/** BR-29: các gói gia hạn hợp lệ (tháng). */
export const RENEWAL_PACKAGES = [1, 2, 3, 6, 12] as const
export type RenewalMonths = (typeof RENEWAL_PACKAGES)[number]

/** BR-29: chiết khấu gói tháng — 3 tháng 5%, 6 tháng 10%, 12 tháng 15%. */
export function renewalDiscountPercent(months: number): number {
  if (months >= 12) return 15
  if (months >= 6) return 10
  if (months >= 3) return 5
  return 0
}

/** Tiền gia hạn = giá thuê tháng × số tháng − chiết khấu (làm tròn đồng). */
export function renewalAmount(
  monthlyPrice: number | null | undefined,
  months: number
): number | null {
  if (monthlyPrice == null || monthlyPrice <= 0 || months <= 0) return null
  const base = monthlyPrice * months
  return Math.round(base * (1 - renewalDiscountPercent(months) / 100))
}

/** Tổng tiền phạt theo số ngày quá hạn. */
export function penaltyTotal(overdueDays: number | null | undefined): number {
  return Math.max(0, overdueDays ?? 0) * OVERDUE_PENALTY_PER_DAY
}

/** Nhãn gói gia hạn kèm chiết khấu, ví dụ "3 tháng (-5%)". */
export function renewalPackageLabel(months: number): string {
  const percent = renewalDiscountPercent(months)
  return percent > 0 ? `${months} tháng (-${percent}%)` : `${months} tháng`
}
