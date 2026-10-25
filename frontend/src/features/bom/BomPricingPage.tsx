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
  Tag,
  Sparkles,
} from "lucide-react"
import { useBomContext } from "@/features/bom/context/BomContext"
import { type UnitPricing, type SurchargeItem } from "@/features/bom/data/bomData"

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
  const {
    pricingList,
    setPricingList,
    surcharges,
    setSurcharges,
    updatePricingInDb,
    createPricingInDb,
    deletePricingInDb,
  } = useBomContext()

  // Search & Filter state for surcharges
  const [searchSurcharge, setSearchSurcharge] = useState("")
  const [surchargeFilter, setSurchargeFilter] = useState<"all" | "surcharge" | "penalty" | "discount">("all")

  // Modal 1: Pricing edit modal
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  const [selectedPricingItem, setSelectedPricingItem] = useState<UnitPricing | null>(null)
  const [editDailyPrice, setEditDailyPrice] = useState<number>(30000)
  const [editNormPrice, setEditNormPrice] = useState<number>(600000)
  const [editClimatePercent, setEditClimatePercent] = useState<number>(20)
  const [editDepositAmount, setEditDepositAmount] = useState<number>(500000)

  // Modal Thêm loại kho mới
  const [isAddPricingModalOpen, setIsAddPricingModalOpen] = useState(false)
  const [newTypeName, setNewTypeName] = useState("")
  const [newSizeCode, setNewSizeCode] = useState("L")
  const [newDimensions, setNewDimensions] = useState("3.0m x 2.5m x 2.5m")
  const [newDailyPrice, setNewDailyPrice] = useState<number>(60000)
  const [newMonthlyPrice, setNewMonthlyPrice] = useState<number>(1200000)
  const [newClimatePercent, setNewClimatePercent] = useState<number>(20)
  const [newDepositAmount, setNewDepositAmount] = useState<number>(1000000)
  const [isCreatingPricing, setIsCreatingPricing] = useState(false)

  // Modal Xác nhận xóa loại kho
  const [pricingToDelete, setPricingToDelete] = useState<UnitPricing | null>(null)
  const [isDeletingPricing, setIsDeletingPricing] = useState(false)

  const resetAddPricingForm = () => {
    setNewTypeName("")
    setNewSizeCode("L")
    setNewDimensions("3.0m x 2.5m x 2.5m")
    setNewDailyPrice(60000)
    setNewMonthlyPrice(1200000)
    setNewClimatePercent(20)
    setNewDepositAmount(1000000)
  }

  const handleCreatePricing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTypeName.trim()) {
      toast.error("Vui lòng nhập tên loại kho!")
      return
    }
    if (!newDimensions.trim()) {
      toast.error("Vui lòng nhập kích thước kho (Dài x Rộng x Cao)!")
      return
    }

    setIsCreatingPricing(true)
    try {
      const ok = await createPricingInDb({
        name: newTypeName.trim(),
        size: newSizeCode.trim().toUpperCase() || "L",
        dimensions: newDimensions.trim(),
        dailyPrice: Number(newDailyPrice) || 0,
        monthlyPrice: Number(newMonthlyPrice) || 0,
        depositAmount: Number(newDepositAmount) || 0,
        climateSurchargePercent: Number(newClimatePercent) || 20,
      })

      if (ok) {
        toast.success(`Đã thêm loại kho "${newTypeName.trim()}" thành công vào Database!`)
        setIsAddPricingModalOpen(false)
        resetAddPricingForm()
      } else {
        // Fallback local UI
        const newItem: UnitPricing = {
          id: `custom-${Date.now()}`,
          unitTypeId: Date.now(),
          size: newSizeCode.trim().toUpperCase() || "L",
          name: newTypeName.trim(),
          dimensions: newDimensions.trim(),
          area: "Tiêu chuẩn",
          description: "",
          dailyPrice: Number(newDailyPrice) || 0,
          normPrice: Number(newMonthlyPrice) || 0,
          acPrice: Math.round((Number(newMonthlyPrice) || 0) * (1 + (Number(newClimatePercent) || 20) / 100)),
          depositAmount: Number(newDepositAmount) || 0,
          depositText: `₫${Number(newDepositAmount).toLocaleString("vi-VN")}`,
          climateSurchargePercent: Number(newClimatePercent) || 20,
          status: "HOẠT ĐỘNG",
        }
        setPricingList((prev) => [...prev, newItem])
        toast.success(`Đã thêm loại kho "${newTypeName.trim()}"!`)
        setIsAddPricingModalOpen(false)
        resetAddPricingForm()
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tạo loại kho mới!")
    } finally {
      setIsCreatingPricing(false)
    }
  }

  const handleConfirmDeletePricing = async () => {
    if (!pricingToDelete) return
    setIsDeletingPricing(true)
    try {
      const id = pricingToDelete.unitTypeId || (
        pricingToDelete.size === "S" ? 1 :
        pricingToDelete.size === "M" ? 2 :
        pricingToDelete.size === "L" ? 3 : 4
      )
      const ok = await deletePricingInDb(id)
      if (ok) {
        toast.success(`Đã xóa loại kho "${pricingToDelete.name}" thành công!`)
      } else {
        setPricingList((prev) => prev.filter((p) => p.id !== pricingToDelete.id))
        toast.success(`Đã xóa loại kho "${pricingToDelete.name}"!`)
      }
    } catch {
      toast.error("Không thể xóa loại kho lúc này!")
    } finally {
      setIsDeletingPricing(false)
      setPricingToDelete(null)
    }
  }

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
    setEditClimatePercent(target.climateSurchargePercent ?? 20)
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
      climateSurchargePercent: editClimatePercent,
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
                climateSurchargePercent: editClimatePercent,
                acPrice: Math.round(editNormPrice * (1 + editClimatePercent / 100)),
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
          </div>
        </div>

        {/* 1. KHUNG GIÁ THUÊ 4 SIZE KHO */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-black text-xs uppercase text-slate-200 tracking-wider flex items-center gap-2">
                <Sparkles className="size-3.5 text-sky-400" />
                <span>1. Khung Giá Thuê Tiêu Chuẩn &amp; Mức Cọc Theo Các Size Kho</span>
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                resetAddPricingForm()
                setIsAddPricingModalOpen(true)
              }}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="size-3.5" />
              <span>Thêm Loại Kho Mới</span>
            </button>
          </div>

          {/* GIAO DIỆN DẠNG BẢNG NGANG (HORIZONTAL TABLE FORMAT) */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-sky-500/30 text-sky-400 uppercase font-bold text-[11px] sm:text-xs tracking-wider">
                  <th className="py-3 px-4 text-left whitespace-nowrap">LOẠI KHO / SIZE</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">KÍCH THƯỚC</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">GIÁ THEO NGÀY</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">GIÁ THEO THÁNG</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">PHỤ PHÍ KHO MÁT</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">TIỀN CỌC CHUẨN</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">TRẠNG THÁI</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
                {pricingList.map((item) => {
                  const theme = SIZE_THEMES[item.size] || SIZE_THEMES.S
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/60 transition">
                      {/* CỘT 1: SIZE & TÊN LOẠI KHO */}
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase border ${theme.badge}`}>
                            Size {item.size}
                          </span>
                          <span className="font-extrabold text-white text-xs sm:text-sm">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* CỘT 2: KÍCH THƯỚC */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-200 text-xs bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800">
                          {item.dimensions}
                        </span>
                      </td>

                      {/* CỘT 3: GIÁ THEO NGÀY */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm">
                          ₫{item.dailyPrice.toLocaleString("vi-VN")}
                        </span>
                      </td>

                      {/* CỘT 4: GIÁ THEO THÁNG */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-black text-sky-400 text-xs sm:text-sm">
                          ₫{item.normPrice.toLocaleString("vi-VN")}
                        </span>
                      </td>

                      {/* CỘT 5: PHỤ PHÍ KHO MÁT */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-cyan-300 text-xs bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/50">
                          +{item.climateSurchargePercent ?? 20}%
                        </span>
                      </td>

                      {/* CỘT 6: TIỀN CỌC CHUẨN */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm">
                          ₫{item.depositAmount.toLocaleString("vi-VN")}
                        </span>
                      </td>

                      {/* CỘT 7: TRẠNG THÁI */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                          <CheckCircle className="size-3" />
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* CỘT 8: THAO TÁC */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPricingModal(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-sky-500 text-slate-200 hover:text-slate-950 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1 border border-slate-700 shadow-xs"
                            title="Sửa khung giá & mức cọc"
                          >
                            <Edit3 className="size-3.5" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPricingToDelete(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1 border border-rose-900/50 shadow-xs"
                            title="Xóa loại kho này"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. BIỂU PHÍ PHỤ THU, PHẠT QUÁ HẠN & GIẢM GIÁ */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-black text-xs uppercase text-slate-200 tracking-wider flex items-center gap-2">
                <Tag className="size-3.5 text-sky-400" />
                <span>2. Biểu Phí Phụ Thu, Phí Phạt Quá Hạn &amp; Chính Sách Miễn Giảm Giá</span>
              </h4>
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
              <button
                type="button"
                onClick={handleOpenAddSurcharge}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
              >
                <Plus className="size-3.5" />
                <span>Thêm Phụ Thu</span>
              </button>
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

          {/* Dạng bảng cột cho từng khoản phí */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 uppercase font-black text-slate-300 text-[10px]">
                  <th className="p-3.5 text-left">Tên Biểu Phí &amp; Chính Sách</th>
                  <th className="p-3.5 text-center">Phân Loại Danh Mục</th>
                  <th className="p-3.5 text-center">Hình Thức Áp Dụng</th>
                  <th className="p-3.5 text-right">Mức Phí Áp Dụng</th>
                  <th className="p-3.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
                {filteredSurcharges.map((sc) => {
                  const badgeConfig = {
                    surcharge: { label: "Phụ Thu Dịch Vụ", style: "bg-slate-800 text-slate-300 border-slate-700" },
                    penalty: { label: "Phí Phạt Quá Hạn", style: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
                    discount: { label: "Chính Sách Miễn Giảm", style: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
                  }[sc.category] || { label: "Khác", style: "bg-slate-800 text-slate-300 border-slate-700" }

                  return (
                    <tr
                      key={sc.id}
                      className="hover:bg-slate-900/50 transition"
                    >
                      {/* Tên biểu phí */}
                      <td className="p-3.5 text-left">
                        <div className="font-extrabold text-white text-xs">{sc.name}</div>
                        {sc.note && (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
                            {sc.note}
                          </div>
                        )}
                      </td>

                      {/* Phân loại */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeConfig.style}`}>
                          {badgeConfig.label}
                        </span>
                      </td>

                      {/* Hình thức */}
                      <td className="p-3.5 text-center text-slate-400 font-medium text-xs">
                        {sc.type}
                      </td>

                      {/* Mức phí áp dụng */}
                      <td className="p-3.5 text-right font-mono font-black text-sky-400 text-sm">
                        {sc.rate}
                      </td>

                      {/* Thao tác */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSurcharge(sc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-sky-500 text-slate-200 hover:text-slate-950 border border-slate-700 font-bold transition cursor-pointer text-xs"
                        >
                          <Edit3 className="size-3.5" />
                          <span>Sửa</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
                      setEditClimatePercent(p.climateSurchargePercent ?? 20)
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
                    Giá Thuê Theo Ngày:
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
                    Giá Thuê Theo Tháng:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editNormPrice}
                      onChange={(e) => setEditNormPrice(Number(e.target.value))}
                      className="w-full p-2.5 pr-14 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">VNĐ/tháng</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Phụ Phí Kho Mát (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editClimatePercent}
                      onChange={(e) => setEditClimatePercent(Number(e.target.value))}
                      className="w-full p-2.5 pr-8 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">%</span>
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

      {/* MODAL 3: THÊM LOẠI KHO MỚI - PORTAL RA BODY */}
      {isAddPricingModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreatePricing}
            className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-white my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-sky-400">
                  THÊM LOẠI KHO MỚI &amp; KHUNG GIÁ
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tạo phân loại kho mới và áp dụng bảng giá niêm yết vào hệ thống
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPricingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Tên Loại Kho:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kho VIP Siêu Lớn"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Ký Hiệu / Mã Size:
                  </label>
                  <select
                    value={newSizeCode}
                    onChange={(e) => setNewSizeCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                  >
                    <option value="S">Size S (Nhỏ / Tủ đồ cá nhân)</option>
                    <option value="M">Size M (Vừa / Căn hộ mini)</option>
                    <option value="L">Size L (Lớn / Căn hộ 2 phòng)</option>
                    <option value="XL">Size XL (Rất Lớn / Hộ gia đình)</option>
                    <option value="XXL">Size XXL (Siêu Lớn / Doanh nghiệp)</option>
                    <option value="CUSTOM">Custom (Kích thước tùy chỉnh)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Kích Thước Chuẩn (Dài x Rộng x Cao):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 3.5m x 3.0m x 2.8m"
                  value={newDimensions}
                  onChange={(e) => setNewDimensions(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Giá Thuê Theo Ngày:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={newDailyPrice}
                      onChange={(e) => setNewDailyPrice(Number(e.target.value))}
                      className="w-full p-2.5 pr-14 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">VNĐ/ngày</span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Giá Thuê Theo Tháng:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={newMonthlyPrice}
                      onChange={(e) => setNewMonthlyPrice(Number(e.target.value))}
                      className="w-full p-2.5 pr-14 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">VNĐ/tháng</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Phụ Phí Kho Mát (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newClimatePercent}
                      onChange={(e) => setNewClimatePercent(Number(e.target.value))}
                      className="w-full p-2.5 pr-8 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">%</span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Mức Tiền Cọc Chuẩn:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={newDepositAmount}
                      onChange={(e) => setNewDepositAmount(Number(e.target.value))}
                      className="w-full p-2.5 pr-12 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[10px]">VNĐ</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddPricingModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 font-bold text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={isCreatingPricing}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-50"
              >
                {isCreatingPricing ? "Đang Lưu..." : "Thêm Loại Kho Mới"}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* MODAL 4: XÁC NHẬN XÓA LOẠI KHO - PORTAL RA BODY */}
      {pricingToDelete && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="size-5" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-white">
                  XÁC NHẬN XÓA LOẠI KHO
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thao tác này sẽ ngưng kích hoạt loại kho trong hệ thống
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1.5">
              <p>
                Bạn có chắc chắn muốn xóa loại kho: <strong className="text-rose-400 font-bold">{pricingToDelete.name}</strong> (Size {pricingToDelete.size})?
              </p>
              <p className="text-[11px] text-slate-400">
                Bảng giá và thông tin size kho này sẽ chuyển sang trạng thái <strong>NGƯNG HOẠT ĐỘNG</strong> và không hiển thị cho khách hàng thuê mới.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPricingToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 font-bold text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isDeletingPricing}
                onClick={handleConfirmDeletePricing}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50"
              >
                {isDeletingPricing ? "Đang Xóa..." : "Xác Nhận Xóa"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
