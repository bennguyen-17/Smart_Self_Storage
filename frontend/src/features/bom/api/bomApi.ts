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
  managerName?: string
  managerEmail?: string
  managerPhone?: string
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
  createFacility: async (data: {
    facilityName: string
    address: string
    phone?: string
    facilityCode?: string
    layoutType?: string
    floorCount?: number
    isAllClimate?: boolean
    managerName?: string
  }): Promise<FacilityApiItem> => {
    return apiClient.post('/facilities', data)
  },
  updateFacility: async (facilityId: number, data: { facilityName?: string; address?: string; phone?: string; status?: string; managerName?: string; managerPhone?: string; managerEmail?: string }): Promise<FacilityApiItem> => {
    return apiClient.put(`/facilities/${facilityId}`, data)
  },
  deleteFacility: async (facilityId: number): Promise<any> => {
    return apiClient.delete(`/facilities/${facilityId}`)
  },
  getUnits: async (): Promise<any[]> => {
    return apiClient.get('/units/filter')
  },
  getPrices: async (): Promise<any[]> => {
    return apiClient.get('/prices')
  },
  updatePrice: async (unitTypeId: number, data: { dailyPrice?: number; monthlyPrice?: number; depositAmount?: number; climateSurchargePercent?: number }): Promise<any> => {
    return apiClient.put(`/prices/${unitTypeId}`, data)
  },
}
