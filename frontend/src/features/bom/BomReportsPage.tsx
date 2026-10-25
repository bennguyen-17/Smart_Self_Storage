import { useState } from "react"
import {
  Download,
  DollarSign,
  Shield,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowDownLeft,
  Warehouse,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react"
import { toast } from "sonner"
import { useBomContext } from "@/features/bom/context/BomContext"

export default function BomReportsPage() {
  const { chainOverview, reloadData, isLoadingApi } = useBomContext()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await reloadData()
      toast.success("Đã đồng bộ số liệu mới nhất từ hệ thống!")
    } catch {
      toast.error("Không thể làm mới dữ liệu lúc này.")
    } finally {
      setIsRefreshing(false)
    }
  }

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
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 border border-sky-500/20">
              <Sparkles className="size-3" />
              BOM SYSTEM REPORT
            </span>
            <span className="text-xs text-slate-400">• Cập nhật thời gian thực</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
            Báo Cáo Tổng Quan Hệ Thống Thuê Kho
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingApi}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
            title="Làm mới dữ liệu từ Database"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
            <span>Làm Mới</span>
          </button>

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
        {/* CỘT TRÁI: SỨC KHỎE TÀI CHÍNH & DÒNG TIỀN */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/80 shadow-inner">
                <DollarSign className="size-5" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Sức Khỏe Tài Chính &amp; Dòng Tiền
              </h3>
            </div>

            <div className="space-y-3.5">
              {/* Thẻ 1: Tổng Doanh Thu */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="size-10 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80 flex items-center justify-center shrink-0">
                    <DollarSign className="size-5" />
                  </span>
                  <div>
                    <span className="text-sm font-bold text-slate-300">Tổng Doanh Thu</span>
                  </div>
                </div>
                <span className="font-mono font-black text-white text-xl sm:text-2xl">
                  ₫{netRevenue.toLocaleString("vi-VN")}
                </span>
              </div>

              {/* Thẻ 2: Tiền Cọc Ký Quỹ */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="size-10 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80 flex items-center justify-center shrink-0">
                    <Lock className="size-5" />
                  </span>
                  <span className="text-sm font-bold text-slate-300">Tiền Cọc Ký Quỹ Đang Giữ</span>
                </div>
                <span className="font-mono font-black text-white text-xl sm:text-2xl">
                  ₫{depositHolding.toLocaleString("vi-VN")}
                </span>
              </div>

              {/* Thẻ 3: Tiền Hoàn Trả Khách Hàng */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="size-10 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80 flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="size-5" />
                  </span>
                  <span className="text-sm font-bold text-slate-300">Tiền Hoàn Trả Khách Hàng</span>
                </div>
                <span className="font-mono font-black text-white text-xl sm:text-2xl">
                  ₫{totalRefunds.toLocaleString("vi-VN")}
                </span>
              </div>

              {/* Thẻ 4: Nợ Quá Hạn & Chế Tài */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="size-10 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80 flex items-center justify-center shrink-0">
                    <AlertTriangle className="size-5" />
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-300">Nợ Quá Hạn &amp; Chế Tài</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {totalOverdueContracts} Hợp đồng quá hạn
                    </div>
                  </div>
                </div>
                <span className="font-mono font-black text-white text-xl sm:text-2xl">
                  ₫{totalDebtAndPenalty.toLocaleString("vi-VN")}
                </span>
              </div>
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

              {/* Ô 6: Kiểm Soát Ra Vào */}
              <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-400">Kiểm Soát Ra Vào</span>
                <span className="font-bold text-white text-base sm:text-lg mt-1 truncate">
                  Mã PIN Tự Động
                </span>
              </div>

              {/* Ô 7: Trạng Thái An Ninh */}
              <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-400">Trạng Thái An Ninh</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-white text-base sm:text-lg truncate">
                    Bảo Mật 100%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
