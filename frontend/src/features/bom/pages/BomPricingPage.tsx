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
    createFeePolicyInDb,
    updateFeePolicyInDb,
    deleteFeePolicyInDb,
  } = useBomContext()

  // Search & Filter state for surcharges
  const [searchSurcharge, setSearchSurcharge] = useState("")
  const [surchargeFilter, setSurchargeFilter] = useState<"all" | "penalty" | "discount" | "damage">("all")

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
  const [surchargeCat, setSurchargeCat] = useState<"penalty" | "discount" | "damage">("penalty")
  const [surchargeName, setSurchargeName] = useState("")
  const [surchargeCalcType, setSurchargeCalcType] = useState<"FIXED" | "PERCENT">("FIXED")
  const [surchargeFeeValue, setSurchargeFeeValue] = useState<number>(100000)
  const [surchargeUnitBasis, setSurchargeUnitBasis] = useState<string>("PER_MONTH")
  const [surchargeWaiveDeposit, setSurchargeWaiveDeposit] = useState<boolean>(false)
  const [surchargeNote, setSurchargeNote] = useState<string>("")
  const [surchargeToDelete, setSurchargeToDelete] = useState<SurchargeItem | null>(null)

  const previewRateString = useMemo(() => {
    let text = ""
    if (surchargeCalcType === "PERCENT") {
      text = `${surchargeFeeValue}%`
      if (surchargeUnitBasis === "PER_DAY") text += " / ngày trễ"
      else if (surchargeUnitBasis === "TOTAL_BILL") text += " Tổng Đơn"
      else if (surchargeUnitBasis === "PER_MONTH") text += " / tháng"
      else text += ` ${surchargeUnitBasis}`
    } else {
      text = `₫${Number(surchargeFeeValue || 0).toLocaleString("vi-VN")}`
      if (surchargeUnitBasis === "PER_MONTH") text += " / tháng"
      else if (surchargeUnitBasis === "PER_HOUR") text += " / giờ"
      else if (surchargeUnitBasis === "PER_DAY") text += " / ngày trễ"
      else if (surchargeUnitBasis === "TOTAL_BILL") text += " / đơn"
      else text += " / lần"
    }
    if (surchargeWaiveDeposit) {
      text += " + Miễn Cọc"
    }
    return text
  }, [surchargeCalcType, surchargeFeeValue, surchargeUnitBasis, surchargeWaiveDeposit])

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
    setSurchargeCat("penalty")
    setSurchargeName("")
    setSurchargeCalcType("FIXED")
    setSurchargeFeeValue(150000)
    setSurchargeUnitBasis("PER_MONTH")
    setSurchargeWaiveDeposit(false)
    setSurchargeNote("")
    setIsSurchargeModalOpen(true)
  }

  const handleOpenEditSurcharge = (item: SurchargeItem) => {
    setEditingSurcharge(item)
    setSurchargeCat(item.category)
    setSurchargeName(item.name)
    const isPct = item.calcType === "PERCENT" || item.rate.includes("%")
    setSurchargeCalcType(isPct ? "PERCENT" : "FIXED")

    const num = item.feeValue != null ? item.feeValue : (parseFloat(item.rate.replace(/[^\d.]/g, "")) || 0)
    setSurchargeFeeValue(num)

    if (item.unitBasis) {
      setSurchargeUnitBasis(item.unitBasis)
    } else if (item.rate.includes("/ tháng")) {
      setSurchargeUnitBasis("PER_MONTH")
    } else if (item.rate.includes("/ giờ")) {
      setSurchargeUnitBasis("PER_HOUR")
    } else if (item.rate.includes("/ ngày")) {
      setSurchargeUnitBasis("PER_DAY")
    } else if (item.rate.includes("Tổng Đơn") || item.rate.includes("/ đơn")) {
      setSurchargeUnitBasis("TOTAL_BILL")
    } else {
      setSurchargeUnitBasis("PER_REQUEST")
    }

    setSurchargeWaiveDeposit(Boolean(item.isWaiveDeposit || item.rate.includes("Miễn Cọc")))
    setSurchargeNote(item.note || "")
    setIsSurchargeModalOpen(true)
  }

  const parseRateString = (rateStr: string) => {
    const isPercent = rateStr.includes("%")
    const cleanNum = rateStr.replace(/[^\d.]/g, "")
    const num = parseFloat(cleanNum) || 0
    return {
      calcType: isPercent ? ("PERCENT" as const) : ("FIXED" as const),
      feeValue: num,
    }
  }

  const handleDeleteSurcharge = async (id: string, targetItem?: SurchargeItem | null) => {
    const item = targetItem || surcharges.find((sc) => sc.id === id)
    if (item?.policyId) {
      const ok = await deleteFeePolicyInDb(item.policyId)
      if (ok) {
        toast.success("Đã xóa khoản phí thành công khỏi Database!")
        setIsSurchargeModalOpen(false)
        setEditingSurcharge(null)
        setSurchargeToDelete(null)
        return
      }
    }

    setSurcharges((prev) => {
      const next = prev.filter((sc) => sc.id !== id)
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("smart_storage_surcharges", JSON.stringify(next))
        }
      } catch (e) {}
      return next
    })
    toast.success("Đã xóa khoản phí thành công!")
    setIsSurchargeModalOpen(false)
    setEditingSurcharge(null)
    setSurchargeToDelete(null)
  }

  const handleSaveSurcharge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!surchargeName.trim()) {
      toast.error("Vui lòng nhập tên khoản phí / chính sách!")
      return
    }

    const categoryMap: Record<string, string> = {
      penalty: "PENALTY",
      discount: "DISCOUNT",
      damage: "DAMAGE",
    }
    const rateStr = previewRateString

    if (editingSurcharge && editingSurcharge.policyId) {
      const ok = await updateFeePolicyInDb(editingSurcharge.policyId, {
        policyName: surchargeName.trim(),
        category: categoryMap[surchargeCat] || "PENALTY",
        calcType: surchargeCalcType,
        feeValue: Number(surchargeFeeValue) || 0,
        unitBasis: surchargeUnitBasis,
        isWaiveDeposit: surchargeWaiveDeposit,
        description: surchargeNote.trim() || rateStr,
      })
      if (ok) {
        toast.success(`Đã cập nhật biểu phí "${surchargeName.trim()}" trực tiếp vào Database!`)
        setIsSurchargeModalOpen(false)
        setEditingSurcharge(null)
        return
      }
    } else if (!editingSurcharge) {
      const ok = await createFeePolicyInDb({
        policyName: surchargeName.trim(),
        category: categoryMap[surchargeCat] || "PENALTY",
        calcType: surchargeCalcType,
        feeValue: Number(surchargeFeeValue) || 0,
        unitBasis: surchargeUnitBasis,
        isWaiveDeposit: surchargeWaiveDeposit,
        description: surchargeNote.trim() || rateStr,
      })
      if (ok) {
        toast.success(`Đã thêm biểu phí "${surchargeName.trim()}" thành công vào Database!`)
        setIsSurchargeModalOpen(false)
        return
      }
    }

    const categoryLabels = {
      penalty: "Phí Phạt Quá Hạn (Penalties & Overdue Fees)",
      discount: "Chính Sách Miễn Giảm Giá (Discount Policy)",
      damage: "Biểu Phí Bồi Thường Hư Hỏng & Vệ Sinh",
    }

    const typeLabels = {
      penalty: "Chế Tài / Phạt Hợp Đồng",
      discount: "Ưu Đãi / Khuyến Mãi",
      damage: "Bồi Thường Hư Hỏng",
    }

    if (editingSurcharge) {
      setSurcharges((prev) => {
        const next = prev.map((sc) =>
          sc.id === editingSurcharge.id
            ? {
                ...sc,
                category: surchargeCat,
                categoryLabel: categoryLabels[surchargeCat],
                type: typeLabels[surchargeCat],
                name: surchargeName.trim(),
                rate: rateStr,
                calcType: surchargeCalcType,
                feeValue: Number(surchargeFeeValue) || 0,
                unitBasis: surchargeUnitBasis,
                isWaiveDeposit: surchargeWaiveDeposit,
                note: surchargeNote.trim(),
              }
            : sc
        )
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("smart_storage_surcharges", JSON.stringify(next))
          }
        } catch (e) {}
        return next
      })
      toast.success(`Đã cập nhật biểu phí "${surchargeName.trim()}"!`)
    } else {
      const newItem: SurchargeItem = {
        id: `sc-${Date.now()}`,
        category: surchargeCat,
        categoryLabel: categoryLabels[surchargeCat],
        type: typeLabels[surchargeCat],
        name: surchargeName.trim(),
        rate: rateStr,
        calcType: surchargeCalcType,
        feeValue: Number(surchargeFeeValue) || 0,
        unitBasis: surchargeUnitBasis,
        isWaiveDeposit: surchargeWaiveDeposit,
        isActive: true,
        note: surchargeNote.trim(),
      }
      setSurcharges((prev) => {
        const next = [newItem, ...prev]
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("smart_storage_surcharges", JSON.stringify(next))
          }
        } catch (e) {}
        return next
      })
      toast.success("Đã thêm hạng mục biểu phí thành công!")
    }

    setIsSurchargeModalOpen(false)
    setEditingSurcharge(null)
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
          </div>

          {/* GIAO DIỆN DẠNG BẢNG NGANG (HORIZONTAL TABLE FORMAT - VỪA VẶN 100% KHÔNG CUỘN) */}
          <div className="rounded-xl border border-slate-800 shadow-md overflow-hidden">
            <table className="w-full text-left text-xs border-collapse table-auto">
              <thead>
                <tr className="bg-slate-900 border-b border-sky-500/30 text-sky-400 uppercase font-bold text-[11px] sm:text-xs tracking-wider">
                  <th className="py-3 px-3 sm:px-4 text-left">LOẠI KHO / SIZE</th>
                  <th className="py-3 px-2 sm:px-3 text-center">GIÁ THEO NGÀY</th>
                  <th className="py-3 px-2 sm:px-3 text-center">GIÁ THEO THÁNG</th>
                  <th className="py-3 px-2 sm:px-3 text-center">PHỤ PHÍ KHO MÁT</th>
                  <th className="py-3 px-2 sm:px-3 text-center">TIỀN CỌC CHUẨN</th>
                  <th className="py-3 px-2 sm:px-3 text-center">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
                {pricingList.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/60 transition">
                      {/* CỘT 1: SIZE & TÊN LOẠI KHO */}
                      <td className="py-3 px-3 sm:px-4 text-left">
                        <span className="font-extrabold text-white text-xs sm:text-sm">
                          {item.name}
                        </span>
                      </td>

                      {/* CỘT 2: GIÁ THEO NGÀY */}
                      <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm">
                          ₫{item.dailyPrice.toLocaleString("vi-VN")}
                        </span>
                      </td>

                      {/* CỘT 4: GIÁ THEO THÁNG */}
                      <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm">
                          ₫{item.normPrice.toLocaleString("vi-VN")}
                        </span>
                      </td>

                      {/* CỘT 5: PHỤ PHÍ KHO MÁT */}
                      <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm">
                          +{item.climateSurchargePercent ?? 20}%
                        </span>
                      </td>

                      {/* CỘT 6: TIỀN CỌC CHUẨN */}
                      <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm">
                          ₫{item.depositAmount.toLocaleString("vi-VN")}
                        </span>
                      </td>

                      {/* CỘT 7: THAO TÁC */}
                      <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenPricingModal(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-sky-500 text-slate-200 hover:text-slate-950 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1.5 border border-slate-700 shadow-xs"
                          title="Sửa khung giá & mức cọc"
                        >
                          <Edit3 className="size-3.5" />
                          <span>Sửa Giá &amp; Cọc</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. BIỂU PHÍ PHẠT QUÁ HẠN, GIẢM GIÁ & BỒI THƯỜNG */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-black text-xs uppercase text-slate-200 tracking-wider flex items-center gap-2">
                <Tag className="size-3.5 text-sky-400" />
                <span>2. Phí Phạt Quá Hạn, Chính Sách Miễn Giảm &amp; Bồi Thường Hư Hỏng</span>
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
                <span>Thêm Biểu Phí</span>
              </button>
            </div>
          </div>

          {/* Thanh phân loại tab */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            {(["all", "penalty", "discount", "damage"] as const).map((filterKey) => (
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
                  : filterKey === "penalty"
                  ? "Phí Phạt Quá Hạn"
                  : filterKey === "discount"
                  ? "Chính Sách Miễn Giảm"
                  : "Bồi Thường Hư Hỏng"}
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
                    penalty: {
                      label: "Phí Phạt Quá Hạn",
                      style: "bg-amber-950/60 text-amber-400 border-amber-800/60",
                    },
                    discount: {
                      label: "Chính Sách Miễn Giảm",
                      style: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
                    },
                    damage: {
                      label: "Bồi Thường Hư Hỏng",
                      style: "bg-rose-950/60 text-rose-400 border-rose-800/60",
                    },
                  }[sc.category] || {
                    label: "Khác",
                    style: "bg-slate-800 text-slate-300 border-slate-700",
                  }

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
                      <td className="p-3.5 text-right font-mono font-bold text-slate-200 text-xs sm:text-sm">
                        {sc.rate}
                      </td>

                      {/* Thao tác */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSurcharge(sc)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-sky-500 text-slate-200 hover:text-slate-950 border border-slate-700 font-bold transition cursor-pointer text-xs"
                            title="Chỉnh sửa biểu phí"
                          >
                            <Edit3 className="size-3.5" />
                            <span>Sửa</span>
                          </button>
                        </div>
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
                  <option value="penalty">1. Phí Phạt Quá Hạn (Penalties)</option>
                  <option value="discount">2. Chính Sách Miễn Giảm Giá (Discount Policy)</option>
                  <option value="damage">3. Bồi Thường Hư Hỏng &amp; Vệ Sinh (Damages)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Tên Khoản Phí / Nội Dung:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phí Phạt Quá Hạn Thanh Toán"
                  value={surchargeName}
                  onChange={(e) => setSurchargeName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                />
              </div>

              {/* Cách thức tính phí: Số tiền cố định hay % */}
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Cách Thức Tính Phí:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSurchargeCalcType("FIXED")
                      if (surchargeFeeValue < 1000) setSurchargeFeeValue(100000)
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      surchargeCalcType === "FIXED"
                        ? "bg-sky-500 text-slate-950 border-sky-400 shadow-sm font-black"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>💵 Số Tiền Cố Định (VNĐ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSurchargeCalcType("PERCENT")
                      if (surchargeFeeValue > 100) setSurchargeFeeValue(10)
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      surchargeCalcType === "PERCENT"
                        ? "bg-sky-500 text-slate-950 border-sky-400 shadow-sm font-black"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>% Tỷ Lệ Phần Trăm (%)</span>
                  </button>
                </div>
              </div>

              {/* Mức phí và Đơn vị tính */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    {surchargeCalcType === "PERCENT" ? "Tỷ Lệ Phần Trăm (%):" : "Số Tiền Áp Dụng (VNĐ):"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      step={surchargeCalcType === "PERCENT" ? "0.1" : "1000"}
                      value={surchargeFeeValue}
                      onChange={(e) => setSurchargeFeeValue(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 pr-10 rounded-xl border border-slate-700 bg-slate-950 font-mono font-bold text-xs text-white outline-none focus:border-sky-400"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                      {surchargeCalcType === "PERCENT" ? "%" : "₫"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Chu Kỳ / Đơn Vị Tính:
                  </label>
                  <select
                    value={surchargeUnitBasis}
                    onChange={(e) => setSurchargeUnitBasis(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400"
                  >
                    <option value="PER_REQUEST">Theo Lần (/ lần)</option>
                    <option value="PER_MONTH">Theo Tháng (/ tháng)</option>
                    <option value="PER_DAY">Theo Ngày Trễ (/ ngày trễ)</option>
                    <option value="PER_HOUR">Theo Giờ (/ giờ)</option>
                    <option value="TOTAL_BILL">Tổng Đơn Hợp Đồng (Tổng bill)</option>
                  </select>
                </div>
              </div>

              {/* Tùy chọn Miễn Cọc khi là Discount */}
              {surchargeCat === "discount" && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    id="waiveDepositPolicy"
                    checked={surchargeWaiveDeposit}
                    onChange={(e) => setSurchargeWaiveDeposit(e.target.checked)}
                    className="rounded border-slate-700 text-sky-500 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="waiveDepositPolicy" className="text-xs text-slate-300 font-bold cursor-pointer select-none">
                    Miễn thu tiền cọc phòng khi áp dụng chính sách này
                  </label>
                </div>
              )}

              {/* Mô tả / Ghi chú chính sách */}
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                  Mô Tả / Hình Thức Áp Dụng:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Phạt 50.000 VNĐ mỗi ngày quá hạn thanh toán tiền kho..."
                  value={surchargeNote}
                  onChange={(e) => setSurchargeNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-medium text-xs text-white outline-none focus:border-sky-400 resize-none"
                />
              </div>

              {/* Dòng Xem Trước (Preview) */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-sky-500/30 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Mức phí áp dụng vào hóa đơn:</span>
                <span className="font-mono font-black text-xs text-sky-400">
                  {previewRateString}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {editingSurcharge ? (
                <button
                  type="button"
                  onClick={() => handleDeleteSurcharge(editingSurcharge.id, editingSurcharge)}
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

      {/* MODAL 5: XÁC NHẬN XÓA BIỂU PHÍ / PHỤ THU - PORTAL RA BODY */}
      {surchargeToDelete && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="size-5" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-white">
                  XÁC NHẬN XÓA BIỂU PHÍ
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thao tác này sẽ xóa hoàn toàn khoản phí khỏi hệ thống
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1.5">
              <p>
                Bạn có chắc chắn muốn xóa: <strong className="text-rose-400 font-bold">{surchargeToDelete.name}</strong> ({surchargeToDelete.rate})?
              </p>
              <p className="text-[11px] text-slate-400">
                Sau khi xác nhận xóa, khoản phí này sẽ không còn hiển thị trong hệ thống và không áp dụng cho khách hàng thuê mới.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSurchargeToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 font-bold text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSurcharge(surchargeToDelete.id, surchargeToDelete)}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
