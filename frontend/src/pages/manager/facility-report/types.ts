// US-33 (phần Manager): số liệu tổng quan của một cơ sở.
// Khớp ManagerDashboardResponse của BE: GET /api/manager/dashboard/overview (header X-Facility-Id).

export interface ManagerDashboard {
  facilityId: number
  facilityName: string
  facilityCode: string

  totalUnits: number
  availableUnits: number
  occupiedUnits: number
  reservedUnits: number
  maintenanceUnits: number
  /** % lấp đầy, ví dụ 84.5 */
  occupancyRate: number

  activeContracts: number
  pendingCheckinContracts: number
  overdueContracts: number
  terminatedContracts: number

  rentalRevenue: number
  extensionRevenue: number
  penaltyRevenue: number
  compensationRevenue: number
  totalRefunds: number
  /** (Thuê + Gia hạn + Phạt + Truy thu) − Hoàn tiền; không gồm tiền cọc */
  netRevenue: number

  /** Cọc đang giữ: KHÔNG phải doanh thu */
  depositHolding: number
  forfeitedDeposit: number
  waivedAmount: number

  totalTickets: number
  submittedTickets: number
  inProgressTickets: number
  resolvedTickets: number
  slaBreachedTickets: number
}
