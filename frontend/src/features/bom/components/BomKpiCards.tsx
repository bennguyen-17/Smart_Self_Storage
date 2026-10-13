import { Warehouse, TrendingUp, DollarSign, AlertTriangle } from "lucide-react"
import { useBomContext } from "../context/BomContext"

export default function BomKpiCards() {
  const { chainOverview, facilities, totalOverdueCount, formatShortCurrency } = useBomContext()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Box 1: Tổng cơ sở */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-sky-500/20 shadow-md hover:border-sky-400/40 transition flex flex-col justify-between min-h-[120px] group">
        <div className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>TỔNG CƠ SỞ KHO</span>
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 group-hover:scale-110 transition-transform">
            <Warehouse className="size-4" />
          </div>
        </div>
        <div className="my-1">
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline gap-1.5">
            <span>{chainOverview ? chainOverview.chainTotalFacilities : facilities.length}</span>
            <span className="text-xs sm:text-sm font-bold text-sky-400">Cơ sở</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          {chainOverview
            ? `${chainOverview.chainTotalUnits.toLocaleString("vi-VN")} Tổng số kho vận hành`
            : "0 Tổng số kho vận hành"}
        </div>
      </div>

      {/* Box 2: Tỉ lệ lấp đầy */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-emerald-500/20 shadow-md hover:border-emerald-400/40 transition flex flex-col justify-between min-h-[120px] group">
        <div className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>TỈ LỆ LẤP ĐẦY TB</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 group-hover:scale-110 transition-transform">
            <TrendingUp className="size-4" />
          </div>
        </div>
        <div className="my-1">
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
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
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-amber-500/20 shadow-md hover:border-amber-400/40 transition flex flex-col justify-between min-h-[120px] group">
        <div className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>DOANH THU TOÀN CHUỖI</span>
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 group-hover:scale-110 transition-transform">
            <DollarSign className="size-4" />
          </div>
        </div>
        <div className="my-1">
          <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
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
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-rose-500/20 shadow-md hover:border-rose-400/40 transition flex flex-col justify-between min-h-[120px] group">
        <div className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>CẢNH BÁO QUÁ HẠN</span>
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 group-hover:scale-110 transition-transform">
            <AlertTriangle className="size-4" />
          </div>
        </div>
        <div className="my-1">
          <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight flex items-baseline gap-1.5">
            <span>{chainOverview ? totalOverdueCount : 0}</span>
            <span className="text-xs sm:text-sm font-bold text-rose-300">Kho</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          {chainOverview
            ? (totalOverdueCount > 0 ? "Cần kích hoạt BR-18 / BR-21" : "An toàn - Không có nợ quá hạn")
            : "0 Đơn quá hạn"}
        </div>
      </div>
    </div>
  )
}
