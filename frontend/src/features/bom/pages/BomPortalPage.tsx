import { useState, useEffect } from "react"
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
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Radio,
} from "lucide-react"

import { LayoutGroup, motion, AnimatePresence } from "motion/react"
import { useTheme } from "@/components/common/theme-provider"
import { useAuth } from "@/context/AuthContext"
import ThreeBackground from "../components/ThreeBackground"
import { bomApi, type ChainDashboardData, type FacilityBreakdownItem } from "../api/bomApi"
import {
  type FacilityPerformance,
  type UnitPricing,
  type SurchargeItem,
} from "../data/bomData"

const NAV_ITEMS = [
  {
    id: "dashboard" as const,
    label: "Giám Sát Cơ Sở",
    shortDesc: "Theo dõi KPI toàn diện, tải chuỗi & cảnh báo vận hành",
    icon: TrendingUp,
  },
  {
    id: "facilities" as const,
    label: "Danh Sách Cơ Sở",
    shortDesc: "Quản lý 7 cụm cơ sở kho, sức chứa & tỷ lệ lấp đầy",
    icon: Warehouse,
  },
  {
    id: "policies" as const,
    label: "Quy Định Chính Sách",
    shortDesc: "Quy định lưu kho, tiêu chuẩn an ninh & chế tài xử lý nợ",
    icon: ShieldAlert,
  },
  {
    id: "pricing" as const,
    label: "Khung Giá Phụ Thu",
    shortDesc: "Biểu giá thuê kho chuẩn & phụ phí tiện ích toàn mạng lưới",
    icon: SlidersHorizontal,
  },
  {
    id: "reports" as const,
    label: "Báo Cáo Toàn Chuỗi",
    shortDesc: "Tổng hợp số liệu doanh thu, công nợ & phân tích hiệu suất",
    icon: FileSpreadsheet,
  },
]

export default function BomPortalPage() {
  const { theme, setTheme } = useTheme()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  // State Tabs: mặc định 'home' chỉ hiện Banner + 4 Thẻ chỉ số
  const [activeTab, setActiveTab] = useState<
    "home" | "dashboard" | "facilities" | "policies" | "pricing" | "reports"
  >("home")

  // Live Backend API Data States
  const [chainOverview, setChainOverview] = useState<ChainDashboardData | null>(null)
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(true)
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false)

  // State Data (100% dữ liệu từ API, mặc định rỗng / 0)
  const [facilities, setFacilities] = useState<FacilityPerformance[]>([])
  const [pricingList, setPricingList] = useState<UnitPricing[]>([])
  const [surcharges, setSurcharges] = useState<SurchargeItem[]>([])
  const [searchSurcharge, setSearchSurcharge] = useState("")
  const [surchargeFilter, setSurchargeFilter] = useState<"all" | "surcharge" | "penalty" | "discount">("all")

  // Fetch Live Data từ Spring Boot Backend (/api/admin/dashboard/chain-overview, /api/facilities, /api/units/filter)
  useEffect(() => {
    let isMounted = true

    const loadLiveData = async () => {
      try {
        setIsLoadingApi(true)
        const [overview, apiFacilities, apiUnits] = await Promise.all([
          bomApi.getChainDashboard().catch((err) => {
            console.warn("API /api/admin/dashboard/chain-overview lỗi:", err)
            return null
          }),
          bomApi.getFacilities().catch((err) => {
            console.warn("API /api/facilities lỗi:", err)
            return null
          }),
          bomApi.getUnits().catch((err) => {
            console.warn("API /api/units/filter lỗi:", err)
            return null
          }),
        ])

        if (!isMounted) return

        if (overview) {
          setChainOverview(overview)
          setIsApiConnected(true)
        }

        if (apiFacilities && apiFacilities.length > 0) {
          setIsApiConnected(true)
          const breakdownMap = new Map<number, FacilityBreakdownItem>(
            (overview?.facilityBreakdown || []).map((b) => [b.facilityId, b])
          )

          const mergedFacilities: FacilityPerformance[] = apiFacilities.map((f) => {
            const bd = breakdownMap.get(f.facilityId)
            return {
              id: `CS-${f.facilityId}`,
              code: f.facilityCode,
              name: f.facilityName,
              address: f.address,
              managerName: `Quản lý ${f.shortCode || f.facilityCode}`,
              managerEmail: `manager.${(f.shortCode || f.facilityCode).toLowerCase()}@smartstorage.vn`,
              totalUnits: bd ? Number(bd.totalUnits) : 0,
              rentedUnits: bd ? Number(bd.occupiedUnits) : 0,
              floorArea: (bd ? Number(bd.totalUnits) : 0) * 15,
              monthlyRevenue: bd ? Number(bd.netRevenue || bd.rentalRevenue) : 0,
              overdueUnits: bd ? Number(bd.overdueContracts) : 0,
              status: f.status,
              rating: bd && bd.occupancyRate >= 80 ? "5.0" : bd && bd.occupancyRate > 0 ? "4.5" : "—",
            }
          })
          setFacilities(mergedFacilities)
        }

        if (apiUnits && apiUnits.length > 0) {
          const sizeMap = new Map<string, UnitPricing>()
          apiUnits.forEach((u: any) => {
            let sizeKey: "S" | "M" | "L" | "XL" = "M"
            if (u.typeName?.includes("Size S") || u.size?.startsWith("1.0m")) sizeKey = "S"
            else if (u.typeName?.includes("Size M") || u.size?.startsWith("1.5m")) sizeKey = "M"
            else if (u.typeName?.includes("Size L") || u.size?.startsWith("2.0m")) sizeKey = "L"
            else if (u.typeName?.includes("Size XL") || u.size?.startsWith("2.5m")) sizeKey = "XL"

            if (!sizeMap.has(sizeKey)) {
              sizeMap.set(sizeKey, {
                id: `PRICE-${sizeKey}`,
                size: sizeKey,
                name: `Size ${sizeKey}`,
                description: u.typeName || `Kho lưu trữ chuẩn Size ${sizeKey}`,
                dimensions: u.size || "",
                area: `${u.areaM2 || 0} m²`,
                normPrice: Number(u.monthlyPrice) || 0,
                acPrice: Math.round(Number(u.monthlyPrice) * (1 + (Number(u.climateSurchargePercent) || 20) / 100)),
                depositText: `₫${Number(u.depositAmount || 0).toLocaleString("vi-VN")}`,
                status: "Đang Áp Dụng",
              })
            } else {
              const item = sizeMap.get(sizeKey)!
              if (u.storageCondition === "CLIMATE_CONTROLLED" || u.isClimate) {
                item.acPrice = Number(u.monthlyPrice) || item.acPrice
              } else {
                item.normPrice = Number(u.monthlyPrice) || item.normPrice
              }
            }
          })
          const sortedList: UnitPricing[] = (["S", "M", "L", "XL"] as const)
            .filter((s) => sizeMap.has(s))
            .map((s) => sizeMap.get(s)!)
          setPricingList(sortedList)
        }
      } catch (err) {
        console.error("Lỗi nạp dữ liệu BOM từ API:", err)
      } finally {
        if (isMounted) setIsLoadingApi(false)
      }
    }

    loadLiveData()

    return () => {
      isMounted = false
    }
  }, [])

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

  // Live API Calculations
  const totalOverdueCount = chainOverview
    ? (chainOverview.facilityBreakdown || []).reduce((sum, f) => sum + (f.overdueContracts || 0), 0)
    : 0

  const formatShortCurrency = (amount: number | string) => {
    const num = Number(amount) || 0
    if (num >= 1_000_000_000) {
      return `₫${(num / 1_000_000_000).toFixed(2)} Tỷ`
    }
    if (num >= 1_000_000) {
      return `₫${(num / 1_000_000).toFixed(1)} Triệu`
    }
    return `₫${num.toLocaleString("vi-VN")}`
  }

  return (
    <div className="relative min-h-screen text-slate-100 font-sans transition-colors duration-200 overflow-x-hidden">
      {/* 3D Dynamic Waves Background (Native Three.js - Theme responsive: dark xanh đen / light cyan) */}
      <ThreeBackground theme={theme} />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-xl border-b border-sky-500/20 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("home")}>
          <div className="w-10 h-10 rounded-2xl bg-sky-600/30 border border-sky-400/40 text-sky-400 flex items-center justify-center font-bold text-lg shadow-sm">
            <Warehouse className="size-5" />
          </div>
          <div>
            <div className="font-black text-sm sm:text-base text-white leading-tight tracking-wide flex items-center gap-2">
              <span>Smart Storage</span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300">
                BOM Portal
              </span>
              {isApiConnected ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live API
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                  Mock Mode
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Hệ thống cho thuê kho tự quản thông minh 24/7
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-3.5 py-1.5 rounded-full border border-sky-500/30 bg-slate-900/60 hover:bg-slate-800/80 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm text-slate-200"
          >
            {theme === "dark" ? (
              <>
                <Sun className="size-3.5 text-amber-400" />
                <span>Giao diện Sáng</span>
              </>
            ) : (
              <>
                <Moon className="size-3.5 text-sky-400" />
                <span>Giao diện Xanh đen</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center space-x-2.5 p-1 sm:px-3 sm:py-1.5 rounded-2xl border border-sky-500/30 bg-slate-900/60 hover:bg-slate-800/80 transition cursor-pointer shadow-sm text-white"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center">
              NV
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-extrabold text-white leading-tight">
                Nguyễn Văn BOM
              </div>
              <div className="text-[10px] text-sky-300/80 font-medium">
                Chuyên viên Quản lý Vận hành
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-8">
        <LayoutGroup id="bom-portal-nav">
          {activeTab === "home" ? (
            /* TRANG CHỦ ĐẦU VÀO: FULL HERO PORTAL (4 Ô CHỈ SỐ + HÀNG 5 NÚT NGANG) */
            <div className="space-y-10">
              <div className="text-center space-y-3 pt-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-wider uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
                  QUẢN LÝ VẬN HÀNH TOÀN HỆ THỐNG
                </h1>
                <p className="text-sky-300 font-semibold text-base sm:text-lg max-w-2xl mx-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                  Trung tâm điều hành cấp cao &amp; giám sát {chainOverview ? chainOverview.chainTotalFacilities : facilities.length} cụm cơ sở kho thông minh 24/7
                </p>
              </div>

              {/* 4 Ô CHỈ SỐ KPI THU NHỎ GỌN GÀNG, TINH TẾ (DỮ LIỆU TỰ ĐỘNG CẬP NHẬT TỪ API) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-5xl mx-auto">
                {/* Box 1: Tổng cơ sở */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/25 backdrop-blur-xs hover:bg-slate-950/45 transition-all duration-300 flex flex-col justify-between min-h-[125px] group">
                  <div className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>TỔNG CƠ SỞ KHO</span>
                    <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 group-hover:scale-110 transition-transform">
                      <Warehouse className="size-4" />
                    </div>
                  </div>
                  <div className="my-1.5">
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md flex items-baseline gap-1.5">
                      <span>{chainOverview ? chainOverview.chainTotalFacilities : facilities.length}</span>
                      <span className="text-xs sm:text-sm font-bold text-sky-400">Cơ sở</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {chainOverview
                      ? `${chainOverview.chainTotalUnits.toLocaleString("vi-VN")} Tổng số kho vận hành`
                      : "0 Tổng số kho vận hành"}
                  </div>
                </div>

                {/* Box 2: Tỉ lệ lấp đầy */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/25 backdrop-blur-xs hover:bg-slate-950/45 transition-all duration-300 flex flex-col justify-between min-h-[125px] group">
                  <div className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>TỈ LỆ LẤP ĐẦY TB</span>
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 group-hover:scale-110 transition-transform">
                      <TrendingUp className="size-4" />
                    </div>
                  </div>
                  <div className="my-1.5">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight drop-shadow-md">
                      {chainOverview ? `${chainOverview.chainAverageOccupancyRate}%` : "0%"}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {chainOverview
                      ? `${chainOverview.chainTotalActiveContracts} Hợp đồng đang thuê`
                      : "0 Hợp đồng đang thuê"}
                  </div>
                </div>

                {/* Box 3: Doanh thu */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/25 backdrop-blur-xs hover:bg-slate-950/45 transition-all duration-300 flex flex-col justify-between min-h-[125px] group">
                  <div className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>DOANH THU TOÀN CHUỖI</span>
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 group-hover:scale-110 transition-transform">
                      <DollarSign className="size-4" />
                    </div>
                  </div>
                  <div className="my-1.5">
                    <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight drop-shadow-md">
                      {chainOverview ? formatShortCurrency(chainOverview.chainNetRevenue) : "₫0"}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {chainOverview
                      ? `Thực thu: ₫${Number(chainOverview.chainNetRevenue).toLocaleString("vi-VN")}`
                      : "₫0"}
                  </div>
                </div>

                {/* Box 4: Cảnh báo */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/25 backdrop-blur-xs hover:bg-slate-950/45 transition-all duration-300 flex flex-col justify-between min-h-[125px] group">
                  <div className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>CẢNH BÁO QUÁ HẠN</span>
                    <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 group-hover:scale-110 transition-transform">
                      <AlertTriangle className="size-4" />
                    </div>
                  </div>
                  <div className="my-1.5">
                    <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight drop-shadow-md flex items-baseline gap-1.5">
                      <span>{chainOverview ? totalOverdueCount : 0}</span>
                      <span className="text-xs sm:text-sm font-bold text-rose-300">Kho</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {chainOverview
                      ? (totalOverdueCount > 0 ? "Cần kích hoạt BR-18 / BR-21" : "An toàn - Không có nợ quá hạn")
                      : "0 Đơn quá hạn"}
                  </div>
                </div>
              </div>

              {/* 5 Ô VUÔNG CHỨC NĂNG ĐỒNG BỘ VIỀN CYAN NEON (SHARED MOTION LAYOUT) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 pt-6 w-full max-w-7xl mx-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  return (
                    <motion.button
                      key={item.id}
                      layoutId={`bom-nav-btn-${item.id}`}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      onClick={() => setActiveTab(item.id)}
                      className="group p-5 sm:p-6 rounded-2xl sm:rounded-3xl min-h-[190px] sm:min-h-[220px] flex flex-col justify-between items-start text-left cursor-pointer border-2 border-sky-400/80 hover:border-sky-300 bg-slate-950/60 hover:bg-slate-900/80 shadow-[0_0_25px_rgba(56,189,248,0.25)] hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] hover:scale-[1.03] backdrop-blur-md relative overflow-hidden transition-colors"
                    >
                      <div className="flex items-center justify-between w-full">
                        <motion.div
                          layoutId={`bom-nav-icon-${item.id}`}
                          className="p-3.5 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors shadow-md"
                        >
                          <Icon className="size-6 sm:size-7" />
                        </motion.div>
                        <div className="p-2 rounded-xl text-slate-500 group-hover:text-sky-300 group-hover:bg-sky-500/10 transition-colors">
                          <ArrowUpRight className="size-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-1.5 w-full">
                        <motion.div
                          layoutId={`bom-nav-title-${item.id}`}
                          className="text-base sm:text-lg font-black text-white group-hover:text-sky-300 tracking-tight transition-colors"
                        >
                          {item.label}
                        </motion.div>
                        <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
                          {item.shortDesc}
                        </p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* GIAO DIỆN KHI CHỌN 1 MỤC: CHUYỂN THÀNH MENU BÊN TRÁI + NỘI DUNG BÊN PHẢI */
            <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
              {/* MENU BÊN TRÁI (Sticky Unified Sidebar Card) */}
              <div className="w-full lg:w-64 xl:w-72 shrink-0 space-y-1.5 sticky top-20 bg-slate-950/70 backdrop-blur-md rounded-2xl border border-sky-500/20 p-2.5 shadow-xl">
                <button
                  onClick={() => setActiveTab("home")}
                  className="w-full py-2.5 px-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/90 font-bold text-xs flex items-center justify-between transition cursor-pointer border border-transparent hover:border-sky-500/20 group mb-1"
                >
                  <span className="flex items-center space-x-2.5">
                    <ArrowLeft className="size-4 text-sky-400 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Về Trang Chủ</span>
                  </span>
                  <span className="text-[10px] uppercase font-black text-sky-400/80 bg-sky-500/10 px-1.5 py-0.5 rounded">
                    Home
                  </span>
                </button>

                {/* 5 Menu Items (Animate morph từ giữa màn hình sang xếp gọn menu bên trái) */}
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <motion.button
                      key={item.id}
                      layoutId={`bom-nav-btn-${item.id}`}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs tracking-wide flex items-center justify-between transition-colors duration-200 cursor-pointer ${
                        isActive
                          ? "bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-900/90 border border-transparent hover:border-sky-500/20"
                      }`}
                    >
                      <span className="flex items-center space-x-2.5 min-w-0">
                        <motion.span layoutId={`bom-nav-icon-${item.id}`} className="shrink-0">
                          <Icon className={`size-4.5 ${isActive ? "text-slate-950" : "text-sky-400"}`} />
                        </motion.span>
                        <motion.span layoutId={`bom-nav-title-${item.id}`} className="truncate">
                          {item.label}
                        </motion.span>
                      </span>
                      <ChevronRight className={`size-3.5 shrink-0 ${isActive ? "text-slate-950" : "text-slate-500"}`} />
                    </motion.button>
                  )
                })}
              </div>

              {/* CỘT NỘI DUNG BÊN PHẢI (Right Content Panel with smooth slide-in) */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 min-w-0 space-y-6"
              >

        {/* SUBTAB 1: GIÁM SÁT & HIỆU SUẤT CƠ SỞ */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-sky-500/20 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-white">
                  <TrendingUp className="size-4.5 text-sky-400" />
                  <span>BẢNG SO SÁNH HIỆU SUẤT HOẠT ĐỘNG GIỮA CÁC CƠ SỞ KHO</span>
                </h3>
                <div className="flex items-center space-x-2">
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
                      <th className="py-3 px-4 text-center">ĐANG THUÊ</th>
                      <th className="py-3 px-4 text-center">DOANH THU THÁNG</th>
                      <th className="py-3 px-4 text-center">ĐƠN QUÁ HẠN</th>
                      <th className="py-3 px-4 text-center">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium text-slate-300">
                    {facilities.length > 0 ? (
                      facilities.map((fac) => (
                        <tr key={fac.id} className="hover:bg-slate-900/60 transition">
                          <td className="py-4 px-4">
                            <div className="font-extrabold text-white text-xs">{fac.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{fac.address}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-white text-xs">{fac.managerName}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{fac.managerEmail}</div>
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-slate-200">
                            {fac.totalUnits} Kho
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-black text-emerald-400">
                              {fac.rentedUnits}
                            </span>
                            <span className="text-slate-400">/{fac.totalUnits}</span>
                          </td>
                          <td className="py-4 px-4 text-center font-black text-sky-400 font-mono text-xs">
                            ₫{fac.monthlyRevenue.toLocaleString("vi-VN").replace(/,/g, ".")}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`font-semibold px-3 py-1 rounded-full text-[10px] inline-block ${
                                fac.overdueUnits > 0
                                  ? "bg-rose-950/60 text-rose-300 border border-rose-800/40"
                                  : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                              }`}
                            >
                              {fac.overdueUnits > 0 ? `${fac.overdueUnits} Đơn quá hạn` : "0 Đơn"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => handleOpenFacilityModal(fac)}
                              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-full shadow-xs transition cursor-pointer"
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                          Chưa có dữ liệu cơ sở từ hệ thống
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: DANH SÁCH CƠ SỞ KHO HỆ THỐNG */}
        {activeTab === "facilities" && (
          <div className="space-y-6">
            <div className="bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-sky-500/20 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-white">
                  <Warehouse className="size-4.5 text-sky-400" />
                  <span>DANH SÁCH TẤT CẢ CÁC CƠ SỞ KHO LƯU TRỮ TOÀN HỆ THỐNG</span>
                </h3>
                <button
                  onClick={() => toast.info("Chức năng thêm cơ sở kho mới sẽ kích hoạt khi có chi nhánh mở rộng!")}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.25)]"
                >
                  <Plus className="size-4" />
                  <span>Thêm Cơ Sở Kho Mới</span>
                </button>
              </div>

              {facilities.length > 0 ? (
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
            ) : (
              <div className="p-12 text-center text-slate-400 italic">
                Chưa có dữ liệu cơ sở kho từ hệ thống
              </div>
            )}
          </div>
        </div>
      )}

        {/* SUBTAB 3: QUY ĐỊNH & CHÍNH SÁCH THUÊ CHUNG */}
        {activeTab === "policies" && (
          <div className="space-y-6">
            <div className="bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-sky-500/20 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-white">
                    <ShieldAlert className="size-4.5 text-sky-400" />
                    <span>THIẾT LẬP CÁC QUY ĐỊNH &amp; CHÍNH SÁCH THUÊ CHUỖI HỆ THỐNG</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Áp dụng thống nhất cho toàn bộ các cơ sở kho và hợp đồng tự quản 24/7
                  </p>
                </div>
                <button
                  onClick={() => toast.success("Đã lưu các thiết lập chính sách chung toàn hệ thống thành công!")}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.3)] shrink-0"
                >
                  Lưu Thay Đổi Chính Sách
                </button>
              </div>

              <div className="space-y-4">
                {/* 1. Đặt cọc */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      Mục 01
                    </span>
                    <h4 className="font-extrabold text-xs uppercase text-slate-200">
                      Chính Sách Đặt Cọc &amp; Giữ Chỗ Kho
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                    <div className="md:col-span-4">
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                        Mức Tiền Cọc Mặc Định Cho Hợp Đồng
                      </label>
                      <select className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white font-bold text-xs focus:border-sky-400 outline-none">
                        <option>1 Tháng Tiền Thuê Kho (Khuyên Dùng)</option>
                        <option>2 Tháng Tiền Thuê Kho</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Áp dụng mặc định cho tất cả hợp đồng thuê mới.</p>
                    </div>
                    <div className="md:col-span-3">
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                        Thời Gian Giữ Chỗ Tối Đa
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          defaultValue={7}
                          className="w-20 p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white font-bold text-center text-xs focus:border-sky-400 outline-none"
                        />
                        <span className="font-bold text-slate-400">Ngày</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Tự hủy giữ chỗ nếu quá hạn.</p>
                    </div>
                    <div className="md:col-span-5">
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                        Điều Kiện Hoàn Tiền Cọc Trả Kho
                      </label>
                      <input
                        type="text"
                        defaultValue="Thông báo trước ≥ 15 ngày & Không hư hại kho"
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white font-bold text-xs focus:border-sky-400 outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Hoàn cọc sau nghiệm thu và trừ phụ thu nếu có.</p>
                    </div>
                  </div>
                </div>

                {/* 2. Gia hạn & Hủy */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      Mục 02
                    </span>
                    <h4 className="font-extrabold text-xs uppercase text-slate-200">
                      Chính Sách Gia Hạn &amp; Hủy Hợp Đồng
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                    <div className="md:col-span-4">
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                        Tự Động Gửi Notification Gia Hạn HĐ
                      </label>
                      <select className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white font-bold text-xs focus:border-sky-400 outline-none">
                        <option>Trước 7 Ngày Hết Hạn (Mặc định)</option>
                        <option>Trước 15 Ngày Hết Hạn</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Gửi Push App &amp; Email nhắc gia hạn HĐ.</p>
                    </div>
                    <div className="md:col-span-3">
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                        Thời Hạn Báo Trả Trước Hạn
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          defaultValue={15}
                          className="w-20 p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white font-bold text-center text-xs focus:border-sky-400 outline-none"
                        />
                        <span className="font-bold text-slate-400">Ngày</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Thời hạn tối thiểu báo trước.</p>
                    </div>
                    <div className="md:col-span-5">
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                        Mức Phạt Khi Hủy HĐ Đột Ngột Trả Sớm
                      </label>
                      <select className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white font-bold text-xs focus:border-sky-400 outline-none">
                        <option>Khấu Trừ 50% Tiền Cọc</option>
                        <option>Khấu Trừ 100% Tiền Cọc</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Khấu trừ cọc khi trả sớm không báo trước.</p>
                    </div>
                  </div>
                </div>

                {/* 3. Nghiệm thu & Trả kho */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Mục 03
                    </span>
                    <h4 className="font-extrabold text-xs uppercase text-slate-200">
                      Quy Định Nghiệm Thu &amp; Trả Kho (Check-out)
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                    <div className="md:col-span-5">
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                        Hình Thức Kiểm Tra &amp; Nghiệm Thu
                      </label>
                      <input
                        type="text"
                        readOnly
                        defaultValue="Xác Thực Ảnh Chụp App & Staff Nghiệm Thu Trực Tiếp"
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-slate-200 font-bold text-xs focus:border-sky-400 outline-none"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                        Thời Gian Hoàn Trả Tiền Cọc
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          defaultValue={3}
                          className="w-20 p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white font-bold text-center text-xs focus:border-sky-400 outline-none"
                        />
                        <span className="font-bold text-slate-400">Ngày làm việc</span>
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                        Phí Vệ Sinh Kho Phụ Thu (Nếu Không Dọn)
                      </label>
                      <input
                        type="text"
                        defaultValue="150,000 VNĐ"
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white font-bold text-xs focus:border-sky-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Quá hạn & Khóa Smart Access */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      Mục 04
                    </span>
                    <h4 className="font-extrabold text-xs uppercase text-slate-200">
                      Quy Trình Xử Lý Quá Hạn &amp; Phong Tỏa Smart Access (BR-18 / BR-21)
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                    <div className="md:col-span-3">
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                        Thời Gian Ân Hạn (Grace Period)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          defaultValue={3}
                          className="w-20 p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white font-bold text-center text-xs focus:border-sky-400 outline-none"
                        />
                        <span className="font-bold text-slate-400">Ngày</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Ân hạn miễn phí phạt ban đầu.</p>
                    </div>
                    <div className="md:col-span-5">
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                        Tự Động Phong Tỏa Mã PIN Cổng IoT
                      </label>
                      <input
                        type="text"
                        readOnly
                        defaultValue="Ngày Thứ 5 Quá Hạn (Tự động Vô hiệu hóa PIN BR-18)"
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-amber-300 font-bold text-xs focus:border-sky-400 outline-none"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                        Niêm Phong Tài Sản &amp; Thanh Lý HĐ
                      </label>
                      <input
                        type="text"
                        readOnly
                        defaultValue="Quá 30 Ngày Không Thanh Toán (BR-21)"
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-rose-400 font-bold text-xs focus:border-sky-400 outline-none"
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
            <div className="bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-sky-500/20 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-white">
                    <SlidersHorizontal className="size-4.5 text-sky-400" />
                    <span>QUẢN LÝ KHUNG GIÁ THUÊ, PHÍ PHỤ THU, PHÍ PHẠT QUÁ HẠN &amp; GIẢM GIÁ</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Áp dụng toàn bộ 4 cơ sở kho hệ thống</p>
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
                      {pricingList.length > 0 ? (
                        pricingList.map((item) => (
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                            Chưa có dữ liệu bảng giá từ API
                          </td>
                        </tr>
                      )}
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
                      {filteredSurcharges.length > 0 ? (
                        filteredSurcharges.map((sc) => (
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                            Chưa có dữ liệu phụ phí / 0 phụ phí
                          </td>
                        </tr>
                      )}
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
            <div className="bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-sky-500/20 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-white">
                  <FileSpreadsheet className="size-4.5 text-sky-400" />
                  <span>BÁO CÁO TOÀN HỆ THỐNG (SYSTEM-WIDE REPORTS &amp; ANALYTICS)</span>
                </h3>
              </div>

              {/* Filter bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <div>
                  <label className="text-[10px] uppercase text-slate-400 block mb-1">Cơ Sở Kho:</label>
                  <select className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold">
                    <option value="all">Tất Cả Các Cơ Sở ({facilities.length} Cơ Sở)</option>
                    {facilities.map((f) => (
                      <option key={f.id} value={f.code}>{f.name}</option>
                    ))}
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
                    {chainOverview && chainOverview.facilityBreakdown && chainOverview.facilityBreakdown.length > 0 ? (
                      chainOverview.facilityBreakdown.map((row) => {
                        const matchedFacility = facilities.find(
                          (f) => f.code === row.facilityCode || f.id === `CS-${row.facilityId}`
                        )
                        return (
                          <tr key={row.facilityCode || row.facilityId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="p-3">
                              <div className="font-extrabold text-slate-900 dark:text-white">{row.facilityName}</div>
                              <div className="text-[11px] text-slate-500">
                                {matchedFacility?.address || "Hệ thống cơ sở kho"} • Mã: <span className="font-mono text-blue-600 font-bold">{row.facilityCode}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900 dark:text-white">Tất Cả Loại Kho</div>
                              <div className="text-[11px] text-blue-600">Standard / Climate</div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-mono font-bold">{row.totalUnits} Kho</span>
                              <span className="text-[11px] text-emerald-600 block font-bold">{row.occupiedUnits} Đang thuê</span>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-black text-blue-600 dark:text-blue-400 text-sm block">
                                {row.occupancyRate}%
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {row.availableUnits} trống • {row.overdueContracts} quá hạn
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold">
                              ₫{Number(row.rentalRevenue || 0).toLocaleString("vi-VN")}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-500">
                              ₫{Number(row.depositHolding || 0).toLocaleString("vi-VN")}
                            </td>
                            <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              ₫{Number(row.netRevenue || 0).toLocaleString("vi-VN")}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`font-extrabold px-2.5 py-1 rounded-full text-[10px] ${
                                  row.occupancyRate >= 80
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                                    : row.occupancyRate > 0
                                    ? "bg-sky-50 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {row.occupancyRate >= 80
                                  ? "★★★★★ Tối ưu"
                                  : row.occupancyRate >= 50
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
                    {/* TOTAL SUMMARY ROW - 100% TỪ LIVE API / 0 */}
                    <tr className="bg-blue-50/60 dark:bg-slate-800 font-black border-t-2 border-indigo-300 dark:border-indigo-700">
                      <td className="p-3 text-blue-900 dark:text-blue-200 uppercase">TỔNG CỘNG TOÀN HỆ THỐNG</td>
                      <td className="p-3 text-blue-900 dark:text-blue-200">Tất Cả Loại Kho (S, M, L, XL, AC)</td>
                      <td className="p-3 text-center font-mono text-blue-900 dark:text-blue-200">
                        {chainOverview ? `${chainOverview.chainTotalUnits} Kho / ${chainOverview.chainTotalActiveContracts} Đang thuê` : "0 Kho / 0 Đang thuê"}
                      </td>
                      <td className="p-3 text-center text-emerald-600 dark:text-emerald-400 font-mono">
                        {chainOverview ? `${chainOverview.chainAverageOccupancyRate}% Lấp Đầy TB (${totalOverdueCount} Quá Hạn)` : "0% Lấp Đầy TB (0 Quá Hạn)"}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-blue-900 dark:text-blue-200">
                        ₫{chainOverview ? Number(chainOverview.chainTotalRevenue || 0).toLocaleString("vi-VN") : "0"}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-blue-900 dark:text-blue-200">
                        ₫{chainOverview ? Number(chainOverview.chainDepositHolding || 0).toLocaleString("vi-VN") : "0"}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ₫{chainOverview ? Number(chainOverview.chainNetRevenue || 0).toLocaleString("vi-VN") : "0"}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-600 text-white font-black px-2.5 py-1 rounded-full text-[10px]">
                          {chainOverview ? `${chainOverview.chainAverageOccupancyRate}% Tỷ lệ lấp đầy` : "0%"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
              </motion.div>
            </div>
          )}
        </LayoutGroup>
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
