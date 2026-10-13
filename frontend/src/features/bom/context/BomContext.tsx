import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { bomApi, type ChainDashboardData, type FacilityBreakdownItem } from "../api/bomApi"
import {
  type FacilityPerformance,
  type UnitPricing,
  type SurchargeItem,
  INITIAL_PRICING,
  INITIAL_SURCHARGES,
} from "../data/bomData"

interface BomContextType {
  chainOverview: ChainDashboardData | null
  facilities: FacilityPerformance[]
  setFacilities: React.Dispatch<React.SetStateAction<FacilityPerformance[]>>
  pricingList: UnitPricing[]
  setPricingList: React.Dispatch<React.SetStateAction<UnitPricing[]>>
  surcharges: SurchargeItem[]
  setSurcharges: React.Dispatch<React.SetStateAction<SurchargeItem[]>>
  isLoadingApi: boolean
  isApiConnected: boolean
  totalOverdueCount: number
  formatShortCurrency: (val?: number) => string
  reloadData: () => Promise<void>
}

const BomContext = createContext<BomContextType | undefined>(undefined)

export function BomProvider({ children }: { children: React.ReactNode }) {
  const [chainOverview, setChainOverview] = useState<ChainDashboardData | null>(null)
  const [facilities, setFacilities] = useState<FacilityPerformance[]>([])
  const [pricingList, setPricingList] = useState<UnitPricing[]>(INITIAL_PRICING)
  const [surcharges, setSurcharges] = useState<SurchargeItem[]>(INITIAL_SURCHARGES)
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(true)
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false)

  const loadLiveData = useCallback(async () => {
    try {
      setIsLoadingApi(true)
      const [overview, apiFacilities, apiUnits] = await Promise.all([
        bomApi.getChainDashboard().catch((err) => {
          console.warn("API /api/admin/dashboard/chain-overview lỗi:", err)
          return null
        }),
        bomApi.getFacilities().catch((err) => {
          console.warn("API /api/facilities lỗi:", err)
          return null
        }),
        bomApi.getUnits().catch((err) => {
          console.warn("API /api/units/filter lỗi:", err)
          return null
        }),
      ])

      if (overview) {
        setChainOverview(overview)
        setIsApiConnected(true)
      }

      if (apiFacilities && apiFacilities.length > 0) {
        setIsApiConnected(true)
        const breakdownMap = new Map<number, FacilityBreakdownItem>(
          (overview?.facilityBreakdown || []).map((b) => [b.facilityId, b])
        )

        const unitsByFacility = new Map<number, any[]>()
        if (apiUnits && Array.isArray(apiUnits)) {
          apiUnits.forEach((u: any) => {
            const facId = u.facilityId || u.facility?.id
            if (facId) {
              if (!unitsByFacility.has(facId)) unitsByFacility.set(facId, [])
              unitsByFacility.get(facId)!.push(u)
            }
          })
        }

        const mappedFacilities: FacilityPerformance[] = apiFacilities.map((f: any, idx: number) => {
          const facId = Number(f.facilityId ?? f.id ?? idx + 1)
          const breakdown = breakdownMap.get(facId)
          const fUnits = unitsByFacility.get(facId) || []
          const totalUnits = breakdown?.totalUnits ?? (fUnits.length > 0 ? fUnits.length : (f.totalCapacity || f.totalUnits || 0))
          const occupied = breakdown?.occupiedUnits ?? fUnits.filter((u) => u.status === "OCCUPIED").length
          const available = breakdown?.availableUnits ?? (totalUnits - occupied > 0 ? totalUnits - occupied : 0)
          const maintenance = breakdown?.maintenanceUnits ?? fUnits.filter((u) => u.status === "MAINTENANCE").length
          const calcOccRate = totalUnits > 0 ? Number(((occupied / totalUnits) * 100).toFixed(1)) : 0
          const realOccRate = breakdown?.occupancyRate ?? calcOccRate
          const rawRevenue = breakdown?.rentalRevenue ?? breakdown?.netRevenue ?? 0
          const realRevenue = rawRevenue > 0 ? `₫${Number(rawRevenue).toLocaleString("vi-VN")}` : "₫0"

          return {
            id: facId,
            code: f.facilityCode || breakdown?.facilityCode || `FAC-0${idx + 1}`,
            name: f.facilityName || breakdown?.facilityName || `Cơ sở ${facId}`,
            address: f.address || "Hệ thống cơ sở kho",
            managerName: breakdown?.managerName || f.managerName || (f.managerId ? `Quản lý ID #${f.managerId}` : "Chưa phân công"),
            managerEmail: breakdown?.managerEmail || (f.managerId ? `manager${f.managerId}@smartstorage.vn` : "manager@smartstorage.vn"),
            managerPhone: breakdown?.managerPhone || f.phone || "0900000000",
            totalUnits: totalUnits,
            occupied: occupied,
            rentedUnits: breakdown?.occupiedUnits ?? occupied,
            available: available,
            maintenance: maintenance,
            occupancyRate: realOccRate,
            monthlyRevenue: realRevenue,
            floorArea: totalUnits * 12,
            overdueUnits: breakdown?.overdueContracts || 0,
            status: f.status || "ACTIVE",
            rating: "5.0 ★",
            priceMultiplier: 1.0,
            note: "Dữ liệu vận hành đồng bộ trực tiếp từ Database",
          }
        })

        setFacilities(mappedFacilities)
      } else if (overview && overview.facilityBreakdown && overview.facilityBreakdown.length > 0) {
        setIsApiConnected(true)
        const mappedFromBreakdown: FacilityPerformance[] = overview.facilityBreakdown.map((b, idx) => {
          const rawRev = b.rentalRevenue ?? b.netRevenue ?? 0
          return {
            id: b.facilityId || idx + 1,
            code: b.facilityCode || `FAC-0${idx + 1}`,
            name: b.facilityName || `Cơ sở ${b.facilityId}`,
            address: "Hệ thống chi nhánh SmartStorage",
            managerName: b.managerName || "Chưa phân công",
            managerEmail: b.managerEmail || "manager@smartstorage.vn",
            managerPhone: b.managerPhone || "0900000000",
            totalUnits: b.totalUnits || 0,
            occupied: b.occupiedUnits || 0,
            rentedUnits: b.occupiedUnits || 0,
            available: b.availableUnits || 0,
            maintenance: b.maintenanceUnits || 0,
            occupancyRate: b.occupancyRate || 0,
            monthlyRevenue: rawRev > 0 ? `₫${Number(rawRev).toLocaleString("vi-VN")}` : "₫0",
            floorArea: (b.totalUnits || 10) * 12,
            overdueUnits: b.overdueContracts || 0,
            status: "ACTIVE",
            rating: "5.0 ★",
            priceMultiplier: 1.0,
            note: "Dữ liệu báo cáo tổng hợp từ Database",
          }
        })
        setFacilities(mappedFromBreakdown)
      } else {
        setFacilities([])
      }
    } catch (err) {
      console.error("Lỗi khi tải Live API BOM:", err)
      setIsApiConnected(false)
    } finally {
      setIsLoadingApi(false)
    }
  }, [])

  useEffect(() => {
    loadLiveData()
  }, [loadLiveData])

  const totalOverdueCount = chainOverview
    ? (chainOverview.facilityBreakdown || []).reduce((sum, item) => sum + (item.overdueContracts || 0), 0)
    : 0

  const formatShortCurrency = (val?: number) => {
    if (!val || val === 0) return "₫0"
    const num = Number(val)
    if (num >= 1_000_000_000) {
      return `₫${(num / 1_000_000_000).toFixed(1)} Tỷ`
    }
    if (num >= 1_000_000) {
      return `₫${(num / 1_000_000).toFixed(1)} Triệu`
    }
    return `₫${num.toLocaleString("vi-VN")}`
  }

  return (
    <BomContext.Provider
      value={{
        chainOverview,
        facilities,
        setFacilities,
        pricingList,
        setPricingList,
        surcharges,
        setSurcharges,
        isLoadingApi,
        isApiConnected,
        totalOverdueCount,
        formatShortCurrency,
        reloadData: loadLiveData,
      }}
    >
      {children}
    </BomContext.Provider>
  )
}

export function useBomContext() {
  const context = useContext(BomContext)
  if (!context) {
    throw new Error("useBomContext must be used within a BomProvider")
  }
  return context
}
