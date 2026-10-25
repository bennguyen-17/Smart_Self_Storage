import { useState } from "react"
import {
  Download,
  DollarSign,
  Shield,
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

      {/* ĐÚNG 1 BẢNG DUY NHẤT - THIẾT KẾ ĐƠN GIẢN, RÕ RÀNG */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/75 shadow-xl">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 uppercase font-black text-slate-300 text-[10px]">
              <th className="p-4 text-left w-1/4">Chỉ Tiêu Quản Trị Hệ Thống</th>
              <th className="p-4 text-left w-1/4">Giá Trị Thực Tế</th>
              <th className="p-4 text-left w-1/2">Chi Tiết Bóc Tách &amp; Tình Trạng Vận Hành</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
            {/* Hàng 1: Tổng Doanh Thu Thực Thu */}
            <tr className="hover:bg-slate-900/40 transition">
              <td className="p-4 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                    <DollarSign className="size-4" />
                  </span>
                  <div>
                    <div className="font-extrabold text-white text-xs">
                      Hàng 1 - Tổng Doanh Thu Thực Thu
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Dòng tiền thực thu sau khi trừ hoàn tiền</div>
                  </div>
                </div>
              </td>
              <td className="p-4 text-left">
                <span className="font-mono font-black text-sky-400 text-base sm:text-lg">
                  ₫{netRevenue.toLocaleString("vi-VN")}
                </span>
              </td>
              <td className="p-4 text-left text-slate-300 text-xs">
                Gồm: Tiền thuê kho ban đầu{" "}
                <b className="font-mono text-white">₫{totalInitialRevenue.toLocaleString("vi-VN")}</b> • Gia hạn hàng tháng{" "}
                <b className="font-mono text-white">₫{totalExtensionRevenue.toLocaleString("vi-VN")}</b>
              </td>
            </tr>

            {/* Hàng 2: Tiền Cọc Ký Quỹ Đang Giữ */}
            <tr className="hover:bg-slate-900/40 transition">
              <td className="p-4 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <Shield className="size-4" />
                  </span>
                  <div>
                    <div className="font-extrabold text-white text-xs">
                      Hàng 2 - Tiền Cọc Ký Quỹ Đang Giữ
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Tài sản ký quỹ bảo toàn lưu ký 100%</div>
                  </div>
                </div>
              </td>
              <td className="p-4 text-left">
                <span className="font-mono font-black text-white text-base sm:text-lg">
                  ₫{depositHolding.toLocaleString("vi-VN")}
                </span>
              </td>
              <td className="p-4 text-left text-slate-300 text-xs">
                <span className="text-emerald-400 font-bold">Bảo chứng 100% nguồn vốn an toàn</span> • Tiền cọc đã cấn trừ vi phạm{" "}
                <b className="font-mono text-white">₫{totalForfeitedDeposit.toLocaleString("vi-VN")}</b>
              </td>
            </tr>

            {/* Hàng 3: Tổng Tiền Hoàn Trả Khách Hàng */}
            <tr className="hover:bg-slate-900/40 transition">
              <td className="p-4 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                    <ArrowDownLeft className="size-4" />
                  </span>
                  <div>
                    <div className="font-extrabold text-white text-xs">
                      Hàng 3 - Tổng Tiền Hoàn Trả Khách Hàng
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Tổng chi hoàn tiền nghiệm thu trả kho</div>
                  </div>
                </div>
              </td>
              <td className="p-4 text-left">
                <span className="font-mono font-black text-rose-400 text-base sm:text-lg">
                  ₫{totalRefunds.toLocaleString("vi-VN")}
                </span>
              </td>
              <td className="p-4 text-left text-slate-300 text-xs">
                Tiền đã thanh toán hoàn trả cọc và tiền thừa khi kết thúc{" "}
                <b className="text-white">{totalTerminatedContracts} hợp đồng thuê</b>
              </td>
            </tr>

            {/* Hàng 4: Khách Nợ & Hợp Đồng Quá Hạn */}
            <tr className="hover:bg-slate-900/40 transition">
              <td className="p-4 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    <AlertTriangle className="size-4" />
                  </span>
                  <div>
                    <div className="font-extrabold text-white text-xs">
                      Hàng 4 - Khách Nợ &amp; Hợp Đồng Quá Hạn
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Kiểm soát rủi ro và chế tài thanh toán</div>
                  </div>
                </div>
              </td>
              <td className="p-4 text-left">
                <span className="font-mono font-black text-amber-400 text-base sm:text-lg">
                  {totalOverdueContracts} HĐ Quá Hạn
                </span>
              </td>
              <td className="p-4 text-left text-slate-300 text-xs">
                Phạt quá hạn &amp; phụ phí chế tài:{" "}
                <b className="font-mono text-amber-300">₫{totalDebtAndPenalty.toLocaleString("vi-VN")}</b> •{" "}
                <span className="text-amber-400/90 font-medium">
                  Hệ thống đã khóa mã PIN tạm dừng quyền ra vào để đôn đốc thu nợ
                </span>
              </td>
            </tr>

            {/* Hàng TỔNG KẾT QUY MÔ & TÌNH TRẠNG Ô KHO HỆ THỐNG */}
            <tr className="bg-slate-900/95 font-bold border-t-2 border-slate-700 text-slate-200">
              <td className="p-4 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    <Warehouse className="size-4" />
                  </span>
                  <div>
                    <div className="font-black text-sky-400 uppercase text-xs">
                      Tổng Quy Mô &amp; Khai Thác Hệ Thống
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                      Toàn bộ mạng lưới kho SmartStorage
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-4 text-left">
                <div className="font-mono font-black text-white text-base">
                  {totalUnits} Ô Kho
                </div>
                <div className="text-[11px] text-sky-400 font-bold mt-0.5">
                  Tỷ lệ lấp đầy: {avgOccupancy}%
                </div>
              </td>
              <td className="p-4 text-left text-xs font-normal">
                Đang cho thuê: <b className="text-white font-mono">{totalOccupiedUnits} kho</b> • Còn trống:{" "}
                <b className="text-emerald-400 font-mono">{totalAvailableUnits} kho</b> • Đang bảo trì:{" "}
                <b className="text-amber-400 font-mono">{totalMaintenanceUnits} kho</b> • Hợp đồng hoạt động:{" "}
                <b className="text-sky-300 font-mono">{totalActiveContracts} HĐ</b>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
