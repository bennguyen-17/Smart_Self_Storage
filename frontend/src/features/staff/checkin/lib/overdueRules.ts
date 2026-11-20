// Quy tắc tính phạt quá hạn và chiết khấu gia hạn (30 ngày/tháng; 3/6/12 tháng giảm 5/10/15%)

export const OVERDUE_PENALTY_PER_DAY = 50_000

export const DAYS_PER_MONTH = 30

export const RENEWAL_PACKAGES = [1, 2, 3, 6, 12] as const
export type RenewalMonths = (typeof RENEWAL_PACKAGES)[number]

export function renewalDiscountPercent(months: number): number {
  if (months >= 12) return 15
  if (months >= 6) return 10
  if (months >= 3) return 5
  return 0
}

export function renewalAmount(
  monthlyPrice: number | null | undefined,
  months: number
): number | null {
  if (monthlyPrice == null || monthlyPrice <= 0 || months <= 0) return null
  const base = monthlyPrice * months
  return Math.round(base * (1 - renewalDiscountPercent(months) / 100))
}

export function renewalAmountByDays(
  monthlyPrice: number | null | undefined,
  days: number
): number | null {
  if (monthlyPrice == null || monthlyPrice <= 0 || days <= 0) return null
  return Math.round((monthlyPrice / DAYS_PER_MONTH) * days)
}

export function penaltyTotal(overdueDays: number | null | undefined): number {
  return Math.max(0, overdueDays ?? 0) * OVERDUE_PENALTY_PER_DAY
}

export function renewalPackageLabel(months: number): string {
  const percent = renewalDiscountPercent(months)
  return percent > 0 ? `${months} tháng (-${percent}%)` : `${months} tháng`
}
