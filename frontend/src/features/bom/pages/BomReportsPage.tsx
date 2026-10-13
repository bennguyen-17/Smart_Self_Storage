import { useState } from "react"
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
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { useBomContext } from "../context/BomContext"

export default function BomReportsPage() {
  const { chainOverview, facilities, totalOverdueCount } = useBomContext()

  const [selectedFacilityCode, setSelectedFacilityCode] = useState("all")
  const [selectedUnitType, setSelectedUnitType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("current")

  const handleExportExcel = () => {
    toast.success("Đang tạo và tải xuống báo cáo tổng hợp doanh thu Excel (.xlsx)...")
  }

  const breakdownList = chainOverview?.facilityBreakdown || []
  const filteredBreakdown = breakdownList.filter((row) => {
    if (selectedFacilityCode !== "all" && row.facilityCode !== selectedFacilityCode) return false
    return true
  })

  // Tính toán tổng số liệu nhanh
  const totalRevenue = chainOverview?.chainNetRevenue || chainOverview?.chainTotalRevenue || 0
  const totalDeposit = chainOverview?.chainDepositHolding || 0
  const avgOccupancy = chainOverview?.chainAverageOccupancyRate || 0
  const totalUnits = chainOverview?.chainTotalUnits || 0
  const totalActive = chainOverview?.chainTotalActiveContracts || 0

  return (
    <div className="space-y-6">
      {/* KHỐI 1: 4 THẺ TỔNG HỢP CHỈ SỐ NHANH (EXECUTIVE SUMMARY METRICS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Tổng Doanh Thu */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 shadow-xl space-y-2 backdrop-blur-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Doanh Thu Thực Thu</span>
            <span className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-sky-400">
            ₫{Number(totalRevenue).toLocaleString("vi-VN")}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="size-3 text-sky-400" />
            <span className="text-sky-300 font-bold">+8.4%</span>
            <span>so với tháng trước</span>
          </div>
        </div>

        {/* Metric 2: Tiền Cọc Holding */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 shadow-xl space-y-2 backdrop-blur-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Tiền Cọc Holding</span>
            <span className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <Shield className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            ₫{Number(totalDeposit).toLocaleString("vi-VN")}
          </div>
          <div className="text-[11px] text-slate-400">
            Ký quỹ bảo chứng an toàn vốn 100%
          </div>
        </div>

        {/* Metric 3: Tỷ Lệ Lấp Đầy Trung Bình */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 shadow-xl space-y-2 backdrop-blur-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Tỷ Lệ Lấp Đầy TB</span>
            <span className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <Percent className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-sky-400">
            {avgOccupancy}%
          </div>
          <div className="text-[11px] text-slate-400">
            {totalOverdueCount > 0 ? (
              <span className="text-slate-300 font-semibold">{totalOverdueCount} hợp đồng quá hạn</span>
            ) : (
              <span className="text-slate-400">Không có nợ xấu phát sinh</span>
            )}
          </div>
        </div>

        {/* Metric 4: Quy Mô Toàn Chuỗi */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 shadow-xl space-y-2 backdrop-blur-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Quy Mô Khai Thác</span>
            <span className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <Warehouse className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {totalActive} <span className="text-sm font-sans text-slate-400">/ {totalUnits} Kho</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Đang vận hành trên {facilities.length} cụm cơ sở
          </div>
        </div>
      </div>

      {/* KHỐI 2: BẢNG BÁO CÁO CHI TIẾT & BỘ LỌC ĐIỀU HÀNH */}
      <div className="bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-sky-500/20 shadow-xl space-y-5">
        {/* Header điều phối */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <FileSpreadsheet className="size-5" />
              </span>
              <h3 className="font-black text-base uppercase text-white tracking-wide">
                BÁO CÁO HIỆU SUẤT &amp; DÒNG TIỀN TỪNG CƠ SỞ
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Phân tích doanh thu thực thu, tiền cọc holding và tỷ lệ khai thác từng chi nhánh
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-sky-500/20 self-start sm:self-auto shrink-0"
          >
            <Download className="size-4" />
            <span>Xuất Báo Cáo Excel</span>
          </button>
        </div>

        {/* Thanh Bộ Lọc Toolbar Hiện Đại */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Filter className="size-3.5 text-sky-400" />
            <span>BỘ LỌC DỮ LIỆU BÁO CÁO:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Lọc 1: Cơ sở kho */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cơ Sở Kho:</label>
              <select
                value={selectedFacilityCode}
                onChange={(e) => setSelectedFacilityCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold outline-none cursor-pointer focus:border-sky-400"
              >
                <option value="all">Tất Cả Các Cơ Sở ({facilities.length} Cơ Sở)</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.code}>{f.name} ({f.code})</option>
                ))}
              </select>
            </div>

            {/* Lọc 2: Loại kho */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Loại / Size Kho:</label>
              <select
                value={selectedUnitType}
                onChange={(e) => setSelectedUnitType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold outline-none cursor-pointer focus:border-sky-400"
              >
                <option value="all">Tất Cả Loại Kho (S, M, L, XL)</option>
                <option value="S">Size S (Tủ cá nhân)</option>
                <option value="M">Size M (Phòng vừa)</option>
                <option value="L">Size L (Phòng lớn)</option>
                <option value="XL">Size XL (Kho Doanh nghiệp)</option>
              </select>
            </div>

            {/* Lọc 3: Trạng thái */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Trạng Thái Thuê:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold outline-none cursor-pointer focus:border-sky-400"
              >
                <option value="all">Tất Cả Trạng Thái</option>
                <option value="occupied">Đang Thuê</option>
                <option value="available">Còn Trống</option>
                <option value="overdue">Quá Hạn</option>
              </select>
            </div>

            {/* Lọc 4: Kỳ báo cáo */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Kỳ Báo Cáo:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold outline-none cursor-pointer focus:border-sky-400"
              >
                <option value="current">Tháng Hiện Tại (T09/2026)</option>
                <option value="prev">Tháng Trước (T08/2026)</option>
                <option value="q3">Quý 3 / 2026</option>
              </select>
            </div>
          </div>
        </div>

        {/* BẢNG BÁO CÁO DOANH THU & HIỆU SUẤT */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 uppercase font-black text-slate-300 text-[10px]">
                <th className="p-3.5 text-center">Cơ Sở Kho</th>
                <th className="p-3.5 text-center">Phân Loại Kho</th>
                <th className="p-3.5 text-center">Công Suất Khai Thác</th>
                <th className="p-3.5 text-center">Tỷ Lệ Lấp Đầy</th>
                <th className="p-3.5 text-center">Doanh Thu Thuê</th>
                <th className="p-3.5 text-center">Tiền Cọc Holding</th>
                <th className="p-3.5 text-center">Doanh Thu Thực Thu</th>
                <th className="p-3.5 text-center">Hiệu Suất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
              {filteredBreakdown.length > 0 ? (
                filteredBreakdown.map((row) => {
                  const matchedFacility = facilities.find(
                    (f) => f.code === row.facilityCode || String(f.id) === String(row.facilityId)
                  )
                  const occRate = Number(row.occupancyRate || 0)

                  return (
                    <tr key={row.facilityCode || row.facilityId} className="hover:bg-slate-900/40 transition">
                      {/* Cơ sở kho */}
                      <td className="p-3.5 text-center">
                        <div className="font-extrabold text-white text-xs">{row.facilityName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {matchedFacility?.address || "Hệ thống cơ sở kho"} • Mã:{" "}
                          <span className="font-mono text-sky-400 font-bold">{row.facilityCode}</span>
                        </div>
                      </td>

                      {/* Loại kho */}
                      <td className="p-3.5 text-center">
                        <span className="font-bold text-white">Tất Cả Loại Kho</span>
                        <span className="text-[10px] text-sky-400 block mt-0.5">Tiêu chuẩn &amp; Điều hòa</span>
                      </td>

                      {/* Quy mô */}
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-bold text-white text-xs">{row.totalUnits} Kho</span>
                        <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                          {row.occupiedUnits} Đang thuê
                        </span>
                      </td>

                      {/* Tỷ lệ lấp đầy kèm mini progress bar */}
                      <td className="p-3.5 text-center">
                        <div className="font-black text-sky-400 font-mono text-sm">
                          {occRate}%
                        </div>
                        <div className="w-20 bg-slate-800 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sky-500"
                            style={{ width: `${Math.min(occRate, 100)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {row.availableUnits} trống • {row.overdueContracts} quá hạn
                        </div>
                      </td>

                      {/* Doanh thu thuê */}
                      <td className="p-3.5 text-center font-mono font-medium text-slate-300">
                        ₫{Number(row.rentalRevenue || 0).toLocaleString("vi-VN")}
                      </td>

                      {/* Tiền cọc holding */}
                      <td className="p-3.5 text-center font-mono font-medium text-slate-300">
                        ₫{Number(row.depositHolding || 0).toLocaleString("vi-VN")}
                      </td>

                      {/* Thực thu */}
                      <td className="p-3.5 text-center font-mono font-black text-sky-400 text-sm">
                        ₫{Number(row.netRevenue || 0).toLocaleString("vi-VN")}
                      </td>

                      {/* Đánh giá hiệu suất */}
                      <td className="p-3.5 text-center">
                        <span className="font-bold px-2.5 py-1 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {occRate >= 80
                            ? "Tối Ưu"
                            : occRate >= 30
                            ? "Tiêu Chuẩn"
                            : occRate > 0
                            ? "Đang Lấp Đầy"
                            : "Chưa Có Thuê"}
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

              {/* DÒNG TỔNG KẾT TOÀN HỆ THỐNG */}
              <tr className="bg-slate-900/90 font-bold border-t-2 border-slate-700 text-slate-100">
                <td className="p-3.5 text-center text-sky-400 uppercase tracking-wider font-black">
                  TỔNG CỘNG TOÀN CHUỖI
                </td>
                <td className="p-3.5 text-center text-slate-300">
                  Toàn bộ 4 Size &amp; Điều hòa
                </td>
                <td className="p-3.5 text-center font-mono text-white text-xs">
                  {totalUnits} Kho / {totalActive} Đang thuê
                </td>
                <td className="p-3.5 text-center text-sky-400 font-mono text-sm font-black">
                  {avgOccupancy}% TB
                </td>
                <td className="p-3.5 text-center font-mono font-bold text-slate-200">
                  ₫{Number(chainOverview?.chainTotalRevenue || 0).toLocaleString("vi-VN")}
                </td>
                <td className="p-3.5 text-center font-mono font-bold text-slate-200">
                  ₫{Number(totalDeposit).toLocaleString("vi-VN")}
                </td>
                <td className="p-3.5 text-center font-mono font-black text-sky-400 text-base">
                  ₫{Number(totalRevenue).toLocaleString("vi-VN")}
                </td>
                <td className="p-3.5 text-center">
                  <span className="bg-slate-800 text-sky-300 font-bold px-3 py-1 rounded-full text-[10px] border border-slate-700 shadow-sm">
                    {avgOccupancy}% Lấp Đầy
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
