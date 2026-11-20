export interface ManagerDashboard {
  facilityId: number
  facilityName: string
  facilityCode: string

  totalUnits: number
  availableUnits: number
  occupiedUnits: number
  reservedUnits: number
  maintenanceUnits: number
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
  // (Thuê + gia hạn + phạt + đền bù) - hoàn tiền
  netRevenue: number

  // Tiền cọc đang giữ, không tính vào doanh thu
  depositHolding: number
  forfeitedDeposit: number
  waivedAmount: number

  totalTickets: number
  submittedTickets: number
  inProgressTickets: number
  resolvedTickets: number
  slaBreachedTickets: number
}
