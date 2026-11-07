// Quy tắc tính phạt quá hạn và chiết khấu tiền gia hạn tại quầy.
// Bám sát công thức backend: 30 ngày/tháng, chiết khấu 3/6/12 tháng = 5/10/15%.

/** Phí phạt trễ hạn cố định 50.000đ/ngày. */
export const OVERDUE_PENALTY_PER_DAY = 50_000

/** Chuẩn hóa thời gian tính gói: 30 ngày mỗi tháng. */
export const DAYS_PER_MONTH = 30

/** Các gói gia hạn hợp lệ tính theo tháng. */
export const RENEWAL_PACKAGES = [1, 2, 3, 6, 12] as const
export type RenewalMonths = (typeof RENEWAL_PACKAGES)[number]

/** Mức chiết khấu theo gói thuê: 3 tháng 5%, 6 tháng 10%, 12 tháng 15%. */
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

/** Tiền gia hạn theo ngày tùy chọn: (giá thuê tháng / 30) × số ngày. */
export function renewalAmountByDays(
  monthlyPrice: number | null | undefined,
  days: number
): number | null {
  if (monthlyPrice == null || monthlyPrice <= 0 || days <= 0) return null
  return Math.round((monthlyPrice / DAYS_PER_MONTH) * days)
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
