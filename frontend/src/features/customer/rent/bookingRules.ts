// US-07: luật nghiệp vụ của form đặt kho. Hàm thuần (không phụ thuộc React, không tự đọc giờ hệ thống)
// để kiểm bằng bảng test DDT trong bookingRules.test.ts.

import { addDays, todayInVietnam } from "@/lib/format"

/** Giờ làm việc của nhân viên tại quầy cơ sở (08:00 - 20:00 hàng ngày) */
export const COUNTER_OPEN_HOUR = 8
export const COUNTER_CLOSE_HOUR = 20

/** Tối đa 7 ngày kể từ ngày đặt (BR-08) */
export const CHECKIN_MAX_OFFSET_DAYS = 7

/** Thuê theo ngày tùy chọn từ 7 đến 29 ngày; từ 30 ngày trở lên dùng gói tháng */
export const MIN_CUSTOM_DAYS = 7
export const MAX_CUSTOM_DAYS = 29

/** Chiết khấu theo gói tháng (1 tháng chuẩn hóa = 30 ngày) */
const PACKAGE_DISCOUNT: Record<number, number> = {
  30: 0,
  60: 0,
  90: 0.05,
  180: 0.1,
  360: 0.15,
}

/** Lấy giờ hiện tại theo múi giờ Việt Nam (0 - 23) */
export function getVietnamHour(now: Date = new Date()): number {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "numeric",
    hourCycle: "h23",
  }).format(now)
  return Number.parseInt(hourStr, 10)
}

/**
 * Các ngày Check-in hợp lệ (YYYY-MM-DD), tính theo giờ Việt Nam.
 * - Nếu thời gian hiện tại < 20:00: Khách được chọn từ Hôm nay (+0) đến 7 ngày tới (+7).
 * - Nếu thời gian hiện tại >= 20:00 (hết ca trực tại quầy): Ngày Check-in sớm nhất là Ngày mai (+1).
 */
export function getCheckInDates(now: Date = new Date()): string[] {
  const today = todayInVietnam(now)
  const hour = getVietnamHour(now)
  const startOffset = hour >= COUNTER_CLOSE_HOUR ? 1 : 0

  const dates: string[] = []
  for (let i = startOffset; i <= CHECKIN_MAX_OFFSET_DAYS; i++) {
    dates.push(addDays(today, i))
  }
  return dates
}

/** Kiểm tra ngày được chọn có phải là ngày hôm nay theo giờ VN hay không */
export function isSameDayCheckIn(dateStr: string, now: Date = new Date()): boolean {
  return dateStr === todayInVietnam(now)
}

/** Kiểm tra quầy hiện tại có đang trong khung giờ phục vụ (08:00 - 20:00) hay không */
export function isCounterOpenNow(now: Date = new Date()): boolean {
  const hour = getVietnamHour(now)
  return hour >= COUNTER_OPEN_HOUR && hour < COUNTER_CLOSE_HOUR
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
 * Tổng tiền thuê ước tính.
 * - 7–29 ngày: số ngày × giá ngày, không chiết khấu.
 * - Gói 30/60/90/180/360 ngày: giá tháng × số tháng, giảm 0/0/5/10/15%.
 * Giá ngày và giá tháng nhận từ dữ liệu ô kho (đã gồm phụ thu điều hòa 20%).
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
