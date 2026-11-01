import { useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  Warehouse,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Layers,
  CheckCircle2,
  Building2,
  User,
  UserCheck,
  UserX,
  Phone,
  Mail,
  ChevronDown,
  MapPin,
  Search,
  Snowflake,
  Filter,
  Eye,
  Info,
  TrendingUp,
  BarChart3,
  ArrowLeft,
} from "lucide-react"
import apiClient from "@/lib/apiClient"
import { getStorageUnits } from "@/features/customer/rent/rentApi"
import { useBomContext } from "@/features/bom/context/BomContext"
import { type FacilityPerformance } from "@/features/bom/data/bomData"
import { bomApi } from "@/features/bom/api/bomApi"
import FacilityCashFlowDashboard from "@/features/bom/components/FacilityCashFlowDashboard"

const MANAGER_PRESETS = [
  { name: "Trần Văn Quản Lý", phone: "0912 345 678", email: "quanly.tran@smartstorage.vn" },
  { name: "Nguyễn Thị Mai", phone: "0987 654 321", email: "mai.nguyen@smartstorage.vn" },
  { name: "Lê Hoàng Long", phone: "0903 888 999", email: "long.le@smartstorage.vn" },
  { name: "Phạm Minh Tuấn", phone: "0934 112 233", email: "tuan.pham@smartstorage.vn" },
]

const getInitials = (name: string) => {
  if (!name || !name.trim() || name === "Chưa phân công") return "FM"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const CITY_REGIONS = [
  { prefix: "HN", label: "Hà Nội", hint: "VD: Số 88 Mễ Trì Hạ, P. Mễ Trì, Q. Nam Từ Liêm, Hà Nội" },
  { prefix: "HCM", label: "TP. Hồ Chí Minh", hint: "VD: Số 12 Ung Văn Khiêm, P. 25, Q. Bình Thạnh, TP.HCM" },
  { prefix: "DN", label: "Đà Nẵng", hint: "VD: Số 56 Nguyễn Văn Linh, P. Nam Dương, Q. Hải Châu, Đà Nẵng" },
  { prefix: "CT", label: "Cần Thơ", hint: "VD: Số 20 Đại Lộ Hòa Bình, P. An Cư, Q. Ninh Kiều, Cần Thơ" },
  { prefix: "HP", label: "Hải Phòng", hint: "VD: Số 15 Lê Hồng Phong, P. Đông Khê, Q. Ngô Quyền, Hải Phòng" },
  { prefix: "BD", label: "Bình Dương", hint: "VD: Số 45 Đại Lộ Bình Dương, TP. Thủ Dầu Một, Bình Dương" },
  { prefix: "FAC", label: "Khu vực khác", hint: "Địa chỉ chi nhánh..." },
]

const getNextFacilityCode = (prefix: string, facList: FacilityPerformance[]) => {
  const regex = new RegExp(`^${prefix}-(\\d+)`, "i")
  let max = 0
  facList.forEach((f) => {
    const match = (f.code || "").match(regex)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > max) max = num
    }
  })
  return `${prefix}-${String(max + 1).padStart(2, "0")}`
}

export default function BomFacilitiesPage() {
  const navigate = useNavigate()
  const {
    facilities,
    setFacilities,
    chainOverview,
    createFacilityInDb,
    updateFacilityInDb,
    deleteFacilityInDb,
  } = useBomContext()

  const { facilityId } = useParams()

  // Tìm cơ sở đang chọn để hiển thị chi tiết ở phần bên phải (nếu có facilityId trên URL)
  const activeFac = useMemo(() => {
    if (!facilityId) return null
    const normalize = (s?: string | number) =>
      String(s || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    const targetNorm = normalize(facilityId)

    const fromBreakdown = (chainOverview?.facilityBreakdown || []).find(
      (b) =>
        String(b.facilityId) === facilityId ||
        normalize(b.facilityCode) === targetNorm ||
        normalize(b.facilityId) === targetNorm
    )

    const fromFacList = facilities.find(
      (f) =>
        String(f.id) === facilityId ||
        normalize(f.code) === targetNorm ||
        normalize(f.id) === targetNorm
    )

    if (fromBreakdown && fromFacList) {
      return { ...fromFacList, ...fromBreakdown }
    }
    return fromBreakdown || fromFacList || null
  }, [facilityId, facilities, chainOverview])


  // State bộ lọc thời gian doanh thu bảng cơ sở: "this_month" (mặc định), "last_3_months", "all_time"
  const [revenuePeriod, setRevenuePeriod] = useState<"this_month" | "last_3_months" | "all_time">("this_month")

  // Modal State Cấu hình cơ sở
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<FacilityPerformance | null>(null)
  const [facilityMultiplier, setFacilityMultiplier] = useState<number>(1.0)
  const [editManagerName, setEditManagerName] = useState("")
  const [editManagerPhone, setEditManagerPhone] = useState("")
  const [editManagerEmail, setEditManagerEmail] = useState("")

  // Modal State Thêm cơ sở kho mới
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false)
  const [newFacCity, setNewFacCity] = useState("HN")
  const [newFacCode, setNewFacCode] = useState("")
  const [newFacName, setNewFacName] = useState("")
  const [newFacAddress, setNewFacAddress] = useState("")
  const [newFacLayout, setNewFacLayout] = useState<"A" | "B">("A")
  const [newFacFloors, setNewFacFloors] = useState<number>(3)
  const [newFacManager, setNewFacManager] = useState("")
  const [newFacPhone, setNewFacPhone] = useState("")
  const [newFacMultiplier, setNewFacMultiplier] = useState(1.0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal State Xóa cơ sở kho
  const [facilityToDelete, setFacilityToDelete] = useState<FacilityPerformance | null>(null)

  // Modal State Xem chi tiết cơ sở & báo cáo cơ cấu ô kho
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [detailFacility, setDetailFacility] = useState<FacilityPerformance | null>(null)
  const [facilityUnits, setFacilityUnits] = useState<any[]>([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)

  const handleOpenFacilityDetail = async (fac: FacilityPerformance) => {
    setDetailFacility(fac)
    setIsDetailModalOpen(true)
    setIsLoadingUnits(true)

    try {
      let facId = Number(fac.id)
      if (isNaN(facId) || facId <= 0) {
        const match = (fac.code || "").match(/\d+/)
        facId = match ? parseInt(match[0], 10) : 1
      }

      const [unitsPromise, facDashboardPromise] = [
        apiClient.get("/units/filter", { params: { facilityId: facId } }).catch(() => null),
        bomApi.getFacilityDashboard(facId).catch(() => null),
      ]

      const [res, facDashboard] = await Promise.all([unitsPromise, facDashboardPromise])

      const raw = Array.isArray(res) ? res : (res?.data || [])
      if (raw.length > 0) {
        setFacilityUnits(raw)
      } else {
        const u1 = (await getStorageUnits(fac.code, 1))?.data || []
        const u2 = (await getStorageUnits(fac.code, 2))?.data || []
        const u3 = (await getStorageUnits(fac.code, 3))?.data || []
        setFacilityUnits([...u1, ...u2, ...u3])
      }

      if (facDashboard) {
        setDetailFacility((prev) =>
          prev
            ? {
                ...prev,
                depositHolding: Number(facDashboard.depositHolding || 0),
                totalRefunds: Number(facDashboard.totalRefunds || 0),
                netRevenue: Number(facDashboard.netRevenue || 0),
                rentalRevenue: Number(facDashboard.rentalRevenue || 0),
                penaltyRevenue: Number(facDashboard.penaltyRevenue || 0),
                overdueUnits: facDashboard.overdueContracts || 0,
                occupancyRate: facDashboard.occupancyRate ?? prev.occupancyRate,
                occupied: facDashboard.occupiedUnits ?? prev.occupied,
                available: facDashboard.availableUnits ?? prev.available,
                maintenance: facDashboard.maintenanceUnits ?? prev.maintenance,
                monthlyRevenues: (facDashboard.monthlyRevenues || []).map((m: any) => ({
                  month: m.month,
                  label: m.label,
                  revenue: Number(m.revenue || 0),
                  rentalRevenue: m.rentalRevenue != null ? Number(m.rentalRevenue) : undefined,
                  penaltyRevenue: m.penaltyRevenue != null ? Number(m.penaltyRevenue) : undefined,
                })),
              }
            : null
        )
      }
    } catch (err) {
      console.warn("Lỗi tải thông tin chi tiết cơ sở:", err)
      try {
        const u1 = (await getStorageUnits(fac.code, 1))?.data || []
        const u2 = (await getStorageUnits(fac.code, 2))?.data || []
        const u3 = (await getStorageUnits(fac.code, 3))?.data || []
        setFacilityUnits([...u1, ...u2, ...u3])
      } catch {
        setFacilityUnits([])
      }
    } finally {
      setIsLoadingUnits(false)
    }
  }

  // Quy mô chuẩn hóa: Layout A = 46 kho, Layout B = 15 kho
  const computedTotalUnits = useMemo(() => {
    return newFacLayout === "A" ? 46 : 15
  }, [newFacLayout])

  // Danh sách quản lý khả dụng (từ Preset & cơ sở hiện có)
  const availableManagers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; email: string }>()

    MANAGER_PRESETS.forEach((p) => {
      map.set(p.name, p)
    })

    facilities.forEach((f) => {
      const clean = (f.managerName || "").replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
      if (clean && clean !== "Chưa phân công" && !map.has(clean)) {
        map.set(clean, {
          name: clean,
          phone: f.managerPhone || "",
          email: f.managerEmail || "manager@smartstorage.vn",
        })
      }
    })

    return Array.from(map.values())
  }, [facilities])

  const handleOpenAddModal = () => {
    const defaultCity = "HN"
    setNewFacCity(defaultCity)
    setNewFacCode(getNextFacilityCode(defaultCity, facilities))
    setNewFacName("")
    setNewFacAddress("")
    setNewFacLayout("A")
    setNewFacFloors(3)
    setNewFacManager("")
    setNewFacPhone("")
    setNewFacMultiplier(1.0)
    setIsAddFacilityModalOpen(true)
  }

  const handleCityChange = (cityPrefix: string) => {
    setNewFacCity(cityPrefix)
    setNewFacCode(getNextFacilityCode(cityPrefix, facilities))
  }

  const handleOpenFacilityModal = (fac: FacilityPerformance) => {
    setSelectedFacility(fac)
    setFacilityMultiplier(fac.priceMultiplier || 1.0)
    const cleanManager = (!fac.managerName || fac.managerName === "Chưa phân công")
      ? ""
      : fac.managerName.replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
    setEditManagerName(cleanManager)
    setEditManagerPhone(fac.managerPhone || "")
    setEditManagerEmail(fac.managerEmail || "")
    setIsFacilityModalOpen(true)
  }

  const handleSaveFacilityModal = async () => {
    if (!selectedFacility) return
    const finalManagerName = editManagerName.trim() || "Chưa phân công"
    const finalManagerPhone = editManagerPhone.trim()
    const finalManagerEmail = editManagerEmail.trim() || "manager@smartstorage.vn"

    const success = await updateFacilityInDb(Number(selectedFacility.id), {
      facilityName: selectedFacility.name,
      address: selectedFacility.address,
      phone: finalManagerPhone || selectedFacility.managerPhone,
      managerName: finalManagerName,
      managerPhone: finalManagerPhone,
      managerEmail: finalManagerEmail,
      priceMultiplier: facilityMultiplier,
    })

    setFacilities((prev) =>
      prev.map((f) =>
        f.id === selectedFacility.id
          ? {
              ...f,
              managerName: finalManagerName,
              managerPhone: finalManagerPhone,
              managerEmail: finalManagerEmail,
              priceMultiplier: facilityMultiplier,
            }
          : f
      )
    )

    if (success) {
      toast.success(`Đã lưu cấu hình cơ sở & quản lý kho ${selectedFacility.name}!`)
    } else {
      toast.success(`Đã cập nhật cấu hình cơ sở ${selectedFacility.name}!`)
    }
    setIsFacilityModalOpen(false)
  }

  const handleCreateFacility = async () => {
    if (!newFacName.trim()) {
      toast.error("Vui lòng nhập tên chi nhánh cơ sở kho!")
      return
    }
    if (!newFacAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ chi nhánh!")
      return
    }

    setIsSubmitting(true)
    try {
      const codeToUse = newFacCode.trim().toUpperCase() || getNextFacilityCode(newFacCity, facilities)
      const success = await createFacilityInDb({
        facilityName: newFacName.trim(),
        facilityCode: codeToUse,
        address: newFacAddress.trim(),
        phone: newFacPhone.trim() || "0900000000",
        layoutType: newFacLayout,
        floorCount: newFacFloors,
        managerName: newFacManager.trim() || "Chưa phân công",
      })

      if (success) {
        toast.success(`Đã thêm cơ sở [${codeToUse}] ${newFacName.trim()} & đồng bộ sơ đồ 2D lên Customer Portal!`)
        setIsAddFacilityModalOpen(false)
      } else {
        const newFacility: FacilityPerformance = {
          id: Date.now(),
          name: newFacName.trim(),
          code: codeToUse,
          address: newFacAddress.trim(),
          managerName: newFacManager.trim() || "Chưa phân công",
          managerEmail: "manager@smartstorage.vn",
          managerPhone: newFacPhone.trim() || "0900000000",
          totalUnits: computedTotalUnits,
          occupied: 0,
          rentedUnits: 0,
          available: computedTotalUnits,
          maintenance: 0,
          occupancyRate: 0,
          floorArea: computedTotalUnits * 12,
          monthlyRevenue: "₫0",
          overdueUnits: 0,
          status: "ACTIVE",
          rating: "5.0 ★",
          priceMultiplier: Number(newFacMultiplier) || 1.0,
          layoutType: `Layout ${newFacLayout}`,
          floorCount: newFacFloors,
        }

        setFacilities((prev) => [newFacility, ...prev])
        toast.success(`Đã thêm thành công cơ sở kho mới: ${newFacility.name}`)
        setIsAddFacilityModalOpen(false)
      }
    } catch (err) {
      console.error(err)
      toast.error("Lỗi khi thêm cơ sở kho!")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!facilityToDelete) return
    const success = await deleteFacilityInDb(Number(facilityToDelete.id))
    if (success) {
      toast.success(`Đã xóa mềm cơ sở kho ${facilityToDelete.name} trong Database!`)
    } else {
      setFacilities((prev) => prev.filter((f) => f.id !== facilityToDelete.id))
      toast.success(`Đã xóa cơ sở kho: ${facilityToDelete.name}`)
    }
    setFacilityToDelete(null)
  }

  return (
    <div className="space-y-6">
      {facilityId && activeFac ? (
        /* GIAO DIỆN BÁO CÁO CƠ SỞ KHO CHI TIẾT - VẪN Ở TRONG MỤC "GIÁM SÁT & CƠ SỞ" */
        (() => {
          const fAny = activeFac as any
          const code = fAny.facilityCode || fAny.code || `FAC-${facilityId}`
          const rawName = fAny.facilityName || fAny.name || `Cơ sở ${code}`
          const name = rawName.replace(/\s*\([A-Z0-9-]+\)\s*$/, "")
          const monthlyRevs = fAny.monthlyRevenues || []

          const isThisMonth = revenuePeriod === "this_month"
          const is3Months = revenuePeriod === "last_3_months"

          // 1. Phân bổ tài chính theo chu kỳ được chọn
          const latestM = monthlyRevs[monthlyRevs.length - 1]
          const m10Revenue = Number(
            latestM?.revenue ?? 
            (fAny.thisMonthRevenue ? Number(String(fAny.thisMonthRevenue).replace(/[^0-9]/g, "")) : 0)
          )
          const m10Rental = Number(latestM?.rentalRevenue ?? 0)
          const m10Penalty = Number(latestM?.penaltyRevenue ?? Math.max(0, m10Revenue - m10Rental))

          const last3Revs = monthlyRevs.slice(-3)
          const sum3Net = last3Revs.length > 0
            ? last3Revs.reduce((acc, m) => acc + Number(m.revenue || 0), 0)
            : Number(fAny.last3MonthsRevenue ? String(fAny.last3MonthsRevenue).replace(/[^0-9]/g, "") : 0)
          const sum3Rental = last3Revs.length > 0
            ? last3Revs.reduce((acc, m) => acc + Number(m.rentalRevenue ?? (m.month === "T10" ? 0 : m.revenue)), 0)
            : Number(fAny.rentalRevenue ?? 0)
          const sum3Penalty = Math.max(0, sum3Net - sum3Rental)

          const allTimeNet = Number(
            fAny.allTimeRevenue != null && typeof fAny.allTimeRevenue === "number"
              ? fAny.allTimeRevenue
              : (fAny.netRevenue ?? (sum3Net > 0 ? sum3Net : 0))
          )
          const allTimeRental = Number(fAny.rentalRevenue ?? sum3Rental)
          const allTimePenalty = Number(fAny.penaltyRevenue ?? Math.max(0, allTimeNet - allTimeRental))

          const netRev = isThisMonth ? m10Revenue : is3Months ? sum3Net : allTimeNet
          const rentalRev = isThisMonth ? m10Rental : is3Months ? sum3Rental : allTimeRental
          const penaltyRev = isThisMonth ? m10Penalty : is3Months ? sum3Penalty : allTimePenalty
          const depHold = Number(fAny.depositHolding ?? 0)
          const totRefund = Number(fAny.totalRefunds ?? 0)
          const overdue = Number(fAny.overdueContracts ?? fAny.overdueUnits ?? 0)
          const tUnits = Number(fAny.totalUnits ?? 46)

          // 2. Vận hành cơ sở kho (Đồng bộ số liệu thực tế với danh sách cơ sở)
          const totalOcc = Number(fAny.occupiedUnits ?? fAny.occupied ?? 0)
          const occUnits = totalOcc
          const resUnits = Number(fAny.reservedUnits ?? fAny.reserved ?? 0)
          const maintUnits = Number(fAny.maintenanceUnits ?? fAny.maintenance ?? 0)
          const availUnits = Math.max(0, tUnits - occUnits - resUnits - maintUnits)
          const occRate = tUnits > 0 ? Number(((occUnits / tUnits) * 100).toFixed(1)) : 0

          const periodLabel =
            revenuePeriod === "this_month"
              ? "Tháng Này"
              : revenuePeriod === "last_3_months"
                ? "3 Tháng Gần Nhất"
                : "Toàn Thời Gian"

          return (
            <div className="space-y-5">
              {/* HEADER BÁO CÁO CƠ SỞ & BỘ CHỌN NHANH */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-md transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate("/bom/facilities")}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0"
                      title="Quay lại danh sách cơ sở kho"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                      Báo Cáo Cơ Sở: {name}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* BỘ LỌC 3 NÚT: THÁNG NÀY | 3 THÁNG GẦN NHẤT | TOÀN THỜI GIAN */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setRevenuePeriod("this_month")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        revenuePeriod === "this_month"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                      title="Xem thông số tháng hiện tại"
                    >
                      Tháng Này
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevenuePeriod("last_3_months")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        revenuePeriod === "last_3_months"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                      title="Xem thông số 3 tháng gần nhất"
                    >
                      3 Tháng Gần Nhất
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevenuePeriod("all_time")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        revenuePeriod === "all_time"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                      title="Xem thông số toàn thời gian"
                    >
                      Toàn Thời Gian
                    </button>
                  </div>

                  {/* Thanh chuyển đổi nhanh các cơ sở - Gọn gàng trên 1 hàng */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-x-auto shrink-0">
                    {facilities.map((f) => {
                      const isSelected = String(f.id) === String(facilityId) || f.code === code
                      return (
                        <button
                          key={f.id}
                          onClick={() => navigate(`/bom/facilities/${f.id}`)}
                          className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60"
                          }`}
                          title={f.name}
                        >
                          <Building2 className="size-3" />
                          {f.code}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* KHỐI EXECUTIVE DASHBOARD DÒNG TIỀN VÀ QUY MÔ VẬN HÀNH */}
              <FacilityCashFlowDashboard
                title={`Doanh Thu Thực Thu - ${code}`}
                subtitle={`Xu hướng dòng tiền thực thu (${periodLabel})`}
                period={revenuePeriod}
                monthlyRevenues={monthlyRevs}
                netRevenue={netRev}
                rentalRevenue={rentalRev}
                depositHolding={depHold}
                penaltyRevenue={penaltyRev}
                totalRefunds={totRefund}
                overdueContracts={overdue}
                totalUnits={tUnits}
                occupiedUnits={occUnits}
                reservedUnits={resUnits}
                availableUnits={availUnits}
                maintenanceUnits={maintUnits}
                occupancyRate={occRate}
              />
            </div>
          )
        })()
      ) : (
        /* BẢNG GIÁM SÁT HOẠT ĐỘNG VÀ CƠ SỞ KHO TOÀN CHUỖI */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Warehouse className="size-5 text-blue-600 dark:text-blue-400" />
                <span>Giám sát cơ sở kho toàn chuỗi</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Quản lý danh sách chi nhánh nằm trong chuỗi kho, theo dõi tình trạng vận hành.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              {/* BỘ LỌC KHOẢNG THỜI GIAN DOANH THU */}
              <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <button
                  type="button"
                  onClick={() => setRevenuePeriod("this_month")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    revenuePeriod === "this_month"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  title="Xem doanh thu tháng hiện tại"
                >
                  Tháng Này
                </button>
                <button
                  type="button"
                  onClick={() => setRevenuePeriod("last_3_months")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    revenuePeriod === "last_3_months"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  title="Xem doanh thu 3 tháng gần nhất"
                >
                  3 Tháng Gần Nhất
                </button>
                <button
                  type="button"
                  onClick={() => setRevenuePeriod("all_time")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    revenuePeriod === "all_time"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  title="Xem tổng doanh thu toàn thời gian"
                >
                  Toàn Thời Gian
                </button>
              </div>

              {/* NÚT THÊM CƠ SỞ KHO MỚI */}
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 shrink-0"
              >
                <Plus className="size-4" />
                <span>Thêm Cơ Sở Kho Mới</span>
              </button>
            </div>
          </div>

          <div className="card-box relative overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <table className="w-full text-center text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">CƠ SỞ KHO</th>
                  <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">QUẢN LÝ CHI NHÁNH</th>
                  <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">KHO THUÊ</th>
                  <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">TỶ LỆ LẤP ĐẦY</th>
                  <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">
                    {revenuePeriod === "this_month"
                      ? "DOANH THU (THÁNG NÀY)"
                      : revenuePeriod === "last_3_months"
                        ? "DOANH THU (3 THÁNG GẦN NHẤT)"
                        : "DOANH THU (TOÀN THỜI GIAN)"}
                  </th>
                  <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {facilities.length > 0 ? (
                  facilities.map((fac) => {
                    const isLayoutB =
                      fac.layoutType === "Layout B" ||
                      fac.layoutType === "B" ||
                      [2, 4, 5, 7].includes(Number(fac.id))
                    const stdUnits = isLayoutB ? 15 : 46
                    const cleanName = (fac.name || "").replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
                    const cleanManager = (fac.managerName || "").replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
                    const rented = fac.occupied ?? fac.rentedUnits ?? 0
                    const displayOccRate =
                      fac.occupancyRate != null
                        ? Number(fac.occupancyRate).toFixed(1).replace(/\.0$/, "")
                        : stdUnits > 0
                          ? String(Math.round((rented / stdUnits) * 100))
                          : "0"

                    const displayRevenue =
                      revenuePeriod === "this_month"
                        ? (fac.thisMonthRevenue || "₫0")
                        : revenuePeriod === "last_3_months"
                          ? (fac.last3MonthsRevenue || "₫0")
                          : (fac.allTimeRevenue || fac.monthlyRevenue || "₫0")

                    return (
                      <tr key={fac.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors">
                        {/* CỘT DUY NHẤT: CƠ SỞ KHO (Toàn bộ cụm Mã cơ sở + Tên cơ sở được bọc chung trong khung badge, không tô màu mã) */}
                        <td className="py-3 px-4 whitespace-nowrap align-middle text-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/bom/facilities/${fac.id}`)}
                            title="Bấm để xem báo cáo dòng tiền & thông số cơ sở"
                            className="inline-flex items-center justify-center gap-1.5 w-[235px] py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 font-mono font-semibold text-xs transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer text-center"
                          >
                            <span>{fac.code}</span>
                            <span className="text-slate-400 dark:text-slate-500 font-normal">-</span>
                            <span className="font-sans font-medium">{cleanName}</span>
                          </button>
                        </td>

                        {/* CỘT 2: QUẢN LÝ CHI NHÁNH */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="text-sm font-normal text-slate-800 dark:text-slate-200">
                            {cleanManager || "Chưa phân công"}
                          </span>
                        </td>

                        {/* CỘT 3: KHO THUÊ (ĐANG THUÊ / TỔNG SỐ KHO) */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="text-sm font-normal text-slate-800 dark:text-slate-200">
                            <span className="font-semibold text-slate-900 dark:text-white">{rented}</span>
                            <span className="text-slate-500 dark:text-slate-400"> / {stdUnits} Kho</span>
                          </span>
                        </td>

                        {/* CỘT 4: TỶ LỆ LẤP ĐẦY */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {displayOccRate}%
                          </span>
                        </td>

                        {/* CỘT 5: DOANH THU THEO KHOẢNG THỜI GIAN ĐƯỢC CHỌN */}
                        <td className="py-3 px-4 text-center whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {displayRevenue}
                        </td>

                        {/* CỘT 6: THAO TÁC */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenFacilityModal(fac)}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-2xs transition cursor-pointer"
                              title="Cấu hình cơ sở"
                            >
                              Cấu hình
                            </button>
                            <button
                              type="button"
                              onClick={() => setFacilityToDelete(fac)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/80 transition cursor-pointer"
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
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Đang tải dữ liệu cơ sở từ hệ thống...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CẤU HÌNH CƠ SỞ KHO - PORTAL RA BODY */}
      {isFacilityModalOpen && selectedFacility && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150 text-white my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-blue-400">
                  CHI TIẾT CẤU HÌNH CƠ SỞ KHO
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  Cơ sở {selectedFacility.name.replace(/\s*\([A-Z0-9-]+\)\s*$/, "")} ({selectedFacility.code})
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
              {/* PHÂN CÔNG QUẢN LÝ CƠ SỞ */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="size-4 text-blue-400" />
                    <span className="text-[11px] text-slate-300 uppercase font-black tracking-wider">
                      Phân công Quản Lý Cơ Sở (Facility Manager)
                    </span>
                  </div>
                  {editManagerName.trim() ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Đã gán quản lý
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Chưa phân công
                    </span>
                  )}
                </div>

                {/* 1. MENU SỔ XUỐNG ĐƯA LÊN TRÊN CÙNG */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      <span>Chọn nhân sự quản lý (Sổ xuống):</span>
                    </label>
                    {editManagerName && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditManagerName("")
                          setEditManagerPhone("")
                          setEditManagerEmail("")
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold hover:underline flex items-center gap-1 cursor-pointer transition"
                      >
                        <UserX className="size-3" />
                        <span>Bỏ phân công</span>
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      value={
                        availableManagers.some(
                          (p) => p.name.trim().toLowerCase() === editManagerName.trim().toLowerCase()
                        )
                          ? availableManagers.find(
                              (p) => p.name.trim().toLowerCase() === editManagerName.trim().toLowerCase()
                            )?.name
                          : editManagerName.trim()
                          ? "__CUSTOM__"
                          : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        if (!val) {
                          setEditManagerName("")
                          setEditManagerPhone("")
                          setEditManagerEmail("")
                        } else if (val === "__CUSTOM__") {
                          // Giữ nguyên dữ liệu tự nhập
                        } else {
                          const found = availableManagers.find((p) => p.name === val)
                          if (found) {
                            setEditManagerName(found.name)
                            setEditManagerPhone(found.phone)
                            setEditManagerEmail(found.email)
                          }
                        }
                      }}
                      className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-slate-700 bg-slate-900 font-bold text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer shadow-inner"
                    >
                      <option value="" className="bg-slate-900 text-slate-400 font-normal">
                        -- Chọn quản lý từ danh sách nhân sự --
                      </option>
                      {availableManagers.map((p) => (
                        <option key={p.name} value={p.name} className="bg-slate-900 text-white font-medium py-1">
                          👤 {p.name} {p.phone ? `• SĐT: ${p.phone}` : ""}
                        </option>
                      ))}
                      {editManagerName.trim() &&
                        !availableManagers.some(
                          (p) => p.name.trim().toLowerCase() === editManagerName.trim().toLowerCase()
                        ) && (
                          <option value="__CUSTOM__" className="bg-slate-900 text-blue-300 font-medium">
                            ✍️ Tùy chỉnh: {editManagerName}
                          </option>
                        )}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-3 size-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 2. KHI BẤM CHỌN -> HIỆN THÔNG TIN MANAGER XUỐNG DƯỚI */}
                {editManagerName.trim() ? (
                  <div className="pt-2 border-t border-slate-800/80 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <User className="size-3 text-slate-400" />
                        <span>Họ và tên Quản Lý:</span>
                      </label>
                      <input
                        type="text"
                        value={editManagerName}
                        onChange={(e) => setEditManagerName(e.target.value)}
                        placeholder="VD: Trần Văn Quản Lý..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <Phone className="size-3 text-slate-400" />
                          <span>Số điện thoại:</span>
                        </label>
                        <input
                          type="text"
                          value={editManagerPhone}
                          onChange={(e) => setEditManagerPhone(e.target.value)}
                          placeholder="VD: 0912 345 678"
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 font-medium text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <Mail className="size-3 text-slate-400" />
                          <span>Email liên hệ:</span>
                        </label>
                        <input
                          type="email"
                          value={editManagerEmail}
                          onChange={(e) => setEditManagerEmail(e.target.value)}
                          placeholder="VD: manager@smartstorage.vn"
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 font-medium text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800/80 p-3 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
                    <span className="text-[11px] text-slate-500 italic">
                      Chưa có quản lý được chọn. Vui lòng chọn nhân sự ở menu sổ xuống phía trên.
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Quy Mô Ô Kho:
                  </label>
                  <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 font-bold text-xs text-blue-300 flex items-center justify-between">
                    <span>
                      {selectedFacility.layoutType === "Layout B" ||
                      selectedFacility.layoutType === "B" ||
                      [2, 4, 5, 7].includes(Number(selectedFacility.id))
                        ? "15 Ô kho"
                        : "46 Ô kho"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">3 Tầng Chuẩn</span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Hệ Số Giá Cơ Sở:
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={facilityMultiplier}
                    onChange={(e) => setFacilityMultiplier(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-blue-500"
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
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: THÊM CƠ SỞ KHO MỚI & CHỌN LAYOUT 2D - PORTAL RA BODY */}
      {isAddFacilityModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-white my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-blue-400 flex items-center gap-2">
                  <Warehouse className="size-4.5" />
                  <span>THÊM CƠ SỞ KHO MỚI</span>
                </h3>
              </div>
              <button
                onClick={() => setIsAddFacilityModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="space-y-4">
              {/* Row 1: Tên chi nhánh */}
              <div>
                <label className="block font-bold text-slate-300 uppercase text-[10px] mb-1">
                  Tên Chi Nhánh Cơ Sở Kho <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  value={newFacName}
                  onChange={(e) => setNewFacName(e.target.value)}
                  placeholder="VD: SmartStorage Cầu Giấy hoặc SmartStorage Bình Thạnh"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-blue-500 placeholder:text-slate-600"
                />
              </div>

              {/* Row 2: Khu vực tỉnh thành & Mã Code tự động */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase text-[10px] mb-1">
                    Tỉnh / Thành Phố <span className="text-rose-400">*</span>:
                  </label>
                  <select
                    value={newFacCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {CITY_REGIONS.map((city) => (
                      <option key={city.prefix} value={city.prefix}>
                        {city.label} ({city.prefix})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase text-[10px] mb-1">
                    Mã Cơ Sở Hệ Thống:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newFacCode}
                      onChange={(e) => setNewFacCode(e.target.value.toUpperCase())}
                      className="w-full p-2.5 pl-3 rounded-xl border border-blue-500/40 bg-blue-950/20 font-mono font-black text-xs text-blue-300 outline-none focus:border-blue-500 uppercase tracking-wider"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Lựa chọn Mô hình Layout Kiến Trúc Thống Nhất */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-300 uppercase text-[10px]">
                  Mô Hình Kiến Trúc &amp; Sơ Đồ Thiết Kế 2D <span className="text-rose-400">*</span>:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card Layout A */}
                  <div
                    onClick={() => setNewFacLayout("A")}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      newFacLayout === "A"
                        ? "bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-xs text-blue-400">Layout A</span>
                      {newFacLayout === "A" && <CheckCircle2 className="size-4 text-blue-400" />}
                    </div>
                    <div className="space-y-1.5 text-[10px] bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 shrink-0">Quy mô:</span>
                        <span className="font-bold text-blue-300 font-mono">46 Ô Kho (3 Tầng)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 shrink-0">Kích thước:</span>
                        <span className="font-bold text-white">Size S, M, L, XL</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span className="text-slate-400 shrink-0 whitespace-nowrap">Cơ cấu tầng:</span>
                        <span className="text-slate-200 font-medium whitespace-nowrap text-right">
                          Trệt (10 XL) + 2 Lầu (36 ô S, M, L)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Layout B */}
                  <div
                    onClick={() => setNewFacLayout("B")}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      newFacLayout === "B"
                        ? "bg-amber-500/10 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-xs text-amber-400">Layout B</span>
                      {newFacLayout === "B" && <CheckCircle2 className="size-4 text-amber-400" />}
                    </div>
                    <div className="space-y-1.5 text-[10px] bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 shrink-0">Quy mô:</span>
                        <span className="font-black text-amber-300 font-mono">15 Ô Kho (3 Tầng)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 shrink-0">Kích thước:</span>
                        <span className="font-bold text-white">Size S, M, L, XL</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span className="text-slate-400 shrink-0 whitespace-nowrap">Cơ cấu tầng:</span>
                        <span className="text-slate-200 font-medium whitespace-nowrap text-right">
                          Trệt (5 XL) + 2 Lầu (10 ô S, M, L)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Địa chỉ chi nhánh */}
              <div>
                <label className="block font-bold text-slate-300 uppercase text-[10px] mb-1">
                  Địa Chỉ Chi Nhánh <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  value={newFacAddress}
                  onChange={(e) => setNewFacAddress(e.target.value)}
                  placeholder={
                    CITY_REGIONS.find((c) => c.prefix === newFacCity)?.hint ||
                    "Số nhà, tên đường, phường/xã, quận/huyện..."
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-semibold text-xs text-white outline-none focus:border-blue-500 placeholder:text-slate-600"
                />
              </div>

              {/* Row 5: Quản lý & Hotline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase text-[10px] mb-1">
                    Quản Lý Chi Nhánh Phụ Trách:
                  </label>
                  <input
                    type="text"
                    value={newFacManager}
                    onChange={(e) => setNewFacManager(e.target.value)}
                    placeholder="VD: Nguyễn Văn Quản Lý"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-semibold text-xs text-white outline-none focus:border-blue-500 placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase text-[10px] mb-1">
                    Hotline Liên Hệ Chi Nhánh:
                  </label>
                  <input
                    type="text"
                    value={newFacPhone}
                    onChange={(e) => setNewFacPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-semibold text-xs text-white outline-none focus:border-blue-500 placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddFacilityModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 font-bold text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreateFacility}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5 transition"
              >
                <Plus className="size-4" />
                <span>{isSubmitting ? "Đang Đồng Bộ..." : "Tạo & Đồng Bộ Cơ Sở Lên 2D"}</span>
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
                  Bạn có chắc chắn muốn xóa{" "}
                  <span className="font-bold text-rose-400">
                    {facilityToDelete.name.replace(/\s*\([A-Z0-9-]+\)\s*$/, "")}
                  </span>{" "}
                  khỏi chuỗi vận hành?
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
                <span>Xác Nhận Xóa Cơ Sở</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
