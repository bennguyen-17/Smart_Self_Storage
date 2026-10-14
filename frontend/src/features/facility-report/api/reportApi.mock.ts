// Số liệu mẫu của cơ sở HN-01, dùng khi VITE_USE_MOCK=true.

import type { ManagerDashboard } from "../types"

const MOCK: ManagerDashboard = {
  facilityId: 1,
  facilityName: "SmartStorage Cầu Giấy (HN-01)",
  facilityCode: "HN-01",
  totalUnits: 50,
  availableUnits: 6,
  occupiedUnits: 40,
  reservedUnits: 2,
  maintenanceUnits: 2,
  occupancyRate: 84,
  activeContracts: 40,
  pendingCheckinContracts: 2,
  overdueContracts: 1,
  terminatedContracts: 12,
  rentalRevenue: 110_000_000,
  extensionRevenue: 4_200_000,
  penaltyRevenue: 1_500_000,
  compensationRevenue: 2_000_000,
  totalRefunds: 3_200_000,
  netRevenue: 114_500_000,
  depositHolding: 15_000_000,
  forfeitedDeposit: 1_000_000,
  waivedAmount: 500_000,
  totalTickets: 20,
  submittedTickets: 3,
  inProgressTickets: 2,
  resolvedTickets: 15,
  slaBreachedTickets: 1,
}

export function mockGetManagerDashboard(): Promise<ManagerDashboard> {
  return new Promise((resolve) => setTimeout(() => resolve({ ...MOCK }), 300))
}
