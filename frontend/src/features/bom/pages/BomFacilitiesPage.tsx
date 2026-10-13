import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Warehouse, X, ArrowLeft } from "lucide-react"
import { useBomContext } from "../context/BomContext"
import { type FacilityPerformance } from "../data/bomData"

export default function BomFacilitiesPage() {
  const navigate = useNavigate()
  const { facilities, setFacilities, chainOverview } = useBomContext()

  // Modal State
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<FacilityPerformance | null>(null)
  const [facilityTotalUnits, setFacilityTotalUnits] = useState<number>(0)
  const [facilityMultiplier, setFacilityMultiplier] = useState<number>(1.0)
  const [facilityNote, setFacilityNote] = useState<string>("")

  const handleOpenFacilityModal = (fac: FacilityPerformance) => {
    setSelectedFacility(fac)
    setFacilityTotalUnits(fac.totalUnits)
    setFacilityMultiplier(fac.priceMultiplier || 1.0)
    setFacilityNote(fac.note || "")
    setIsFacilityModalOpen(true)
  }

  const handleSaveFacilityModal = () => {
    if (!selectedFacility) return
    setFacilities((prev) =>
      prev.map((f) =>
        f.id === selectedFacility.id
          ? {
              ...f,
              totalUnits: facilityTotalUnits,
              priceMultiplier: facilityMultiplier,
              note: facilityNote,
            }
          : f
      )
    )
    toast.success(`Đã cập nhật thông số vận hành cho ${selectedFacility.name}`)
    setIsFacilityModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb quay về trang chủ BOM */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={() => navigate("/bom")}
          className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại Tổng Quan Điều Hành</span>
        </button>
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-lg">
          Module: Giám Sát &amp; Cơ Sở Kho
        </span>
      </div>

      {/* Bảng Giám Sát & Danh Sách Cơ Sở Kho Toàn Chuỗi */}
      <div className="bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-sky-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-white">
              <Warehouse className="size-4.5 text-sky-400" />
              <span>GIÁM SÁT HOẠT ĐỘNG VÀ CƠ SỞ KHO TOÀN CHUỖI</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Theo dõi sức chứa, tỷ lệ lấp đầy thực tế và cấu hình tham số {facilities.length} chi nhánh toàn hệ thống
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-semibold">Tháng báo cáo:</span>
            <select className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-bold bg-slate-900 text-white outline-none cursor-pointer focus:border-sky-400">
              <option value="09/2026">Tháng 09 / 2026</option>
              <option value="08/2026">Tháng 08 / 2026</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-black text-[10px]">
                <th className="py-3 px-4">CƠ SỞ KHO</th>
                <th className="py-3 px-4">QUẢN LÝ CHI NHÁNH</th>
                <th className="py-3 px-4 text-center">QUY MÔ KHO</th>
                <th className="py-3 px-4 text-center">TỶ LỆ LẤP ĐẦY</th>
                <th className="py-3 px-4 text-center">DOANH THU THỰC THU</th>
                <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                <th className="py-3 px-4 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
              {facilities.length > 0 ? (
                facilities.map((fac) => {
                  const bdItem = (chainOverview?.facilityBreakdown || []).find((b) => String(b.facilityId) === String(fac.id))
                  const overdueCount = bdItem?.overdueContracts || 0

                  return (
                    <tr key={fac.id} className="hover:bg-slate-900/60 transition">
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-white text-xs flex items-center gap-2">
                          <span>{fac.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            {fac.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{fac.address}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-xs">{fac.managerName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{fac.managerEmail || fac.managerPhone}</div>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-200">
                        {fac.totalUnits} Kho
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-black text-emerald-400 text-sm">
                          {fac.occupancyRate ?? (fac.totalUnits > 0 ? Math.round(((fac.rentedUnits || 0) / fac.totalUnits) * 100) : 0)}%
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {fac.occupied ?? fac.rentedUnits}/{fac.totalUnits} đang thuê
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-black text-sky-400 font-mono text-xs">
                        {fac.monthlyRevenue}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`font-semibold px-3 py-1 rounded-full text-[10px] inline-block ${
                            overdueCount > 0
                              ? "bg-rose-950/60 text-rose-300 border border-rose-800/40"
                              : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                          }`}
                        >
                          {overdueCount > 0 ? `${overdueCount} Đơn quá hạn` : "Hoạt động chuẩn"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleOpenFacilityModal(fac)}
                          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-full shadow-xs transition cursor-pointer"
                        >
                          Cấu hình
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Đang tải dữ liệu cơ sở từ hệ thống...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CẤU HÌNH CƠ SỞ KHO */}
      {isFacilityModalOpen && selectedFacility && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-sky-400">
                  CHI TIẾT CẤU HÌNH CƠ SỞ KHO
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  Cơ sở {selectedFacility.name} • Mã: {selectedFacility.code}
                </p>
              </div>
              <button
                onClick={() => setIsFacilityModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-900 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-black flex items-center justify-center text-sm">
                  FM
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Quản Lý Cơ Sở (Manager):</span>
                  <span className="font-extrabold text-sky-200 text-sm">
                    {selectedFacility.managerName}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Tổng Số Ô Kho Thiết Lập:
                  </label>
                  <input
                    type="number"
                    value={facilityTotalUnits}
                    onChange={(e) => setFacilityTotalUnits(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Hệ Số Giá Cơ Sở (Multiplier):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={facilityMultiplier}
                    onChange={(e) => setFacilityMultiplier(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Ghi Chú Vận Hành BOM:
                </label>
                <textarea
                  rows={3}
                  value={facilityNote}
                  onChange={(e) => setFacilityNote(e.target.value)}
                  placeholder="Nhập ghi chú hoặc điều chỉnh chiến lược vận hành..."
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-semibold text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsFacilityModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 font-bold text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleSaveFacilityModal}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
