// Luật phân ca (US-32). Hàm thuần, kiểm bằng bảng DDT.

import type { DayShift, DaySchedule, FacilityStaff, ShiftAssignment } from "./types"

/**
 * Nhân viên chọn được làm người trực: đúng cơ sở của Manager, tài khoản đang hoạt động. Sắp theo tên.
 * Mỗi ca chỉ 1 người trực (nhóm chốt 03/11): sự cố gửi trong ca luôn được phân cho đúng người đó.
 */
export function pickableStaff(staff: readonly FacilityStaff[], facilityId: number | null): FacilityStaff[] {
  if (facilityId === null) return []
  return staff
    .filter((s) => s.facilityId === facilityId && s.status === "ACTIVE")
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"))
}

/** Người trực của ca (dữ liệu cũ có thể còn nhiều người: lấy người đầu, giao diện báo để Manager chuẩn hóa) */
export function onDutyOf(shift: Pick<DayShift, "staff">): ShiftAssignment | null {
  return shift.staff[0] ?? null
}

export interface ShiftWrite {
  date: string
  shiftId: number
  employeeIds: number[]
}

/**
 * "Áp dụng lịch ngày này cho cả tuần": chép người trực từng ca của ngày nguồn sang các ngày khác trong tuần (T2 → CN),
 * ghi đè lịch đang có. Bỏ qua ngày đã qua (chỉ xem). Ca nguồn chưa có người thì ngày đích cũng để trống ca đó.
 */
export function planWeekCopy(source: DaySchedule, today: string): ShiftWrite[] {
  return weekDays(source.date)
    .filter((d) => d.date !== source.date && d.date >= today)
    .flatMap((d) =>
      source.shifts.map((s) => {
        const person = onDutyOf(s)
        return { date: d.date, shiftId: s.shiftId, employeeIds: person ? [person.employeeId] : [] }
      })
    )
}

/** Tên các ca khác trong ngày mà nhân viên đã trực (để cảnh báo Manager khi xếp nhiều ca) */
export function otherShiftsOf(
  schedule: DaySchedule | undefined,
  employeeId: number,
  exceptShiftId: number
): string[] {
  if (!schedule) return []
  return schedule.shifts
    .filter(
      (s) =>
        s.shiftId !== exceptShiftId &&
        s.staff.some((a) => a.employeeId === employeeId)
    )
    .map((s) => s.shiftName)
}

/** "06:00:00" → "06:00" */
function hhmm(time: string): string {
  return time.slice(0, 5)
}

/** "06:00 – 14:00"; ca kết thúc sau nửa đêm ghi thêm "(qua đêm)" */
export function shiftTimeLabel(startTime: string, endTime: string): string {
  const overnight = hhmm(endTime) <= hhmm(startTime)
  return `${hhmm(startTime)} – ${hhmm(endTime)}${overnight ? " (qua đêm)" : ""}`
}

export type ShiftPeriod = "morning" | "afternoon" | "night"

/** Chọn biểu tượng theo giờ bắt đầu: 04–12h là sáng, 12–18h là chiều, còn lại là đêm */
export function shiftPeriod(startTime: string): ShiftPeriod {
  const hour = Number(startTime.slice(0, 2))
  if (hour >= 4 && hour < 12) return "morning"
  if (hour >= 12 && hour < 18) return "afternoon"
  return "night"
}

const WEEKDAY_LABEL = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

export interface WeekDay {
  /** YYYY-MM-DD */
  date: string
  /** "T2", …, "CN" */
  weekday: string
  /** "13/10" */
  dayMonth: string
}

/** 7 ngày (thứ 2 → chủ nhật) của tuần chứa ngày đã chọn; tính theo ngày lịch, không lệch múi giờ */
export function weekDays(date: string): WeekDay[] {
  const base = new Date(`${date}T00:00:00Z`)
  const fromMonday = (base.getUTCDay() + 6) % 7
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base.getTime() + (i - fromMonday) * 86_400_000)
    const iso = d.toISOString().slice(0, 10)
    return {
      date: iso,
      weekday: WEEKDAY_LABEL[d.getUTCDay()],
      dayMonth: `${iso.slice(8, 10)}/${iso.slice(5, 7)}`,
    }
  })
}
