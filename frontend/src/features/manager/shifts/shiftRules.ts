import type { DayShift, DaySchedule, FacilityStaff, ShiftAssignment } from "./types"

// Mỗi ca chỉ 1 người trực để sự cố phát sinh trong ca tự gán thẳng cho người đó
export function pickableStaff(staff: readonly FacilityStaff[], facilityId: number | null): FacilityStaff[] {
  if (facilityId === null) return []
  return staff
    .filter((s) => s.facilityId === facilityId && s.status === "ACTIVE")
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"))
}

// Dữ liệu cũ có thể có nhiều người trong 1 ca nên lấy người đầu tiên
export function onDutyOf(shift: Pick<DayShift, "staff">): ShiftAssignment | null {
  return shift.staff[0] ?? null
}

export interface ShiftWrite {
  date: string
  shiftId: number
  employeeIds: number[]
}

// Chép lịch ngày nguồn sang các ngày còn lại trong tuần, bỏ qua ngày đã qua
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

// Tìm các ca khác trong cùng ngày nhân viên đã trực để cảnh báo khi xếp trùng
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

function hhmm(time: string): string {
  return time.slice(0, 5)
}

export function shiftTimeLabel(startTime: string, endTime: string): string {
  const overnight = hhmm(endTime) <= hhmm(startTime)
  return `${hhmm(startTime)} – ${hhmm(endTime)}${overnight ? " (qua đêm)" : ""}`
}

export type ShiftPeriod = "morning" | "afternoon" | "night"

export function shiftPeriod(startTime: string): ShiftPeriod {
  const hour = Number(startTime.slice(0, 2))
  if (hour >= 4 && hour < 12) return "morning"
  if (hour >= 12 && hour < 18) return "afternoon"
  return "night"
}

const WEEKDAY_LABEL = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

export interface WeekDay {
  // YYYY-MM-DD
  date: string
  weekday: string
  dayMonth: string
}

// Tính 7 ngày T2–CN theo UTC để không bị lệch múi giờ
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
