import { Warehouse, TrendingUp, DollarSign, AlertTriangle } from "lucide-react"
import { useBomContext } from "../context/BomContext"

export default function BomKpiCards() {
  const { chainOverview, facilities, totalOverdueCount, formatShortCurrency } = useBomContext()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Box 1: Tổng cơ sở */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 shadow-lg transition flex flex-col justify-between min-h-[120px] group">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>TỔNG CƠ SỞ KHO</span>
          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 group-hover:text-sky-400 transition-colors">
            <Warehouse className="size-4" />
          </div>
        </div>
        <div className="my-1">
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-1.5">
            <span>{chainOverview ? chainOverview.chainTotalFacilities : facilities.length}</span>
            <span className="text-xs sm:text-sm font-bold text-sky-400 font-sans">Cơ sở</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          {chainOverview
            ? `${chainOverview.chainTotalUnits.toLocaleString("vi-VN")} Tổng số kho vận hành`
            : "0 Tổng số kho vận hành"}
        </div>
      </div>

      {/* Box 2: Tỉ lệ lấp đầy */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 shadow-lg transition flex flex-col justify-between min-h-[120px] group">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>TỈ LỆ LẤP ĐẦY TB</span>
          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 group-hover:text-sky-400 transition-colors">
            <TrendingUp className="size-4" />
          </div>
        </div>
        <div className="my-1">
          <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono tracking-tight">
            {chainOverview ? `${chainOverview.chainAverageOccupancyRate}%` : "0%"}
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          {chainOverview
            ? `${chainOverview.chainTotalActiveContracts} Hợp đồng đang thuê`
            : "0 Hợp đồng đang thuê"}
        </div>
      </div>

      {/* Box 3: Doanh thu */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 shadow-lg transition flex flex-col justify-between min-h-[120px] group">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>DOANH THU TOÀN CHUỖI</span>
          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 group-hover:text-sky-400 transition-colors">
            <DollarSign className="size-4" />
          </div>
        </div>
        <div className="my-1">
          <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono tracking-tight">
            {chainOverview ? formatShortCurrency(chainOverview.chainNetRevenue) : "₫0"}
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          {chainOverview
            ? `Thực thu: ₫${Number(chainOverview.chainNetRevenue).toLocaleString("vi-VN")}`
            : "₫0"}
        </div>
      </div>

      {/* Box 4: Cảnh báo */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 shadow-lg transition flex flex-col justify-between min-h-[120px] group">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>CẢNH BÁO QUÁ HẠN</span>
          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 group-hover:text-sky-400 transition-colors">
            <AlertTriangle className="size-4" />
          </div>
        </div>
        <div className="my-1">
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-1.5">
            <span>{chainOverview ? totalOverdueCount : 0}</span>
            <span className="text-xs sm:text-sm font-bold text-slate-400 font-sans">Kho</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          {chainOverview
            ? (totalOverdueCount > 0 ? "Cần xử lý" : "An toàn - Không có nợ quá hạn")
            : "0 Đơn quá hạn"}
        </div>
      </div>
    </div>
  )
}
