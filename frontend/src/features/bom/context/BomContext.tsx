import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { bomApi, type ChainDashboardData, type FacilityBreakdownItem, type FeePolicyItem } from "../api/bomApi"
import {
  type FacilityPerformance,
  type UnitPricing,
  type SurchargeItem,
  INITIAL_PRICING,
  INITIAL_SURCHARGES,
} from "../data/bomData"
import { toast } from "sonner"

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
  updatePricingInDb: (unitTypeId: number, data: { dailyPrice?: number; monthlyPrice?: number; depositAmount?: number; climateSurchargePercent?: number }) => Promise<boolean>
  createPricingInDb: (data: {
    name: string
    size?: string
    dimensions: string
    dailyPrice: number
    monthlyPrice: number
    depositAmount: number
    climateSurchargePercent?: number
  }) => Promise<boolean>
  deletePricingInDb: (unitTypeId: number) => Promise<boolean>
  createFeePolicyInDb: (data: Partial<FeePolicyItem>) => Promise<boolean>
  updateFeePolicyInDb: (policyId: number, data: Partial<FeePolicyItem>) => Promise<boolean>
  deleteFeePolicyInDb: (policyId: number) => Promise<boolean>
  createFacilityInDb: (data: {
    facilityName: string
    address: string
    phone?: string
    facilityCode?: string
    layoutType?: string
    floorCount?: number
    isAllClimate?: boolean
    status?: string
    managerName?: string
  }) => Promise<boolean>
  updateFacilityInDb: (facilityId: number, data: { facilityName?: string; address?: string; phone?: string; status?: string; managerName?: string; managerPhone?: string; managerEmail?: string; priceMultiplier?: number }) => Promise<boolean>
  deleteFacilityInDb: (facilityId: number) => Promise<boolean>
}

const BomContext = createContext<BomContextType | undefined>(undefined)

function fixMojibake(str?: string): string {
  if (!str) return ""
  try {
    if (/(?:Ã|áº|á»|Ä|É|Å|Ë|Ì|Í|Î|Ï)/.test(str)) {
      const bytes = new Uint8Array(str.split("").map((c) => c.charCodeAt(0)))
      const decoded = new TextDecoder("utf-8").decode(bytes)
      if (decoded && !decoded.includes("\ufffd")) {
        return decoded
      }
    }
  } catch (e) {}
  return str
}

export function BomProvider({ children }: { children: React.ReactNode }) {
  const [chainOverview, setChainOverview] = useState<ChainDashboardData | null>(null)
  const [facilities, setFacilities] = useState<FacilityPerformance[]>([])
  const [pricingList, setPricingList] = useState<UnitPricing[]>(INITIAL_PRICING)
  const [surcharges, setSurcharges] = useState<SurchargeItem[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("smart_storage_surcharges")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      }
    } catch (e) {
      console.warn("Lỗi đọc surcharges từ localStorage:", e)
    }
    return INITIAL_SURCHARGES
  })
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(true)
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false)

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("smart_storage_surcharges", JSON.stringify(surcharges))
      }
    } catch (e) {
      console.warn("Lỗi lưu surcharges vào localStorage:", e)
    }
  }, [surcharges])

  const loadLiveData = useCallback(async () => {
    try {
      setIsLoadingApi(true)
      const [overview, apiFacilities, apiUnits, apiPrices, apiFeePolicies] = await Promise.all([
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
        bomApi.getPrices().catch((err) => {
          console.warn("API /api/prices lỗi:", err)
          return null
        }),
        bomApi.getFeePolicies().catch((err) => {
          console.warn("API /api/fee-policies lỗi:", err)
          return null
        }),
      ])

      if (overview) {
        setChainOverview(overview)
        setIsApiConnected(true)
      }

      // 0. Cập nhật biểu phí (Fee Policies) từ Database
      if (apiFeePolicies && Array.isArray(apiFeePolicies) && apiFeePolicies.length > 0) {
        setIsApiConnected(true)
        const mappedSurcharges: SurchargeItem[] = apiFeePolicies
          .filter((fp) => fp.category !== "SURCHARGE")
          .map((fp) => {
            const rawCat = (fp.category || "PENALTY").toLowerCase()
            const cat = (rawCat === "discount" || rawCat === "damage" ? rawCat : "penalty") as "penalty" | "discount" | "damage"
            const catLabels: Record<string, string> = {
              penalty: "Phí Phạt Quá Hạn (Penalties & Overdue Fees)",
              discount: "Chính Sách Miễn Giảm Giá (Discount Policy & Waivers)",
              damage: "Biểu Phí Bồi Thường Hư Hỏng & Vệ Sinh",
            }
            const typeLabels: Record<string, string> = {
              penalty: "Chế Tài / Phạt Hợp Đồng",
              discount: "Ưu Đãi / Khuyến Mãi",
              damage: "Bồi Thường Hư Hỏng",
            }
          let rateStr = ""
          if (fp.calcType === "PERCENT") {
            const unitSuffix =
              fp.unitBasis === "PER_DAY" ? "/ ngày trễ" :
              fp.unitBasis === "PER_MONTH" ? "/ tháng" :
              fp.unitBasis === "TOTAL_BILL" || fp.unitBasis === "CONTRACT_TOTAL" ? "Tổng Đơn" : ""
            rateStr = `${fp.feeValue}% ${unitSuffix}`.trim()
          } else {
            const unitLabel =
              fp.unitBasis === "PER_DAY" ? "/ ngày trễ" :
              fp.unitBasis === "PER_MONTH" ? "/ tháng" :
              fp.unitBasis === "PER_HOUR" ? "/ giờ" :
              fp.unitBasis === "TOTAL_BILL" ? "/ đơn" : "/ lần"
            rateStr = `₫${Number(fp.feeValue).toLocaleString("vi-VN")} ${unitLabel}`
          }
          if (fp.isWaiveDeposit) {
            rateStr += " + Miễn Cọc"
          }

          return {
            id: `policy-${fp.policyId}`,
            policyId: fp.policyId,
            policyCode: fp.policyCode,
            category: cat,
            categoryLabel: catLabels[cat] || catLabels.penalty,
            type: typeLabels[cat] || "Chính Sách Biểu Phí",
            name: fixMojibake(fp.policyName),
            rate: rateStr,
            calcType: fp.calcType as any,
            feeValue: Number(fp.feeValue),
            unitBasis: fp.unitBasis,
            isWaiveDeposit: fp.isWaiveDeposit,
            isActive: fp.status === "ACTIVE",
            note: fixMojibake(fp.description || ""),
          }
        })
        setSurcharges(mappedSurcharges)
      }

      // 1. Cập nhật bảng giá từ Database (nếu API có dữ liệu)
      if (apiPrices && Array.isArray(apiPrices) && apiPrices.length > 0) {
        setIsApiConnected(true)
        const mappedPrices: UnitPricing[] = apiPrices.map((p: any) => ({
          id: `size-${(p.size || "").toLowerCase()}`,
          unitTypeId: p.unitTypeId,
          size: p.size,
          name: p.name || `Size ${p.size}`,
          description: p.description || "",
          dimensions: p.dimensions || "",
          area: p.area || "",
          height: p.height || "2.0m",
          dailyPrice: Number(p.dailyPrice || 0),
          normPrice: Number(p.monthlyPrice || 0),
          acPrice:
            Number(p.acPrice || 0) > Number(p.monthlyPrice || 0)
              ? Number(p.acPrice)
              : Math.round(Number(p.monthlyPrice || 0) * 1.2),
          climateSurchargePercent: Number(p.climateSurchargePercent || 20),
          depositAmount: Number(p.depositAmount || 0),
          depositText: `₫${Number(p.depositAmount || 0).toLocaleString("vi-VN")}`,
          status: p.status === "ACTIVE" ? "Đang áp dụng" : (p.status || "Đang áp dụng"),
        }))
        setPricingList(mappedPrices)
      }

      // 2. Cập nhật danh sách cơ sở từ Database
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

        const savedManagersMap = (() => {
          try {
            const raw = localStorage.getItem("smart_storage_facility_managers")
            return raw ? JSON.parse(raw) : {}
          } catch (e) {
            return {}
          }
        })()

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
          const thisMonthRevVal = Number(breakdown?.thisMonthRevenue ?? 0)
          const last3MonthsRevVal = Number(breakdown?.last3MonthsRevenue ?? 0)
          const allTimeRevVal = Number(
            breakdown?.allTimeRevenue ?? 
            (breakdown?.netRevenue != null && Number(breakdown.netRevenue) > 0 ? breakdown.netRevenue : (breakdown?.rentalRevenue ?? 0))
          )

          const fmtThisMonth = thisMonthRevVal > 0 ? `₫${thisMonthRevVal.toLocaleString("vi-VN")}` : "₫0"
          const fmtLast3Months = last3MonthsRevVal > 0 ? `₫${last3MonthsRevVal.toLocaleString("vi-VN")}` : "₫0"
          const fmtAllTime = allTimeRevVal > 0 ? `₫${allTimeRevVal.toLocaleString("vi-VN")}` : "₫0"

          const rawName = f.facilityName || breakdown?.facilityName || `Cơ sở ${facId}`
          const fixedName = fixMojibake(rawName)
          const cleanName = fixedName.replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
          const fixedAddress = fixMojibake(f.address || "Hệ thống cơ sở kho")

          // Ưu tiên thông tin Quản lý từ DB (f.managerName từ API /api/facilities kết nối bảng EmployeeProfile & Account)
          const dbMgrName = (f.managerName && f.managerName !== "Chưa phân công" && f.managerName.trim())
            ? fixMojibake(f.managerName).replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
            : ""
          const breakdownMgrName = (breakdown?.managerName && breakdown.managerName !== "Chưa phân công" && breakdown.managerName.trim())
            ? fixMojibake(breakdown.managerName).replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
            : ""
          const savedMgr = savedManagersMap[facId] || savedManagersMap[f.facilityCode]
          const savedMgrName = (savedMgr?.name && savedMgr.name !== "Chưa phân công" && savedMgr.name.trim())
            ? savedMgr.name.trim()
            : ""

          const finalMgrName = dbMgrName || breakdownMgrName || savedMgrName || (f.managerId ? `Quản lý ID #${f.managerId}` : "Chưa phân công")
          const finalMgrEmail = (dbMgrName && f.managerEmail) || (breakdownMgrName && breakdown?.managerEmail) || (savedMgrName && savedMgr?.email) || (f.managerId ? `manager${f.managerId}@smartstorage.vn` : "manager@smartstorage.vn")
          const finalMgrPhone = (dbMgrName && f.managerPhone) || (breakdownMgrName && breakdown?.managerPhone) || (savedMgrName && savedMgr?.phone) || f.phone || "0900000000"

          if (dbMgrName) {
            try {
              const raw = localStorage.getItem("smart_storage_facility_managers")
              if (raw) {
                const curr = JSON.parse(raw)
                if (curr[facId]?.name === "Chưa phân công" || curr[f.facilityCode]?.name === "Chưa phân công") {
                  delete curr[facId]
                  delete curr[f.facilityCode]
                  localStorage.setItem("smart_storage_facility_managers", JSON.stringify(curr))
                }
              }
            } catch (e) {}
          }
          const stdUnits = (f.layoutType === "B" || f.layoutType === "Layout B") ? 15 : 46

          return {
            id: facId,
            code: f.facilityCode || breakdown?.facilityCode || `FAC-0${idx + 1}`,
            name: cleanName || rawName,
            address: fixedAddress,
            managerName: finalMgrName,
            managerEmail: finalMgrEmail,
            managerPhone: finalMgrPhone,
            totalUnits: totalUnits > 0 ? totalUnits : stdUnits,
            occupied: occupied,
            rentedUnits: breakdown?.occupiedUnits ?? occupied,
            available: available,
            maintenance: maintenance,
            occupancyRate: realOccRate,
            monthlyRevenue: fmtThisMonth,
            thisMonthRevenue: fmtThisMonth,
            last3MonthsRevenue: fmtLast3Months,
            allTimeRevenue: fmtAllTime,
            floorArea: totalUnits * 12,
            overdueUnits: breakdown?.overdueContracts || 0,
            depositHolding: Number(breakdown?.depositHolding || 0),
            totalRefunds: Number(breakdown?.totalRefunds || 0),
            netRevenue: Number(breakdown?.netRevenue || 0),
            rentalRevenue: Number(breakdown?.rentalRevenue || 0),
            penaltyRevenue: Number(breakdown?.penaltyRevenue || 0),
            monthlyRevenues: (breakdown?.monthlyRevenues || []).map((m: any) => ({
              month: m.month,
              label: m.label,
              revenue: Number(m.revenue || 0),
              rentalRevenue: m.rentalRevenue != null ? Number(m.rentalRevenue) : undefined,
              penaltyRevenue: m.penaltyRevenue != null ? Number(m.penaltyRevenue) : undefined,
            })),
            status: f.status || "ACTIVE",
            rating: "5.0 ★",
            priceMultiplier: savedMgr?.priceMultiplier || 1.0,
            layoutType: f.layoutType || "A",
            floorCount: f.floorCount || 3,
            note: "Dữ liệu vận hành đồng bộ trực tiếp từ Database",
          }
        })

        setFacilities(mappedFacilities)
      } else if (overview && overview.facilityBreakdown && overview.facilityBreakdown.length > 0) {
        setIsApiConnected(true)
        const mappedFromBreakdown: FacilityPerformance[] = overview.facilityBreakdown.map((b, idx) => {
          const thisMonthRevVal = Number(b.thisMonthRevenue ?? 0)
          const last3MonthsRevVal = Number(b.last3MonthsRevenue ?? 0)
          const allTimeRevVal = Number(
            b.allTimeRevenue ?? 
            (b.netRevenue != null && Number(b.netRevenue) > 0 ? b.netRevenue : (b.rentalRevenue ?? 0))
          )

          const fmtThisMonth = thisMonthRevVal > 0 ? `₫${thisMonthRevVal.toLocaleString("vi-VN")}` : "₫0"
          const fmtLast3Months = last3MonthsRevVal > 0 ? `₫${last3MonthsRevVal.toLocaleString("vi-VN")}` : "₫0"
          const fmtAllTime = allTimeRevVal > 0 ? `₫${allTimeRevVal.toLocaleString("vi-VN")}` : "₫0"

          const rawName = b.facilityName || `Cơ sở ${b.facilityId}`
          const cleanName = rawName.replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
          const rawMgr = b.managerName || "Chưa phân công"
          const cleanMgr = rawMgr.replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
          const isLayoutB = [2, 4, 5, 7].includes(Number(b.facilityId)) || String(b.facilityCode).includes("02") || String(b.facilityCode).includes("04") || String(b.facilityCode).includes("05") || String(b.facilityCode).includes("07")
          const stdUnits = isLayoutB ? 15 : 46
          return {
            id: b.facilityId || idx + 1,
            code: b.facilityCode || `FAC-0${idx + 1}`,
            name: cleanName || rawName,
            address: "Hệ thống chi nhánh SmartStorage",
            managerName: cleanMgr || rawMgr,
            managerEmail: b.managerEmail || "manager@smartstorage.vn",
            managerPhone: b.managerPhone || "0900000000",
            totalUnits: b.totalUnits && b.totalUnits > 0 ? b.totalUnits : stdUnits,
            occupied: b.occupiedUnits || 0,
            rentedUnits: b.occupiedUnits || 0,
            available: b.availableUnits || 0,
            maintenance: b.maintenanceUnits || 0,
            occupancyRate: b.occupancyRate || 0,
            monthlyRevenue: fmtThisMonth,
            thisMonthRevenue: fmtThisMonth,
            last3MonthsRevenue: fmtLast3Months,
            allTimeRevenue: fmtAllTime,
            floorArea: (b.totalUnits || 10) * 12,
            overdueUnits: b.overdueContracts || 0,
            depositHolding: Number(b.depositHolding || 0),
            totalRefunds: Number(b.totalRefunds || 0),
            netRevenue: Number(b.netRevenue || 0),
            rentalRevenue: Number(b.rentalRevenue || 0),
            penaltyRevenue: Number(b.penaltyRevenue || 0),
            monthlyRevenues: (b.monthlyRevenues || []).map((m: any) => ({
              month: m.month,
              label: m.label,
              revenue: Number(m.revenue || 0),
              rentalRevenue: m.rentalRevenue != null ? Number(m.rentalRevenue) : undefined,
              penaltyRevenue: m.penaltyRevenue != null ? Number(m.penaltyRevenue) : undefined,
            })),
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
    const handleUpdate = () => {
      loadLiveData()
    }
    window.addEventListener("storage_facilities_updated", handleUpdate)
    window.addEventListener("storage", handleUpdate)
    return () => {
      window.removeEventListener("storage_facilities_updated", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [loadLiveData])

  // Cập nhật giá & cọc lưu trực tiếp vào Database
  const updatePricingInDb = async (
    unitTypeId: number,
    data: { dailyPrice?: number; monthlyPrice?: number; depositAmount?: number; climateSurchargePercent?: number }
  ): Promise<boolean> => {
    try {
      await bomApi.updatePrice(unitTypeId, data)
      // Cập nhật state local ngay để giao diện phản hồi tức thì
      setPricingList((prev) =>
        prev.map((item) => {
          if (item.unitTypeId === unitTypeId) {
            const newNorm = data.monthlyPrice !== undefined ? data.monthlyPrice : item.normPrice
            const newDaily = data.dailyPrice !== undefined ? data.dailyPrice : item.dailyPrice
            const newDeposit = data.depositAmount !== undefined ? data.depositAmount : item.depositAmount
            const newAc = Math.round(newNorm * 1.2)
            return {
              ...item,
              dailyPrice: newDaily,
              normPrice: newNorm,
              acPrice: newAc,
              depositAmount: newDeposit,
              depositText: `₫${newDeposit.toLocaleString("vi-VN")}`,
            }
          }
          return item
        })
      )
      return true
    } catch (err) {
      console.error("Lỗi cập nhật giá vào database:", err)
      return false
    }
  }

  // Thêm loại kho mới vào Database
  const createPricingInDb = async (data: {
    name: string
    size?: string
    dimensions: string
    dailyPrice: number
    monthlyPrice: number
    depositAmount: number
    climateSurchargePercent?: number
  }): Promise<boolean> => {
    try {
      await bomApi.createPrice(data)
      await loadLiveData()
      return true
    } catch (err) {
      console.error("Lỗi thêm loại kho vào database:", err)
      return false
    }
  }

  // Xóa mềm loại kho khỏi Database
  const deletePricingInDb = async (unitTypeId: number): Promise<boolean> => {
    try {
      await bomApi.deletePrice(unitTypeId)
      await loadLiveData()
      return true
    } catch (err) {
      console.error("Lỗi xóa loại kho khỏi database:", err)
      return false
    }
  }

  // Thêm biểu phí mới vào Database
  const createFeePolicyInDb = async (data: Partial<FeePolicyItem>): Promise<boolean> => {
    try {
      await bomApi.createFeePolicy(data)
      await loadLiveData()
      return true
    } catch (err) {
      console.error("Lỗi thêm biểu phí vào database:", err)
      return false
    }
  }

  // Cập nhật biểu phí vào Database
  const updateFeePolicyInDb = async (policyId: number, data: Partial<FeePolicyItem>): Promise<boolean> => {
    try {
      await bomApi.updateFeePolicy(policyId, data)
      await loadLiveData()
      return true
    } catch (err) {
      console.error("Lỗi cập nhật biểu phí vào database:", err)
      return false
    }
  }

  // Xóa mềm biểu phí khỏi Database (status = 'INACTIVE')
  const deleteFeePolicyInDb = async (policyId: number): Promise<boolean> => {
    try {
      await bomApi.deleteFeePolicy(policyId)
      await loadLiveData()
      return true
    } catch (err) {
      console.error("Lỗi xóa biểu phí trong database:", err)
      return false
    }
  }

  // Thêm cơ sở kho lưu trực tiếp vào Database
  const createFacilityInDb = async (data: {
    facilityName: string
    address: string
    phone?: string
    facilityCode?: string
    layoutType?: string
    floorCount?: number
    isAllClimate?: boolean
    status?: string
    managerName?: string
  }): Promise<boolean> => {
    try {
      await bomApi.createFacility(data)
      await loadLiveData()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("storage_facilities_updated"))
        window.dispatchEvent(new CustomEvent("storage_units_updated"))
        try {
          localStorage.setItem("smart_storage_last_facility_sync", String(Date.now()))
        } catch (e) {}
      }
      return true
    } catch (err) {
      console.error("Lỗi thêm cơ sở vào database:", err)
      return false
    }
  }

  // Cập nhật cơ sở kho lưu trực tiếp vào Database
  const updateFacilityInDb = async (
    facilityId: number,
    data: {
      facilityName?: string
      address?: string
      phone?: string
      status?: string
      managerName?: string
      managerPhone?: string
      managerEmail?: string
      priceMultiplier?: number
    }
  ): Promise<boolean> => {
    try {
      if (data.managerName !== undefined || data.priceMultiplier !== undefined) {
        try {
          const raw = localStorage.getItem("smart_storage_facility_managers")
          const curr = raw ? JSON.parse(raw) : {}
          curr[facilityId] = {
            ...(curr[facilityId] || {}),
            name: data.managerName,
            phone: data.managerPhone || "",
            email: data.managerEmail || "",
            priceMultiplier: data.priceMultiplier,
          }
          localStorage.setItem("smart_storage_facility_managers", JSON.stringify(curr))
        } catch (e) {}
      }

      await bomApi.updateFacility(facilityId, data)
      await loadLiveData()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("storage_facilities_updated"))
        try {
          localStorage.setItem("smart_storage_last_facility_sync", String(Date.now()))
        } catch (e) {}
      }
      return true
    } catch (err) {
      console.error("Lỗi cập nhật cơ sở vào database:", err)
      return false
    }
  }

  // Xóa mềm cơ sở kho trong Database (status = 'INACTIVE')
  const deleteFacilityInDb = async (facilityId: number): Promise<boolean> => {
    try {
      await bomApi.deleteFacility(facilityId)
      await loadLiveData()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("storage_facilities_updated"))
        window.dispatchEvent(new CustomEvent("storage_units_updated"))
        try {
          localStorage.setItem("smart_storage_last_facility_sync", String(Date.now()))
        } catch (e) {}
      }
      return true
    } catch (err) {
      console.error("Lỗi xóa mềm cơ sở trong database:", err)
      return false
    }
  }

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
        updatePricingInDb,
        createPricingInDb,
        deletePricingInDb,
        createFeePolicyInDb,
        updateFeePolicyInDb,
        deleteFeePolicyInDb,
        createFacilityInDb,
        updateFacilityInDb,
        deleteFacilityInDb,
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
