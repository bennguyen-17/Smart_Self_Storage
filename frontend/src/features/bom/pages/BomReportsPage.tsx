import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import apiClient from "@/lib/apiClient"
import { getStorageUnits } from "@/features/customer/rent/rentApi"
import { useBomContext } from "@/features/bom/context/BomContext"
import FacilityCashFlowDashboard from "@/features/bom/components/FacilityCashFlowDashboard"

export default function BomReportsPage() {
  const navigate = useNavigate()
  const { chainOverview, facilities } = useBomContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const breakdownList = chainOverview?.facilityBreakdown || []
  const initialFacId = searchParams.get("facilityId") || "ALL"
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(initialFacId)

  // Lưu trữ danh sách ô kho của cơ sở đang chọn để hiển thị bảng cơ cấu
  const [facilityUnits, setFacilityUnits] = useState<any[]>([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)

  // Đồng bộ param trên url nếu người dùng chuyển trang vào
  useEffect(() => {
    const p = searchParams.get("facilityId")
    if (p) {
      setSelectedFacilityId(p)
    } else {
      setSelectedFacilityId("ALL")
    }
  }, [searchParams])

  const isAll = selectedFacilityId === "ALL"

  // Lấy dữ liệu cơ sở đang chọn (nếu có)
  const currentFac = useMemo(() => {
    if (isAll) return null
    const normalize = (s?: string | number) =>
      String(s || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    const targetNorm = normalize(selectedFacilityId)

    return (
      breakdownList.find(
        (b) =>
          String(b.facilityId) === selectedFacilityId ||
          normalize(b.facilityCode) === targetNorm ||
          normalize(b.facilityId) === targetNorm
      ) ||
      facilities.find(
        (f) =>
          String(f.id) === selectedFacilityId ||
          normalize(f.code) === targetNorm ||
          normalize(f.id) === targetNorm
      ) ||
      null
    )
  }, [isAll, selectedFacilityId, breakdownList, facilities])

  // Tải danh sách ô kho khi chọn cơ sở cụ thể để phân tích cơ cấu
  useEffect(() => {
    if (isAll || !selectedFacilityId) {
      setFacilityUnits([])
      return
    }

    let isMounted = true
    setIsLoadingUnits(true)

    const fetchUnits = async () => {
      try {
        let facId = Number(selectedFacilityId)
        if (isNaN(facId) || facId <= 0) {
          const match = selectedFacilityId.match(/\d+/)
          facId = match ? parseInt(match[0], 10) : 1
        }

        const res: any = await apiClient
          .get("/units/filter", { params: { facilityId: facId } })
          .catch(() => null)

        const raw = Array.isArray(res) ? res : res?.data || []
        if (isMounted) {
          if (raw.length > 0) {
            setFacilityUnits(raw)
          } else {
            const facCode = (currentFac as any)?.facilityCode || (currentFac as any)?.code || `FAC-${facId}`
            const [u1, u2, u3] = await Promise.all([
              getStorageUnits(facCode, 1).catch(() => ({ data: [] })),
              getStorageUnits(facCode, 2).catch(() => ({ data: [] })),
              getStorageUnits(facCode, 3).catch(() => ({ data: [] })),
            ])
            const combined = [...(u1?.data || []), ...(u2?.data || []), ...(u3?.data || [])]
            setFacilityUnits(combined)
          }
        }
      } catch (err) {
        console.warn("Không thể tải ô kho của cơ sở:", err)
      } finally {
        if (isMounted) setIsLoadingUnits(false)
      }
    }

    fetchUnits()
    return () => {
      isMounted = false
    }
  }, [isAll, selectedFacilityId, currentFac])

  // Chuẩn bị dữ liệu hiển thị truyền cho FacilityCashFlowDashboard
  const dashboardProps = useMemo(() => {
    if (isAll || !currentFac) {
      return {
        title: "Doanh Thu Toàn Hệ Thống",
        subtitle: "Xu hướng dòng tiền thực thu 6 tháng gần nhất toàn chuỗi kho",
        monthlyRevenues: chainOverview?.monthlyRevenues || [],
        netRevenue: Number(chainOverview?.chainNetRevenue || 0),
        rentalRevenue: Number((chainOverview as any)?.chainRentalRevenue || breakdownList.reduce((acc, r) => acc + Number(r.rentalRevenue || 0), 0) || chainOverview?.chainTotalRevenue || 0),
        depositHolding: Number(chainOverview?.chainDepositHolding || 0),
        penaltyRevenue: Number((chainOverview as any)?.chainPenaltyRevenue || breakdownList.reduce((acc, r) => acc + Number(r.penaltyRevenue || 0), 0)),
        totalRefunds: Number(chainOverview?.chainTotalRefunds || 0),
        overdueContracts: breakdownList.reduce((acc, r) => acc + Number(r.overdueContracts || 0), 0),
        totalUnits: Number(chainOverview?.chainTotalUnits || 0),
        occupiedUnits: breakdownList.reduce((acc, r) => acc + Number(r.occupiedUnits || 0), 0),
        reservedUnits: breakdownList.reduce((acc, r) => acc + Number(r.reservedUnits || 0), 0),
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
    const rentalRev = Number(facBreakdown?.rentalRevenue ?? (facPerformance as any)?.rentalRevenue ?? 0)
    const depHold = Number(facBreakdown?.depositHolding ?? facPerformance?.depositHolding ?? 0)
    const penaltyRev = Number(facBreakdown?.penaltyRevenue ?? (facPerformance as any)?.penaltyRevenue ?? 0)
    const totRefund = Number(facBreakdown?.totalRefunds ?? facPerformance?.totalRefunds ?? 0)
    const overdue = Number(facBreakdown?.overdueContracts ?? facPerformance?.overdueUnits ?? 0)
    const tUnits = Number(facBreakdown?.totalUnits ?? facPerformance?.totalUnits ?? 46)
    const occUnits = Number(facBreakdown?.occupiedUnits ?? facPerformance?.occupied ?? 0)
    const resUnits = Number(facBreakdown?.reservedUnits ?? (facPerformance as any)?.reservedUnits ?? 0)
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
      rentalRevenue: rentalRev,
      depositHolding: depHold,
      penaltyRevenue: penaltyRev,
      totalRefunds: totRefund,
      overdueContracts: overdue,
      totalUnits: tUnits,
      occupiedUnits: occUnits,
      reservedUnits: resUnits,
      availableUnits: availUnits,
      maintenanceUnits: maintUnits,
      occupancyRate: occRate,
    }
  }, [isAll, currentFac, selectedFacilityId, chainOverview, breakdownList, facilities])

  const currentFacName = currentFac
    ? ((currentFac as any).facilityName || (currentFac as any).name || "").replace(/\s*\([A-Z0-9-]+\)\s*$/, "")
    : ""
  const currentFacCode = currentFac ? (currentFac as any).facilityCode || (currentFac as any).code || "" : ""

  return (
    <div className="space-y-5">
      {/* HEADER BÁO CÁO - Chuẩn Staff & Manager */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {!isAll && (
            <button
              type="button"
              onClick={() => navigate("/bom/facilities")}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0 shadow-xs"
              title="Quay lại danh sách cơ sở kho"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>
              {isAll
                ? "Báo cáo tổng quan doanh thu toàn chuỗi"
                : `Báo cáo cơ sở: ${currentFacName} (${currentFacCode})`}
            </span>
          </h1>
        </div>
      </div>

      {/* KHỐI EXECUTIVE DASHBOARD DÒNG TIỀN VÀ QUY MÔ VẬN HÀNH */}
      <FacilityCashFlowDashboard {...dashboardProps} />

      {/* NẾU ĐANG CHỌN CƠ SỞ CỤ THỂ: HIỂN THỊ THÊM BẢNG CƠ CẤU Ô KHO THEO SIZE */}
      {!isAll && (
        <div className="rounded-2xl border border-slate-200/90 bg-white/90 dark:border-slate-800/90 dark:bg-slate-900/60 p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <span>BÁO CÁO CƠ CẤU Ô KHO THEO SIZE &amp; LOẠI HÌNH</span>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 shadow-2xs">
                  {currentFacCode}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chi tiết tỷ lệ khai thác và doanh thu tiềm năng từng kích thước ô kho
              </p>
            </div>
          </div>

          {isLoadingUnits ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold space-y-2">
              <div className="size-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Đang tổng hợp cơ cấu ô kho...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-center text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    <th className="p-3 text-center whitespace-nowrap">Phân Loại / Size</th>
                    <th className="p-3 text-center whitespace-nowrap">Quy Cách Sàn</th>
                    <th className="p-3 text-center whitespace-nowrap">Tổng Số Ô</th>
                    <th className="p-3 text-center whitespace-nowrap">Đang Thuê</th>
                    <th className="p-3 text-center whitespace-nowrap">Còn Trống</th>
                    <th className="p-3 text-center whitespace-nowrap">Giữ Chỗ</th>
                    <th className="p-3 text-center whitespace-nowrap">Bảo Trì</th>
                    <th className="p-3 text-center whitespace-nowrap">Tỷ Lệ Lấp Đầy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-semibold text-slate-700 dark:text-slate-300">
                  {(() => {
                    const SIZES = [
                      { size: "S", name: "Size S (Tủ Cá Nhân)", dim: "1.0m × 1.0m", defaultNorm: 600000 },
                      { size: "M", name: "Size M (Phòng Vừa)", dim: "1.5m × 2.0m", defaultNorm: 1200000 },
                      { size: "L", name: "Size L (Phòng Lớn)", dim: "2.0m × 3.0m", defaultNorm: 2400000 },
                      { size: "XL", name: "Size XL (Kho Doanh Nghiệp)", dim: "2.5m × 4.0m", defaultNorm: 4000000 },
                    ]

                    let grandTotal = 0
                    let grandOccupied = 0
                    let grandAvailable = 0
                    let grandHold = 0
                    let grandMaintenance = 0

                    const rows = SIZES.map((cfg) => {
                      const list = facilityUnits.filter((u) => {
                        const typeStr = (u.typeName || u.typeLabel || "").toUpperCase()
                        const sz = (u.size || "").toUpperCase()
                        const code = (u.unitCode || u.unitId || "").toUpperCase()
                        if (cfg.size === "XL") return typeStr.includes("XL") || sz === "XL" || sz.includes("XL") || code.includes("-XL")
                        if (cfg.size === "S") return (typeStr.includes("SIZE S") || sz === "S" || code.includes("-S")) && !typeStr.includes("XL") && !code.includes("-XL")
                        if (cfg.size === "M") return typeStr.includes("SIZE M") || sz === "M" || code.includes("-M")
                        if (cfg.size === "L") return (typeStr.includes("SIZE L") || sz === "L" || code.includes("-L")) && !typeStr.includes("XL") && !code.includes("-XL")
                        return false
                      })

                      const total = list.length
                      const occupied = list.filter((u) => {
                        const st = (u.status || "").toUpperCase()
                        return st === "OCCUPIED" || st === "RENTED"
                      }).length
                      const available = list.filter((u) => (u.status || "").toUpperCase() === "AVAILABLE").length
                      const hold = list.filter((u) => {
                        const st = (u.status || "").toUpperCase()
                        return st === "HOLD" || st === "RESERVED"
                      }).length
                      const maintenance = list.filter((u) => (u.status || "").toUpperCase() === "MAINTENANCE").length
                      const occRate = total > 0 ? Math.round((occupied / total) * 100) : 0

                      grandTotal += total
                      grandOccupied += occupied
                      grandAvailable += available
                      grandHold += hold
                      grandMaintenance += maintenance

                      return (
                        <tr key={cfg.size} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition">
                          <td className="p-3 whitespace-nowrap align-middle text-center">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm whitespace-nowrap">{cfg.name}</div>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{cfg.dim}</td>
                          <td className="p-3 text-center font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">{total} ô</td>
                          <td className="p-3 text-center font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">{occupied}</td>
                          <td className="p-3 text-center font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">{available}</td>
                          <td className="p-3 text-center font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">{hold}</td>
                          <td className="p-3 text-center font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">{maintenance}</td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">{occRate}%</span>
                              <div className="w-14 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 dark:bg-slate-300 rounded-full"
                                  style={{ width: `${Math.min(occRate, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })

                    const grandRate = grandTotal > 0 ? Math.round((grandOccupied / grandTotal) * 100) : 0

                    return (
                      <>
                        {rows}
                        <tr className="bg-slate-100 dark:bg-slate-950 font-black border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                          <td className="p-3 whitespace-nowrap align-middle text-center uppercase text-slate-900 dark:text-white tracking-wider">
                            TỔNG CỘNG CƠ CẤU
                          </td>
                          <td className="p-3 text-center text-slate-400 font-mono whitespace-nowrap">—</td>
                          <td className="p-3 text-center text-blue-600 dark:text-blue-400 font-mono whitespace-nowrap">{grandTotal} ô</td>
                          <td className="p-3 text-center text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap">{grandOccupied}</td>
                          <td className="p-3 text-center text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">{grandAvailable}</td>
                          <td className="p-3 text-center text-amber-600 dark:text-amber-400 font-mono whitespace-nowrap">{grandHold}</td>
                          <td className="p-3 text-center text-rose-600 dark:text-rose-400 font-mono whitespace-nowrap">{grandMaintenance}</td>
                          <td className="p-3 text-center text-blue-600 dark:text-blue-400 font-mono whitespace-nowrap">{grandRate}%</td>
                        </tr>
                      </>
                    )
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
