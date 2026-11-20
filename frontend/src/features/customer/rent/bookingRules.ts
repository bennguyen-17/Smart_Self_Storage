// Quy tắc tính giá và kiểm tra điều kiện đặt thuê kho

import { addDays, todayInVietnam } from "@/lib/format"

/** Giờ làm việc của nhân viên tại quầy cơ sở (07:00 - 20:00 hàng ngày) */
export const COUNTER_OPEN_HOUR = 7
export const COUNTER_CLOSE_HOUR = 20

/** Tối đa 7 ngày kể từ ngày đặt kho */
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

export function getVietnamHour(now: Date = new Date()): number {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "numeric",
    hourCycle: "h23",
  }).format(now)
  return Number.parseInt(hourStr, 10)
}

// Danh sách ngày nhận kho hợp lệ (YYYY-MM-DD): từ ngày mai đến 7 ngày tới theo giờ VN
export function getCheckInDates(now: Date = new Date()): string[] {
  const today = todayInVietnam(now)

  const dates: string[] = []
  for (let i = 1; i <= CHECKIN_MAX_OFFSET_DAYS; i++) {
    dates.push(addDays(today, i))
  }
  return dates
}

export function isSameDayCheckIn(dateStr: string, now: Date = new Date()): boolean {
  return dateStr === todayInVietnam(now)
}

export function isCounterOpenNow(now: Date = new Date()): boolean {
  const hour = getVietnamHour(now)
  return hour >= COUNTER_OPEN_HOUR && hour < COUNTER_CLOSE_HOUR
}

// Ép số ngày thuê tùy chọn về khoảng 7-29; giá trị rỗng hoặc không hợp lệ trả về 7
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

// Ước tính tiền thuê (7-29 ngày tính theo đơn giá ngày; gói tháng giảm 0/0/5/10/15%). Số chính thức do BE tính khi tạo đơn.
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
