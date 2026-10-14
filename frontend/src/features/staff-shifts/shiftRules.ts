// Luật phân ca (US-32). Hàm thuần, kiểm bằng bảng DDT.

import type { DaySchedule, FacilityStaff, ShiftAssignment } from "./types"

/**
 * Nhân viên được phép chọn cho một ca: đúng cơ sở của Manager (AC), đang hoạt động,
 * chưa có trong ca đó. Sắp theo tên.
 */
export function assignableStaff(
  staff: readonly FacilityStaff[],
  facilityId: number | null,
  current: readonly ShiftAssignment[]
): FacilityStaff[] {
  if (facilityId === null) return []
  const taken = new Set(current.map((a) => a.employeeId))
  return staff
    .filter(
      (s) =>
        s.facilityId === facilityId &&
        s.status === "ACTIVE" &&
        !taken.has(s.employeeId)
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"))
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

/** Thêm một người vào ca; trùng người thì giữ nguyên danh sách */
export function addAssignment(
  current: readonly ShiftAssignment[],
  staff: FacilityStaff
): ShiftAssignment[] {
  if (current.some((a) => a.employeeId === staff.employeeId))
    return [...current]
  return [
    ...current,
    { employeeId: staff.employeeId, fullName: staff.fullName },
  ]
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
