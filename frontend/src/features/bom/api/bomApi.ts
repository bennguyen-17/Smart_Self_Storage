import apiClient from '@/lib/apiClient'

export interface FacilityBreakdownItem {
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
  netRevenue: number
  depositHolding: number
}

export interface ChainDashboardData {
  chainTotalFacilities: number
  chainTotalUnits: number
  chainAverageOccupancyRate: number
  chainTotalActiveContracts: number
  chainTotalRevenue: number
  chainTotalRefunds: number
  chainNetRevenue: number
  chainDepositHolding: number
  facilityBreakdown: FacilityBreakdownItem[]
}

export interface FacilityApiItem {
  facilityId: number
  facilityCode: string
  shortCode: string
  facilityName: string
  address: string
  phone: string
  floorCount: number
  layoutType: string
  isAllClimate: boolean
  status: string
}

export const bomApi = {
  getChainDashboard: async (): Promise<ChainDashboardData> => {
    return apiClient.get('/admin/dashboard/chain-overview')
  },
  getFacilities: async (): Promise<FacilityApiItem[]> => {
    return apiClient.get('/facilities')
  },
}
