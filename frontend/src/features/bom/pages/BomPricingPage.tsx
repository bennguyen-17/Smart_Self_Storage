import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  SlidersHorizontal,
  Plus,
  Edit3,
  Search,
  CheckCircle,
  X,
  ArrowLeft,
} from "lucide-react"
import { useBomContext } from "../context/BomContext"
import { type UnitPricing, type SurchargeItem } from "../data/bomData"

export default function BomPricingPage() {
  const navigate = useNavigate()
  const { pricingList, setPricingList, surcharges, setSurcharges } = useBomContext()

  // Search & Filter state for surcharges
  const [searchSurcharge, setSearchSurcharge] = useState("")
  const [surchargeFilter, setSurchargeFilter] = useState<"all" | "surcharge" | "penalty" | "discount">("all")

  // Modal 1: Pricing edit modal
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  const [selectedPricingItem, setSelectedPricingItem] = useState<UnitPricing | null>(null)
  const [editNormPrice, setEditNormPrice] = useState<number>(0)
  const [editAcPrice, setEditAcPrice] = useState<number>(0)
  const [editDeposit, setEditDeposit] = useState<string>("1 Tháng Tiền Thuê")

  // Modal 2: Surcharge modal
  const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false)
  const [surchargeCat, setSurchargeCat] = useState<"surcharge" | "penalty" | "discount">("surcharge")
  const [surchargeName, setSurchargeName] = useState("")
  const [surchargeRate, setSurchargeRate] = useState("")
  const [surchargeNote, setSurchargeNote] = useState("")

  const filteredSurcharges = useMemo(() => {
    return surcharges.filter((item) => {
      const matchFilter = surchargeFilter === "all" || item.category === surchargeFilter
      const matchSearch =
        item.name.toLowerCase().includes(searchSurcharge.toLowerCase()) ||
        item.type.toLowerCase().includes(searchSurcharge.toLowerCase()) ||
        item.note.toLowerCase().includes(searchSurcharge.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [surcharges, surchargeFilter, searchSurcharge])

  const handleOpenPricingModal = (item?: UnitPricing) => {
    const target = item || pricingList[0]
    if (!target) return
    setSelectedPricingItem(target)
    setEditNormPrice(target.normPrice)
    setEditAcPrice(target.acPrice)
    setEditDeposit(target.depositText)
    setIsPricingModalOpen(true)
  }

  const handleSavePricingModal = () => {
    if (!selectedPricingItem) return
    setPricingList((prev) =>
      prev.map((p) =>
        p.id === selectedPricingItem.id
          ? {
              ...p,
              normPrice: editNormPrice,
              acPrice: editAcPrice,
              depositText: editDeposit,
            }
          : p
      )
    )
    toast.success(`Đã cập nhật khung giá chuẩn cho ${selectedPricingItem.name}`)
    setIsPricingModalOpen(false)
  }

  const handleSaveSurcharge = (e: React.FormEvent) => {
    e.preventDefault()
    if (!surchargeName || !surchargeRate) {
      toast.error("Vui lòng điền đầy đủ tên và mức phí áp dụng!")
      return
    }

    const categoryLabels = {
      surcharge: "1. Biểu Phí Phụ Thu (Surcharges)",
      penalty: "2. Phí Phạt Quá Hạn (Penalties)",
      discount: "3. Chính Sách Miễn Giảm Giá (Discounts)",
    }

    const typeLabels = {
      surcharge: "Phụ Thu Dịch Vụ",
      penalty: "Chế Tài / Phạt Hợp Đồng",
      discount: "Ưu Đãi / Khuyến Mãi",
    }

    const newItem: SurchargeItem = {
      id: `sc-${Date.now()}`,
      category: surchargeCat,
      categoryLabel: categoryLabels[surchargeCat],
      type: typeLabels[surchargeCat],
      name: surchargeName,
      rate: surchargeRate,
      isActive: true,
      note: surchargeNote || "Áp dụng theo quy chuẩn vận hành BOM",
    }

    setSurcharges((prev) => [newItem, ...prev])
    toast.success("Đã thêm hạng mục phụ thu / giảm giá thành công!")
    setIsSurchargeModalOpen(false)
    setSurchargeName("")
    setSurchargeRate("")
    setSurchargeNote("")
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
          Module: Khung Giá &amp; Phụ Phí
        </span>
      </div>

      {/* Bảng Quản Lý Khung Giá & Phụ Phí */}
      <div className="bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-sky-500/20 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-white">
              <SlidersHorizontal className="size-4.5 text-sky-400" />
              <span>QUẢN LÝ KHUNG GIÁ THUÊ, PHÍ PHỤ THU, PHÍ PHẠT QUÁ HẠN &amp; GIẢM GIÁ</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Áp dụng toàn bộ hệ thống cơ sở kho</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSurchargeModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-4 text-sky-400" />
              <span>Thêm Phụ Thu / Giảm Giá</span>
            </button>
            <button
              onClick={() => handleOpenPricingModal()}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.3)] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="size-4" />
              <span>Cập Nhật Bảng Giá &amp; Phí</span>
            </button>
          </div>
        </div>

        {/* 1. Bảng Khung Giá Thuê Tiêu Chuẩn */}
        <div className="space-y-2">
          <h4 className="font-black text-xs uppercase text-slate-200">
            1. Khung Giá Thuê Tiêu Chuẩn Theo Size Kho (Base Rental Pricing Matrix)
          </h4>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 uppercase font-black text-slate-300 text-[10px]">
                  <th className="p-3.5">Loại / Size Kho</th>
                  <th className="p-3.5 text-center">Kích Thước Sàn</th>
                  <th className="p-3.5 text-right">Kho Thường (Non-AC)</th>
                  <th className="p-3.5 text-right">Kho Điều Hòa (AC 22-24°C)</th>
                  <th className="p-3.5 text-center">Mức Cọc Yêu Cầu</th>
                  <th className="p-3.5 text-center">Trạng Thái Bảng Giá</th>
                  <th className="p-3.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
                {pricingList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5">
                      <div className="font-extrabold text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400">{item.description}</div>
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      <span className="font-bold text-white">{item.dimensions}</span>
                      <span className="text-slate-400 block text-[10px]">({item.area})</span>
                    </td>
                    <td className="p-3.5 text-right font-black font-mono text-emerald-400 text-sm">
                      ₫{item.normPrice.toLocaleString("vi-VN")} / tháng
                    </td>
                    <td className="p-3.5 text-right font-black font-mono text-sky-400 text-sm">
                      ₫{item.acPrice.toLocaleString("vi-VN")} / tháng
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-300">
                      {item.depositText}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="bg-emerald-950/80 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-800">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleOpenPricingModal(item)}
                        className="text-sky-400 font-black hover:underline cursor-pointer"
                      >
                        Sửa Giá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Biểu Phí Phụ Thu, Phạt & Giảm Giá */}
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-black text-xs uppercase text-slate-200">
                2. Biểu Phí Phụ Thu, Phí Phạt Quá Hạn &amp; Chính Sách Miễn Giảm Giá
              </h4>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="size-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phụ thu, phí phạt..."
                  value={searchSurcharge}
                  onChange={(e) => setSearchSurcharge(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-bold text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            {(["all", "surcharge", "penalty", "discount"] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setSurchargeFilter(filterKey)}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer border ${
                  surchargeFilter === filterKey
                    ? "bg-sky-500 text-slate-950 border-sky-500 font-black"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {filterKey === "all"
                  ? "Tất Cả Hạng Mục"
                  : filterKey === "surcharge"
                  ? "Biểu Phí Phụ Thu"
                  : filterKey === "penalty"
                  ? "Phí Phạt Quá Hạn"
                  : "Chính Sách Miễn Giảm"}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 uppercase font-black text-slate-300 text-[10px]">
                  <th className="p-3">Phân Loại Hạng Mục Phí / Chính Sách</th>
                  <th className="p-3">Nội Dung Chi Tiết / Tên Hạng Mục</th>
                  <th className="p-3">Mức Phí / Mức Áp Dụng</th>
                  <th className="p-3 text-center">Kích Hoạt</th>
                  <th className="p-3">Ghi Chú Vận Hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
                {filteredSurcharges.map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3">
                      <span className="font-bold text-slate-400 text-[11px] block">{sc.categoryLabel}</span>
                      <span className="font-bold text-sky-400">{sc.type}</span>
                    </td>
                    <td className="p-3 font-extrabold text-white">{sc.name}</td>
                    <td className="p-3 font-black font-mono text-emerald-400">{sc.rate}</td>
                    <td className="p-3 text-center">
                      <CheckCircle className="size-4 text-emerald-400 mx-auto" />
                    </td>
                    <td className="p-3 text-slate-400 text-xs">{sc.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: CHỈNH SỬA BẢNG GIÁ SIZE S/M/L/XL */}
      {isPricingModalOpen && selectedPricingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-sky-400">
                  CẬP NHẬT BIỂU GIÁ KHO {selectedPricingItem.name}
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  Kích thước sàn: {selectedPricingItem.dimensions} ({selectedPricingItem.area})
                </p>
              </div>
              <button
                onClick={() => setIsPricingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Giá Kho Thường (Non-AC):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editNormPrice}
                      onChange={(e) => setEditNormPrice(Number(e.target.value))}
                      className="w-full p-2.5 pr-12 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">VNĐ/tháng</span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Giá Kho Điều Hòa (AC 22-24°C):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editAcPrice}
                      onChange={(e) => setEditAcPrice(Number(e.target.value))}
                      className="w-full p-2.5 pr-12 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">VNĐ/tháng</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Quy Định Tiền Cọc Mặc Định:
                </label>
                <select
                  value={editDeposit}
                  onChange={(e) => setEditDeposit(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white"
                >
                  <option value="1 Tháng Tiền Thuê">1 Tháng Tiền Thuê Kho</option>
                  <option value="2 Tháng Tiền Thuê">2 Tháng Tiền Thuê Kho</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsPricingModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 font-bold text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleSavePricingModal}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: THÊM HẠNG MỤC PHỤ THU / GIẢM GIÁ */}
      {isSurchargeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSurcharge}
            className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150 text-white"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-sky-400">
                  CẤU HÌNH HẠNG MỤC PHÍ PHỤ THU / GIẢM GIÁ
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  Thêm mới hoặc cập nhật biểu phí, phụ thu &amp; chính sách ưu đãi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSurchargeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Nhóm Phân Loại Hạng Mục:
                </label>
                <select
                  value={surchargeCat}
                  onChange={(e) => setSurchargeCat(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white"
                >
                  <option value="surcharge">1. Biểu Phí Phụ Thu (Surcharges)</option>
                  <option value="penalty">2. Phí Phạt Quá Hạn (Penalties)</option>
                  <option value="discount">3. Chính Sách Miễn Giảm Giá (Discount Policy)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Nội Dung Chi Tiết / Tên Hạng Mục Phí:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phí Điện Kho Lạnh 24/7"
                  value={surchargeName}
                  onChange={(e) => setSurchargeName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Mức Phí / Giá Trị Áp Dụng:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: ₫300,000 / tháng hoặc 1.5% / ngày"
                  value={surchargeRate}
                  onChange={(e) => setSurchargeRate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Ghi Chú Vận Hành &amp; Điều Khoản Áp Dụng:
                </label>
                <textarea
                  rows={2}
                  value={surchargeNote}
                  onChange={(e) => setSurchargeNote(e.target.value)}
                  placeholder="Áp dụng mặc định cho các ô kho có điều hòa AC..."
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-semibold text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSurchargeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 font-bold text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer"
              >
                Lưu Hạng Mục
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
