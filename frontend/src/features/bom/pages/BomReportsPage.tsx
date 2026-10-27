import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Building2, Layers } from "lucide-react"
import { useBomContext } from "@/features/bom/context/BomContext"
import FacilityCashFlowDashboard from "@/features/bom/components/FacilityCashFlowDashboard"

export default function BomReportsPage() {
  const { chainOverview, facilities } = useBomContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const breakdownList = chainOverview?.facilityBreakdown || []
  const initialFacId = searchParams.get("facilityId") || "ALL"
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(initialFacId)

  // Đồng bộ param trên url nếu người dùng chuyển trang vào
  useEffect(() => {
    const p = searchParams.get("facilityId")
    if (p) {
      setSelectedFacilityId(p)
    } else {
      setSelectedFacilityId("ALL")
    }
  }, [searchParams])

  const handleSelectFacility = (id: string) => {
    setSelectedFacilityId(id)
    if (id === "ALL") {
      searchParams.delete("facilityId")
      setSearchParams(searchParams, { replace: true })
    } else {
      setSearchParams({ facilityId: id }, { replace: true })
    }
  }

  const isAll = selectedFacilityId === "ALL"

  // Lấy dữ liệu cơ sở đang chọn (nếu có)
  const currentFac = useMemo(() => {
    if (isAll) return null
    return (
      breakdownList.find((b) => String(b.facilityId) === selectedFacilityId) ||
      facilities.find((f) => String(f.id) === selectedFacilityId) ||
      null
    )
  }, [isAll, selectedFacilityId, breakdownList, facilities])

  // Chuẩn bị dữ liệu hiển thị truyền cho FacilityCashFlowDashboard
  const dashboardProps = useMemo(() => {
    if (isAll || !currentFac) {
      return {
        title: "Doanh Thu Toàn Hệ Thống",
        subtitle: "Xu hướng dòng tiền thực thu 6 tháng gần nhất toàn chuỗi kho",
        monthlyRevenues: chainOverview?.monthlyRevenues || [],
        netRevenue: Number(chainOverview?.chainNetRevenue || 0),
        depositHolding: Number(chainOverview?.chainDepositHolding || 0),
        totalRefunds: Number(chainOverview?.chainTotalRefunds || 0),
        overdueContracts: breakdownList.reduce((acc, r) => acc + Number(r.overdueContracts || 0), 0),
        totalUnits: Number(chainOverview?.chainTotalUnits || 0),
        occupiedUnits: breakdownList.reduce((acc, r) => acc + Number(r.occupiedUnits || 0), 0),
        availableUnits: breakdownList.reduce((acc, r) => acc + Number(r.availableUnits || 0), 0),
        maintenanceUnits: breakdownList.reduce((acc, r) => acc + Number(r.maintenanceUnits || 0), 0),
        occupancyRate: Number(chainOverview?.chainAverageOccupancyRate || 0),
      }
    }

    const facBreakdown = breakdownList.find((b) => String(b.facilityId) === selectedFacilityId)
    const facPerformance = facilities.find((f) => String(f.id) === selectedFacilityId)

    const code = facBreakdown?.facilityCode || facPerformance?.code || `FAC-${selectedFacilityId}`
    const rawName = facBreakdown?.facilityName || facPerformance?.name || `Cơ sở ${code}`
    const name = rawName.replace(/\s*\([A-Z0-9-]+\)\s*$/, "")

    const monthlyRevs = facBreakdown?.monthlyRevenues || facPerformance?.monthlyRevenues || []
    const netRev = Number(facBreakdown?.netRevenue ?? facPerformance?.netRevenue ?? facPerformance?.monthlyRevenue ?? 0)
    const depHold = Number(facBreakdown?.depositHolding ?? facPerformance?.depositHolding ?? 0)
    const totRefund = Number(facBreakdown?.totalRefunds ?? facPerformance?.totalRefunds ?? 0)
    const overdue = Number(facBreakdown?.overdueContracts ?? facPerformance?.overdueUnits ?? 0)
    const tUnits = Number(facBreakdown?.totalUnits ?? facPerformance?.totalUnits ?? 46)
    const occUnits = Number(facBreakdown?.occupiedUnits ?? facPerformance?.occupied ?? 0)
    const availUnits = Number(facBreakdown?.availableUnits ?? facPerformance?.available ?? 0)
    const maintUnits = Number(facBreakdown?.maintenanceUnits ?? facPerformance?.maintenance ?? 0)
    const occRate = Number(
      facBreakdown?.occupancyRate ??
      facPerformance?.occupancyRate ??
      (tUnits > 0 ? Math.round((occUnits / tUnits) * 100) : 0)
    )

    return {
      title: `Doanh Thu Thực Thu - ${code}`,
      subtitle: `Xu hướng dòng tiền thực thu 6 tháng gần nhất tại ${name}`,
      monthlyRevenues: monthlyRevs,
      netRevenue: netRev,
      depositHolding: depHold,
      totalRefunds: totRefund,
      overdueContracts: overdue,
      totalUnits: tUnits,
      occupiedUnits: occUnits,
      availableUnits: availUnits,
      maintenanceUnits: maintUnits,
      occupancyRate: occRate,
    }
  }, [isAll, currentFac, selectedFacilityId, chainOverview, breakdownList, facilities])

  // Danh sách cơ sở để render thanh filter chọn nhanh
  const facilityFilterButtons = useMemo(() => {
    if (breakdownList.length > 0) {
      return breakdownList.map((b) => ({
        id: String(b.facilityId),
        code: b.facilityCode || `FAC-${b.facilityId}`,
        name: (b.facilityName || "").replace(/\s*\([A-Z0-9-]+\)\s*$/, ""),
      }))
    }
    return facilities.map((f) => ({
      id: String(f.id),
      code: f.code || `FAC-${f.id}`,
      name: (f.name || "").replace(/\s*\([A-Z0-9-]+\)\s*$/, ""),
    }))
  }, [breakdownList, facilities])

  return (
    <div className="space-y-5">
      {/* HEADER BÁO CÁO & BỘ CHỌN CƠ SỞ NHANH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
            Báo Cáo Tổng Quan Hệ Thống Thuê Kho
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Giám sát dòng tiền thực thu và quy mô vận hành theo từng cơ sở hoặc toàn hệ thống
          </p>
        </div>

        {/* Nút lọc chuyển đổi nhanh giữa Toàn Hệ Thống và từng Cơ sở */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleSelectFacility("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedFacilityId === "ALL"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25 border border-sky-400"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
            }`}
          >
            <Layers className="size-3.5" />
            Toàn Hệ Thống
          </button>

          {facilityFilterButtons.map((f) => {
            const isSelected = selectedFacilityId === f.id
            return (
              <button
                key={f.id}
                onClick={() => handleSelectFacility(f.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25 border border-sky-400"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
                }`}
                title={f.name}
              >
                <Building2 className="size-3.5" />
                {f.code}
              </button>
            )
          })}
        </div>
      </div>

      {/* KHỐI EXECUTIVE DASHBOARD DÒNG TIỀN VÀ QUY MÔ VẬN HÀNH */}
      <FacilityCashFlowDashboard {...dashboardProps} />
    </div>
  )
}
