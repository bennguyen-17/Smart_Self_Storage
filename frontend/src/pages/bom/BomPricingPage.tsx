import { useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import {
  SlidersHorizontal,
  Plus,
  Edit3,
  Search,
  CheckCircle,
  X,
  Trash2,
  LayoutGrid,
  Table,
  Snowflake,
  ShieldCheck,
  Tag,
  Sparkles,
} from "lucide-react"
import { useBomContext } from "@/pages/bom/context/BomContext"
import { type UnitPricing, type SurchargeItem } from "@/pages/bom/data/bomData"

const SIZE_THEMES: Record<string, { badge: string; border: string; glow: string; text: string; lightBg: string }> = {
  S: {
    badge: "bg-slate-800 text-sky-300 border-slate-700",
    border: "border-slate-800 hover:border-slate-700",
    glow: "from-slate-700/20",
    text: "text-white",
    lightBg: "bg-slate-900/60",
  },
  M: {
    badge: "bg-slate-800 text-sky-300 border-slate-700",
    border: "border-slate-800 hover:border-slate-700",
    glow: "from-slate-700/20",
    text: "text-white",
    lightBg: "bg-slate-900/60",
  },
  L: {
    badge: "bg-slate-800 text-sky-300 border-slate-700",
    border: "border-slate-800 hover:border-slate-700",
    glow: "from-slate-700/20",
    text: "text-white",
    lightBg: "bg-slate-900/60",
  },
  XL: {
    badge: "bg-slate-800 text-sky-300 border-slate-700",
    border: "border-slate-800 hover:border-slate-700",
    glow: "from-slate-700/20",
    text: "text-white",
    lightBg: "bg-slate-900/60",
  },
}

export default function BomPricingPage() {
  const { pricingList, setPricingList, surcharges, setSurcharges, updatePricingInDb } = useBomContext()

  // View mode: cards (thẻ trực quan) hoặc table (bảng đối soát)
  const [pricingViewMode, setPricingViewMode] = useState<"cards" | "table">("cards")

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

  const handleSavePricingModal = async () => {
    if (!selectedPricingItem) return
    const unitTypeId = selectedPricingItem.unitTypeId || (
      selectedPricingItem.size === "S" ? 1 :
      selectedPricingItem.size === "M" ? 2 :
      selectedPricingItem.size === "L" ? 3 : 4
    )

    const success = await updatePricingInDb(unitTypeId, {
      dailyPrice: editDailyPrice,
      monthlyPrice: editNormPrice,
      depositAmount: editDepositAmount,
      climateSurchargePercent: 20,
    })

    if (success) {
      toast.success(`Đã lưu bảng giá & mức cọc cho ${selectedPricingItem.name} trực tiếp vào Database!`)
    } else {
      // Fallback update local state
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
      toast.success(`Đã cập nhật khung giá & mức cọc cho ${selectedPricingItem.name}`)
    }
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
      {/* Khung Bảng Giá & Phụ Phí Điều Hành */}
      <div className="bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-sky-500/20 shadow-xl space-y-6">
        {/* Header điều phối */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <SlidersHorizontal className="size-5" />
              </span>
              <h3 className="font-black text-base uppercase text-white tracking-wide">
                BẢNG GIÁ THUÊ &amp; BIỂU PHÍ HỆ THỐNG
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Quy chuẩn 4 kích thước kho cố định (chiều cao 2.0m), đơn giá kho mát (+20%) và biểu phí áp dụng toàn chuỗi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Chuyển đổi giao diện Thẻ / Bảng */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setPricingViewMode("cards")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  pricingViewMode === "cards"
                    ? "bg-sky-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="size-3.5" />
                <span>Dạng Thẻ</span>
              </button>
              <button
                type="button"
                onClick={() => setPricingViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  pricingViewMode === "table"
                    ? "bg-sky-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Table className="size-3.5" />
                <span>Dạng Bảng</span>
              </button>
            </div>

            <button
              onClick={handleOpenAddSurcharge}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="size-4 text-sky-400" />
              <span>Thêm Phụ Thu</span>
            </button>
            <button
              onClick={() => handleOpenPricingModal()}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-md shadow-sky-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="size-4" />
              <span>Cập Nhật Giá</span>
            </button>
          </div>
        </div>

        {/* 1. KHUNG GIÁ THUÊ 4 SIZE KHO */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-black text-xs uppercase text-slate-200 tracking-wider flex items-center gap-2">
                <Sparkles className="size-3.5 text-sky-400" />
                <span>1. Khung Giá Thuê Tiêu Chuẩn &amp; Mức Cọc Theo 4 Size Kho</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chiều cao kho cố định 2.0m. Kho Điều hòa / Mát (22°C–25°C) tự động cộng 20% vào đơn giá thuê.
              </p>
            </div>
          </div>

          {pricingViewMode === "cards" ? (
            /* GIAO DIỆN DẠNG THẺ (PRICING CARDS - THUẬN MẮT, HIỆN ĐẠI) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pricingList.map((item) => {
                const theme = SIZE_THEMES[item.size] || SIZE_THEMES.S
                return (
                  <div
                    key={item.id}
                    className={`group relative p-5 rounded-2xl bg-slate-900/60 border ${theme.border} transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between shadow-lg overflow-hidden`}
                  >
                    {/* Gradient ánh sáng phía trên */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.glow}`} />

                    <div className="space-y-3.5">
                      {/* Size Badge & Tên */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase border ${theme.badge}`}>
                          Size {item.size}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {item.status}
                        </span>
                      </div>

                      <div>
                        <div className="font-black text-white text-base group-hover:text-sky-300 transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.description}
                        </div>
                      </div>

                      {/* Quy cách sàn & kích thước */}
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-center">
                        <span className="text-white font-bold">{item.dimensions}</span>
                        <span className="text-slate-400 text-[10px] block mt-0.5">
                          Sàn {item.area} • Cao {item.height || "2.0m"}
                        </span>
                      </div>

                      {/* Giá thuê chính (Kho Thường) */}
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Giá Kho Thường</div>
                        <div className="text-xl font-black font-mono text-sky-400">
                          ₫{item.normPrice.toLocaleString("vi-VN")}
                          <span className="text-[10px] font-sans font-medium text-slate-400"> /tháng</span>
                        </div>
                        <div className="text-[11px] font-mono font-semibold text-slate-300">
                          ₫{item.dailyPrice.toLocaleString("vi-VN")}{" "}
                          <span className="text-[10px] font-sans text-slate-500">/ngày</span>
                        </div>
                      </div>

                      {/* Thông số phụ: Kho Điều Hòa & Tiền Cọc */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                            <Snowflake className="size-3 text-sky-400" />
                            <span>Kho Mát (+20%):</span>
                          </span>
                          <span className="font-mono font-bold text-sky-300 text-xs">
                            ₫{item.acPrice.toLocaleString("vi-VN")}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                            <ShieldCheck className="size-3 text-sky-400" />
                            <span>Tiền Cọc Chuẩn:</span>
                          </span>
                          <span className="font-mono font-bold text-slate-200 text-xs">
                            ₫{item.depositAmount.toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Nút hành động sửa giá & cọc */}
                    <div className="pt-4 mt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleOpenPricingModal(item)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-sky-500 text-slate-200 hover:text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                      >
                        <Edit3 className="size-3.5" />
                        <span>Sửa Giá &amp; Cọc</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* GIAO DIỆN DẠNG BẢNG (TABLE VIEW) */
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 uppercase font-black text-slate-300 text-[10px]">
                    <th className="p-3.5 text-center">Size Kho</th>
                    <th className="p-3.5 text-center">Quy Cách Sàn</th>
                    <th className="p-3.5 text-center">Giá Ngày (Non-AC)</th>
                    <th className="p-3.5 text-center">Kho Thường (Tháng)</th>
                    <th className="p-3.5 text-center">Kho Điều Hòa (+20%)</th>
                    <th className="p-3.5 text-center">Tiền Cọc Chuẩn</th>
                    <th className="p-3.5 text-center">Trạng Thái</th>
                    <th className="p-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
                  {pricingList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3.5 text-center">
                        <div className="font-extrabold text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                      </td>
                      <td className="p-3.5 text-center font-mono">
                        <span className="font-bold text-white">{item.dimensions}</span>
                        <span className="text-slate-400 block text-[10px]">({item.area} • Cao {item.height || "2.0m"})</span>
                      </td>
                      <td className="p-3.5 text-center font-semibold font-mono text-slate-300 text-sm">
                        ₫{item.dailyPrice.toLocaleString("vi-VN")} <span className="text-[10px] text-slate-400 font-sans">/ngày</span>
                      </td>
                      <td className="p-3.5 text-center font-black font-mono text-sky-400 text-sm">
                        ₫{item.normPrice.toLocaleString("vi-VN")} <span className="text-[10px] text-slate-400 font-sans">/tháng</span>
                      </td>
                      <td className="p-3.5 text-center font-semibold font-mono text-sky-300 text-sm">
                        ₫{item.acPrice.toLocaleString("vi-VN")} <span className="text-[10px] text-slate-400 font-sans">/tháng</span>
                        <span className="block text-[10px] text-slate-400 font-sans">
                          (₫{Math.round(item.dailyPrice * 1.2).toLocaleString("vi-VN")}/ngày)
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-block px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 font-semibold font-mono text-slate-200 text-xs shadow-sm">
                          ₫{item.depositAmount.toLocaleString("vi-VN")}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="bg-slate-800 text-slate-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] border border-slate-700">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleOpenPricingModal(item)}
                          className="text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer"
                        >
                          Sửa Giá &amp; Cọc
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. BIỂU PHÍ PHỤ THU, PHẠT QUÁ HẠN & GIẢM GIÁ */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-black text-xs uppercase text-slate-200 tracking-wider flex items-center gap-2">
                <Tag className="size-3.5 text-sky-400" />
                <span>2. Biểu Phí Phụ Thu, Phí Phạt Quá Hạn &amp; Chính Sách Miễn Giảm Giá</span>
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
                  placeholder="Tìm kiếm khoản phí..."
                  value={searchSurcharge}
                  onChange={(e) => setSearchSurcharge(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-bold text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Thanh phân loại tab */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            {(["all", "surcharge", "penalty", "discount"] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setSurchargeFilter(filterKey)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                  surchargeFilter === filterKey
                    ? "bg-sky-500 text-slate-950 border-sky-500 font-black shadow-sm"
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

          {/* Dạng thẻ gọn gàng cho từng khoản phí */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredSurcharges.map((sc) => {
              const badgeConfig = {
                surcharge: { label: "Phụ Thu Dịch Vụ", style: "bg-slate-800 text-slate-300 border-slate-700" },
                penalty: { label: "Phí Phạt Quá Hạn", style: "bg-slate-800 text-slate-300 border-slate-700" },
                discount: { label: "Chính Sách Miễn Giảm", style: "bg-slate-800 text-slate-300 border-slate-700" },
              }[sc.category] || { label: "Khác", style: "bg-slate-800 text-slate-300 border-slate-700" }

              return (
                <div
                  key={sc.id}
                  className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeConfig.style}`}>
                        {badgeConfig.label}
                      </span>
                    </div>
                    <div className="font-extrabold text-white text-sm">
                      {sc.name}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Mức Phí Áp Dụng</div>
                      <div className="font-black font-mono text-sky-400 text-sm">
                        {sc.rate}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenEditSurcharge(sc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-sky-500 text-slate-200 hover:text-slate-950 border border-slate-700 font-bold transition cursor-pointer text-xs"
                    >
                      <Edit3 className="size-3.5" />
                      <span>Sửa</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredSurcharges.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-bold rounded-2xl bg-slate-900/30 border border-slate-800">
              Không tìm thấy biểu phí hoặc phụ thu nào phù hợp.
            </div>
          )}
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
                <p className="text-xs text-slate-400 mt-0.5">
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
                        ? "bg-sky-500 text-slate-950 shadow-md font-black"
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
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-md shadow-sky-500/20 cursor-pointer"
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
                <p className="text-xs text-slate-400 mt-0.5">
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
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-md shadow-sky-500/20 cursor-pointer"
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
