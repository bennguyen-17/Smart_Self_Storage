import { useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Warehouse, X, ArrowLeft, Plus, Trash2, AlertTriangle } from "lucide-react"
import { useBomContext } from "../context/BomContext"
import { type FacilityPerformance } from "../data/bomData"

export default function BomFacilitiesPage() {
  const navigate = useNavigate()
  const { facilities, setFacilities, chainOverview } = useBomContext()

  // Modal State Cấu hình cơ sở
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<FacilityPerformance | null>(null)
  const [facilityTotalUnits, setFacilityTotalUnits] = useState<number>(0)
  const [facilityMultiplier, setFacilityMultiplier] = useState<number>(1.0)

  // Modal State Thêm cơ sở kho mới
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false)
  const [newFacName, setNewFacName] = useState("")
  const [newFacCode, setNewFacCode] = useState("")
  const [newFacAddress, setNewFacAddress] = useState("")
  const [newFacManager, setNewFacManager] = useState("")
  const [newFacPhone, setNewFacPhone] = useState("")
  const [newFacUnits, setNewFacUnits] = useState(20)
  const [newFacMultiplier, setNewFacMultiplier] = useState(1.0)

  // Modal State Xóa cơ sở kho
  const [facilityToDelete, setFacilityToDelete] = useState<FacilityPerformance | null>(null)

  const handleOpenFacilityModal = (fac: FacilityPerformance) => {
    setSelectedFacility(fac)
    setFacilityTotalUnits(fac.totalUnits)
    setFacilityMultiplier(fac.priceMultiplier || 1.0)
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
            }
          : f
      )
    )
    toast.success(`Đã cập nhật thông số vận hành cho ${selectedFacility.name}`)
    setIsFacilityModalOpen(false)
  }

  const handleCreateFacility = () => {
    if (!newFacName.trim() || !newFacCode.trim() || !newFacAddress.trim()) {
      toast.error("Vui lòng nhập đầy đủ tên, mã cơ sở và địa chỉ!")
      return
    }

    const newFacility: FacilityPerformance = {
      id: Date.now(),
      name: newFacName.trim(),
      code: newFacCode.trim().toUpperCase(),
      address: newFacAddress.trim(),
      managerName: newFacManager.trim() || "Chưa phân công",
      managerEmail: "manager@smartstorage.vn",
      managerPhone: newFacPhone.trim() || "0900000000",
      totalUnits: Number(newFacUnits) || 20,
      occupied: 0,
      rentedUnits: 0,
      available: Number(newFacUnits) || 20,
      maintenance: 0,
      occupancyRate: 0,
      floorArea: (Number(newFacUnits) || 20) * 12,
      monthlyRevenue: "đ0",
      overdueUnits: 0,
      status: "ACTIVE",
      rating: "5.0 ★",
      priceMultiplier: Number(newFacMultiplier) || 1.0,
    }

    setFacilities((prev) => [newFacility, ...prev])
    toast.success(`Đã thêm thành công cơ sở kho mới: ${newFacility.name}`)

    // Reset form
    setNewFacName("")
    setNewFacCode("")
    setNewFacAddress("")
    setNewFacManager("")
    setNewFacPhone("")
    setNewFacUnits(20)
    setNewFacMultiplier(1.0)
    setIsAddFacilityModalOpen(false)
  }

  const handleConfirmDelete = () => {
    if (!facilityToDelete) return
    setFacilities((prev) => prev.filter((f) => f.id !== facilityToDelete.id))
    toast.success(`Đã xóa cơ sở kho: ${facilityToDelete.name}`)
    setFacilityToDelete(null)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb quay về trang chủ BOM (Đã bỏ badge Module theo yêu cầu) */}
      <div className="flex items-center pb-1">
        <button
          onClick={() => navigate("/bom")}
          className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại Tổng Quan Điều Hành</span>
        </button>
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
          {/* NÚT THÊM CƠ SỞ KHO MỚI THAY THẾ CHO THÁNG BÁO CÁO */}
          <button
            onClick={() => setIsAddFacilityModalOpen(true)}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/20 shrink-0"
          >
            <Plus className="size-4" />
            <span>Thêm Cơ Sở Kho Mới</span>
          </button>
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
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenFacilityModal(fac)}
                            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                            title="Cấu hình cơ sở"
                          >
                            Cấu hình
                          </button>
                          <button
                            onClick={() => setFacilityToDelete(fac)}
                            className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition cursor-pointer"
                            title="Xóa cơ sở kho"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
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

      {/* MODAL 1: CẤU HÌNH CƠ SỞ KHO - PORTAL RA BODY */}
      {isFacilityModalOpen && selectedFacility && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150 text-white my-auto">
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
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
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
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                  />
                </div>
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
        </div>,
        document.body
      )}

      {/* MODAL 2: THÊM CƠ SỞ KHO MỚI - PORTAL RA BODY */}
      {isAddFacilityModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-white my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-sky-400 flex items-center gap-2">
                  <Plus className="size-4" />
                  <span>THÊM CƠ SỞ KHO MỚI TOÀN HỆ THỐNG</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Thiết lập chi nhánh lưu trữ thông minh mới do BOM phê duyệt
                </p>
              </div>
              <button
                onClick={() => setIsAddFacilityModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Tên Cơ Sở Kho <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    value={newFacName}
                    onChange={(e) => setNewFacName(e.target.value)}
                    placeholder="VD: SmartStorage Bình Thạnh"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Mã Code <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    value={newFacCode}
                    onChange={(e) => setNewFacCode(e.target.value)}
                    placeholder="HCM-04"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Địa Chỉ Chi Nhánh <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  value={newFacAddress}
                  onChange={(e) => setNewFacAddress(e.target.value)}
                  placeholder="VD: Số 12 Ung Văn Khiêm, P. 25, Q. Bình Thạnh, TP.HCM"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-semibold text-xs text-white outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Quản Lý Phụ Trách:
                  </label>
                  <input
                    type="text"
                    value={newFacManager}
                    onChange={(e) => setNewFacManager(e.target.value)}
                    placeholder="VD: Nguyễn Văn Quản Lý"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-semibold text-xs text-white outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Số Điện Thoại Liên Hệ:
                  </label>
                  <input
                    type="text"
                    value={newFacPhone}
                    onChange={(e) => setNewFacPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-semibold text-xs text-white outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Quy Mô Số Kho Khởi Tạo:
                  </label>
                  <input
                    type="number"
                    value={newFacUnits}
                    onChange={(e) => setNewFacUnits(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Hệ Số Giá Khu Vực:
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={newFacMultiplier}
                    onChange={(e) => setNewFacMultiplier(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAddFacilityModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 font-bold text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleCreateFacility}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="size-4" />
                <span>Lưu &amp; Kích Hoạt Cơ Sở</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: XÁC NHẬN XÓA CƠ SỞ KHO - PORTAL RA BODY */}
      {facilityToDelete && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl border border-rose-500/30 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-white my-auto">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                <AlertTriangle className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm uppercase text-white">
                  Xác Nhận Xóa Cơ Sở Kho?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bạn có chắc chắn muốn xóa cơ sở <span className="font-bold text-rose-400">{facilityToDelete.name}</span> ({facilityToDelete.code}) khỏi chuỗi vận hành?
                </p>
                <p className="text-[11px] text-slate-400 italic">
                  Hành động này được cấp quyền bởi Ban Điều Hành (BOM).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setFacilityToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 font-bold text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="size-4" />
                <span>Xác Nhận Xóa Vĩnh Viễn</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
