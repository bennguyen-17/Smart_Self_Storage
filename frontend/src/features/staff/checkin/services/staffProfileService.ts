import http from "@/lib/apiClient"

export interface AssignedShift {
  shiftId: number
  shiftName: string
  startTime: string
  endTime: string
  isCurrent: boolean
  status: string
}

export interface StaffProfileData {
  success: boolean
  accountId: number
  employeeId?: number
  fullName: string
  phone: string
  email: string
  role: string
  roleTitle: string
  staffCode: string
  facilityId?: number
  facilityCode?: string
  facilityName: string
  facilityAddress?: string
  date: string
  shiftStatus: "IN_SHIFT" | "UPCOMING" | "ENDED" | "NO_SHIFT"
  shiftStatusText: string
  assignedShifts: AssignedShift[]
}

export async function getStaffProfile(date?: string): Promise<StaffProfileData> {
  const params = date ? { date } : undefined
  const data = await http.get<any, StaffProfileData>("/staff/profile", { params })
  return data
}
