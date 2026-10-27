import React, { useState, useMemo } from "react"
import { TrendingUp, Warehouse } from "lucide-react"

export interface MonthlyRevenuePoint {
  month: string
  label: string
  revenue: number
}

export interface FacilityCashFlowDashboardProps {
  title?: string
  subtitle?: string
  monthlyRevenues?: MonthlyRevenuePoint[]
  netRevenue?: number
  rentalRevenue?: number
  depositHolding?: number
  totalRefunds?: number
  overdueContracts?: number
  penaltyRevenue?: number
  totalUnits?: number
  occupiedUnits?: number
  availableUnits?: number
  maintenanceUnits?: number
  occupancyRate?: number
}

export default function FacilityCashFlowDashboard({
  title = "Doanh Thu Qua Các Tháng",
  subtitle = "Xu hướng dòng tiền thực thu 6 tháng gần nhất",
  monthlyRevenues = [],
  netRevenue = 0,
  rentalRevenue = 0,
  depositHolding = 0,
  totalRefunds = 0,
  overdueContracts = 0,
  penaltyRevenue = 0,
  totalUnits = 0,
  occupiedUnits = 0,
  availableUnits = 0,
  maintenanceUnits = 0,
  occupancyRate = 0,
}: FacilityCashFlowDashboardProps) {
  const [, setHoveredMonthIndex] = useState<number | null>(null)

  // Đảm bảo có tối thiểu dữ liệu 6 tháng để hiển thị
  const monthlyData: MonthlyRevenuePoint[] = useMemo(() => {
    if (monthlyRevenues && monthlyRevenues.length > 0) {
      return monthlyRevenues.map((m) => ({
        month: m.month,
        label: m.label,
        revenue: Number(m.revenue || 0),
      }))
    }
    return [
      { month: "T5", label: "Tháng 05", revenue: 0 },
      { month: "T6", label: "Tháng 06", revenue: 0 },
      { month: "T7", label: "Tháng 07", revenue: 0 },
      { month: "T8", label: "Tháng 08", revenue: 0 },
      { month: "T9", label: "Tháng 09", revenue: 0 },
      { month: "T10", label: "Tháng 10", revenue: netRevenue },
    ]
  }, [monthlyRevenues, netRevenue])

  const latestMonth = monthlyData[monthlyData.length - 1]
  const currentMonthRevenue = latestMonth ? latestMonth.revenue : netRevenue

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
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
        <div>
          {/* Tiêu đề & Tỷ lệ tăng trưởng */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/80 shadow-inner">
                <TrendingUp className="size-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {title}
                </h3>
                {subtitle && <div className="text-[11px] text-slate-400">{subtitle}</div>}
              </div>
            </div>
          </div>

          {/* BIỂU ĐỒ ĐƯỜNG SVG (LINE CHART) */}
          <div className="relative w-full overflow-hidden pt-1 pb-1">
            <svg viewBox={svgViewBox} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="facilityRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
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
                    stroke={line.isZero ? "#64748b" : line.isNegative ? "#f43f5e" : "#334155"}
                    strokeDasharray={line.isZero ? "4 4" : "3 3"}
                    strokeWidth={line.isZero ? "1.2" : "1"}
                    opacity={line.isZero ? "0.7" : line.isNegative ? "0.4" : "0.45"}
                  />
                  <text
                    x="26"
                    y={line.y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill={line.isZero ? "#94a3b8" : line.isNegative ? "#f87171" : "#64748b"}
                    className={`font-mono ${line.isZero ? "font-bold" : ""}`}
                  >
                    {line.label}
                  </text>
                </g>
              ))}

              {/* Vùng đổ bóng Gradient bên dưới đường cong */}
              <path d={revenueAreaPath} fill="url(#facilityRevenueGradient)" />

              {/* Đường cong doanh thu chính */}
              <path
                d={revenueLinePath}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Các điểm tròn dữ liệu trên từng tháng & Số tiền hiển thị trực tiếp */}
              {chartPoints.map((p, idx) => {
                const isNeg = p.revenue < 0
                const labelY = isNeg ? p.y + 15 : p.y <= 38 ? p.y + 16 : p.y - 9

                return (
                  <g
                    key={p.month}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredMonthIndex(idx)}
                    onMouseLeave={() => setHoveredMonthIndex(null)}
                  >
                    <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                    <line
                      x1={p.x}
                      y1={plotTop}
                      x2={p.x}
                      y2={hasNegative ? plotBottom : 130}
                      stroke="#475569"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                      opacity="0.3"
                    />

                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      className={
                        isNeg
                          ? "fill-rose-500 stroke-slate-900 stroke-2"
                          : "fill-white stroke-slate-900 stroke-2"
                      }
                    />

                    {/* SỐ TIỀN HIỂN THỊ TRỰC TIẾP TRÊN BIỂU ĐỒ */}
                    <text
                      x={p.x}
                      y={labelY}
                      textAnchor="middle"
                      fontSize="9.5"
                      className={`font-mono font-bold select-none ${
                        isNeg ? "fill-rose-400" : "fill-sky-300"
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
                      className={`font-mono font-bold ${
                        isNeg ? "fill-rose-300" : "fill-slate-300"
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

        {/* 3 THẺ TÀI CHÍNH BỔ TRỢ DƯỚI BIỂU ĐỒ: TIỀN CỌC, TIỀN THUÊ KHO, TIỀN PHẠT */}
        <div className="grid grid-cols-3 gap-2.5 pt-4 mt-2 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold block truncate">Tiền Cọc</span>
            <span className="font-mono font-bold text-white text-xs sm:text-sm mt-0.5 block truncate">
              ₫{depositHolding.toLocaleString("vi-VN")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold block truncate">Tiền Thuê Kho</span>
            <span className="font-mono font-bold text-white text-xs sm:text-sm mt-0.5 block truncate">
              ₫{(rentalRevenue || netRevenue).toLocaleString("vi-VN")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold block truncate">Tiền Phạt</span>
            <span className="font-mono font-bold text-white text-xs sm:text-sm mt-0.5 block truncate">
              ₫{penaltyRevenue.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: QUY MÔ KHAI THÁC & VẬN HÀNH KHO */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/80 shadow-inner">
              <Warehouse className="size-5" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              Quy Mô Khai Thác &amp; Vận Hành
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Ô 1 (Donut Chart - Chiếm 2 hàng): Tỷ Lệ Lấp Đầy */}
            <div className="row-span-2 rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col items-center justify-center text-center relative">
              <div className="relative size-32 sm:size-36 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-white transition-all duration-1000 ease-out"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 38}
                    strokeDashoffset={
                      2 * Math.PI * 38 - (Math.min(100, Math.max(0, occRateNum)) / 100) * (2 * Math.PI * 38)
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
                    {displayOcc}%
                  </span>
                </div>
              </div>
            </div>

            {/* Ô 2: Tổng Số Ô Kho */}
            <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col justify-center">
              <span className="text-xs font-semibold text-slate-400">Tổng Số Ô Kho</span>
              <span className="font-mono font-black text-white text-xl sm:text-2xl mt-1">
                {totalUnits.toLocaleString("vi-VN")}
              </span>
            </div>

            {/* Ô 3: Kho Đang Cho Thuê */}
            <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col justify-center">
              <span className="text-xs font-semibold text-slate-400">Kho Đang Cho Thuê</span>
              <span className="font-mono font-black text-white text-xl sm:text-2xl mt-1">
                {occupiedUnits.toLocaleString("vi-VN")}
              </span>
            </div>

            {/* Ô 4: Kho Còn Trống */}
            <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col justify-center">
              <span className="text-xs font-semibold text-slate-400">Kho Còn Trống</span>
              <span className="font-mono font-black text-white text-xl sm:text-2xl mt-1">
                {availableUnits.toLocaleString("vi-VN")}
              </span>
            </div>

            {/* Ô 5: Kho Đang Bảo Trì */}
            <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col justify-center">
              <span className="text-xs font-semibold text-slate-400">Đang Bảo Trì</span>
              <span className="font-mono font-black text-white text-xl sm:text-2xl mt-1">
                {maintenanceUnits.toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
