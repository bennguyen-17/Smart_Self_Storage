import { useState } from "react"
import {
  Download,
  Warehouse,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import { useBomContext } from "@/features/bom/context/BomContext"

export default function BomReportsPage() {
  const { chainOverview } = useBomContext()
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null)

  const breakdownList = chainOverview?.facilityBreakdown || []

  // Các con số tài chính tổng thể
  const netRevenue = Number(chainOverview?.chainNetRevenue || 0)
  const totalRefunds = Number(chainOverview?.chainTotalRefunds || 0)
  const depositHolding = Number(chainOverview?.chainDepositHolding || 0)
  const totalUnits = Number(chainOverview?.chainTotalUnits || 0)
  const avgOccupancy = Number(chainOverview?.chainAverageOccupancyRate || 0)
  const totalActiveContracts = Number(chainOverview?.chainTotalActiveContracts || 0)

  // Bóc tách chi tiết từ breakdown
  const totalInitialRevenue = breakdownList.reduce((acc, r) => acc + Number(r.rentalRevenue || 0), 0)
  const totalExtensionRevenue = breakdownList.reduce((acc, r) => acc + Number(r.extensionRevenue || 0), 0)
  const totalPenaltyRevenue = breakdownList.reduce((acc, r) => acc + Number(r.penaltyRevenue || 0), 0)
  const totalCompensationRevenue = breakdownList.reduce((acc, r) => acc + Number(r.compensationRevenue || 0), 0)
  const totalForfeitedDeposit = breakdownList.reduce((acc, r) => acc + Number(r.forfeitedDeposit || 0), 0)
  const totalOverdueContracts = breakdownList.reduce((acc, r) => acc + Number(r.overdueContracts || 0), 0)
  const totalTerminatedContracts = breakdownList.reduce((acc, r) => acc + Number(r.terminatedContracts || 0), 0)
  const totalOccupiedUnits = breakdownList.reduce((acc, r) => acc + Number(r.occupiedUnits || 0), 0)
  const totalAvailableUnits = breakdownList.reduce((acc, r) => acc + Number(r.availableUnits || 0), 0)
  const totalMaintenanceUnits = breakdownList.reduce((acc, r) => acc + Number(r.maintenanceUnits || 0), 0)
  const totalDebtAndPenalty = totalPenaltyRevenue + totalCompensationRevenue

  // Dữ liệu doanh thu các tháng thực tế lấy từ Database (API chainOverview.monthlyRevenues)
  const apiMonthlyRevenues = chainOverview?.monthlyRevenues
  const monthlyRevenueData =
    apiMonthlyRevenues && apiMonthlyRevenues.length > 0
      ? apiMonthlyRevenues.map((m) => ({
          month: m.month,
          label: m.label,
          revenue: Number(m.revenue || 0),
        }))
      : [
          { month: "T5", label: "Tháng 05", revenue: 0 },
          { month: "T6", label: "Tháng 06", revenue: 0 },
          { month: "T7", label: "Tháng 07", revenue: 0 },
          { month: "T8", label: "Tháng 08", revenue: 0 },
          { month: "T9", label: "Tháng 09", revenue: 0 },
          { month: "T10", label: "Tháng 10 (Hiện tại)", revenue: netRevenue },
        ]

  const latestMonth = monthlyRevenueData[monthlyRevenueData.length - 1]
  const prevMonthRevenue =
    monthlyRevenueData.length >= 2 ? monthlyRevenueData[monthlyRevenueData.length - 2].revenue : 0
  const currentMonthRevenue = latestMonth ? latestMonth.revenue : netRevenue
  const growthPercent =
    prevMonthRevenue > 0
      ? Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 1000) / 10
      : currentMonthRevenue > 0
        ? 100
        : 0

  const maxRevenue = Math.max(...monthlyRevenueData.map((d) => d.revenue), netRevenue) * 1.15 || 10000000
  const minRevenue = 0

  // Tọa độ vẽ biểu đồ SVG: plotWidth 412, plotHeight 115, x: 38 -> 450, y: 15 -> 130
  const chartPoints = monthlyRevenueData.map((d, i) => {
    const x = 38 + (i / Math.max(1, monthlyRevenueData.length - 1)) * 412
    const y = 130 - ((d.revenue - minRevenue) / Math.max(1, maxRevenue - minRevenue)) * 115
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

  const revenueAreaPath = `${revenueLinePath} L ${chartPoints[chartPoints.length - 1].x} 130 L ${chartPoints[0].x} 130 Z`

  // Xuất file báo cáo
  const handleExportCSV = () => {
    const headers = ["Chỉ Tiêu Quản Trị Hệ Thống", "Số Liệu Thực Tế", "Chi Tiết Bóc Tách & Tình Trạng"]
    const rows = [
      [
        "Hàng 1 - Tổng Doanh Thu Thực Thu",
        `₫${netRevenue.toLocaleString("vi-VN")}`,
        `Gồm: Tiền thuê kho ban đầu ₫${totalInitialRevenue.toLocaleString("vi-VN")} • Gia hạn hàng tháng ₫${totalExtensionRevenue.toLocaleString("vi-VN")}`,
      ],
      [
        "Hàng 2 - Tiền Cọc Ký Quỹ Đang Giữ",
        `₫${depositHolding.toLocaleString("vi-VN")}`,
        `Bảo chứng 100% nguồn vốn an toàn • Tiền cọc đã cấn trừ vi phạm ₫${totalForfeitedDeposit.toLocaleString("vi-VN")}`,
      ],
      [
        "Hàng 3 - Tổng Tiền Hoàn Trả Khách Hàng",
        `₫${totalRefunds.toLocaleString("vi-VN")}`,
        `Tiền đã thanh toán hoàn trả cọc và tiền thừa khi kết thúc ${totalTerminatedContracts} hợp đồng thuê`,
      ],
      [
        "Hàng 4 - Khách Nợ & Hợp Đồng Quá Hạn",
        `${totalOverdueContracts} HĐ Quá Hạn`,
        `Phạt quá hạn & phụ phí chế tài: ₫${totalDebtAndPenalty.toLocaleString("vi-VN")} • Hệ thống đã khóa mã PIN tạm dừng quyền ra vào để đôn đốc thu nợ`,
      ],
      [
        "Tổng Quy Mô & Khai Thác Ô Kho",
        `${totalUnits} Ô Kho`,
        `Đang cho thuê: ${totalOccupiedUnits} kho (${avgOccupancy}%) • Còn trống: ${totalAvailableUnits} kho • Bảo trì: ${totalMaintenanceUnits} kho • HĐ hoạt động: ${totalActiveContracts} HĐ`,
      ],
    ]

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\r\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Bao_Cao_Tong_Quan_He_Thong_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Đã xuất file báo cáo Excel (.CSV) thành công!")
  }

  return (
    <div className="space-y-5">
      {/* HEADER ĐƠN GIẢN GỌN GÀNG */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
            Báo Cáo Tổng Quan Hệ Thống Thuê Kho
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
          >
            <Download className="size-3.5" />
            <span>Xuất Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* BỐ CỤC 2 CỘT ĐỐI XỨNG THEO MẪU EXECUTIVE DASHBOARD */}
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
                    Doanh Thu Qua Các Tháng
                  </h3>
                  <div className="text-[11px] text-slate-400">Xu hướng dòng tiền thực thu 6 tháng gần nhất</div>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-bold">
                <TrendingUp className={`size-3.5 ${growthPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`} />
                <span>{growthPercent >= 0 ? `+${growthPercent}%` : `${growthPercent}%`}</span>
              </div>
            </div>

            {/* BIỂU ĐỒ ĐƯỜNG SVG (LINE CHART) */}
            <div className="relative w-full overflow-hidden pt-1 pb-1">
              <svg viewBox="0 0 460 170" className="w-full h-auto overflow-visible">
                <defs>
                  {/* Gradient đổ bóng mềm phía dưới đường biểu diễn */}
                  <linearGradient id="revenueLineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Các đường lưới ngang (Grid lines) */}
                {[0, 0.33, 0.66, 1].map((ratio) => {
                  const y = 15 + 115 * (1 - ratio)
                  const val = Math.round((maxRevenue * ratio) / 1000000)
                  return (
                    <g key={ratio}>
                      <line
                        x1="32"
                        y1={y}
                        x2="450"
                        y2={y}
                        stroke="#334155"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                        opacity="0.45"
                      />
                      <text
                        x="24"
                        y={y + 3}
                        textAnchor="end"
                        fontSize="9"
                        fill="#64748b"
                        className="font-mono"
                      >
                        {val}tr
                      </text>
                    </g>
                  )
                })}

                {/* Vùng đổ bóng Gradient bên dưới đường cong */}
                <path d={revenueAreaPath} fill="url(#revenueLineGradient)" />

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
                {chartPoints.map((p, idx) => (
                  <g
                    key={p.month}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredMonthIndex(idx)}
                    onMouseLeave={() => setHoveredMonthIndex(null)}
                  >
                    {/* Vùng nhận cảm ứng rê chuột */}
                    <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                    {/* Vạch kẻ dọc nhẹ */}
                    <line
                      x1={p.x}
                      y1="20"
                      x2={p.x}
                      y2="130"
                      stroke="#475569"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                      opacity="0.3"
                    />

                    {/* Điểm nút */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      className="fill-white stroke-slate-900 stroke-2"
                    />

                    {/* SỐ TIỀN HIỂN THỊ TRỰC TIẾP TRÊN BIỂU ĐỒ - KHÔNG CẦN DI CHUỘT */}
                    <text
                      x={p.x}
                      y={p.y <= 38 ? p.y + 18 : p.y - 9}
                      textAnchor="middle"
                      fontSize="9.5"
                      className="font-mono font-bold fill-sky-300 select-none"
                    >
                      {p.revenue === 0
                        ? "₫0"
                        : p.revenue >= 1000000
                          ? `₫${(p.revenue / 1000000).toFixed(1).replace(/\.0$/, "")}tr`
                          : `₫${Math.round(p.revenue / 1000)}k`}
                    </text>

                    {/* Nhãn tháng ở trục hoành X */}
                    <text
                      x={p.x}
                      y="152"
                      textAnchor="middle"
                      fontSize="10"
                      className="font-mono fill-slate-300 font-bold"
                    >
                      {p.month}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* DẢI DOANH THU 6 THÁNG - HIỆN SỐ TIỀN ĐẦY ĐỦ RÕ RÀNG */}
            <div className="grid grid-cols-6 gap-1.5 pt-3 pb-1 border-t border-slate-800/80">
              {monthlyRevenueData.map((m) => (
                <div
                  key={m.month}
                  className="p-1.5 sm:p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center"
                >
                  <div className="text-[10px] font-bold text-slate-400">{m.month}</div>
                  <div className="text-[11px] sm:text-xs font-mono font-black text-white mt-0.5 truncate">
                    {m.revenue > 0 ? `₫${m.revenue.toLocaleString("vi-VN")}` : "₫0"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3 THẺ TÀI CHÍNH BỔ TRỢ DƯỚI BIỂU ĐỒ (KÝ QUỸ, HOÀN TIỀN, NỢ) */}
          <div className="grid grid-cols-3 gap-2.5 pt-4 mt-2 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-semibold block truncate">Tiền Cọc Ký Quỹ</span>
              <span className="font-mono font-bold text-white text-xs sm:text-sm mt-0.5 block truncate">
                ₫{depositHolding.toLocaleString("vi-VN")}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-semibold block truncate">Hoàn Trả Khách</span>
              <span className="font-mono font-bold text-white text-xs sm:text-sm mt-0.5 block truncate">
                ₫{totalRefunds.toLocaleString("vi-VN")}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-semibold block truncate">Nợ &amp; Chế Tài</span>
              <span className="font-mono font-bold text-white text-xs sm:text-sm mt-0.5 block truncate">
                {totalOverdueContracts} HĐ Quá Hạn
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
                    {/* Vòng nền */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-slate-800"
                      fill="transparent"
                    />
                    {/* Vòng tiến trình */}
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
                        2 * Math.PI * 38 - ((avgOccupancy || 0) / 100) * (2 * Math.PI * 38)
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Lấp Đầy
                    </span>
                    <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
                      {avgOccupancy}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Đang Khai Thác</span>
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
                  {totalOccupiedUnits.toLocaleString("vi-VN")}
                </span>
              </div>

              {/* Ô 4: Kho Còn Trống */}
              <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-400">Kho Còn Trống</span>
                <span className="font-mono font-black text-white text-xl sm:text-2xl mt-1">
                  {totalAvailableUnits.toLocaleString("vi-VN")}
                </span>
              </div>

              {/* Ô 5: Kho Đang Bảo Trì */}
              <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-400">Đang Bảo Trì</span>
                <span className="font-mono font-black text-white text-xl sm:text-2xl mt-1">
                  {totalMaintenanceUnits.toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
