import { useState, useMemo } from "react"
import {
  FileSpreadsheet,
  Download,
  DollarSign,
  Shield,
  Percent,
  Warehouse,
  TrendingUp,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  Eye,
  MapPin,
  User,
  Phone,
  Mail,
  ChevronRight,
  X,
  BarChart3,
  Layers,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { useBomContext } from "@/features/bom/context/BomContext"
import type { FacilityBreakdownItem } from "@/features/bom/api/bomApi"

export default function BomReportsPage() {
  const { chainOverview, facilities, totalOverdueCount, reloadData, isLoadingApi } = useBomContext()

  // State bộ lọc và sắp xếp
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFacilityCode, setSelectedFacilityCode] = useState("all")
  const [occupancyFilter, setOccupancyFilter] = useState<"all" | "high" | "medium" | "low">("all")
  const [riskFilter, setRiskFilter] = useState<"all" | "overdue" | "maintenance">("all")
  const [sortBy, setSortBy] = useState<"revenue_desc" | "occupancy_desc" | "units_desc">("revenue_desc")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modal chi tiết cơ sở
  const [selectedFacilityDetail, setSelectedFacilityDetail] = useState<FacilityBreakdownItem | null>(null)

  const breakdownList = chainOverview?.facilityBreakdown || []

  // Xử lý làm mới dữ liệu
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await reloadData()
      toast.success("Đã đồng bộ số liệu báo cáo mới nhất từ hệ thống!")
    } catch {
      toast.error("Không thể làm mới dữ liệu lúc này.")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Xuất báo cáo Excel / CSV UTF-8 thực tế có thể mở ngay bằng Excel
  const handleExportCSV = () => {
    if (!breakdownList.length) {
      toast.error("Không có dữ liệu báo cáo để xuất file!")
      return
    }

    const headers = [
      "Mã Cơ Sở",
      "Tên Cơ Sở",
      "Quản Lý Phụ Trách",
      "Số Điện Thoại",
      "Email",
      "Tổng Ô Kho",
      "Đang Thuê",
      "Còn Trống",
      "Bảo Trì",
      "Tỷ Lệ Lấp Đầy (%)",
      "Doanh Thu Thuê Ban Đầu (VNĐ)",
      "Doanh Thu Gia Hạn (VNĐ)",
      "Phí Phạt / Phụ Thu (VNĐ)",
      "Bồi Thường Hư Hại (VNĐ)",
      "Tổng Hoàn Trả Khách (VNĐ)",
      "Thực Thu Ròng (VNĐ)",
      "Tiền Cọc Đang Giữ (VNĐ)",
      "Hợp Đồng Active",
      "Hợp Đồng Quá Hạn",
    ]

    const rows = breakdownList.map((row) => [
      `"${row.facilityCode}"`,
      `"${row.facilityName}"`,
      `"${row.managerName || "Chưa phân công"}"`,
      `"${row.managerPhone || ""}"`,
      `"${row.managerEmail || ""}"`,
      row.totalUnits,
      row.occupiedUnits,
      row.availableUnits,
      row.maintenanceUnits,
      `${row.occupancyRate}%`,
      Number(row.rentalRevenue || 0),
      Number(row.extensionRevenue || 0),
      Number(row.penaltyRevenue || 0),
      Number(row.compensationRevenue || 0),
      Number(row.totalRefunds || 0),
      Number(row.netRevenue || 0),
      Number(row.depositHolding || 0),
      row.activeContracts,
      row.overdueContracts,
    ])

    // Dòng tổng cộng
    const totalRow = [
      `"TOTAL"`,
      `"TỔNG CỘNG TOÀN CHUỖI"`,
      `""`,
      `""`,
      `""`,
      chainOverview?.chainTotalUnits || 0,
      chainOverview?.facilityBreakdown?.reduce((acc, r) => acc + r.occupiedUnits, 0) || 0,
      chainOverview?.facilityBreakdown?.reduce((acc, r) => acc + r.availableUnits, 0) || 0,
      chainOverview?.facilityBreakdown?.reduce((acc, r) => acc + r.maintenanceUnits, 0) || 0,
      `${chainOverview?.chainAverageOccupancyRate || 0}%`,
      chainOverview?.facilityBreakdown?.reduce((acc, r) => acc + Number(r.rentalRevenue || 0), 0) || 0,
      chainOverview?.facilityBreakdown?.reduce((acc, r) => acc + Number(r.extensionRevenue || 0), 0) || 0,
      chainOverview?.facilityBreakdown?.reduce((acc, r) => acc + Number(r.penaltyRevenue || 0), 0) || 0,
      chainOverview?.facilityBreakdown?.reduce((acc, r) => acc + Number(r.compensationRevenue || 0), 0) || 0,
      Number(chainOverview?.chainTotalRefunds || 0),
      Number(chainOverview?.chainNetRevenue || 0),
      Number(chainOverview?.chainDepositHolding || 0),
      chainOverview?.chainTotalActiveContracts || 0,
      totalOverdueCount,
    ]

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(",")), totalRow.join(",")].join("\r\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Bao_Cao_He_Thong_Thue_Kho_SmartStorage_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Đã xuất file báo cáo Excel (.CSV UTF-8) thành công!")
  }

  // Lọc và sắp xếp danh sách cơ sở
  const filteredAndSortedBreakdown = useMemo(() => {
    let result = [...breakdownList]

    // 1. Lọc theo search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (r) =>
          r.facilityName.toLowerCase().includes(q) ||
          r.facilityCode.toLowerCase().includes(q) ||
          (r.managerName && r.managerName.toLowerCase().includes(q))
      )
    }

    // 2. Lọc theo cơ sở
    if (selectedFacilityCode !== "all") {
      result = result.filter((r) => r.facilityCode === selectedFacilityCode)
    }

    // 3. Lọc theo tỷ lệ lấp đầy
    if (occupancyFilter === "high") {
      result = result.filter((r) => Number(r.occupancyRate || 0) >= 20)
    } else if (occupancyFilter === "medium") {
      result = result.filter((r) => Number(r.occupancyRate || 0) >= 10 && Number(r.occupancyRate || 0) < 20)
    } else if (occupancyFilter === "low") {
      result = result.filter((r) => Number(r.occupancyRate || 0) < 10)
    }

    // 4. Lọc theo rủi ro
    if (riskFilter === "overdue") {
      result = result.filter((r) => (r.overdueContracts || 0) > 0)
    } else if (riskFilter === "maintenance") {
      result = result.filter((r) => (r.maintenanceUnits || 0) > 0)
    }

    // 5. Sắp xếp
    if (sortBy === "revenue_desc") {
      result.sort((a, b) => Number(b.netRevenue || 0) - Number(a.netRevenue || 0))
    } else if (sortBy === "occupancy_desc") {
      result.sort((a, b) => Number(b.occupancyRate || 0) - Number(a.occupancyRate || 0))
    } else if (sortBy === "units_desc") {
      result.sort((a, b) => Number(b.totalUnits || 0) - Number(a.totalUnits || 0))
    }

    return result
  }, [breakdownList, searchQuery, selectedFacilityCode, occupancyFilter, riskFilter, sortBy])

  // Tổng hợp chỉ số tài chính & khai thác toàn chuỗi
  const totalRevenue = chainOverview?.chainNetRevenue || 0
  const grossRevenue = chainOverview?.chainTotalRevenue || 0
  const totalRefunds = chainOverview?.chainTotalRefunds || 0
  const totalDeposit = chainOverview?.chainDepositHolding || 0
  const avgOccupancy = chainOverview?.chainAverageOccupancyRate || 0
  const totalUnits = chainOverview?.chainTotalUnits || 0
  const totalActive = chainOverview?.chainTotalActiveContracts || 0
  const totalOccupiedUnits = breakdownList.reduce((acc, r) => acc + (r.occupiedUnits || 0), 0)
  const totalAvailableUnits = breakdownList.reduce((acc, r) => acc + (r.availableUnits || 0), 0)
  const totalMaintenanceUnits = breakdownList.reduce((acc, r) => acc + (r.maintenanceUnits || 0), 0)
  const totalRenewalRevenue = breakdownList.reduce((acc, r) => acc + Number(r.extensionRevenue || 0), 0)
  const totalInitialRevenue = breakdownList.reduce((acc, r) => acc + Number(r.rentalRevenue || 0), 0)

  return (
    <div className="space-y-6">
      {/* 1. THANH TIÊU ĐỀ & ĐIỀU HÀNH DÀNH CHO BOM */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-3xl border border-sky-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-black text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="size-3" />
                BOM EXECUTIVE DASHBOARD
              </span>
              <span className="text-xs text-slate-400">
                • Cập nhật thời gian thực từ cơ sở dữ liệu
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Báo Cáo Toàn Diện Hệ Thống Thuê Kho &amp; Dòng Tiền Chuỗi
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Giám sát dòng tiền thực thu, tiền ký quỹ holding, tỷ lệ lấp đầy và kiểm soát chỉ số rủi ro trên toàn bộ 7 cơ sở kho SmartStorage.
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
              <span>Xuất Báo Cáo Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KHỐI 5 THẺ CHỈ SỐ CỐT LÕI (EXECUTIVE KPI METRICS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Doanh Thu Thực Thu Ròng */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/30 shadow-xl space-y-2.5 backdrop-blur-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Doanh Thu Thực Thu
            </span>
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-slate-950 transition">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-sky-400">
            ₫{Number(totalRevenue).toLocaleString("vi-VN")}
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Tổng thu: ₫{Number(grossRevenue).toLocaleString("vi-VN")}</span>
            <span className="text-rose-400">Hoàn: -₫{Number(totalRefunds).toLocaleString("vi-VN")}</span>
          </div>
        </div>

        {/* Metric 2: Tiền Cọc Holding */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-xl space-y-2.5 backdrop-blur-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Tiền Cọc Ký Quỹ
            </span>
            <span className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 group-hover:bg-slate-700 transition">
              <Shield className="size-4 text-emerald-400" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            ₫{Number(totalDeposit).toLocaleString("vi-VN")}
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Bảo chứng an toàn vốn:</span>
            <span className="font-bold text-emerald-400">100%</span>
          </div>
        </div>

        {/* Metric 3: Tỷ Lệ Lấp Đầy Trung Bình */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-xl space-y-2.5 backdrop-blur-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Tỷ Lệ Lấp Đầy TB
            </span>
            <span className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 group-hover:bg-slate-700 transition">
              <Percent className="size-4 text-sky-400" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-sky-400">
            {avgOccupancy}%
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Đang thuê: <b className="text-white">{totalOccupiedUnits}</b></span>
            <span>Trống: <b className="text-white">{totalAvailableUnits}</b></span>
          </div>
        </div>

        {/* Metric 4: Tình Trạng Hợp Đồng & Rủi Ro */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-xl space-y-2.5 backdrop-blur-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Hợp Đồng Đang Thuê
            </span>
            <span className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 group-hover:bg-slate-700 transition">
              <Layers className="size-4 text-purple-400" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {totalActive} <span className="text-xs font-normal text-slate-400">HĐ Active</span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[10px] flex items-center justify-between">
            {totalOverdueCount > 0 ? (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="size-3" />
                {totalOverdueCount} HĐ quá hạn
              </span>
            ) : (
              <span className="text-slate-400">Không có nợ xấu</span>
            )}
            <span className="text-slate-500">Bảo trì: {totalMaintenanceUnits}</span>
          </div>
        </div>

        {/* Metric 5: Quy Mô Hạ Tầng */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-xl space-y-2.5 backdrop-blur-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Quy Mô Hạ Tầng
            </span>
            <span className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 group-hover:bg-slate-700 transition">
              <Warehouse className="size-4 text-amber-400" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {totalUnits} <span className="text-xs font-normal text-slate-400">Ô Kho</span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Mạng lưới:</span>
            <span className="font-bold text-sky-400">{facilities.length} Cơ sở toàn quốc</span>
          </div>
        </div>
      </div>

      {/* 3. TRỰC QUAN HÓA: SO SÁNH HIỆU SUẤT & TỶ LỆ LẤP ĐẦY TỪNG CƠ SỞ */}
      <div className="bg-slate-950/75 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <BarChart3 className="size-4" />
            </span>
            <div>
              <h3 className="font-black text-sm uppercase text-white tracking-wide">
                BẢNG XẾP HẠNG &amp; SO SÁNH CÔNG SUẤT 7 CƠ SỞ
              </h3>
              <p className="text-[11px] text-slate-400">
                Trực quan hóa tỷ lệ lấp đầy, số kho đang thuê và đóng góp doanh thu của từng chi nhánh
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Tổng: <b className="text-sky-400">{breakdownList.length}</b> cơ sở
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {breakdownList.map((item, idx) => {
            const occ = Number(item.occupancyRate || 0)
            const isHigh = occ >= 20
            const isMedium = occ >= 10 && occ < 20

            return (
              <div
                key={item.facilityId || idx}
                onClick={() => setSelectedFacilityDetail(item)}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 hover:bg-slate-900 transition cursor-pointer space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-sky-400 font-bold uppercase">
                      {item.facilityCode}
                    </div>
                    <div className="font-extrabold text-white text-xs mt-0.5 group-hover:text-sky-300 transition-colors">
                      {item.facilityName}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isHigh
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : isMedium
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {occ}% Lấp đầy
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? "bg-emerald-500" : isMedium ? "bg-sky-500" : "bg-slate-600"
                      }`}
                      style={{ width: `${Math.min(occ, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{item.occupiedUnits} / {item.totalUnits} Kho đã thuê</span>
                    <span>Còn {item.availableUnits} trống</span>
                  </div>
                </div>

                {/* Doanh thu & người quản lý */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
                    QL: <b className="text-slate-300">{item.managerName || "Chưa gán"}</b>
                  </div>
                  <div className="font-mono font-black text-sky-400 text-xs">
                    ₫{Number(item.netRevenue || 0).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. KHỐI BẢNG BÁO CÁO DÒNG TIỀN VÀ HIỆU SUẤT CHI TIẾT */}
      <div className="bg-slate-950/75 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
        {/* Tiêu đề & thanh công cụ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <FileSpreadsheet className="size-5" />
            </span>
            <div>
              <h3 className="font-black text-base uppercase text-white tracking-wide">
                BẢNG BÁO CÁO DÒNG TIỀN &amp; HIỆU SUẤT KHAI THÁC TỪNG CƠ SỞ
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bảng phân tích dòng tiền thực tế, tiền cọc, nguồn doanh thu và rủi ro hợp đồng của từng chi nhánh
              </p>
            </div>
          </div>
        </div>

        {/* Thanh Bộ Lọc Toolbar Chuyên Nghiệp */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Filter className="size-3.5 text-sky-400" />
              <span>BỘ LỌC BÁO CÁO:</span>
            </div>
            <div className="text-xs text-slate-400">
              Hiển thị <b className="text-white">{filteredAndSortedBreakdown.length}</b> / {breakdownList.length} cơ sở
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* 1. Tìm kiếm */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Tìm kiếm:
              </label>
              <input
                type="text"
                placeholder="Tên cơ sở, mã, quản lý..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold outline-none placeholder-slate-500 focus:border-sky-400"
              />
            </div>

            {/* 2. Chọn cơ sở */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Cơ Sở Kho:
              </label>
              <select
                value={selectedFacilityCode}
                onChange={(e) => setSelectedFacilityCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold outline-none cursor-pointer focus:border-sky-400"
              >
                <option value="all">Tất Cả Các Cơ Sở ({facilities.length})</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.code}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Lọc theo tỷ lệ lấp đầy */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Tỷ Lệ Lấp Đầy:
              </label>
              <select
                value={occupancyFilter}
                onChange={(e) => setOccupancyFilter(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold outline-none cursor-pointer focus:border-sky-400"
              >
                <option value="all">Tất Cả Mức Độ</option>
                <option value="high">Lấp Đầy Cao (≥ 20%)</option>
                <option value="medium">Đang Tăng Trưởng (10% - 20%)</option>
                <option value="low">Cần Thúc Đẩy (&lt; 10%)</option>
              </select>
            </div>

            {/* 4. Lọc theo rủi ro */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Chỉ Số Rủi Ro:
              </label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold outline-none cursor-pointer focus:border-sky-400"
              >
                <option value="all">Tất Cả</option>
                <option value="overdue">Có Hợp Đồng Quá Hạn</option>
                <option value="maintenance">Có Kho Đang Bảo Trì</option>
              </select>
            </div>

            {/* 5. Sắp xếp */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Sắp Xếp Theo:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold outline-none cursor-pointer focus:border-sky-400"
              >
                <option value="revenue_desc">Doanh Thu Giảm Dần</option>
                <option value="occupancy_desc">Tỷ Lệ Lấp Đầy Giảm Dần</option>
                <option value="units_desc">Quy Mô Kho Giảm Dần</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bảng dữ liệu chi tiết */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 uppercase font-black text-slate-300 text-[10px]">
                <th className="p-3.5 text-left">Cơ Sở &amp; Quản Lý</th>
                <th className="p-3.5 text-center">Công Suất Khai Thác</th>
                <th className="p-3.5 text-center">Tỷ Lệ Lấp Đầy</th>
                <th className="p-3.5 text-right">Doanh Thu Thuê</th>
                <th className="p-3.5 text-right">Gia Hạn Hàng Tháng</th>
                <th className="p-3.5 text-right">Hoàn Trả</th>
                <th className="p-3.5 text-right">Thực Thu Ròng</th>
                <th className="p-3.5 text-right">Tiền Cọc Holding</th>
                <th className="p-3.5 text-center">Rủi Ro / Vận Hành</th>
                <th className="p-3.5 text-center">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
              {filteredAndSortedBreakdown.length > 0 ? (
                filteredAndSortedBreakdown.map((row) => {
                  const occRate = Number(row.occupancyRate || 0)
                  const isHigh = occRate >= 20
                  const isMedium = occRate >= 10 && occRate < 20

                  return (
                    <tr
                      key={row.facilityCode || row.facilityId}
                      className="hover:bg-slate-900/50 transition cursor-pointer"
                      onClick={() => setSelectedFacilityDetail(row)}
                    >
                      {/* Cơ sở & Quản lý */}
                      <td className="p-3.5 text-left">
                        <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                          <span className="font-mono text-sky-400 font-black">[{row.facilityCode}]</span>
                          <span>{row.facilityName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-1 text-slate-300">
                            <User className="size-3 text-slate-500" />
                            {row.managerName || "Chưa phân công"}
                          </span>
                          {row.managerPhone && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              • {row.managerPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Công suất */}
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-bold text-white text-xs">
                          {row.totalUnits} Kho
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 space-x-1">
                          <span className="text-sky-300 font-bold">{row.occupiedUnits} thuê</span>
                          <span>•</span>
                          <span>{row.availableUnits} trống</span>
                          {row.maintenanceUnits > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400">{row.maintenanceUnits} sửa</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Tỷ lệ lấp đầy */}
                      <td className="p-3.5 text-center">
                        <div className="font-black text-sky-400 font-mono text-sm">
                          {occRate}%
                        </div>
                        <div className="w-20 bg-slate-950 rounded-full h-1.5 mx-auto mt-1 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              isHigh ? "bg-emerald-500" : isMedium ? "bg-sky-500" : "bg-slate-600"
                            }`}
                            style={{ width: `${Math.min(occRate, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            isHigh
                              ? "text-emerald-400"
                              : isMedium
                              ? "text-sky-400"
                              : "text-slate-500"
                          }`}
                        >
                          {isHigh ? "Tối Ưu" : isMedium ? "Tiêu Chuẩn" : "Cần Thúc Đẩy"}
                        </span>
                      </td>

                      {/* Doanh thu thuê */}
                      <td className="p-3.5 text-right font-mono font-bold text-slate-200">
                        ₫{Number(row.rentalRevenue || 0).toLocaleString("vi-VN")}
                      </td>

                      {/* Doanh thu gia hạn */}
                      <td className="p-3.5 text-right font-mono font-medium text-slate-300">
                        ₫{Number(row.extensionRevenue || 0).toLocaleString("vi-VN")}
                      </td>

                      {/* Hoàn trả */}
                      <td className="p-3.5 text-right font-mono text-rose-400 font-medium">
                        {Number(row.totalRefunds || 0) > 0
                          ? `-₫${Number(row.totalRefunds).toLocaleString("vi-VN")}`
                          : "₫0"}
                      </td>

                      {/* Thực thu ròng */}
                      <td className="p-3.5 text-right font-mono font-black text-sky-400 text-sm">
                        ₫{Number(row.netRevenue || 0).toLocaleString("vi-VN")}
                      </td>

                      {/* Tiền cọc */}
                      <td className="p-3.5 text-right font-mono font-bold text-white">
                        ₫{Number(row.depositHolding || 0).toLocaleString("vi-VN")}
                      </td>

                      {/* Rủi ro / Giám sát */}
                      <td className="p-3.5 text-center">
                        <div className="space-y-0.5">
                          {row.overdueContracts > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                              <AlertTriangle className="size-3" />
                              {row.overdueContracts} quá hạn
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              An toàn
                            </span>
                          )}
                          {(row.totalTickets || 0) > 0 && (
                            <div className="text-[10px] text-slate-500">
                              {row.totalTickets} sự cố ({row.inProgressTickets || 0} xử lý)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Nút xem chi tiết */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFacilityDetail(row)
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-500 text-slate-400 hover:text-slate-950 transition cursor-pointer inline-flex items-center justify-center"
                          title="Xem chi tiết cơ sở"
                        >
                          <Eye className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                    Không tìm thấy cơ sở nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}

              {/* DÒNG TỔNG KẾT TOÀN HỆ THỐNG */}
              <tr className="bg-slate-900/95 font-bold border-t-2 border-sky-500/30 text-slate-100">
                <td className="p-4 text-left text-sky-400 uppercase tracking-wider font-black text-xs">
                  TỔNG CỘNG TOÀN CHUỖI (7 CƠ SỞ)
                </td>
                <td className="p-4 text-center font-mono text-white text-xs">
                  {totalUnits} Kho / {totalOccupiedUnits} Đang thuê
                </td>
                <td className="p-4 text-center text-sky-400 font-mono text-sm font-black">
                  {avgOccupancy}% TB
                </td>
                <td className="p-4 text-right font-mono font-bold text-slate-200">
                  ₫{totalInitialRevenue.toLocaleString("vi-VN")}
                </td>
                <td className="p-4 text-right font-mono font-medium text-slate-300">
                  ₫{totalRenewalRevenue.toLocaleString("vi-VN")}
                </td>
                <td className="p-4 text-right font-mono font-medium text-rose-400">
                  -₫{Number(totalRefunds).toLocaleString("vi-VN")}
                </td>
                <td className="p-4 text-right font-mono font-black text-sky-400 text-base">
                  ₫{Number(totalRevenue).toLocaleString("vi-VN")}
                </td>
                <td className="p-4 text-right font-mono font-bold text-white">
                  ₫{Number(totalDeposit).toLocaleString("vi-VN")}
                </td>
                <td className="p-4 text-center">
                  {totalOverdueCount > 0 ? (
                    <span className="text-amber-400 text-[10px] font-bold">
                      {totalOverdueCount} HĐ Quá Hạn
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-[10px] font-bold">
                      Hệ thống ổn định
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <span className="text-[10px] text-sky-400 font-bold">100% Khai thác</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL CHI TIẾT CƠ SỞ KHO (FACILITY DRILLDOWN MODAL) */}
      {selectedFacilityDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl text-white space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono font-bold text-xs">
                    {selectedFacilityDetail.facilityCode}
                  </span>
                  <h3 className="font-black text-lg text-white uppercase">
                    {selectedFacilityDetail.facilityName}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="size-3 text-slate-500" />
                  Chi nhánh trực thuộc hệ thống SmartStorage
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFacilityDetail(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Thông tin Quản lý */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Quản lý chi nhánh phụ trách:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <User className="size-3.5 text-sky-400" />
                  <span>{selectedFacilityDetail.managerName || "Chưa phân công"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="size-3.5 text-slate-500" />
                  <span>{selectedFacilityDetail.managerPhone || "Chưa cập nhật"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 truncate">
                  <Mail className="size-3.5 text-slate-500" />
                  <span>{selectedFacilityDetail.managerEmail || "Chưa cập nhật"}</span>
                </div>
              </div>
            </div>

            {/* Cơ cấu Kho & Khai thác */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Tổng Ô Kho</div>
                <div className="text-xl font-black font-mono text-white mt-1">
                  {selectedFacilityDetail.totalUnits}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] uppercase font-bold text-sky-400">Đang Thuê</div>
                <div className="text-xl font-black font-mono text-sky-400 mt-1">
                  {selectedFacilityDetail.occupiedUnits}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-400">Còn Trống</div>
                <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                  {selectedFacilityDetail.availableUnits}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] uppercase font-bold text-amber-400">Bảo Trì</div>
                <div className="text-xl font-black font-mono text-amber-400 mt-1">
                  {selectedFacilityDetail.maintenanceUnits}
                </div>
              </div>
            </div>

            {/* Chi tiết Dòng Tiền & Doanh Thu */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-300">
                Phân tích dòng tiền thực tế:
              </h4>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950 text-xs">
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Doanh thu tiền thuê ban đầu:</span>
                  <span className="font-mono font-bold text-white">
                    ₫{Number(selectedFacilityDetail.rentalRevenue || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Doanh thu gia hạn hàng tháng:</span>
                  <span className="font-mono font-bold text-white">
                    ₫{Number(selectedFacilityDetail.extensionRevenue || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Phí phạt quá hạn &amp; bồi thường:</span>
                  <span className="font-mono font-bold text-white">
                    ₫{(Number(selectedFacilityDetail.penaltyRevenue || 0) + Number(selectedFacilityDetail.compensationRevenue || 0)).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-rose-400">Tổng tiền hoàn trả khách:</span>
                  <span className="font-mono font-bold text-rose-400">
                    -₫{Number(selectedFacilityDetail.totalRefunds || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="p-3 bg-sky-500/10 flex items-center justify-between font-black text-sky-400">
                  <span className="uppercase">Thực thu ròng (Net Revenue):</span>
                  <span className="font-mono text-base">
                    ₫{Number(selectedFacilityDetail.netRevenue || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Tiền cọc holding đang giữ:</span>
                  <span className="font-mono font-bold text-white">
                    ₫{Number(selectedFacilityDetail.depositHolding || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedFacilityDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
