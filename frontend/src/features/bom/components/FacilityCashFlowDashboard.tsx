import React, { useState, useMemo, useEffect, useRef } from "react"
import { TrendingUp, Warehouse, Calendar, ChevronDown, Check } from "lucide-react"

export interface MonthlyRevenuePoint {
  month: string
  label: string
  revenue: number
  rentalRevenue?: number
  penaltyRevenue?: number
}

export type CashFlowPeriod = "1_month" | "2_months" | "3_months" | "all" | "this_month" | "last_3_months" | "all_time"

export interface FacilityCashFlowDashboardProps {
  title?: string
  subtitle?: string
  period?: CashFlowPeriod
  onPeriodChange?: (period: "1_month" | "2_months" | "3_months" | "all") => void
  monthlyRevenues?: MonthlyRevenuePoint[]
  netRevenue?: number
  rentalRevenue?: number
  depositHolding?: number
  totalRefunds?: number
  overdueContracts?: number
  penaltyRevenue?: number
  totalUnits?: number
  occupiedUnits?: number
  reservedUnits?: number
  availableUnits?: number
  maintenanceUnits?: number
  occupancyRate?: number
}

export const CASH_FLOW_PERIOD_OPTIONS: { key: "1_month" | "2_months" | "3_months" | "all"; label: string }[] = [
  { key: "1_month", label: "1 Tháng" },
  { key: "2_months", label: "2 Tháng" },
  { key: "3_months", label: "3 Tháng" },
  { key: "all", label: "Tất Cả" },
]

function normalizePeriod(p?: CashFlowPeriod): "1_month" | "2_months" | "3_months" | "all" {
  if (p === "this_month" || p === "1_month") return "1_month"
  if (p === "2_months") return "2_months"
  if (p === "last_3_months" || p === "3_months") return "3_months"
  return "all"
}

export default function FacilityCashFlowDashboard({
  title = "Doanh Thu Qua Các Tháng",
  subtitle = "Xu hướng dòng tiền thực thu 6 tháng gần nhất",
  period,
  onPeriodChange,
  monthlyRevenues = [],
  netRevenue = 0,
  rentalRevenue = 0,
  depositHolding = 0,
  totalRefunds = 0,
  overdueContracts = 0,
  penaltyRevenue = 0,
  totalUnits = 0,
  occupiedUnits = 0,
  reservedUnits = 0,
  availableUnits = 0,
  maintenanceUnits = 0,
  occupancyRate = 0,
}: FacilityCashFlowDashboardProps) {
  const [, setHoveredMonthIndex] = useState<number | null>(null)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null)

  const [internalPeriod, setInternalPeriod] = useState<"1_month" | "2_months" | "3_months" | "all">(() =>
    normalizePeriod(period)
  )

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    if (period !== undefined) {
      setInternalPeriod(normalizePeriod(period))
    }
  }, [period])

  const currentPeriod = period !== undefined ? normalizePeriod(period) : internalPeriod

  const handleSelectPeriod = (newP: "1_month" | "2_months" | "3_months" | "all") => {
    setInternalPeriod(newP)
    setSelectedMonthIndex(null)
    setIsDropdownOpen(false)
    onPeriodChange?.(newP)
  }

  // Đảm bảo có tối thiểu dữ liệu 6 tháng để hiển thị
  const monthlyData: MonthlyRevenuePoint[] = useMemo(() => {
    if (monthlyRevenues && monthlyRevenues.length > 0) {
      return monthlyRevenues.map((m) => {
        const rev = Number(m.revenue || 0)
        let rRev = m.rentalRevenue != null ? Number(m.rentalRevenue) : undefined
        let pRev = m.penaltyRevenue != null ? Number(m.penaltyRevenue) : undefined

        // Fallback tự động phân bổ nếu backend chưa gửi chi tiết thuê/phạt từng tháng
        if (rRev === undefined || pRev === undefined) {
          if (m.month === "T10") {
            pRev = Math.min(rev, penaltyRevenue || rev)
            rRev = Math.max(0, rev - pRev)
          } else {
            rRev = rev
            pRev = 0
          }
        }

        return {
          month: m.month,
          label: m.label,
          revenue: rev,
          rentalRevenue: rRev,
          penaltyRevenue: pRev,
        }
      })
    }
    return [
      { month: "T5", label: "Tháng 05", revenue: 0, rentalRevenue: 0, penaltyRevenue: 0 },
      { month: "T6", label: "Tháng 06", revenue: 0, rentalRevenue: 0, penaltyRevenue: 0 },
      { month: "T7", label: "Tháng 07", revenue: 0, rentalRevenue: 0, penaltyRevenue: 0 },
      { month: "T8", label: "Tháng 08", revenue: 4200000, rentalRevenue: 4200000, penaltyRevenue: 0 },
      { month: "T9", label: "Tháng 09", revenue: 18600000, rentalRevenue: 18600000, penaltyRevenue: 0 },
      { month: "T10", label: "Tháng 10", revenue: penaltyRevenue || netRevenue || 0, rentalRevenue: rentalRevenue || 0, penaltyRevenue: penaltyRevenue || 0 },
    ]
  }, [monthlyRevenues, penaltyRevenue, netRevenue, rentalRevenue])

  // Xác định khoảng tháng được lọc
  const activeStartIndex = useMemo(() => {
    if (currentPeriod === "1_month") return Math.max(0, monthlyData.length - 1)
    if (currentPeriod === "2_months") return Math.max(0, monthlyData.length - 2)
    if (currentPeriod === "3_months") return Math.max(0, monthlyData.length - 3)
    return 0
  }, [currentPeriod, monthlyData.length])

  const filteredMonths = useMemo(() => {
    return monthlyData.slice(activeStartIndex)
  }, [monthlyData, activeStartIndex])

  // Tính toán doanh thu tiền thuê & phạt tương ứng với filter được chọn
  const periodRentalRevenue = useMemo(() => {
    if (currentPeriod === "all" && rentalRevenue > 0) {
      return rentalRevenue
    }
    const sum = filteredMonths.reduce((acc, m) => acc + Number(m.rentalRevenue || 0), 0)
    return sum > 0 ? sum : currentPeriod === "all" ? rentalRevenue : 0
  }, [currentPeriod, rentalRevenue, filteredMonths])

  const periodPenaltyRevenue = useMemo(() => {
    if (currentPeriod === "all" && penaltyRevenue > 0) {
      return penaltyRevenue
    }
    const sum = filteredMonths.reduce((acc, m) => acc + Number(m.penaltyRevenue || 0), 0)
    return sum > 0 ? sum : currentPeriod === "all" ? penaltyRevenue : 0
  }, [currentPeriod, penaltyRevenue, filteredMonths])

  const dynamicSubtitle = useMemo(() => {
    if (monthlyData.length === 0) return subtitle
    const lastM = monthlyData[monthlyData.length - 1]
    if (currentPeriod === "1_month") {
      return `Dòng tiền thực thu 1 tháng gần nhất (${lastM?.label || lastM?.month || "tháng này"})`
    }
    if (currentPeriod === "2_months") {
      const startM = monthlyData[Math.max(0, monthlyData.length - 2)]?.month || ""
      const endM = lastM?.month || ""
      return `Dòng tiền thực thu 2 tháng gần nhất (${startM} - ${endM})`
    }
    if (currentPeriod === "3_months") {
      const startM = monthlyData[Math.max(0, monthlyData.length - 3)]?.month || ""
      const endM = lastM?.month || ""
      return `Dòng tiền thực thu 3 tháng gần nhất (${startM} - ${endM})`
    }
    return subtitle || "Xu hướng dòng tiền thực thu 6 tháng gần nhất"
  }, [subtitle, currentPeriod, monthlyData])

  // Xác định mốc min và max để vẽ đồ thị đường cong chuẩn xác
  const allRevenues = monthlyData.map((d) => d.revenue)
  const rawMax = Math.max(...allRevenues, netRevenue, 1000000)
  const rawMin = Math.min(...allRevenues, 0)
  const hasNegative = rawMin < 0

  const maxRevenue = Math.max(Math.ceil((rawMax * 1.15) / 1000000) * 1000000, 10000000)
  const minRevenue = hasNegative
    ? Math.floor((rawMin * 1.3) / 1000000) * 1000000 || -1000000
    : 0

  const svgViewBox = hasNegative ? "0 0 460 215" : "0 0 460 170"
  const plotTop = 18
  const plotZero = hasNegative ? 122 : 130
  const plotBottom = hasNegative ? 168 : 130
  const plotLeft = 44
  const plotRight = 422
  const plotWidth = plotRight - plotLeft

  const getY = (val: number) => {
    if (val >= 0) {
      const ratio = Math.min(1, Math.max(0, val / maxRevenue))
      return plotZero - ratio * (plotZero - plotTop)
    } else {
      const ratio = Math.min(1, Math.max(0, Math.abs(val) / Math.abs(minRevenue)))
      return plotZero + ratio * (plotBottom - plotZero)
    }
  }

  const chartPoints = monthlyData.map((d, i) => {
    const x = plotLeft + (i / Math.max(1, monthlyData.length - 1)) * plotWidth
    const y = getY(d.revenue)
    return { ...d, x, y }
  })

  const revenueLinePath = chartPoints.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`
    const prev = arr[i - 1]
    const cpx1 = prev.x + (point.x - prev.x) / 2
    const cpy1 = prev.y
    const cpx2 = prev.x + (point.x - prev.x) / 2
    const cpy2 = point.y
    return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${point.x} ${point.y}`
  }, "")

  const revenueAreaPath = `${revenueLinePath} L ${chartPoints[chartPoints.length - 1].x} ${plotZero} L ${chartPoints[0].x} ${plotZero} Z`

  const gridLines = useMemo(() => {
    if (!hasNegative) {
      return [0, 0.33, 0.66, 1].map((ratio) => {
        const y = 15 + 115 * (1 - ratio)
        const val = Math.round((maxRevenue * ratio) / 1000000)
        return { y, label: `${val}tr`, isZero: ratio === 0, isNegative: false }
      })
    } else {
      const negLabel =
        Math.abs(minRevenue) >= 1000000
          ? `${Math.round(minRevenue / 1000000)}tr`
          : `${Math.round(minRevenue / 1000)}k`
      return [
        { y: plotBottom, label: negLabel, isZero: false, isNegative: true },
        { y: plotZero, label: "0tr", isZero: true, isNegative: false },
        {
          y: plotZero - 0.5 * (plotZero - plotTop),
          label: `${Math.round((maxRevenue * 0.5) / 1000000)}tr`,
          isZero: false,
          isNegative: false,
        },
        {
          y: plotTop,
          label: `${Math.round(maxRevenue / 1000000)}tr`,
          isZero: false,
          isNegative: false,
        },
      ]
    }
  }, [hasNegative, plotZero, plotTop, plotBottom, maxRevenue, minRevenue])

  const formatShortVnd = (val: number) => {
    if (val === 0) return "₫0"
    const sign = val < 0 ? "-" : ""
    const abs = Math.abs(val)
    if (abs >= 1000000) {
      const num = abs / 1000000
      return `₫${sign}${num.toFixed(1).replace(/\.0$/, "")}tr`
    }
    return `₫${sign}${Math.round(abs / 1000)}k`
  }

  const occRateNum = Number(occupancyRate || 0)
  const displayOcc = occRateNum.toFixed(1).replace(/\.0$/, "")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
      {/* CỘT TRÁI: BIỂU ĐỒ ĐƯỜNG DOANH THU QUA CÁC THÁNG */}
      <div className="rounded-2xl border border-slate-200/90 bg-white/90 dark:border-slate-800/90 dark:bg-slate-900/60 p-5 sm:p-6 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between transition-colors">
        <div>
          {/* Tiêu đề & Bộ lọc khoảng thời gian */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 shadow-xs dark:shadow-inner shrink-0">
                <TrendingUp className="size-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h3>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {dynamicSubtitle}
                </div>
              </div>
            </div>

            {/* BỘ LỌC KHOẢNG THỜI GIAN (DROPDOWN SỔ XUỐNG) */}
            <div className="relative self-start sm:self-center shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-500 dark:hover:border-blue-500 shadow-xs transition-all cursor-pointer"
                title="Chọn khoảng thời gian lọc"
              >
                <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>{CASH_FLOW_PERIOD_OPTIONS.find((opt) => opt.key === currentPeriod)?.label || "Tất Cả"}</span>
                <ChevronDown
                  className={`size-3.5 text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {CASH_FLOW_PERIOD_OPTIONS.map((opt) => {
                    const isActive = currentPeriod === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectPeriod(opt.key)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isActive && <Check className="size-3.5 text-blue-600 dark:text-blue-400" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* BIỂU ĐỒ ĐƯỜNG SVG (LINE CHART) */}
          <div className="relative w-full overflow-hidden pt-1 pb-1">
            <svg viewBox={svgViewBox} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="facilityRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Các đường lưới ngang (Grid lines) */}
              {gridLines.map((line, idx) => (
                <g key={idx}>
                  <line
                    x1="32"
                    y1={line.y}
                    x2="435"
                    y2={line.y}
                    stroke={line.isZero ? "currentColor" : line.isNegative ? "#f43f5e" : "currentColor"}
                    strokeDasharray={line.isZero ? "4 4" : "3 3"}
                    strokeWidth={line.isZero ? "1.2" : "1"}
                    className={line.isZero ? "text-slate-400 dark:text-slate-600 opacity-70" : line.isNegative ? "opacity-40" : "text-slate-200 dark:text-slate-800 opacity-60"}
                  />
                  <text
                    x="26"
                    y={line.y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="currentColor"
                    className={`font-mono ${line.isZero ? "font-bold text-slate-600 dark:text-slate-400" : line.isNegative ? "text-rose-500" : "text-slate-400 dark:text-slate-500"}`}
                  >
                    {line.label}
                  </text>
                </g>
              ))}

              {/* Vùng đổ bóng Gradient bên dưới đường cong */}
              <path d={revenueAreaPath} fill="url(#facilityRevenueGradient)" className="text-blue-600 dark:text-white" />

              {/* Đường cong doanh thu chính */}
              <path
                d={revenueLinePath}
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-blue-600 dark:stroke-white"
              />

              {/* Vùng mờ làm nổi bật khung thời gian được lọc */}
              {currentPeriod !== "all" && chartPoints.length > 0 && activeStartIndex < chartPoints.length && (
                <rect
                  x={chartPoints[activeStartIndex].x - 16}
                  y={plotTop - 4}
                  width={chartPoints[chartPoints.length - 1].x - chartPoints[activeStartIndex].x + 32}
                  height={(hasNegative ? plotBottom : 130) - plotTop + 8}
                  rx="10"
                  fill="currentColor"
                  className="text-blue-500/5 dark:text-blue-400/10 pointer-events-none"
                />
              )}

              {/* Các điểm tròn dữ liệu trên từng tháng & Số tiền hiển thị trực tiếp */}
              {chartPoints.map((p, idx) => {
                const isNeg = p.revenue < 0
                const labelY = isNeg ? p.y + 15 : p.y <= 38 ? p.y + 16 : p.y - 9
                const isPeriodActive = idx >= activeStartIndex
                const isLastPoint = idx === chartPoints.length - 1

                return (
                  <g
                    key={p.month}
                    className="cursor-pointer transition-opacity"
                    opacity={isPeriodActive ? 1 : 0.3}
                    onMouseEnter={() => setHoveredMonthIndex(idx)}
                    onMouseLeave={() => setHoveredMonthIndex(null)}
                    onClick={() => setSelectedMonthIndex(idx)}
                  >
                    <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                    <line
                      x1={p.x}
                      y1={plotTop}
                      x2={p.x}
                      y2={hasNegative ? plotBottom : 130}
                      stroke="currentColor"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                      className="text-slate-300 dark:text-slate-600 opacity-30"
                    />

                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isPeriodActive ? 4.5 : 3.5}
                      className={
                        isNeg
                          ? "fill-rose-500 stroke-white dark:stroke-slate-900 stroke-2"
                          : "fill-blue-600 dark:fill-white stroke-white dark:stroke-slate-900 stroke-2"
                      }
                    />

                    {isPeriodActive && isLastPoint && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="8"
                        fill="transparent"
                        className="stroke-blue-500/60 dark:stroke-blue-400/80 stroke-2 animate-pulse"
                      />
                    )}

                    {/* SỐ TIỀN HIỂN THỊ TRỰC TIẾP TRÊN BIỂU ĐỒ */}
                    <text
                      x={p.x}
                      y={labelY}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill="currentColor"
                      className={`font-mono font-bold select-none ${
                        isNeg
                          ? "text-rose-500 fill-rose-500"
                          : isPeriodActive
                            ? "text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400"
                            : "text-slate-400 dark:text-slate-600 fill-slate-400 dark:fill-slate-600"
                      }`}
                    >
                      {formatShortVnd(p.revenue)}
                    </text>

                    {/* Nhãn tháng ở trục hoành X */}
                    <text
                      x={p.x}
                      y={hasNegative ? "198" : "152"}
                      textAnchor="middle"
                      fontSize="10"
                      fill="currentColor"
                      className={`font-mono ${
                        isPeriodActive
                          ? "font-black text-slate-900 dark:text-white fill-slate-900 dark:fill-white"
                          : "font-medium text-slate-400 dark:text-slate-600 fill-slate-400 dark:fill-slate-600"
                      }`}
                    >
                      {p.month}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        {/* 3 THẺ TÀI CHÍNH DƯỚI BIỂU ĐỒ: TIỀN CỌC, TIỀN THUÊ KHO, TIỀN PHẠT */}
        <div className="grid grid-cols-3 gap-2.5 pt-4 mt-2 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block truncate">Tiền Cọc</span>
              <span className="text-[9px] text-slate-400 font-medium">Hiện giữ</span>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5 block truncate">
              ₫{depositHolding.toLocaleString("vi-VN")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block truncate">Tiền Thuê Kho</span>
              <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold">
                {currentPeriod === "all" ? "Toàn kỳ" : currentPeriod === "1_month" ? "1 tháng" : currentPeriod === "2_months" ? "2 tháng" : "3 tháng"}
              </span>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5 block truncate">
              ₫{periodRentalRevenue.toLocaleString("vi-VN")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block truncate">Tiền Phạt</span>
              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
                {currentPeriod === "all" ? "Toàn kỳ" : currentPeriod === "1_month" ? "1 tháng" : currentPeriod === "2_months" ? "2 tháng" : "3 tháng"}
              </span>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5 block truncate">
              ₫{periodPenaltyRevenue.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: QUY MÔ KHAI THÁC & VẬN HÀNH KHO */}
      <div className="rounded-2xl border border-slate-200/90 bg-white/90 dark:border-slate-800/90 dark:bg-slate-900/60 p-5 sm:p-6 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 shadow-xs dark:shadow-inner">
              <Warehouse className="size-5" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Quy Mô Khai Thác &amp; Vận Hành
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Ô 1 (Donut Chart - Chiếm 3 hàng): Tỷ Lệ Lấp Đầy */}
            <div className="row-span-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 p-4 flex flex-col items-center justify-center text-center relative shadow-xs dark:shadow-none">
              <div className="relative size-32 sm:size-36 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-200 dark:text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-blue-600 dark:text-white transition-all duration-1000 ease-out"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 38}
                    strokeDashoffset={
                      2 * Math.PI * 38 - (Math.min(100, Math.max(0, occRateNum)) / 100) * (2 * Math.PI * 38)
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-white tracking-tight">
                    {displayOcc}%
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Lấp Đầy</span>
                </div>
              </div>
            </div>

            {/* Ô 2: Tổng Số Ô Kho */}
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 p-3.5 flex flex-col justify-center shadow-xs dark:shadow-none">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng Số Ô Kho</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-xl sm:text-2xl mt-0.5">
                {totalUnits.toLocaleString("vi-VN")}
              </span>
            </div>

            {/* Ô 3: Kho Đang Cho Thuê */}
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 p-3.5 flex flex-col justify-center shadow-xs dark:shadow-none">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kho Đang Cho Thuê</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-xl sm:text-2xl mt-0.5">
                {occupiedUnits.toLocaleString("vi-VN")}
              </span>
            </div>

            {/* Ô 4: Kho Đang Giữ Chỗ / Đặt Trước */}
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 p-3.5 flex flex-col justify-center shadow-xs dark:shadow-none">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang Giữ Chỗ</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-xl sm:text-2xl mt-0.5">
                {reservedUnits.toLocaleString("vi-VN")}
              </span>
            </div>

            {/* Ô 5: Kho Còn Trống */}
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 p-3.5 flex flex-col justify-center shadow-xs dark:shadow-none">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kho Còn Trống</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-xl sm:text-2xl mt-0.5">
                {availableUnits.toLocaleString("vi-VN")}
              </span>
            </div>

            {/* Ô 6: Kho Đang Bảo Trì */}
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 p-3.5 flex flex-col justify-center shadow-xs dark:shadow-none">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang Bảo Trì</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-xl sm:text-2xl mt-0.5">
                {maintenanceUnits.toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
