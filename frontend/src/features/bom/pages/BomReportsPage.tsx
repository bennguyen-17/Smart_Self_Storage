import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileSpreadsheet, Download, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useBomContext } from "../context/BomContext"

export default function BomReportsPage() {
  const navigate = useNavigate()
  const { chainOverview, facilities, totalOverdueCount } = useBomContext()

  const [selectedFacilityCode, setSelectedFacilityCode] = useState("all")
  const [selectedUnitType, setSelectedUnitType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const handleExportExcel = () => {
    toast.success("Đang tạo và tải xuống báo cáo tổng hợp doanh thu Excel (.xlsx)...")
  }

  const breakdownList = chainOverview?.facilityBreakdown || []
  const filteredBreakdown = breakdownList.filter((row) => {
    if (selectedFacilityCode !== "all" && row.facilityCode !== selectedFacilityCode) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb quay về trang chủ BOM */}
      <div className="flex items-center pb-1">
        <button
          onClick={() => navigate("/bom")}
          className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại Tổng Quan Điều Hành</span>
        </button>
      </div>

      {/* Báo Cáo Toàn Hệ Thống */}
      <div className="bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-sky-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-white">
              <FileSpreadsheet className="size-4.5 text-sky-400" />
              <span>BÁO CÁO DOANH THU &amp; HIỆU SUẤT TOÀN HỆ THỐNG</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tổng hợp dòng tiền thực thu, tiền cọc holding và hiệu suất vận hành từng cơ sở
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Download className="size-4" />
            <span>Xuất Báo Cáo Excel</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-bold">
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1">Cơ Sở Kho:</label>
            <select
              value={selectedFacilityCode}
              onChange={(e) => setSelectedFacilityCode(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold"
            >
              <option value="all">Tất Cả Các Cơ Sở ({facilities.length} Cơ Sở)</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.code}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1">Loại / Size Kho:</label>
            <select
              value={selectedUnitType}
              onChange={(e) => setSelectedUnitType(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold"
            >
              <option value="all">Tất Cả Loại Kho (S, M, L, XL)</option>
              <option value="S">Size S (Mini)</option>
              <option value="M">Size M (Medium)</option>
              <option value="L">Size L (Large)</option>
              <option value="XL">Size XL (Warehouse)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1">Trạng Thái Thuê:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold"
            >
              <option value="all">Tất Cả Trạng Thái</option>
              <option value="occupied">Đang Thuê</option>
              <option value="available">Trống</option>
              <option value="overdue">Quá Hạn</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1">Khoảng Thời Gian:</label>
            <select className="w-full p-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold">
              <option>Tháng Hiện Tại (T09/2026)</option>
              <option>Tháng 08 / 2026</option>
            </select>
          </div>
        </div>

        {/* Table Báo Cáo */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 uppercase font-black text-slate-300 text-[10px]">
                <th className="p-3">Cơ Sở Kho Hệ Thống</th>
                <th className="p-3">Loại / Size Kho</th>
                <th className="p-3 text-center">Quy Mô &amp; Đang Thuê</th>
                <th className="p-3 text-center">Trạng Thái Thuê (%)</th>
                <th className="p-3 text-right">Doanh Thu Thuê / Tháng</th>
                <th className="p-3 text-right">Tổng Tiền Cọc (Deposit)</th>
                <th className="p-3 text-right">Doanh Thu Thực Thu</th>
                <th className="p-3 text-center">Hiệu Suất Vận Hành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
              {filteredBreakdown.length > 0 ? (
                filteredBreakdown.map((row) => {
                  const matchedFacility = facilities.find(
                    (f) => f.code === row.facilityCode || String(f.id) === String(row.facilityId)
                  )
                  return (
                    <tr key={row.facilityCode || row.facilityId} className="hover:bg-slate-900/40 transition">
                      <td className="p-3">
                        <div className="font-extrabold text-white">{row.facilityName}</div>
                        <div className="text-[11px] text-slate-400">
                          {matchedFacility?.address || "Hệ thống cơ sở kho"} • Mã:{" "}
                          <span className="font-mono text-sky-400 font-bold">{row.facilityCode}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">Tất Cả Loại Kho</div>
                        <div className="text-[11px] text-sky-400">Standard / Climate</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono font-bold text-white">{row.totalUnits} Kho</span>
                        <span className="text-[11px] text-emerald-400 block font-bold">
                          {row.occupiedUnits} Đang thuê
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono">
                        <span className="font-black text-sky-400 text-sm block">
                          {row.occupancyRate}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {row.availableUnits} trống • {row.overdueContracts} quá hạn
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        ₫{Number(row.rentalRevenue || 0).toLocaleString("vi-VN")}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-400">
                        ₫{Number(row.depositHolding || 0).toLocaleString("vi-VN")}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                        ₫{Number(row.netRevenue || 0).toLocaleString("vi-VN")}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-extrabold px-2.5 py-1 rounded-full text-[10px] ${
                            row.occupancyRate >= 80
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                              : row.occupancyRate >= 30
                              ? "bg-sky-950/80 text-sky-300 border border-sky-800"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {row.occupancyRate >= 80
                            ? "★★★★★ Tối ưu"
                            : row.occupancyRate >= 30
                            ? "★★★★☆ Tiêu chuẩn"
                            : row.occupancyRate > 0
                            ? "★★★☆☆ Đang lấp đầy"
                            : "Chưa có hợp đồng"}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    Chưa có dữ liệu báo cáo từ API
                  </td>
                </tr>
              )}

              {/* TOTAL SUMMARY ROW - 100% TỪ LIVE API */}
              <tr className="bg-sky-950/40 font-black border-t-2 border-sky-500/40">
                <td className="p-3 text-sky-200 uppercase">TỔNG CỘNG TOÀN HỆ THỐNG</td>
                <td className="p-3 text-sky-200">Tất Cả Loại Kho (S, M, L, XL, AC)</td>
                <td className="p-3 text-center font-mono text-sky-200">
                  {chainOverview
                    ? `${chainOverview.chainTotalUnits} Kho / ${chainOverview.chainTotalActiveContracts} Đang thuê`
                    : "0 Kho"}
                </td>
                <td className="p-3 text-center text-emerald-400 font-mono">
                  {chainOverview
                    ? `${chainOverview.chainAverageOccupancyRate}% Lấp Đầy TB (${totalOverdueCount} Quá Hạn)`
                    : "0%"}
                </td>
                <td className="p-3 text-right font-mono font-black text-sky-200">
                  ₫{chainOverview ? Number(chainOverview.chainTotalRevenue || 0).toLocaleString("vi-VN") : "0"}
                </td>
                <td className="p-3 text-right font-mono font-black text-sky-200">
                  ₫{chainOverview ? Number(chainOverview.chainDepositHolding || 0).toLocaleString("vi-VN") : "0"}
                </td>
                <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                  ₫{chainOverview ? Number(chainOverview.chainNetRevenue || 0).toLocaleString("vi-VN") : "0"}
                </td>
                <td className="p-3 text-center">
                  <span className="bg-sky-500 text-slate-950 font-black px-2.5 py-1 rounded-full text-[10px]">
                    {chainOverview ? `${chainOverview.chainAverageOccupancyRate}% Tỷ lệ lấp đầy` : "0%"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
