import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Building2,
  TrendingUp,
  Warehouse,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Plus,
  Edit3,
  Moon,
  Sun,
  LogOut,
  Search,
  CheckCircle,
  SlidersHorizontal,
  DollarSign,
  ShieldAlert,
  User,
  X,
  Lock,
} from "lucide-react"

import { useTheme } from "@/components/common/theme-provider"
import { useAuth } from "@/context/AuthContext"
import {
  INITIAL_FACILITIES,
  INITIAL_PRICING,
  INITIAL_SURCHARGES,
  INITIAL_SYSTEM_REPORTS,
  type FacilityPerformance,
  type UnitPricing,
  type SurchargeItem,
} from "../data/bomData"

export default function BomPortalPage() {
  const { theme, setTheme } = useTheme()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  // State Tabs
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "facilities" | "policies" | "pricing" | "reports"
  >("dashboard")

  // State Data
  const [facilities, setFacilities] = useState<FacilityPerformance[]>(INITIAL_FACILITIES)
  const [pricingList, setPricingList] = useState<UnitPricing[]>(INITIAL_PRICING)
  const [surcharges, setSurcharges] = useState<SurchargeItem[]>(INITIAL_SURCHARGES)
  const [searchSurcharge, setSearchSurcharge] = useState("")
  const [surchargeFilter, setSurchargeFilter] = useState<"all" | "surcharge" | "penalty" | "discount">("all")

  // Modals state
  const [selectedFacility, setSelectedFacility] = useState<FacilityPerformance | null>(null)
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false)
  const [facilityTotalUnits, setFacilityTotalUnits] = useState(350)
  const [facilityMultiplier, setFacilityMultiplier] = useState(1.15)
  const [facilityNote, setFacilityNote] = useState("")

  const [selectedPricing, setSelectedPricing] = useState<UnitPricing | null>(null)
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  const [editNormPrice, setEditNormPrice] = useState(850000)
  const [editAcPrice, setEditAcPrice] = useState(1150000)
  const [editDeposit, setEditDeposit] = useState("1 Tháng Tiền Thuê")

  const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false)
  const [surchargeCat, setSurchargeCat] = useState<"surcharge" | "penalty" | "discount">("surcharge")
  const [surchargeName, setSurchargeName] = useState("")
  const [surchargeRate, setSurchargeRate] = useState("")
  const [surchargeNote, setSurchargeNote] = useState("")

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Actions
  const handleOpenFacilityModal = (fac: FacilityPerformance) => {
    setSelectedFacility(fac)
    setFacilityTotalUnits(fac.totalUnits)
    setFacilityMultiplier(1.15)
    setFacilityNote("Chiến lược vận hành tối ưu hoá tỷ lệ lấp đầy quý 4")
    setIsFacilityModalOpen(true)
  }

  const handleSaveFacilityModal = () => {
    if (selectedFacility) {
      setFacilities((prev) =>
        prev.map((f) =>
          f.id === selectedFacility.id
            ? { ...f, totalUnits: Number(facilityTotalUnits) }
            : f
        )
      )
      toast.success(
        `Đã lưu cấu hình cơ sở ${selectedFacility.name} (Hệ số giá: ${facilityMultiplier})!`
      )
    }
    setIsFacilityModalOpen(false)
  }

  const handleOpenPricingModal = (pricing?: UnitPricing) => {
    const target = pricing || pricingList[0]
    setSelectedPricing(target)
    setEditNormPrice(target.normPrice)
    setEditAcPrice(target.acPrice)
    setEditDeposit(target.depositText)
    setIsPricingModalOpen(true)
  }

  const handleSavePricingModal = () => {
    if (selectedPricing) {
      setPricingList((prev) =>
        prev.map((p) =>
          p.id === selectedPricing.id
            ? {
                ...p,
                normPrice: Number(editNormPrice),
                acPrice: Number(editAcPrice),
                depositText: editDeposit,
              }
            : p
        )
      )
      toast.success(
        `Đã cập nhật khung giá cho ${selectedPricing.name} thành công!`
      )
    }
    setIsPricingModalOpen(false)
  }

  const handleSaveSurcharge = (e: React.FormEvent) => {
    e.preventDefault()
    if (!surchargeName.trim() || !surchargeRate.trim()) {
      toast.error("Vui lòng điền đầy đủ tên và mức áp dụng.")
      return
    }

    const newItem: SurchargeItem = {
      id: `sc-${Date.now()}`,
      category: surchargeCat,
      categoryLabel:
        surchargeCat === "surcharge"
          ? "Biểu Phí Phụ Thu (Surcharges)"
          : surchargeCat === "penalty"
          ? "Phí Phạt Quá Hạn (Penalties & Overdue Fees)"
          : "Chính Sách Miễn Giảm Giá (Discount Policy & Waivers)",
      type: "BOM Cấu hình mới",
      name: surchargeName,
      rate: surchargeRate,
      isActive: true,
      note: surchargeNote || "Áp dụng toàn chuỗi",
    }

    setSurcharges((prev) => [newItem, ...prev])
    toast.success(`Đã thêm hạng mục: ${surchargeName}`)
    setIsSurchargeModalOpen(false)
    setSurchargeName("")
    setSurchargeRate("")
    setSurchargeNote("")
  }

  const handleExport = (format: "EXCEL" | "PDF" | "CSV") => {
    toast.success(`Đang trích xuất Báo cáo Vận hành BOM định dạng ${format}... Tải xuống hoàn tất!`)
  }

  const handleLogout = () => {
    signOut()
    toast.success("Đã đăng xuất khỏi tài khoản BOM.")
    navigate("/internal_login")
  }

  // Filter Surcharges
  const filteredSurcharges = surcharges.filter((item) => {
    const matchesFilter =
      surchargeFilter === "all" || item.category === surchargeFilter
    const matchesSearch =
      item.name.toLowerCase().includes(searchSurcharge.toLowerCase()) ||
      item.note.toLowerCase().includes(searchSurcharge.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
            <Warehouse className="size-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
              Smart Storage
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Hệ thống cho thuê kho tự quản thông minh 24/7
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            {theme === "dark" ? (
              <>
                <Sun className="size-4 text-amber-400" />
                <span className="hidden sm:inline">Giao diện Sáng</span>
              </>
            ) : (
              <>
                <Moon className="size-4 text-indigo-500" />
                <span className="hidden sm:inline">Giao diện Tối</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center space-x-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
              NV
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-extrabold text-slate-900 dark:text-white leading-tight">
                Nguyễn Văn BOM
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Chuyên viên Quản lý Vận hành
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* HERO / METRICS BANNER (Chuẩn mẫu ảnh: Xanh dương gradient, 4 box thông số có icon góc phải) */}
        <div className="p-6 rounded-3xl bg-[#2540b0] dark:bg-slate-900 text-white shadow-xl border border-blue-600/30 space-y-5">
          <div className="flex items-center space-x-3.5 pb-1">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md shrink-0 border border-white/20">
              <Building2 className="size-6 text-white" />
            </div>
            <h2 className="font-black text-lg sm:text-xl text-white tracking-wide uppercase">
              QUẢN LÝ VẬN HÀNH TOÀN HỆ THỐNG
            </h2>
          </div>

          {/* Quick Metrics (4 card xanh có icon góc trên bên phải) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/15 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/15 dark:border-slate-700">
              <div className="text-[11px] font-bold text-blue-100 uppercase tracking-wider flex items-center justify-between">
                <span>TỔNG CƠ SỞ KHO</span>
                <Warehouse className="size-4 text-blue-200" />
              </div>
              <div className="text-2xl font-black text-white mt-1.5">
                4 <span className="text-xs font-semibold text-blue-100">Cơ sở</span>
              </div>
              <div className="text-[11px] text-blue-100 mt-0.5 font-medium">
                1,240 Tổng số kho
              </div>
            </div>

            <div className="bg-white/15 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/15 dark:border-slate-700">
              <div className="text-[11px] font-bold text-blue-100 uppercase tracking-wider flex items-center justify-between">
                <span>TỈ LỆ LẤP ĐẦY TB</span>
                <TrendingUp className="size-4 text-emerald-300" />
              </div>
              <div className="text-2xl font-black text-emerald-300 mt-1.5">88.5%</div>
              <div className="text-[11px] text-blue-100 mt-0.5 font-medium">
                1,098 / 1,240 kho rented
              </div>
            </div>

            <div className="bg-white/15 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/15 dark:border-slate-700">
              <div className="text-[11px] font-bold text-blue-100 uppercase tracking-wider flex items-center justify-between">
                <span>DOANH THU THÁNG 09</span>
                <DollarSign className="size-4 text-amber-300" />
              </div>
              <div className="text-2xl font-black text-amber-300 mt-1.5">₫1.85 Tỷ</div>
              <div className="text-[11px] text-blue-100 mt-0.5 font-medium">
                +14.2% so với T08
              </div>
            </div>

            <div className="bg-white/15 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/15 dark:border-slate-700">
              <div className="text-[11px] font-bold text-blue-100 uppercase tracking-wider flex items-center justify-between">
                <span>CẢNH BÁO QUÁ HẠN</span>
                <AlertTriangle className="size-4 text-rose-300" />
              </div>
              <div className="text-2xl font-black text-rose-300 mt-1.5">12 Kho</div>
              <div className="text-[11px] text-rose-200 mt-0.5 font-medium">
                Cần kích hoạt BR-18 / BR-21
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION SUBTABS BAR (Dạng pill pills như ảnh chụp) */}
        <div className="flex items-center space-x-2.5 overflow-x-auto text-xs font-extrabold no-scrollbar pt-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2.5 rounded-2xl border transition flex items-center space-x-2 whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === "dashboard"
                ? "bg-[#1d4ed8] text-white border-[#1d4ed8]"
                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            <TrendingUp className="size-3.5" />
            <span>Giám Sát &amp; Hiệu Suất Cơ Sở</span>
          </button>

          <button
            onClick={() => setActiveTab("facilities")}
            className={`px-4 py-2.5 rounded-2xl border transition flex items-center space-x-2 whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === "facilities"
                ? "bg-[#1d4ed8] text-white border-[#1d4ed8]"
                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            <Warehouse className="size-3.5" />
            <span>Danh Sách Cơ Sở Kho Hệ Thống</span>
          </button>

          <button
            onClick={() => setActiveTab("policies")}
            className={`px-4 py-2.5 rounded-2xl border transition flex items-center space-x-2 whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === "policies"
                ? "bg-[#1d4ed8] text-white border-[#1d4ed8]"
                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            <ShieldAlert className="size-3.5" />
            <span>Quy Định &amp; Chính Sách Thuê Chung</span>
          </button>

          <button
            onClick={() => setActiveTab("pricing")}
            className={`px-4 py-2.5 rounded-2xl border transition flex items-center space-x-2 whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === "pricing"
                ? "bg-[#1d4ed8] text-white border-[#1d4ed8]"
                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Khung Giá, Phụ Thu &amp; Giảm Giá</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2.5 rounded-2xl border transition flex items-center space-x-2 whitespace-nowrap cursor-pointer shadow-xs ${
              activeTab === "reports"
                ? "bg-[#1d4ed8] text-white border-[#1d4ed8]"
                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            <FileSpreadsheet className="size-3.5" />
            <span>Báo Cáo System &amp; Xuất Dữ Liệu</span>
          </button>
        </div>

        {/* SUBTAB 1: GIÁM SÁT & HIỆU SUẤT CƠ SỞ */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-slate-900 dark:text-white">
                  <TrendingUp className="size-4 text-blue-600" />
                  <span>BẢNG SO SÁNH HIỆU SUẤT HOẠT ĐỘNG GIỮA CÁC CƠ SỞ KHO</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-bold">Tháng báo cáo:</span>
                  <select className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
                    <option value="09/2026">Tháng 09 / 2026</option>
                    <option value="08/2026">Tháng 08 / 2026</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 uppercase font-black text-slate-600 dark:text-slate-300 text-[10px]">
                      <th className="p-3">Cơ Sở Kho</th>
                      <th className="p-3">Quản Lý Chi Nhánh</th>
                      <th className="p-3 text-center">Quy Mô Kho</th>
                      <th className="p-3 text-center">Đang Thuê</th>
                      <th className="p-3 text-right">Doanh Thu Tháng</th>
                      <th className="p-3 text-center">Đơn Quá Hạn</th>
                      <th className="p-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    {facilities.map((fac) => (
                      <tr key={fac.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900 dark:text-white">{fac.name}</div>
                          <div className="text-[11px] text-slate-500">{fac.address}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{fac.managerName}</div>
                          <div className="text-[11px] text-slate-500">{fac.managerEmail}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono font-bold">{fac.totalUnits}</span> Kho
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {fac.rentedUnits}
                          </span>
                          <span className="text-slate-400 font-bold">/{fac.totalUnits}</span>
                        </td>
                        <td className="p-3 text-right font-black text-blue-700 dark:text-blue-400 font-mono text-sm">
                          ₫{fac.monthlyRevenue.toLocaleString("vi-VN")}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] border ${
                              fac.overdueUnits > 0
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800"
                            }`}
                          >
                            {fac.overdueUnits > 0 ? `${fac.overdueUnits} Đơn quá hạn` : "0 Đơn"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenFacilityModal(fac)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: DANH SÁCH CƠ SỞ KHO HỆ THỐNG */}
        {activeTab === "facilities" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-slate-900 dark:text-white">
                  <Warehouse className="size-4 text-blue-600" />
                  <span>DANH SÁCH TẤT CẢ CÁC CƠ SỞ KHO LƯU TRỮ TOÀN HỆ THỐNG</span>
                </h3>
                <button
                  onClick={() => toast.info("Chức năng thêm cơ sở kho mới sẽ kích hoạt khi có chi nhánh mở rộng!")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>Thêm Cơ Sở Kho Mới</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facilities.map((fac) => (
                  <div
                    key={fac.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4 hover:border-blue-400 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-md">
                          {fac.code}
                        </span>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{fac.name}</h4>
                        <p className="text-xs text-slate-500">{fac.address}</p>
                      </div>
                      <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                        {fac.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Quản lý cơ sở:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{fac.managerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Sức chứa &amp; Sàn:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {fac.totalUnits} Kho • {fac.floorArea.toLocaleString()} m² sàn
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleOpenFacilityModal(fac)}
                        className="bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-800 dark:text-slate-200 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        Cấu hình chi nhánh
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: QUY ĐỊNH & CHÍNH SÁCH THUÊ CHUNG */}
        {activeTab === "policies" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-slate-900 dark:text-white">
                  <ShieldAlert className="size-4 text-indigo-600" />
                  <span>THIẾT LẬP CÁC QUY ĐỊNH &amp; CHÍNH SÁCH THUÊ CHUNG CHUỖI HỆ THỐNG</span>
                </h3>
                <button
                  onClick={() => toast.success("Đã lưu các thiết lập chính sách chung toàn hệ thống thành công!")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Lưu Thay Đổi Chính Sách
                </button>
              </div>

              <div className="space-y-4">
                {/* 1. Đặt cọc */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <h4 className="font-black text-xs uppercase text-blue-600 dark:text-blue-400">
                    1. CHÍNH SÁCH ĐẶT CỌC &amp; GIỮ CHỖ KHO
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Mức Tiền Cọc Mặc Định Cho Hợp Đồng
                      </label>
                      <select className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold">
                        <option>1 Tháng Tiền Thuê Kho (Khuyên Dùng)</option>
                        <option>2 Tháng Tiền Thuê Kho</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Áp dụng mặc định cho tất cả hợp đồng thuê mới.</p>
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Thời Gian Giữ Chỗ Tối Đa Khi Cọc Trước
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          defaultValue={7}
                          className="w-20 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-center"
                        />
                        <span className="font-bold text-slate-500">Ngày</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Sau 7 ngày không ký HĐ sẽ tự động hủy giữ chỗ.</p>
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Điều Kiện Hoàn Tiền Cọc Trả Kho
                      </label>
                      <input
                        type="text"
                        defaultValue="Thông báo trước ≥ 15 ngày & Không hư hại kho"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Hoàn cọc sau nghiệm thu và trừ phụ thu nếu có.</p>
                    </div>
                  </div>
                </div>

                {/* 2. Gia hạn & Hủy */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <h4 className="font-black text-xs uppercase text-indigo-600 dark:text-indigo-400">
                    2. CHÍNH SÁCH GIA HẠN &amp; HỦY HỢP ĐỒNG
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Tự Động Gửi Notification Gia Hạn HĐ
                      </label>
                      <select className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold">
                        <option>Trước 7 Ngày Hết Hạn (Mặc định)</option>
                        <option>Trước 15 Ngày Hết Hạn</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Gửi Push App &amp; Email nhắc gia hạn HĐ.</p>
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Thời Hạn Báo Trả Kho Trước Hạn
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          defaultValue={15}
                          className="w-20 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-center"
                        />
                        <span className="font-bold text-slate-500">Ngày</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Thời hạn tối thiểu khách cần báo trước khi trả.</p>
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Mức Phạt Khi Hủy HĐ Đột Ngột Trả Sớm
                      </label>
                      <select className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold">
                        <option>Khấu Trừ 50% Tiền Cọc</option>
                        <option>Khấu Trừ 100% Tiền Cọc</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Khấu trừ cọc khi trả sớm không báo trước.</p>
                    </div>
                  </div>
                </div>

                {/* 3. Nghiệm thu & Trả kho */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <h4 className="font-black text-xs uppercase text-emerald-600 dark:text-emerald-400">
                    3. QUY ĐỊNH NGHIỆM THU &amp; TRẢ KHO (CHECK-OUT)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Hình Thức Kiểm Tra &amp; Nghiệm Thu
                      </label>
                      <input
                        type="text"
                        readOnly
                        defaultValue="Xác Thực Ảnh Chụp App & Staff Nghiệm Thu Trực Tiếp"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Thời Gian Tối Đa Hoàn Trả Tiền Cọc
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          defaultValue={3}
                          className="w-20 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-center"
                        />
                        <span className="font-bold text-slate-500">Ngày Làm Việc</span>
                      </div>
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Phí Vệ Sinh Kho Phụ Thu (Nếu Không Dọn)
                      </label>
                      <input
                        type="text"
                        defaultValue="150,000 VNĐ"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Quá hạn & Khóa Smart Access */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <h4 className="font-black text-xs uppercase text-rose-600 dark:text-rose-400">
                    4. QUY TRÌNH XỬ LÝ QUÁ HẠN &amp; PHONG TỎA SMART ACCESS (BR-18 / BR-21)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Thời Gian Ân Hạn (Grace Period)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          defaultValue={3}
                          className="w-20 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-center"
                        />
                        <span className="font-bold text-slate-500">Ngày</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Ân hạn miễn phí phạt nợ quá hạn ban đầu.</p>
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Tự Động Phong Tỏa Mã PIN Cổng IoT
                      </label>
                      <input
                        type="text"
                        readOnly
                        defaultValue="Ngày Thứ 5 Quá Hạn (Tự động Vô hiệu hóa PIN BR-18)"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Niêm Phong Tài Sản &amp; Thanh Lý HĐ
                      </label>
                      <input
                        type="text"
                        readOnly
                        defaultValue="Quá 30 Ngày Không Thanh Toán (BR-21)"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 font-bold text-xs text-rose-600 dark:text-rose-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: KHUNG GIÁ, PHỤ THU & GIẢM GIÁ */}
        {activeTab === "pricing" && (
          <div className="space-y-6">
            {/* PRICING MATRIX SECTION */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-slate-900 dark:text-white">
                    <SlidersHorizontal className="size-4 text-indigo-600" />
                    <span>QUẢN LÝ KHUNG GIÁ THUÊ, PHÍ PHỤ THU, PHÍ PHẠT QUÁ HẠN &amp; GIẢM GIÁ</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Áp dụng toàn bộ 4 cơ sở kho hệ thống</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsSurchargeModalOpen(true)}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-4 text-indigo-600" />
                    <span>Thêm Phụ Thu / Giảm Giá</span>
                  </button>
                  <button
                    onClick={() => handleOpenPricingModal()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="size-4" />
                    <span>Cập Nhật Bảng Giá &amp; Phí</span>
                  </button>
                </div>
              </div>

              {/* Table 1: Base Rental Pricing Matrix */}
              <div className="space-y-2">
                <h4 className="font-black text-xs uppercase text-slate-800 dark:text-slate-200">
                  1. Khung Giá Thuê Tiêu Chuẩn Theo Size Kho (Base Rental Pricing Matrix)
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 uppercase font-black text-slate-600 dark:text-slate-300 text-[10px]">
                        <th className="p-3.5">Loại / Size Kho</th>
                        <th className="p-3.5 text-center">Kích Thước Sàn</th>
                        <th className="p-3.5 text-right">Kho Thường (Non-AC)</th>
                        <th className="p-3.5 text-right">Kho Điều Hòa (AC 22-24°C)</th>
                        <th className="p-3.5 text-center">Mức Cọc Yêu Cầu</th>
                        <th className="p-3.5 text-center">Trạng Thái Bảng Giá</th>
                        <th className="p-3.5 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {pricingList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="font-extrabold text-slate-900 dark:text-white">{item.name}</div>
                            <div className="text-[11px] text-slate-500">{item.description}</div>
                          </td>
                          <td className="p-3.5 text-center font-mono">
                            <span className="font-bold">{item.dimensions}</span>
                            <span className="text-slate-400 block text-[10px]">({item.area})</span>
                          </td>
                          <td className="p-3.5 text-right font-black font-mono text-emerald-600 text-sm">
                            ₫{item.normPrice.toLocaleString("vi-VN")} / tháng
                          </td>
                          <td className="p-3.5 text-right font-black font-mono text-blue-600 text-sm">
                            ₫{item.acPrice.toLocaleString("vi-VN")} / tháng
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                            {item.depositText}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-200 dark:border-emerald-800">
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleOpenPricingModal(item)}
                              className="text-indigo-600 dark:text-indigo-400 font-black hover:underline cursor-pointer"
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

              {/* Table 2: Additional Fees & Discounts */}
              <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-xs uppercase text-slate-800 dark:text-slate-200">
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
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
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
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
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

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 uppercase font-black text-slate-600 dark:text-slate-300 text-[10px]">
                        <th className="p-3">Phân Loại Hạng Mục Phí / Chính Sách</th>
                        <th className="p-3">Nội Dung Chi Tiết / Tên Hạng Mục</th>
                        <th className="p-3">Mức Phí / Mức Mới Áp Dụng</th>
                        <th className="p-3 text-center">Kích Hoạt</th>
                        <th className="p-3">Ghi Chú Vận Hành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {filteredSurcharges.map((sc) => (
                        <tr key={sc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3">
                            <span className="font-bold text-slate-500 text-[11px] block">{sc.categoryLabel}</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{sc.type}</span>
                          </td>
                          <td className="p-3 font-extrabold text-slate-900 dark:text-white">{sc.name}</td>
                          <td className="p-3 font-black font-mono text-slate-900 dark:text-white">{sc.rate}</td>
                          <td className="p-3 text-center">
                            <CheckCircle className="size-4 text-emerald-500 mx-auto" />
                          </td>
                          <td className="p-3 text-slate-500 text-xs">{sc.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: BÁO CÁO SYSTEM & XUẤT DỮ LIỆU */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-slate-900 dark:text-white">
                  <FileSpreadsheet className="size-4 text-blue-600" />
                  <span>XEM VÀ XUẤT BÁO CÁO TOÀN HỆ THỐNG (SYSTEM-WIDE REPORTS &amp; ANALYTICS)</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleExport("EXCEL")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet className="size-4" />
                    <span>Xuất Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleExport("PDF")}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileText className="size-4" />
                    <span>Xuất PDF Report</span>
                  </button>
                </div>
              </div>

              {/* Filter bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <div>
                  <label className="text-[10px] uppercase text-slate-400 block mb-1">Cơ Sở Kho:</label>
                  <select className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold">
                    <option>Tất Cả Các Cơ Sở (Toàn Hệ Thống)</option>
                    <option>SelfStorage Trụ Sở Quận 1</option>
                    <option>SelfStorage Nam Sài Gòn Q.7</option>
                    <option>SelfStorage TP. Thủ Đức</option>
                    <option>SelfStorage Sân Bay Tân Bình</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-400 block mb-1">Loại / Size Kho:</label>
                  <select className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold">
                    <option>Tất Cả Loại Kho (S, M, L, XL)</option>
                    <option>Size S</option>
                    <option>Size M</option>
                    <option>Size L</option>
                    <option>Size XL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-400 block mb-1">Trạng Thái Thuê:</label>
                  <select className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold">
                    <option>Tất Cả Trạng Thái</option>
                    <option>Đang Thuê</option>
                    <option>Trống</option>
                    <option>Quá Hạn</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-400 block mb-1">Khoảng Thời Gian:</label>
                  <select className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold">
                    <option>Tháng Hiện Tại (T09/2026)</option>
                    <option>Tháng 08 / 2026</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 uppercase font-black text-slate-600 dark:text-slate-300 text-[10px]">
                      <th className="p-3">Cơ Sở Kho Hệ Thống</th>
                      <th className="p-3">Loại / Size Kho Chi Tiết</th>
                      <th className="p-3 text-center">Quy Mô &amp; Đang Thuê</th>
                      <th className="p-3 text-center">Trạng Thái Thuê (%)</th>
                      <th className="p-3 text-right">Doanh Thu Thuê / Tháng</th>
                      <th className="p-3 text-right">Tổng Tiền Cọc (Deposit)</th>
                      <th className="p-3 text-right">Doanh Thu Thực Thu</th>
                      <th className="p-3 text-center">Hiệu Suất Vận Hành</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    {INITIAL_SYSTEM_REPORTS.map((row) => (
                      <tr key={row.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900 dark:text-white">{row.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {row.address} • Mã: <span className="font-mono text-blue-600 font-bold">{row.code}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{row.sizeDetail}</div>
                          <div className="text-[11px] text-blue-600">{row.typeDetail}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono font-bold">{row.totalUnits} Kho</span>
                          <span className="text-[11px] text-emerald-600 block font-bold">{row.rentedUnits} Đang thuê</span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="font-black text-blue-600 dark:text-blue-400 text-sm block">
                            {row.occupancyRate}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {row.vacantUnits} trống • {row.overdueUnits} quá hạn
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold">
                          ₫{row.rentalRevenue.toLocaleString("vi-VN")}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-500">
                          ₫{row.depositRevenue.toLocaleString("vi-VN")}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          ₫{row.netRevenue.toLocaleString("vi-VN")}
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold px-2.5 py-1 rounded-full text-[10px]">
                            {row.performanceBadge}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* TOTAL SUMMARY ROW */}
                    <tr className="bg-blue-50/60 dark:bg-slate-800 font-black border-t-2 border-indigo-300 dark:border-indigo-700">
                      <td className="p-3 text-blue-900 dark:text-blue-200 uppercase">TỔNG CỘNG TOÀN HỆ THỐNG</td>
                      <td className="p-3 text-blue-900 dark:text-blue-200">Tất Cả Loại Kho (S, M, L, XL, AC)</td>
                      <td className="p-3 text-center font-mono text-blue-900 dark:text-blue-200">
                        1,240 Kho / 1,098 Rented
                      </td>
                      <td className="p-3 text-center text-emerald-600 dark:text-emerald-400 font-mono">
                        88.5% Lấp Đầy TB (12 Quá Hạn)
                      </td>
                      <td className="p-3 text-right font-mono font-black text-blue-900 dark:text-blue-200">
                        ₫1,650,000,000
                      </td>
                      <td className="p-3 text-right font-mono font-black text-blue-900 dark:text-blue-200">
                        ₫1,850,000,000
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ₫1,850,000,000
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-600 text-white font-black px-2.5 py-1 rounded-full text-[10px]">
                          ▲ +14.2% Growth
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 1. MODAL CẤU HÌNH CƠ SỞ KHO */}
      {isFacilityModalOpen && selectedFacility && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-blue-600 dark:text-blue-400">
                  CHI TIẾT CẤU HÌNH CƠ SỞ KHO
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  Cơ sở {selectedFacility.name} • Mã: {selectedFacility.code}
                </p>
              </div>
              <button
                onClick={() => setIsFacilityModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                  FM
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Quản Lý Cơ Sở (Manager):</span>
                  <span className="font-extrabold text-blue-900 dark:text-blue-200 text-sm">
                    {selectedFacility.managerName}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Tổng Số Ô Kho Thiết Lập:
                  </label>
                  <input
                    type="number"
                    value={facilityTotalUnits}
                    onChange={(e) => setFacilityTotalUnits(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Hệ Số Giá Cơ Sở (Multiplier):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={facilityMultiplier}
                    onChange={(e) => setFacilityMultiplier(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] mb-1">
                  Ghi Chú Vận Hành BOM:
                </label>
                <textarea
                  rows={3}
                  value={facilityNote}
                  onChange={(e) => setFacilityNote(e.target.value)}
                  placeholder="Nhập ghi chú hoặc điều chỉnh chiến lược vận hành..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsFacilityModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleSaveFacilityModal}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL CẬP NHẬT KHUNG GIÁ */}
      {isPricingModalOpen && selectedPricing && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-indigo-600 dark:text-indigo-400">
                  CẬP NHẬT KHUNG GIÁ THUÊ THỦ CÔNG
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  Điều chỉnh đơn giá niêm yết cho các Size kho hệ thống
                </p>
              </div>
              <button
                onClick={() => setIsPricingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] mb-1">
                  Loại / Size Kho Áp Dụng:
                </label>
                <select
                  value={selectedPricing.id}
                  onChange={(e) => {
                    const found = pricingList.find((p) => p.id === e.target.value)
                    if (found) {
                      setSelectedPricing(found)
                      setEditNormPrice(found.normPrice)
                      setEditAcPrice(found.acPrice)
                      setEditDeposit(found.depositText)
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs"
                >
                  {pricingList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.area})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Giá Kho Thường (Non-AC):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editNormPrice}
                      onChange={(e) => setEditNormPrice(Number(e.target.value))}
                      className="w-full p-2.5 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-[10px]">VNĐ/tháng</span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Giá Kho Điều Hòa (AC 22-24°C):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editAcPrice}
                      onChange={(e) => setEditAcPrice(Number(e.target.value))}
                      className="w-full p-2.5 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-[10px]">VNĐ/tháng</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] mb-1">
                  Quy Định Tiền Cọc Mặc Định:
                </label>
                <select
                  value={editDeposit}
                  onChange={(e) => setEditDeposit(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs"
                >
                  <option value="1 Tháng Tiền Thuê">1 Tháng Tiền Thuê Kho</option>
                  <option value="2 Tháng Tiền Thuê">2 Tháng Tiền Thuê Kho</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsPricingModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleSavePricingModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL CẤU HÌNH PHỤ THU / GIẢM GIÁ */}
      {isSurchargeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSurcharge}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-indigo-600 dark:text-indigo-400">
                  CẤU HÌNH HẠNG MỤC PHÍ PHỤ THU / GIẢM GIÁ
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  Thêm mới hoặc cập nhật biểu phí, phụ thu &amp; chính sách ưu đãi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSurchargeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] mb-1">
                  Nhóm Phân Loại Hạng Mục:
                </label>
                <select
                  value={surchargeCat}
                  onChange={(e) => setSurchargeCat(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs"
                >
                  <option value="surcharge">1. Biểu Phí Phụ Thu (Surcharges)</option>
                  <option value="penalty">2. Phí Phạt Quá Hạn (Penalties)</option>
                  <option value="discount">3. Chính Sách Miễn Giảm Giá (Discount Policy)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] mb-1">
                  Nội Dung Chi Tiết / Tên Hạng Mục Phí:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phí Điện Kho Lạnh 24/7"
                  value={surchargeName}
                  onChange={(e) => setSurchargeName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] mb-1">
                  Mức Phí / Giá Trị Áp Dụng:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: ₫300,000 / tháng hoặc 1.5% / ngày"
                  value={surchargeRate}
                  onChange={(e) => setSurchargeRate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] mb-1">
                  Ghi Chú Vận Hành &amp; Điều Khoản Áp Dụng:
                </label>
                <textarea
                  rows={2}
                  value={surchargeNote}
                  onChange={(e) => setSurchargeNote(e.target.value)}
                  placeholder="Áp dụng mặc định cho các ô kho có điều hòa AC..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSurchargeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Lưu Hạng Mục
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. MODAL HỒ SƠ TÀI KHOẢN BOM */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                  Hồ Sơ Ban Quản Lý Vận Hành
                </h3>
                <p className="text-[10px] text-slate-500 font-bold">
                  BOM (Board of Management) System Account Profile
                </p>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  NV
                </div>
                <div>
                  <div className="font-black text-sm text-indigo-950 dark:text-indigo-200">
                    Nguyễn Văn BOM
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase mt-0.5">
                    ● ĐANG TRONG CA ĐIỀU HÀNH
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Chuyên viên Quản lý Vận hành • Ban Điều Hành Hệ Thống (BOM)
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-black uppercase text-slate-400">
                  1. Thông tin Định danh &amp; Công tác
                </div>
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Họ và Tên:</span>
                    <span className="text-slate-900 dark:text-white font-bold">Nguyễn Văn BOM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã Quản Lý:</span>
                    <span className="font-mono font-bold text-blue-600">BOM-HQ-8899</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số Điện Thoại:</span>
                    <span className="font-mono font-bold">0909 777 888</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-mono font-bold">bom.nguyen@swp391.vn</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => toast.info("Vui lòng liên hệ Admin để đổi mật khẩu tài khoản cấp cao.")}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Đổi Mật Khẩu
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <LogOut className="size-3.5" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
