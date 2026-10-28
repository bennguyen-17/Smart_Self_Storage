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
  extensionRevenue?: number
  penaltyRevenue?: number
  compensationRevenue?: number
  totalRefunds?: number
  netRevenue: number
  thisMonthRevenue?: number
  last3MonthsRevenue?: number
  allTimeRevenue?: number
  depositHolding: number
  forfeitedDeposit?: number
  waivedAmount?: number
  managerName?: string
  managerEmail?: string
  managerPhone?: string
  totalTickets?: number
  inProgressTickets?: number
  resolvedTickets?: number
  slaBreachedTickets?: number
  monthlyRevenues?: MonthlyRevenueItem[]
}

export interface MonthlyRevenueItem {
  month: string
  label: string
  revenue: number
  rentalRevenue?: number
  penaltyRevenue?: number
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
  monthlyRevenues?: MonthlyRevenueItem[]
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
  getChainDashboard: async (period?: string): Promise<ChainDashboardData> => {
    return apiClient.get('/admin/dashboard/chain-overview', {
      params: period ? { period } : undefined,
    })
  },
  getFacilityDashboard: async (facilityId: number): Promise<FacilityBreakdownItem> => {
    return apiClient.get('/manager/dashboard/overview', {
      params: { facilityId },
    })
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
  createPrice: async (data: {
    name: string
    size?: string
    dimensions: string
    dailyPrice: number
    monthlyPrice: number
    depositAmount: number
    climateSurchargePercent?: number
  }): Promise<any> => {
    return apiClient.post('/prices', data)
  },
  deletePrice: async (unitTypeId: number): Promise<any> => {
    return apiClient.delete(`/prices/${unitTypeId}`)
  },
  getFeePolicies: async (): Promise<FeePolicyItem[]> => {
    return apiClient.get('/fee-policies')
  },
  createFeePolicy: async (data: Partial<FeePolicyItem>): Promise<FeePolicyItem> => {
    return apiClient.post('/fee-policies', data)
  },
  updateFeePolicy: async (policyId: number, data: Partial<FeePolicyItem>): Promise<FeePolicyItem> => {
    return apiClient.put(`/fee-policies/${policyId}`, data)
  },
  deleteFeePolicy: async (policyId: number): Promise<void> => {
    return apiClient.delete(`/fee-policies/${policyId}`)
  },
}

export interface FeePolicyItem {
  policyId: number
  policyCode: string
  policyName: string
  category: "SURCHARGE" | "PENALTY" | "DISCOUNT" | string
  calcType: "PERCENT" | "FIXED" | string
  feeValue: number
  unitBasis: string
  description?: string
  isWaiveDeposit?: boolean
  status: string
}

