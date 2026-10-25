import { useState } from "react"
import {
  Download,
  DollarSign,
  Shield,
  Percent,
  Warehouse,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
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
      toast.success("Đã đồng bộ số liệu tài chính & dòng tiền mới nhất từ hệ thống!")
    } catch {
      toast.error("Không thể làm mới dữ liệu lúc này.")
    } finally {
      setIsRefreshing(false)
    }
  }

  const breakdownList = chainOverview?.facilityBreakdown || []

  // Tính toán số liệu tổng thể hệ thống
  const netRevenue = Number(chainOverview?.chainNetRevenue || 0)
  const grossRevenue = Number(chainOverview?.chainTotalRevenue || 0)
  const totalRefunds = Number(chainOverview?.chainTotalRefunds || 0)
  const depositHolding = Number(chainOverview?.chainDepositHolding || 0)
  const avgOccupancy = Number(chainOverview?.chainAverageOccupancyRate || 0)
  const totalUnits = Number(chainOverview?.chainTotalUnits || 0)
  const totalActiveContracts = Number(chainOverview?.chainTotalActiveContracts || 0)

  // Tổng hợp chi tiết từ breakdown toàn hệ thống
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
  const totalTickets = breakdownList.reduce((acc, r) => acc + Number(r.totalTickets || 0), 0)
  const resolvedTickets = breakdownList.reduce((acc, r) => acc + Number(r.resolvedTickets || 0), 0)

  // Ước tính công nợ / phạt phát sinh
  const totalDebtAndPenalty = totalPenaltyRevenue + totalCompensationRevenue

  // Xuất file báo cáo tổng hợp hệ thống (Excel / CSV UTF-8)
  const handleExportCSV = () => {
    const headers = ["Chỉ Tiêu Báo Cáo Hệ Thống", "Phân Loại", "Giá Trị Số Liệu", "Đơn Vị", "Ghi Chú"]
    const rows = [
      ["Tổng Doanh Thu Thực Thu Ròng (Net Revenue)", "Dòng tiền thực thu", netRevenue, "VNĐ", "Tiền thuê + Gia hạn + Phạt - Hoàn trả"],
      ["Tổng Thu Gộp Hệ Thống (Gross Inflow)", "Dòng tiền vào", grossRevenue, "VNĐ", "Toàn bộ khoản tiền khách đã nộp"],
      ["Tiền Thuê Kho Ban Đầu", "Doanh thu dịch vụ", totalInitialRevenue, "VNĐ", "Hợp đồng thuê mới"],
      ["Tiền Gia Hạn Thuê Hàng Tháng", "Doanh thu định kỳ", totalExtensionRevenue, "VNĐ", "Khách gia hạn hợp đồng"],
      ["Tiền Cọc Ký Quỹ Đang Giữ (Holding Deposit)", "Tài sản bảo chứng", depositHolding, "VNĐ", "Bảo chứng an toàn vốn 100%"],
      ["Tổng Tiền Đã Hoàn Trả Khách Hàng (Refunds)", "Dòng tiền ra", totalRefunds, "VNĐ", "Quyết toán hoàn tiền thanh lý hợp đồng"],
      ["Tiền Cọc Đã Tịch Thu / Cấn Trừ Vi Phạm", "Thu nhập khác", totalForfeitedDeposit, "VNĐ", "Xử lý khách vi phạm/hủy cọc"],
      ["Tiền Phạt Quá Hạn & Bồi Thường Thu Được", "Phụ thu chế tài", totalDebtAndPenalty, "VNĐ", "Phạt trễ hạn và đền bù hư hại"],
      ["Tổng Số Hợp Đồng Khách Đang Nợ / Quá Hạn", "Chỉ số rủi ro", totalOverdueContracts, "Hợp đồng", "Cần bộ phận vận hành đôn đốc"],
      ["Tổng Hợp Đồng Đang Có Hiệu Lực", "Hợp đồng hoạt động", totalActiveContracts, "Hợp đồng", "Đang lưu kho và thanh toán"],
      ["Tổng Quy Mô Ô Kho Khai Thác", "Hạ tầng", totalUnits, "Ô Kho", "Toàn bộ hệ thống kho"],
      ["Số Kho Đang Thuê (Occupied)", "Hiệu suất", totalOccupiedUnits, "Ô Kho", `Tỷ lệ lấp đầy ${avgOccupancy}%`],
      ["Số Kho Còn Trống Sẵn Sàng (Available)", "Khả dụng", totalAvailableUnits, "Ô Kho", "Sẵn sàng đón khách mới"],
      ["Số Kho Đang Bảo Trì (Maintenance)", "Kỹ thuật", totalMaintenanceUnits, "Ô Kho", "Đang sửa chữa, kiểm định"],
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

    toast.success("Đã xuất báo cáo tổng quan hệ thống (.CSV UTF-8) thành công!")
  }

  return (
    <div className="space-y-6">
      {/* 1. THANH TIÊU ĐỀ & ĐIỀU HÀNH BÁO CÁO TỔNG QUAN */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-3xl border border-sky-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-black text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="size-3" />
                BOM EXECUTIVE SYSTEM REPORT
              </span>
              <span className="text-xs text-slate-400">
                • Báo cáo tổng thể toàn bộ hệ thống thuê kho
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Báo Cáo Tổng Quan Dòng Tiền &amp; Hoạt Động Hệ Thống
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Tổng hợp toàn diện các chỉ số tài chính: tổng tiền thực thu, tiền cọc bảo lưu, tiền hoàn trả khách hàng, công nợ quá hạn và tình trạng khai thác toàn hệ sinh thái SmartStorage.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingApi}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
              title="Làm mới dữ liệu từ Database"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
              <span className="hidden sm:inline">Làm Mới</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/25"
            >
              <Download className="size-4" />
              <span>Xuất Báo Cáo Tổng Hợp</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KHỐI 4 THẺ TÀI CHÍNH CỐT LÕI HỆ THỐNG: TIỀN THU, TIỀN CỌC, TIỀN HOÀN, TIỀN NỢ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Tiền Thu (Thực Thu Ròng) */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/40 shadow-xl space-y-3 backdrop-blur-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Tổng Doanh Thu Thực Thu
            </span>
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-slate-950 transition">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-sky-400">
            ₫{netRevenue.toLocaleString("vi-VN")}
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Tiền thuê kho:</span>
              <span className="font-mono text-slate-200 font-bold">₫{totalInitialRevenue.toLocaleString("vi-VN")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Gia hạn hàng tháng:</span>
              <span className="font-mono text-slate-200 font-bold">₫{totalExtensionRevenue.toLocaleString("vi-VN")}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tiền Cọc Ký Quỹ Đang Giữ */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 shadow-xl space-y-3 backdrop-blur-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Tiền Cọc Ký Quỹ Đang Giữ
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
              <Shield className="size-4" />
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-white">
            ₫{depositHolding.toLocaleString("vi-VN")}
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Tình trạng ký quỹ:</span>
              <span className="font-bold text-emerald-400">Bảo chứng an toàn 100%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tiền cọc đã cấn trừ:</span>
              <span className="font-mono text-slate-300 font-bold">₫{totalForfeitedDeposit.toLocaleString("vi-VN")}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Tổng Tiền Hoàn Trả Khách Hàng */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 shadow-xl space-y-3 backdrop-blur-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Tiền Hoàn Trả Khách Hàng
            </span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-slate-950 transition">
              <ArrowDownLeft className="size-4" />
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-rose-400">
            ₫{totalRefunds.toLocaleString("vi-VN")}
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Mục đích:</span>
              <span className="text-slate-300 font-medium">Hoàn cọc &amp; tiền thừa trả kho</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hợp đồng hoàn tất:</span>
              <span className="font-mono text-slate-200 font-bold">{totalTerminatedContracts} hợp đồng</span>
            </div>
          </div>
        </div>

        {/* Card 4: Công Nợ & Hợp Đồng Quá Hạn */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 shadow-xl space-y-3 backdrop-blur-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Khách Nợ &amp; HĐ Quá Hạn
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
              <AlertTriangle className="size-4" />
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-amber-400">
            {totalOverdueContracts} <span className="text-sm font-sans font-bold text-slate-400">HĐ Quá Hạn</span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Tiền phạt &amp; bồi thường:</span>
              <span className="font-mono text-amber-300 font-bold">₫{totalDebtAndPenalty.toLocaleString("vi-VN")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Trạng thái:</span>
              <span className="text-amber-400 font-bold">
                {totalOverdueContracts > 0 ? "Đang đôn đốc thu hồi" : "Không có nợ xấu"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BẢNG BÓC TÁCH CÂN ĐỐI DÒNG TIỀN TÀI CHÍNH TOÀN HỆ THỐNG */}
      <div className="bg-slate-950/75 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <FileSpreadsheet className="size-5" />
            </span>
            <div>
              <h3 className="font-black text-sm uppercase text-white tracking-wide">
                BẢNG CÂN ĐỐI &amp; BÓC TÁCH DÒNG TIỀN HỆ THỐNG
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chi tiết các nguồn thu vào, tiền hoàn ra và khoản ký quỹ bảo toàn của toàn bộ hệ thống
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Đơn vị tính: <b className="text-white">Việt Nam Đồng (VNĐ)</b>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 uppercase font-black text-slate-300 text-[10px]">
                <th className="p-3.5 text-left">Khoản Mục Dòng Tiền</th>
                <th className="p-3.5 text-center">Bản Chất Dòng Tiền</th>
                <th className="p-3.5 text-right">Số Tiền (VNĐ)</th>
                <th className="p-3.5 text-center">Tỷ Trọng / Trạng Thái</th>
                <th className="p-3.5 text-left">Ghi Chú Vận Hành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
              {/* Mục 1: Tiền thuê mới */}
              <tr className="hover:bg-slate-900/50 transition">
                <td className="p-3.5 text-left">
                  <div className="font-extrabold text-white text-xs">1. Doanh Thu Tiền Thuê Ban Đầu</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                    Thanh toán kỳ đầu của tất cả các hợp đồng thuê kho mới
                  </div>
                </td>
                <td className="p-3.5 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Dòng Tiền Thu Vào
                  </span>
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-white text-sm">
                  ₫{totalInitialRevenue.toLocaleString("vi-VN")}
                </td>
                <td className="p-3.5 text-center text-sky-300 font-mono font-bold">
                  {grossRevenue > 0 ? `${((totalInitialRevenue / grossRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
                <td className="p-3.5 text-left text-slate-400 font-normal">
                  Đã ghi nhận thanh toán qua VNPay và chuyển khoản trực tiếp
                </td>
              </tr>

              {/* Mục 2: Tiền gia hạn */}
              <tr className="hover:bg-slate-900/50 transition">
                <td className="p-3.5 text-left">
                  <div className="font-extrabold text-white text-xs">2. Doanh Thu Gia Hạn Hàng Tháng</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                    Khách hàng thanh toán gia hạn duy trì hợp đồng kho định kỳ
                  </div>
                </td>
                <td className="p-3.5 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Dòng Tiền Thu Vào
                  </span>
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-white text-sm">
                  ₫{totalExtensionRevenue.toLocaleString("vi-VN")}
                </td>
                <td className="p-3.5 text-center text-sky-300 font-mono font-bold">
                  {grossRevenue > 0 ? `${((totalExtensionRevenue / grossRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
                <td className="p-3.5 text-left text-slate-400 font-normal">
                  Tự động hạch toán vào doanh thu của chu kỳ hợp đồng kế tiếp
                </td>
              </tr>

              {/* Mục 3: Tiền phạt & bồi thường */}
              <tr className="hover:bg-slate-900/50 transition">
                <td className="p-3.5 text-left">
                  <div className="font-extrabold text-white text-xs">3. Tiền Phạt Quá Hạn &amp; Bồi Thường Hư Hại</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                    Các khoản phụ thu chế tài quá ngày, phí mở khóa mã PIN và bồi thường thiết bị
                  </div>
                </td>
                <td className="p-3.5 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Phụ Thu Chế Tài
                  </span>
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-amber-300 text-sm">
                  ₫{totalDebtAndPenalty.toLocaleString("vi-VN")}
                </td>
                <td className="p-3.5 text-center text-slate-400 font-mono">
                  {totalOverdueContracts > 0 ? `${totalOverdueContracts} HĐ quá hạn` : "An toàn"}
                </td>
                <td className="p-3.5 text-left text-slate-400 font-normal">
                  Áp dụng theo đúng biểu phí phụ thu và biên bản kiểm kê bàn giao
                </td>
              </tr>

              {/* Mục 4: Tiền hoàn trả khách */}
              <tr className="hover:bg-slate-900/50 transition">
                <td className="p-3.5 text-left">
                  <div className="font-extrabold text-rose-400 text-xs">4. Tổng Tiền Hoàn Trả Khách Hàng (Refunds)</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                    Khoản tiền trả lại khách hàng sau khi thanh lý và nghiệm thu kho
                  </div>
                </td>
                <td className="p-3.5 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Dòng Tiền Hoàn Ra
                  </span>
                </td>
                <td className="p-3.5 text-right font-mono font-black text-rose-400 text-sm">
                  -₫{totalRefunds.toLocaleString("vi-VN")}
                </td>
                <td className="p-3.5 text-center text-rose-400 font-mono font-bold">
                  {totalTerminatedContracts} HĐ quyết toán
                </td>
                <td className="p-3.5 text-left text-slate-400 font-normal">
                  Đã hoàn trả an toàn về tài khoản ngân hàng của khách
                </td>
              </tr>

              {/* Hàng TỔNG DOANH THU THỰC THU RÒNG */}
              <tr className="bg-sky-500/10 font-bold border-y-2 border-sky-500/40 text-slate-100">
                <td className="p-4 text-left text-sky-400 uppercase tracking-wider font-black text-xs">
                  ➔ TỔNG DOANH THU THỰC THU HỆ THỐNG (NET REVENUE)
                </td>
                <td className="p-4 text-center">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-sky-500 text-slate-950 uppercase shadow-md shadow-sky-500/30">
                    Dòng Tiền Thực Giữ
                  </span>
                </td>
                <td className="p-4 text-right font-mono font-black text-sky-400 text-lg">
                  ₫{netRevenue.toLocaleString("vi-VN")}
                </td>
                <td className="p-4 text-center text-sky-300 font-mono font-black text-sm">
                  100% Thực Thu
                </td>
                <td className="p-4 text-left text-sky-200 font-bold text-xs">
                  Tổng thu gộp trừ toàn bộ tiền hoàn trả khách hàng
                </td>
              </tr>

              {/* Mục 5: Tiền cọc ký quỹ holding */}
              <tr className="hover:bg-slate-900/50 transition">
                <td className="p-3.5 text-left">
                  <div className="font-extrabold text-white text-xs">5. Tiền Cọc Ký Quỹ Đang Giữ (Holding Deposit)</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                    Quỹ tiền cọc bảo chứng thực tế của các hợp đồng đang hoạt động
                  </div>
                </td>
                <td className="p-3.5 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Bảo Lưu Ký Quỹ
                  </span>
                </td>
                <td className="p-3.5 text-right font-mono font-black text-white text-sm">
                  ₫{depositHolding.toLocaleString("vi-VN")}
                </td>
                <td className="p-3.5 text-center text-emerald-400 font-mono font-bold">
                  Bảo toàn 100%
                </td>
                <td className="p-3.5 text-left text-slate-400 font-normal">
                  Tách riêng trong tài khoản ký quỹ, hoàn trả khi khách hết hạn thuê
                </td>
              </tr>

              {/* Mục 6: Tiền cọc đã cấn trừ/tịch thu */}
              <tr className="hover:bg-slate-900/50 transition">
                <td className="p-3.5 text-left">
                  <div className="font-extrabold text-white text-xs">6. Tiền Cọc Cấn Trừ &amp; Tịch Thu Vi Phạm</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                    Cấn trừ do khách nợ quá 15 ngày, hủy cọc hoặc bồi thường thiệt hại
                  </div>
                </td>
                <td className="p-3.5 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Hạch Toán Thu Nhập
                  </span>
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-slate-200 text-sm">
                  ₫{totalForfeitedDeposit.toLocaleString("vi-VN")}
                </td>
                <td className="p-3.5 text-center text-slate-400 font-mono">
                  Đã chuyển toán
                </td>
                <td className="p-3.5 text-left text-slate-400 font-normal">
                  Chuyển từ quỹ ký quỹ sang thu nhập hệ thống theo điều khoản hợp đồng
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. KHỐI TỔNG QUAN QUY MÔ, CÔNG SUẤT VÀ VẬN HÀNH TOÀN HỆ THỐNG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Box 1: Quy mô & Phân bổ trạng thái Ô Kho */}
        <div className="p-6 rounded-3xl bg-slate-950/75 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Warehouse className="size-4" />
              </span>
              <div>
                <h4 className="font-black text-xs uppercase text-white tracking-wider">
                  Quy Mô &amp; Công Suất Khai Thác Ô Kho
                </h4>
                <p className="text-[10px] text-slate-400">Toàn bộ kho trong hệ sinh thái SmartStorage</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-black text-lg text-white">{totalUnits} Ô Kho</div>
              <div className="text-[10px] font-bold text-sky-400">Tỷ lệ lấp đầy: {avgOccupancy}%</div>
            </div>
          </div>

          {/* Thanh phân bổ trực quan (Multi-segment bar) */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div
                className="bg-sky-500 h-full transition-all duration-500"
                style={{ width: `${(totalOccupiedUnits / (totalUnits || 1)) * 100}%` }}
                title={`Đang thuê: ${totalOccupiedUnits} kho`}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(totalAvailableUnits / (totalUnits || 1)) * 100}%` }}
                title={`Còn trống: ${totalAvailableUnits} kho`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${(totalMaintenanceUnits / (totalUnits || 1)) * 100}%` }}
                title={`Bảo trì: ${totalMaintenanceUnits} kho`}
              />
            </div>

            {/* Chi tiết 3 trạng thái */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-sky-400 font-bold text-[11px]">
                  <span className="size-2 rounded-full bg-sky-400" />
                  <span>ĐANG THUÊ</span>
                </div>
                <div className="text-xl font-mono font-black text-white">{totalOccupiedUnits}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {((totalOccupiedUnits / (totalUnits || 1)) * 100).toFixed(1)}% công suất
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <span>CÒN TRỐNG</span>
                </div>
                <div className="text-xl font-mono font-black text-white">{totalAvailableUnits}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {((totalAvailableUnits / (totalUnits || 1)) * 100).toFixed(1)}% khả dụng
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-[11px]">
                  <span className="size-2 rounded-full bg-amber-400" />
                  <span>BẢO TRÌ</span>
                </div>
                <div className="text-xl font-mono font-black text-white">{totalMaintenanceUnits}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {((totalMaintenanceUnits / (totalUnits || 1)) * 100).toFixed(1)}% kiểm định
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Tình trạng Hợp đồng & Giám sát Rủi ro Toàn Hệ Thống */}
        <div className="p-6 rounded-3xl bg-slate-950/75 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Layers className="size-4" />
              </span>
              <div>
                <h4 className="font-black text-xs uppercase text-white tracking-wider">
                  Giám Sát Hợp Đồng &amp; Vận Hành Hệ Thống
                </h4>
                <p className="text-[10px] text-slate-400">Kiểm soát rủi ro thanh toán và sự cố kỹ thuật</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-black text-lg text-purple-400">{totalActiveContracts} HĐ</div>
              <div className="text-[10px] text-slate-400">Đang hoạt động</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Mục 1: Hợp đồng active */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">HĐ Đang Thuê Tốt</div>
                <div className="text-lg font-mono font-black text-emerald-400 mt-0.5">
                  {totalActiveContracts} Hợp đồng
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Thanh toán đầy đủ &amp; đúng hạn</div>
              </div>
              <CheckCircle2 className="size-6 text-emerald-500/40" />
            </div>

            {/* Mục 2: Hợp đồng quá hạn */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-amber-400 uppercase">HĐ Quá Hạn Cần Thu Nợ</div>
                <div className="text-lg font-mono font-black text-amber-400 mt-0.5">
                  {totalOverdueContracts} Hợp đồng
                </div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">Đã khóa mã PIN ra vào</div>
              </div>
              <AlertTriangle className="size-6 text-amber-500/40" />
            </div>

            {/* Mục 3: Hợp đồng đã hoàn tất */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">HĐ Đã Thanh Lý</div>
                <div className="text-lg font-mono font-black text-slate-200 mt-0.5">
                  {totalTerminatedContracts} Hợp đồng
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Nghiệm thu và hoàn tất cọc</div>
              </div>
              <Clock className="size-6 text-slate-600" />
            </div>

            {/* Mục 4: Sự cố / Vé hỗ trợ */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Hỗ Trợ Kỹ Thuật</div>
                <div className="text-lg font-mono font-black text-sky-400 mt-0.5">
                  {resolvedTickets} / {totalTickets} Đã xử lý
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Tỷ lệ giải quyết SLA cao</div>
              </div>
              <Shield className="size-6 text-sky-500/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
