// Luật phân ca (US-32). Hàm thuần, kiểm bằng bảng DDT.

import type { DaySchedule, Duty, FacilityStaff, ShiftAssignment, ShiftKey } from "./types"

export const SHIFTS: readonly { key: ShiftKey; label: string; time: string }[] = [
  { key: "MORNING", label: "Ca sáng", time: "08:00 – 12:00" },
  { key: "AFTERNOON", label: "Ca chiều", time: "12:00 – 16:00" },
  { key: "EVENING", label: "Ca tối", time: "16:00 – 20:00" },
]

export const DUTY_LABEL: Record<Duty, string> = {
  CHECKIN: "Check-in / bàn giao",
  INSPECTION: "Nghiệm thu trả kho",
  INCIDENT: "Xử lý sự cố",
}

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
  const taken = new Set(current.map((a) => a.accountId))
  return staff
    .filter((s) => s.facilityId === facilityId && s.status === "ACTIVE" && !taken.has(s.accountId))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"))
}

/** Các ca khác trong ngày mà nhân viên đã trực (để nhắc Manager khi xếp ca liền) */
export function otherShiftsOf(schedule: DaySchedule | undefined, accountId: number, except: ShiftKey): ShiftKey[] {
  if (!schedule) return []
  return schedule.shifts
    .filter((s) => s.shift !== except && s.assignments.some((a) => a.accountId === accountId))
    .map((s) => s.shift)
}

/** Ca thiếu việc nào: cơ sở cần đủ người cho cả 3 đầu việc trong mỗi ca */
export function missingDuties(assignments: readonly ShiftAssignment[]): Duty[] {
  const covered = new Set(assignments.map((a) => a.duty))
  return (Object.keys(DUTY_LABEL) as Duty[]).filter((d) => !covered.has(d))
}

/** Thêm một người vào ca; trùng người thì giữ nguyên danh sách */
export function addAssignment(current: readonly ShiftAssignment[], staff: FacilityStaff, duty: Duty): ShiftAssignment[] {
  if (current.some((a) => a.accountId === staff.accountId)) return [...current]
  return [...current, { accountId: staff.accountId, fullName: staff.fullName, duty }]
}
