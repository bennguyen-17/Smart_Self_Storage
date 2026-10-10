// US-07: luật nghiệp vụ của form đặt kho. Hàm thuần (không phụ thuộc React, không tự đọc giờ hệ thống)
// để kiểm bằng bảng test DDT trong bookingRules.test.ts.

import { addDays, todayInVietnam } from "@/lib/format"

/** BR-17: khách chỉ được chọn ngày Check-in từ Hôm nay + 1 đến Hôm nay + 7 */
export const CHECKIN_MIN_OFFSET_DAYS = 1
export const CHECKIN_MAX_OFFSET_DAYS = 7

/** BR-13: thuê theo ngày tùy chọn từ 7 đến 29 ngày; từ 30 ngày trở lên dùng gói tháng */
export const MIN_CUSTOM_DAYS = 7
export const MAX_CUSTOM_DAYS = 29

/** BR-13: chiết khấu theo gói tháng (1 tháng chuẩn hóa = 30 ngày) */
const PACKAGE_DISCOUNT: Record<number, number> = {
  30: 0,
  60: 0,
  90: 0.05,
  180: 0.1,
  360: 0.15,
}

/**
 * Các ngày Check-in hợp lệ (YYYY-MM-DD), tính theo giờ Việt Nam.
 * Nhận `now` làm tham số thay vì tự gọi `new Date()` để test được mọi thời điểm (ví dụ 06:30 sáng).
 */
export function getCheckInDates(now: Date): string[] {
  const today = todayInVietnam(now)
  const dates: string[] = []
  for (let i = CHECKIN_MIN_OFFSET_DAYS; i <= CHECKIN_MAX_OFFSET_DAYS; i++) {
    dates.push(addDays(today, i))
  }
  return dates
}

/** Số ngày thuê tùy chọn hợp lệ: ép về khoảng 7–29; nhập rỗng, chữ hoặc số âm thì về 7 */
export function clampRentalDays(input: string): number {
  const days = Math.floor(Number(input))
  if (!Number.isFinite(days) || days < MIN_CUSTOM_DAYS) return MIN_CUSTOM_DAYS
  return Math.min(days, MAX_CUSTOM_DAYS)
}

export interface RentalTotal {
  raw: number
  discountRate: number
  discount: number
  total: number
}

/**
 * BR-13: tổng tiền thuê ước tính.
 * - 7–29 ngày: số ngày × giá ngày, không chiết khấu.
 * - Gói 30/60/90/180/360 ngày: giá tháng × số tháng, giảm 0/0/5/10/15%.
 * Giá ngày và giá tháng nhận từ dữ liệu ô kho (đã gồm phụ thu điều hòa 20% theo BR-09, xem Q-01).
 * Đây là số ƯỚC TÍNH để hiển thị; số chính thức do BE tính khi tạo đơn.
 */
export function calcRentalTotal(params: {
  dailyPrice: number
  monthlyPrice: number
  days: number
}): RentalTotal {
  const { dailyPrice, monthlyPrice, days } = params
  const isPackage = days in PACKAGE_DISCOUNT
  const raw = isPackage ? monthlyPrice * (days / 30) : dailyPrice * days
  const discountRate = isPackage ? PACKAGE_DISCOUNT[days] : 0
  const discount = Math.round(raw * discountRate)
  return { raw, discountRate, discount, total: raw - discount }
}
