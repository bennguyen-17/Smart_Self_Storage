import { useState, useMemo } from "react"
import { createPortal } from "react-dom"
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
  Trash2,
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
  const [editDailyPrice, setEditDailyPrice] = useState<number>(30000)
  const [editNormPrice, setEditNormPrice] = useState<number>(600000)
  const [editAcPrice, setEditAcPrice] = useState<number>(720000)
  const [editDepositAmount, setEditDepositAmount] = useState<number>(500000)

  // Modal 2: Surcharge add/edit modal
  const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false)
  const [editingSurcharge, setEditingSurcharge] = useState<SurchargeItem | null>(null)
  const [surchargeCat, setSurchargeCat] = useState<"surcharge" | "penalty" | "discount">("surcharge")
  const [surchargeName, setSurchargeName] = useState("")
  const [surchargeRate, setSurchargeRate] = useState("")

  const filteredSurcharges = useMemo(() => {
    return surcharges.filter((item) => {
      const matchFilter = surchargeFilter === "all" || item.category === surchargeFilter
      const matchSearch =
        item.name.toLowerCase().includes(searchSurcharge.toLowerCase()) ||
        item.rate.toLowerCase().includes(searchSurcharge.toLowerCase()) ||
        item.type.toLowerCase().includes(searchSurcharge.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [surcharges, surchargeFilter, searchSurcharge])

  const handleOpenPricingModal = (item?: UnitPricing) => {
    const target = item || pricingList[0]
    if (!target) return
    setSelectedPricingItem(target)
    setEditDailyPrice(target.dailyPrice)
    setEditNormPrice(target.normPrice)
    setEditAcPrice(target.acPrice)
    setEditDepositAmount(target.depositAmount)
    setIsPricingModalOpen(true)
  }

  const handleSavePricingModal = () => {
    if (!selectedPricingItem) return
    setPricingList((prev) =>
      prev.map((p) =>
        p.id === selectedPricingItem.id
          ? {
              ...p,
              dailyPrice: editDailyPrice,
              normPrice: editNormPrice,
              acPrice: editAcPrice,
              depositAmount: editDepositAmount,
              depositText: `₫${editDepositAmount.toLocaleString("vi-VN")}`,
            }
          : p
      )
    )
    toast.success(`Đã cập nhật khung giá & mức cọc chuẩn cho ${selectedPricingItem.name}`)
    setIsPricingModalOpen(false)
  }

  const handleOpenAddSurcharge = () => {
    setEditingSurcharge(null)
    setSurchargeCat("surcharge")
    setSurchargeName("")
    setSurchargeRate("")
    setIsSurchargeModalOpen(true)
  }

  const handleOpenEditSurcharge = (item: SurchargeItem) => {
    setEditingSurcharge(item)
    setSurchargeCat(item.category)
    setSurchargeName(item.name)
    setSurchargeRate(item.rate)
    setIsSurchargeModalOpen(true)
  }

  const handleDeleteSurcharge = (id: string) => {
    setSurcharges((prev) => prev.filter((sc) => sc.id !== id))
    toast.success("Đã xóa khoản phí thành công!")
    setIsSurchargeModalOpen(false)
    setEditingSurcharge(null)
  }

  const handleSaveSurcharge = (e: React.FormEvent) => {
    e.preventDefault()
    if (!surchargeName.trim() || !surchargeRate.trim()) {
      toast.error("Vui lòng điền đầy đủ tên và mức phí áp dụng!")
      return
    }

    const categoryLabels = {
      surcharge: "Biểu Phí Phụ Thu (Surcharges)",
      penalty: "Phí Phạt Quá Hạn (Penalties & Overdue Fees)",
      discount: "Chính Sách Miễn Giảm Giá (Discount Policy)",
    }

    const typeLabels = {
      surcharge: "Phụ Thu Dịch Vụ",
      penalty: "Chế Tài / Phạt Hợp Đồng",
      discount: "Ưu Đãi / Khuyến Mãi",
    }

    if (editingSurcharge) {
      setSurcharges((prev) =>
        prev.map((sc) =>
          sc.id === editingSurcharge.id
            ? {
                ...sc,
                category: surchargeCat,
                categoryLabel: categoryLabels[surchargeCat],
                type: typeLabels[surchargeCat],
                name: surchargeName.trim(),
                rate: surchargeRate.trim(),
              }
            : sc
        )
      )
      toast.success(`Đã cập nhật biểu phí "${surchargeName.trim()}"!`)
    } else {
      const newItem: SurchargeItem = {
        id: `sc-${Date.now()}`,
        category: surchargeCat,
        categoryLabel: categoryLabels[surchargeCat],
        type: typeLabels[surchargeCat],
        name: surchargeName.trim(),
        rate: surchargeRate.trim(),
        isActive: true,
        note: "",
      }
      setSurcharges((prev) => [newItem, ...prev])
      toast.success("Đã thêm hạng mục biểu phí thành công!")
    }

    setIsSurchargeModalOpen(false)
    setEditingSurcharge(null)
    setSurchargeName("")
    setSurchargeRate("")
  }

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
              onClick={handleOpenAddSurcharge}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-black text-xs uppercase text-slate-200">
                1. Khung Giá Thuê Tiêu Chuẩn &amp; Mức Cọc Chuẩn Theo 4 Size Kho
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chiều cao cố định 2.0m. Kho Điều hòa / Mát (22°C–25°C) tự động cộng 20% vào đơn giá thuê.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 uppercase font-black text-slate-300 text-[10px]">
                  <th className="p-3.5">Kích Thước / Size Kho</th>
                  <th className="p-3.5 text-center">Quy Cách Sàn</th>
                  <th className="p-3.5 text-right">Giá Ngày (Non-AC)</th>
                  <th className="p-3.5 text-right">Kho Thường (Tháng)</th>
                  <th className="p-3.5 text-right">Kho Điều Hòa (+20%)</th>
                  <th className="p-3.5 text-center">Tiền Cọc Chuẩn</th>
                  <th className="p-3.5 text-center">Trạng Thái</th>
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
                      <span className="text-slate-400 block text-[10px]">({item.area} • Cao {item.height || "2.0m"})</span>
                    </td>
                    <td className="p-3.5 text-right font-black font-mono text-amber-400 text-sm">
                      ₫{item.dailyPrice.toLocaleString("vi-VN")} <span className="text-[10px] text-slate-400 font-sans">/ngày</span>
                    </td>
                    <td className="p-3.5 text-right font-black font-mono text-emerald-400 text-sm">
                      ₫{item.normPrice.toLocaleString("vi-VN")} <span className="text-[10px] text-slate-400 font-sans">/tháng</span>
                    </td>
                    <td className="p-3.5 text-right font-black font-mono text-sky-400 text-sm">
                      ₫{item.acPrice.toLocaleString("vi-VN")} <span className="text-[10px] text-slate-400 font-sans">/tháng</span>
                      <span className="block text-[10px] text-sky-400/80 font-sans">
                        (₫{Math.round(item.dailyPrice * 1.2).toLocaleString("vi-VN")}/ngày)
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-block px-3 py-1 rounded-xl bg-violet-950/80 border border-violet-700/60 font-black font-mono text-violet-300 text-xs shadow-sm">
                        ₫{item.depositAmount.toLocaleString("vi-VN")}
                      </span>
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
                        Sửa Giá &amp; Cọc
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
              <p className="text-[11px] text-slate-400 mt-0.5">
                Quy định mức thu dịch vụ bổ sung, chế tài trễ hạn và các ưu đãi thanh toán
              </p>
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
                  <th className="p-3.5">Nội Dung Khoản Phí</th>
                  <th className="p-3.5">Phân Loại</th>
                  <th className="p-3.5 text-right">Mức Phí Áp Dụng</th>
                  <th className="p-3.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
                {filteredSurcharges.map((sc) => {
                  const badgeConfig = {
                    surcharge: { label: "Phụ Thu Dịch Vụ", style: "bg-sky-950/80 text-sky-400 border-sky-800" },
                    penalty: { label: "Phí Phạt Quá Hạn", style: "bg-amber-950/80 text-amber-400 border-amber-800" },
                    discount: { label: "Chính Sách Miễn Giảm", style: "bg-emerald-950/80 text-emerald-400 border-emerald-800" },
                  }[sc.category] || { label: "Khác", style: "bg-slate-800 text-slate-300 border-slate-700" }

                  return (
                    <tr key={sc.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3.5">
                        <div className="font-extrabold text-white text-sm">{sc.name}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeConfig.style}`}>
                          {badgeConfig.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black font-mono text-emerald-400 text-sm">
                        {sc.rate}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSurcharge(sc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-slate-950 border border-sky-500/30 font-bold transition cursor-pointer text-xs"
                        >
                          <Edit3 className="size-3.5" />
                          <span>Chỉnh Sửa</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredSurcharges.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-bold">
                      Không tìm thấy biểu phí hoặc phụ thu nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: CHỈNH SỬA BẢNG GIÁ SIZE S/M/L/XL - PORTAL RA BODY TRÁNH TRỒI LỆCH MÀN HÌNH */}
      {isPricingModalOpen && selectedPricingItem && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150 text-white my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-sky-400">
                  CẬP NHẬT BIỂU GIÁ &amp; MỨC CỌC CHUẨN - {selectedPricingItem.name}
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  Kích thước sàn: {selectedPricingItem.dimensions} ({selectedPricingItem.area} • Cao {selectedPricingItem.height || "2.0m"})
                </p>
              </div>
              <button
                onClick={() => setIsPricingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* TAB CHỌN SIZE KHO ĐỂ CHUYỂN ĐỔI TIỆN LỢI */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              {pricingList.map((p) => {
                const isCurrent = selectedPricingItem.id === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPricingItem(p)
                      setEditDailyPrice(p.dailyPrice)
                      setEditNormPrice(p.normPrice)
                      setEditAcPrice(p.acPrice)
                      setEditDepositAmount(p.depositAmount)
                    }}
                    className={`flex-1 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${
                      isCurrent
                        ? "bg-sky-500 text-slate-950 shadow-md"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    Size {p.size}
                  </button>
                )
              })}
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Giá Thuê Theo Ngày (Non-AC):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editDailyPrice}
                      onChange={(e) => setEditDailyPrice(Number(e.target.value))}
                      className="w-full p-2.5 pr-14 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">VNĐ/ngày</span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Giá Thuê Tháng (Kho Thường):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editNormPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setEditNormPrice(val)
                        setEditAcPrice(Math.round(val * 1.2))
                      }}
                      className="w-full p-2.5 pr-14 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">VNĐ/tháng</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-400 uppercase text-[10px]">
                      Kho Điều Hòa (22°C–25°C):
                    </label>
                    <span className="text-[10px] text-sky-400 font-bold">+20%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={editAcPrice}
                      onChange={(e) => setEditAcPrice(Number(e.target.value))}
                      className="w-full p-2.5 pr-14 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">VNĐ/tháng</span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Mức Tiền Cọc Chuẩn:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editDepositAmount}
                      onChange={(e) => setEditDepositAmount(Number(e.target.value))}
                      className="w-full p-2.5 pr-12 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">VNĐ</span>
                  </div>
                </div>
              </div>

              {/* Nút chọn nhanh mức cọc chuẩn */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-bold mr-1">Mức cọc mẫu:</span>
                {[
                  { label: "500k (Size S)", val: 500000 },
                  { label: "1tr (Size M)", val: 1000000 },
                  { label: "2tr (Size L)", val: 2000000 },
                  { label: "3tr (Size XL)", val: 3000000 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setEditDepositAmount(preset.val)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      editDepositAmount === preset.val
                        ? "bg-violet-600 text-white border-violet-500 font-black shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
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
        </div>,
        document.body
      )}

      {/* MODAL 2: THÊM / CHỈNH SỬA HẠNG MỤC PHỤ THU & PHÍ PHẠT - PORTAL RA BODY */}
      {isSurchargeModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveSurcharge}
            className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-white my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-sky-400">
                  {editingSurcharge ? "CẬP NHẬT BIỂU PHÍ & PHỤ THU" : "THÊM PHỤ THU / BIỂU PHÍ MỚI"}
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  {editingSurcharge
                    ? `Chỉnh sửa mức phí cho "${editingSurcharge.name}"`
                    : "Thiết lập biểu phí phụ thu hoặc chế tài trễ hạn mới"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSurchargeModalOpen(false)
                  setEditingSurcharge(null)
                }}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Nhóm Phân Loại:
                </label>
                <select
                  value={surchargeCat}
                  onChange={(e) => setSurchargeCat(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                >
                  <option value="surcharge">1. Biểu Phí Phụ Thu (Surcharges)</option>
                  <option value="penalty">2. Phí Phạt Quá Hạn (Penalties)</option>
                  <option value="discount">3. Chính Sách Miễn Giảm Giá (Discount Policy)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Tên Khoản Phí / Nội Dung:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phí Điện Kho Lạnh 24/7"
                  value={surchargeName}
                  onChange={(e) => setSurchargeName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
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
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {editingSurcharge ? (
                <button
                  type="button"
                  onClick={() => handleDeleteSurcharge(editingSurcharge.id)}
                  className="px-3.5 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  <span>Xóa Phí</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSurchargeModalOpen(false)
                    setEditingSurcharge(null)
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-700 font-bold text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer"
                >
                  {editingSurcharge ? "Lưu Thay Đổi" : "Lưu Hạng Mục"}
                </button>
              </div>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  )
}
