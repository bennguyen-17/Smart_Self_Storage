// Manager xem nhân viên trong ngày làm được gì (đề: "Assign facility staff…", BR-50) và nhật ký thao tác nội bộ
// của cơ sở mình (BR-46). Khớp ManagerStaffActivityResponse và AdminActivityLogResponse của BE.

import type { ActivityLogEntry } from "@/features/admin/audit-logs/types"

export interface StaffActivity {
  employeeId: number
  accountId: number
  fullName: string
  /** Đã bấm "Bắt đầu ca" */
  attended: boolean
  /** Số lượt nhận kho (check-in) hoàn tất */
  checkIns: number
  /** Số lượt xác nhận trả kho */
  checkouts: number
  ticketsResolved: number
  /** Số ô kho bảo trì xong */
  maintenanceDone: number
  /** Việc được giao đã xong: không dùng từ 29/10 (nhóm bỏ giao việc), BE có thể bỏ trường này */
  tasksDone?: number
  /** Thời gian trung bình từ lúc ticket tạo tới lúc nhận, null khi chưa nhận ticket nào */
  avgTicketAcceptMinutes: number | null
}

export interface ShiftActivity {
  shiftId: number
  shiftName: string
  startTime: string
  endTime: string
  staff: StaffActivity[]
}

/** GET /api/manager/staff-activity?date=YYYY-MM-DD */
export interface StaffActivityDay {
  date: string
  shifts: ShiftActivity[]
}

/** GET /api/manager/activity-logs?date=…: cùng dạng nhật ký của Admin, thêm cơ sở */
export interface FacilityLogEntry extends ActivityLogEntry {
  facilityId: number | null
  facilityCode: string | null
}
