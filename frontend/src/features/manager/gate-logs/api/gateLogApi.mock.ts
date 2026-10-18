// Dữ liệu mẫu nhật ký ra vào cổng, dùng khi VITE_USE_MOCK=true.

import { addDays, todayInVietnam } from "@/lib/format"
import type { GateLog } from "../types"

const MOCK_LATENCY_MS = 200

const SEEDS: Array<{
  dayOffset: number
  time: string
  customerId: number
  accountId: number
  personName: string
  personPhone: string
  personRole: string
  identityNumber: string
  gateName: string
  accessMethod: string
  staffName?: string
  reason: string
}> = [
  {
    dayOffset: 0,
    time: "08:15:22",
    customerId: 1,
    accountId: 31,
    personName: "Nguyễn Thành Long",
    personPhone: "0912 345 678",
    personRole: "Khách hàng",
    identityNumber: "001201012345",
    gateName: "Cổng Chính",
    accessMethod: "Mã PIN động IoT",
    reason: "Mã PIN động hợp lệ",
  },
  {
    dayOffset: 0,
    time: "07:30:00",
    customerId: 1,
    accountId: 10,
    personName: "Nguyễn Thành Long",
    personPhone: "0912 345 678",
    personRole: "Khách hàng",
    identityNumber: "001201012345",
    gateName: "Cổng Chính",
    accessMethod: "Thẻ Master thủ công",
    staffName: "Nguyễn Văn Hùng",
    reason: "Khách quên điện thoại, nhân viên xác minh CCCD mở bằng Thẻ Master",
  },
  {
    dayOffset: -1,
    time: "20:15:00",
    customerId: 2,
    accountId: 32,
    personName: "Trần Thu Hà",
    personPhone: "0987 654 321",
    personRole: "Khách hàng",
    identityNumber: "079201098765",
    gateName: "Cổng Xe Tải",
    accessMethod: "Mã PIN động IoT",
    reason: "Mã PIN động hợp lệ",
  },
  {
    dayOffset: -1,
    time: "18:45:00",
    customerId: 2,
    accountId: 11,
    personName: "Trần Thu Hà",
    personPhone: "0987 654 321",
    personRole: "Khách hàng",
    identityNumber: "079201098765",
    gateName: "Cổng Chính",
    accessMethod: "Thẻ Master thủ công",
    staffName: "Lê Thị Ánh Tuyết",
    reason: "Mở cửa phụ hỗ trợ chuyển hàng bằng Thẻ Master",
  },
  {
    dayOffset: -2,
    time: "14:20:10",
    customerId: 3,
    accountId: 33,
    personName: "Trần Thị Bích Ngọc",
    personPhone: "0933 445 566",
    personRole: "Khách hàng",
    identityNumber: "001202023456",
    gateName: "Cổng VIP",
    accessMethod: "Mã PIN động IoT",
    reason: "Mã PIN động hợp lệ",
  },
  {
    dayOffset: -3,
    time: "17:15:40",
    customerId: 2,
    accountId: 32,
    personName: "Trần Thu Hà",
    personPhone: "0987 654 321",
    personRole: "Khách hàng",
    identityNumber: "079201098765",
    gateName: "Thang máy hàng",
    accessMethod: "Mã PIN động IoT",
    reason: "Mã PIN động hợp lệ",
  },
]

function buildLogs(): GateLog[] {
  const today = todayInVietnam()
  return SEEDS.map((s, index) => {
    const openedAt = `${addDays(today, s.dayOffset)}T${s.time}`
    return {
      auditLogId: 501 + index,
      accountId: s.accountId,
      facilityId: 1,
      customerId: s.customerId,
      action: s.accessMethod.includes("Thẻ Master") ? "MANUAL_GATE_OPEN" : `GATE_ACCESS_GRANTED - ${s.gateName}`,
      openedAt,
      reason: s.reason,
      createdAt: openedAt,
      personName: s.personName,
      personPhone: s.personPhone,
      personRole: s.personRole,
      identityNumber: s.identityNumber,
      gateName: s.gateName,
      accessMethod: s.accessMethod,
      staffName: s.staffName,
      facilityName: "SmartStorage Cầu Giấy",
    }
  })
}

export function mockListManualGateOpenLogs(): Promise<GateLog[]> {
  return new Promise((resolve) => setTimeout(() => resolve(buildLogs()), MOCK_LATENCY_MS))
}
