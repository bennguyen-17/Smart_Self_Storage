import { useState, useMemo, useEffect, useRef, useCallback } from "react"
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
  Calendar,
  Check,
  MapPin,
  Search,
  Snowflake,
  Filter,
  Eye,
  Info,
  TrendingUp,
  BarChart3,
  ArrowLeft,
  Activity,
} from "lucide-react"
import apiClient from "@/lib/apiClient"
import { getStorageUnits } from "@/features/customer/rent/rentApi"
import { useBomContext } from "@/features/bom/context/BomContext"
import { type FacilityPerformance } from "@/features/bom/data/bomData"
import { bomApi } from "@/features/bom/api/bomApi"
import FacilityCashFlowDashboard from "@/features/bom/components/FacilityCashFlowDashboard"
import { listAccounts } from "@/features/admin/accounts/api/accountApi"
import type { InternalAccount } from "@/features/admin/accounts/types"

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
      const bestManagerName = (fromFacList.managerName && fromFacList.managerName !== "Chưa phân công")
        ? fromFacList.managerName
        : (fromBreakdown.managerName || fromFacList.managerName || "Chưa phân công")
      const bestManagerPhone = fromFacList.managerPhone || fromBreakdown.managerPhone
      const bestManagerEmail = fromFacList.managerEmail || fromBreakdown.managerEmail
      return {
        ...fromBreakdown,
        ...fromFacList,
        managerName: bestManagerName,
        managerPhone: bestManagerPhone,
        managerEmail: bestManagerEmail,
      }
    }
    return fromBreakdown || fromFacList || null
  }, [facilityId, facilities, chainOverview])

  const [selectedFacilityUnits, setSelectedFacilityUnits] = useState<any[]>([])
  const [isLoadingSelectedUnits, setIsLoadingSelectedUnits] = useState(false)

  useEffect(() => {
    if (!facilityId || !activeFac) {
      setSelectedFacilityUnits([])
      return
    }

    let isMounted = true
    setIsLoadingSelectedUnits(true)

    const fetchUnits = async () => {
      try {
        let facId = Number(facilityId)
        if (isNaN(facId) || facId <= 0) {
          const match = facilityId.match(/\d+/)
          facId = match ? parseInt(match[0], 10) : 1
        }

        const res: any = await apiClient
          .get("/units/filter", { params: { facilityId: facId } })
          .catch(() => null)

        const raw = Array.isArray(res) ? res : res?.data || []
        if (isMounted) {
          if (raw.length > 0) {
            setSelectedFacilityUnits(raw)
          } else {
            const facCode = (activeFac as any).facilityCode || (activeFac as any).code || `FAC-${facId}`
            const [u1, u2, u3] = await Promise.all([
              getStorageUnits(facCode, 1).catch(() => ({ data: [] })),
              getStorageUnits(facCode, 2).catch(() => ({ data: [] })),
              getStorageUnits(facCode, 3).catch(() => ({ data: [] })),
            ])
            const combined = [...(u1?.data || []), ...(u2?.data || []), ...(u3?.data || [])]
            setSelectedFacilityUnits(combined)
          }
        }
      } catch (err) {
        console.warn("Lỗi tải ô kho cơ sở:", err)
      } finally {
        if (isMounted) setIsLoadingSelectedUnits(false)
      }
    }

    fetchUnits()
    return () => {
      isMounted = false
    }
  }, [facilityId, activeFac])

  // State bộ lọc thời gian doanh thu bảng cơ sở: "this_month" (mặc định), "last_3_months", "all_time"
  const [revenuePeriod, setRevenuePeriod] = useState<"this_month" | "last_3_months" | "all_time">("this_month")

  const REVENUE_PERIOD_OPTIONS = [
    { key: "this_month", label: "Tháng Này" },
    { key: "last_3_months", label: "3 Tháng Gần Nhất" },
    { key: "all_time", label: "Toàn Thời Gian" },
  ] as const

  const [isDetailPeriodOpen, setIsDetailPeriodOpen] = useState(false)
  const detailPeriodRef = useRef<HTMLDivElement>(null)

  const [isListPeriodOpen, setIsListPeriodOpen] = useState(false)
  const listPeriodRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (detailPeriodRef.current && !detailPeriodRef.current.contains(e.target as Node)) {
        setIsDetailPeriodOpen(false)
      }
      if (listPeriodRef.current && !listPeriodRef.current.contains(e.target as Node)) {
        setIsListPeriodOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Modal State Cấu hình cơ sở
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<FacilityPerformance | null>(null)
  const [facilityMultiplier, setFacilityMultiplier] = useState<number>(1.0)
  const [editManagerName, setEditManagerName] = useState("")
  const [editManagerPhone, setEditManagerPhone] = useState("")
  const [editManagerEmail, setEditManagerEmail] = useState("")
  const [editFacilityStatus, setEditFacilityStatus] = useState("ACTIVE")

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
  const [newFacStatus, setNewFacStatus] = useState("ACTIVE")
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

  // Quy mô chuẩn hóa: Layout A = 45 kho (3 tầng), Layout B = 15 kho (2 tầng)
  const computedTotalUnits = useMemo(() => {
    return newFacLayout === "B" ? 15 : 45
  }, [newFacLayout])

  const [internalAccounts, setInternalAccounts] = useState<InternalAccount[]>([])

  const loadAccounts = useCallback(() => {
    listAccounts()
      .then((data) => {
        if (Array.isArray(data)) {
          setInternalAccounts(data)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadAccounts()
    window.addEventListener("storage_facilities_updated", loadAccounts)
    return () => window.removeEventListener("storage_facilities_updated", loadAccounts)
  }, [loadAccounts])

  // Lọc danh sách quản lý hợp lệ: Chỉ role = MANAGER, status = ACTIVE, và CHƯA phụ trách cơ sở nào (mỗi cơ sở 1 quản lý)
  const getEligibleManagers = useCallback(
    (targetFacilityId?: number | null, currentManagerName?: string) => {
      const assignedNamesInOtherFacilities = new Set<string>()
      facilities.forEach((f) => {
        const facId = Number(f.id)
        if (targetFacilityId && facId === targetFacilityId) return
        const clean = (f.managerName || "").replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim().toLowerCase()
        if (clean && clean !== "chưa phân công" && clean !== "chua phan cong") {
          assignedNamesInOtherFacilities.add(clean)
        }
      })

      const list: { name: string; phone: string; email: string; accountId?: number; facilityId?: number | null }[] = []
      const seenNames = new Set<string>()

      internalAccounts.forEach((acc) => {
        // 1. Chỉ những người có role là MANAGER (Quản lý cơ sở)
        if (acc.role !== "MANAGER") return
        // 2. Tài khoản phải đang hoạt động (ACTIVE)
        if (acc.status !== "ACTIVE") return

        const cleanName = (acc.fullName || "").replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
        if (!cleanName) return

        // 3. Validate mỗi cơ sở chỉ có 1 manager:
        // Manager nào đã quản lý cơ sở KHÁC thì KHÔNG được hiện
        const isAssignedToOther =
          (acc.facilityId != null && targetFacilityId != null && Number(acc.facilityId) !== Number(targetFacilityId)) ||
          (acc.facilityId != null && targetFacilityId == null) ||
          (assignedNamesInOtherFacilities.has(cleanName.toLowerCase()) &&
            (!currentManagerName || cleanName.toLowerCase() !== currentManagerName.trim().toLowerCase()))

        if (isAssignedToOther) return

        if (!seenNames.has(cleanName.toLowerCase())) {
          seenNames.add(cleanName.toLowerCase())
          list.push({
            name: cleanName,
            phone: acc.phone || "",
            email: acc.email || "manager@smartstorage.vn",
            accountId: acc.accountId,
            facilityId: acc.facilityId,
          })
        }
      })

      // Nếu cơ sở hiện tại đã có manager (currentManagerName) mà chưa có trong list, giữ lại để hiển thị
      if (currentManagerName) {
        const cleanCur = currentManagerName.replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
        if (cleanCur && cleanCur !== "Chưa phân công" && !seenNames.has(cleanCur.toLowerCase())) {
          list.unshift({
            name: cleanCur,
            phone: editManagerPhone || "",
            email: editManagerEmail || "manager@smartstorage.vn",
            facilityId: targetFacilityId,
          })
        }
      }

      return list
    },
    [facilities, internalAccounts, editManagerPhone, editManagerEmail]
  )

  // Quản lý khả dụng cho modal Sửa cấu hình cơ sở
  const availableManagers = useMemo(() => {
    return getEligibleManagers(selectedFacility ? Number(selectedFacility.id) : null, selectedFacility?.managerName)
  }, [getEligibleManagers, selectedFacility])

  // Quản lý khả dụng cho modal Thêm cơ sở mới (chỉ manager chưa quản lý cơ sở nào)
  const addAvailableManagers = useMemo(() => {
    return getEligibleManagers(null, "")
  }, [getEligibleManagers])

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
    setNewFacStatus("ACTIVE")
    setIsAddFacilityModalOpen(true)
  }

  const handleCityChange = (cityPrefix: string) => {
    setNewFacCity(cityPrefix)
    setNewFacCode(getNextFacilityCode(cityPrefix, facilities))
  }

  const handleOpenFacilityModal = (fac: FacilityPerformance) => {
    setSelectedFacility(fac)
    setFacilityMultiplier(fac.priceMultiplier || 1.0)
    setEditFacilityStatus(fac.status || "ACTIVE")
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

    if (finalManagerName && finalManagerName !== "Chưa phân công") {
      const duplicateFacility = facilities.find(
        (f) =>
          Number(f.id) !== Number(selectedFacility.id) &&
          (f.managerName || "").replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim().toLowerCase() ===
            finalManagerName.toLowerCase()
      )
      if (duplicateFacility) {
        toast.error(
          `Quản lý [${finalManagerName}] đang phụ trách cơ sở [${duplicateFacility.code} - ${duplicateFacility.name}]! Mỗi cơ sở chỉ có 1 Quản lý và 1 Quản lý chỉ phụ trách 1 cơ sở.`
        )
        return
      }
    }

    const success = await updateFacilityInDb(Number(selectedFacility.id), {
      facilityName: selectedFacility.name,
      address: selectedFacility.address,
      phone: finalManagerPhone || selectedFacility.managerPhone,
      status: editFacilityStatus,
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
              status: editFacilityStatus,
              managerName: finalManagerName,
              managerPhone: finalManagerPhone,
              managerEmail: finalManagerEmail,
              priceMultiplier: facilityMultiplier,
            }
          : f
      )
    )

    if (success) {
      toast.success(`Đã lưu cấu hình & trạng thái cơ sở ${selectedFacility.name}!`)
    } else {
      toast.success(`Đã cập nhật cấu hình cơ sở ${selectedFacility.name}!`)
    }
    loadAccounts()
    setIsFacilityModalOpen(false)
  }

  const handleQuickUpdateStatus = async (fac: FacilityPerformance, newStatus: string) => {
    const statusLabel =
      newStatus === "MAINTENANCE"
        ? "Bảo trì (Tạm ngưng nhận khách)"
        : newStatus === "INACTIVE"
        ? "Tạm ngưng hoạt động"
        : "Hoạt động bình thường"

    const success = await updateFacilityInDb(Number(fac.id), {
      status: newStatus,
      facilityName: fac.name,
      address: fac.address,
      phone: fac.managerPhone,
    })

    setFacilities((prev) =>
      prev.map((f) => (f.id === fac.id ? { ...f, status: newStatus } : f))
    )

    if (success) {
      toast.success(`Đã cập nhật trạng thái cơ sở [${fac.code}] sang: ${statusLabel}`)
    }
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

    if (newFacManager.trim() && newFacManager.trim() !== "Chưa phân công") {
      const duplicateFacility = facilities.find(
        (f) =>
          (f.managerName || "").replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim().toLowerCase() ===
            newFacManager.trim().toLowerCase()
      )
      if (duplicateFacility) {
        toast.error(
          `Quản lý [${newFacManager.trim()}] đang phụ trách cơ sở [${duplicateFacility.code} - ${duplicateFacility.name}]! Mỗi cơ sở chỉ có 1 Quản lý.`
        )
        return
      }
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
        status: newFacStatus,
        managerName: newFacManager.trim() || "Chưa phân công",
      })

      if (success) {
        toast.success(`Đã thêm cơ sở [${codeToUse}] ${newFacName.trim()} & đồng bộ sơ đồ 2D lên Customer Portal!`)
        loadAccounts()
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
          status: newFacStatus,
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
                  {/* BỘ LỌC THỜI GIAN (DROPDOWN SỔ XUỐNG) */}
                  <div className="relative" ref={detailPeriodRef}>
                    <button
                      type="button"
                      onClick={() => setIsDetailPeriodOpen((prev) => !prev)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-500 dark:hover:border-blue-500 shadow-xs transition-all cursor-pointer"
                      title="Chọn khoảng thời gian xem báo cáo"
                    >
                      <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{periodLabel}</span>
                      <ChevronDown
                        className={`size-3.5 text-slate-400 transition-transform duration-200 ${
                          isDetailPeriodOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                        }`}
                      />
                    </button>

                    {isDetailPeriodOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        {REVENUE_PERIOD_OPTIONS.map((opt) => {
                          const isActive = revenuePeriod === opt.key
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                setRevenuePeriod(opt.key)
                                setIsDetailPeriodOpen(false)
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                                isActive
                                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isActive && <Check className="size-3.5 text-blue-600 dark:text-blue-400" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
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

              {/* BẢNG BÁO CÁO CƠ CẤU Ô KHO THEO SIZE */}
              <div className="rounded-2xl border border-slate-200/90 bg-white/90 dark:border-slate-800/90 dark:bg-slate-900/60 p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                      <span>BÁO CÁO CƠ CẤU Ô KHO THEO SIZE &amp; LOẠI HÌNH</span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold normal-case">
                        ({periodLabel})
                      </span>
                    </h3>
                  </div>
                </div>

                {isLoadingSelectedUnits ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold space-y-2">
                    <div className="size-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs">Đang tổng hợp cơ cấu ô kho...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-400 uppercase font-black text-[10px]">
                          <th className="p-3 text-center whitespace-nowrap">Phân Loại / Size</th>
                          <th className="p-3 text-center whitespace-nowrap">Quy Cách Sàn</th>
                          <th className="p-3 text-center whitespace-nowrap">Tổng Số Ô</th>
                          <th className="p-3 text-center whitespace-nowrap">Đang Thuê</th>
                          <th className="p-3 text-center whitespace-nowrap">Còn Trống</th>
                          <th className="p-3 text-center whitespace-nowrap">Giữ Chỗ</th>
                          <th className="p-3 text-center whitespace-nowrap">Bảo Trì</th>
                          <th className="p-3 text-center whitespace-nowrap">Tỷ Lệ Lấp Đầy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-semibold text-slate-700 dark:text-slate-300">
                        {(() => {
                          const SIZES = [
                            { size: "S", name: "Size S (Tủ Cá Nhân)", dim: "1.0m × 1.0m", defaultNorm: 600000 },
                            { size: "M", name: "Size M (Phòng Vừa)", dim: "1.5m × 2.0m", defaultNorm: 1200000 },
                            { size: "L", name: "Size L (Phòng Lớn)", dim: "2.0m × 3.0m", defaultNorm: 2400000 },
                            { size: "XL", name: "Size XL (Kho Doanh Nghiệp)", dim: "2.5m × 4.0m", defaultNorm: 4000000 },
                          ]

                          let grandTotal = 0
                          let grandOccupied = 0
                          let grandAvailable = 0
                          let grandHold = 0
                          let grandMaintenance = 0

                          const rows = SIZES.map((cfg) => {
                            const list = selectedFacilityUnits.filter((u) => {
                              const typeStr = (u.typeName || u.typeLabel || "").toUpperCase()
                              const sz = (u.size || "").toUpperCase()
                              const code = (u.unitCode || u.unitId || "").toUpperCase()
                              if (cfg.size === "XL") return typeStr.includes("XL") || sz === "XL" || sz.includes("XL") || code.includes("-XL")
                              if (cfg.size === "S") return (typeStr.includes("SIZE S") || sz === "S" || code.includes("-S")) && !typeStr.includes("XL") && !code.includes("-XL")
                              if (cfg.size === "M") return typeStr.includes("SIZE M") || sz === "M" || code.includes("-M")
                              if (cfg.size === "L") return (typeStr.includes("SIZE L") || sz === "L" || code.includes("-L")) && !typeStr.includes("XL") && !code.includes("-XL")
                              return false
                            })

                            const total = list.length
                            let occupied = list.filter((u) => {
                              const st = (u.status || "").toUpperCase()
                              return st === "OCCUPIED" || st === "RENTED"
                            }).length
                            let available = list.filter((u) => (u.status || "").toUpperCase() === "AVAILABLE").length
                            let hold = list.filter((u) => {
                              const st = (u.status || "").toUpperCase()
                              return st === "HOLD" || st === "RESERVED"
                            }).length
                            const maintenance = list.filter((u) => (u.status || "").toUpperCase() === "MAINTENANCE").length

                            const occRate = total > 0 ? Math.round((occupied / total) * 100) : 0

                            grandTotal += total
                            grandOccupied += occupied
                            grandAvailable += available
                            grandHold += hold
                            grandMaintenance += maintenance

                            return (
                              <tr key={cfg.size} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition">
                                <td className="p-3 text-center whitespace-nowrap">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{cfg.name}</div>
                                </td>
                                <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{cfg.dim}</td>
                                <td className="p-3 text-center font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">{total} ô</td>
                                <td className="p-3 text-center font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">{occupied}</td>
                                <td className="p-3 text-center font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">{available}</td>
                                <td className="p-3 text-center font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">{hold}</td>
                                <td className="p-3 text-center font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">{maintenance}</td>
                                <td className="p-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{occRate}%</span>
                                    <div className="w-14 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="h-full bg-blue-600 dark:bg-slate-300 rounded-full"
                                        style={{ width: `${Math.min(occRate, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )
                          })

                          const grandRate =
                            grandTotal > 0
                              ? Number(((grandOccupied / grandTotal) * 100).toFixed(1)).toString().replace(/\.0$/, "")
                              : "0"

                          return (
                            <>
                              {rows}
                              <tr className="bg-slate-100 dark:bg-slate-950 font-black border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                                <td className="p-3 text-center uppercase text-slate-900 dark:text-white tracking-wider whitespace-nowrap">
                                  TỔNG CỘNG CƠ CẤU
                                </td>
                                <td className="p-3 text-center text-slate-400 font-mono whitespace-nowrap">—</td>
                                <td className="p-3 text-center text-blue-600 dark:text-blue-400 font-mono whitespace-nowrap">{grandTotal} ô</td>
                                <td className="p-3 text-center text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap">{grandOccupied}</td>
                                <td className="p-3 text-center text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">{grandAvailable}</td>
                                <td className="p-3 text-center text-amber-600 dark:text-amber-400 font-mono whitespace-nowrap">{grandHold}</td>
                                <td className="p-3 text-center text-rose-600 dark:text-rose-400 font-mono whitespace-nowrap">{grandMaintenance}</td>
                                <td className="p-3 text-center text-blue-600 dark:text-blue-400 font-mono whitespace-nowrap">{grandRate}%</td>
                              </tr>
                            </>
                          )
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
              {/* BỘ LỌC KHOẢNG THỜI GIAN DOANH THU (DROPDOWN SỔ XUỐNG) */}
              <div className="relative" ref={listPeriodRef}>
                <button
                  type="button"
                  onClick={() => setIsListPeriodOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-500 dark:hover:border-blue-500 shadow-xs transition-all cursor-pointer"
                  title="Chọn khoảng thời gian doanh thu"
                >
                  <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {revenuePeriod === "this_month"
                      ? "Tháng Này"
                      : revenuePeriod === "last_3_months"
                        ? "3 Tháng Gần Nhất"
                        : "Toàn Thời Gian"}
                  </span>
                  <ChevronDown
                    className={`size-3.5 text-slate-400 transition-transform duration-200 ${
                      isListPeriodOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                    }`}
                  />
                </button>

                {isListPeriodOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {REVENUE_PERIOD_OPTIONS.map((opt) => {
                      const isActive = revenuePeriod === opt.key
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setRevenuePeriod(opt.key)
                            setIsListPeriodOpen(false)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                            isActive
                              ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isActive && <Check className="size-3.5 text-blue-600 dark:text-blue-400" />}
                        </button>
                      )
                    })}
                  </div>
                )}
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
                  <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">
                    {revenuePeriod === "this_month"
                      ? "DOANH THU (THÁNG NÀY)"
                      : revenuePeriod === "last_3_months"
                        ? "DOANH THU (3 THÁNG GẦN NHẤT)"
                        : "DOANH THU (TOÀN THỜI GIAN)"}
                  </th>
                  <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">TRẠNG THÁI</th>
                  <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {facilities.length > 0 ? (
                  facilities.map((fac) => {
                    const isLayoutB =
                      fac.layoutType === "Layout B" ||
                      fac.layoutType === "B" ||
                      [2, 4, 5, 7, 8].includes(Number(fac.id))
                    const stdUnits = isLayoutB ? 15 : 45
                    const cleanName = (fac.name || "").replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
                    const cleanManager = (fac.managerName || "").replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim()
                    const rented = fac.occupied ?? fac.rentedUnits ?? 0

                    const displayRevenue =
                      revenuePeriod === "this_month"
                        ? (fac.thisMonthRevenue || "₫0")
                        : revenuePeriod === "last_3_months"
                          ? (fac.last3MonthsRevenue || "₫0")
                          : (fac.allTimeRevenue || fac.monthlyRevenue || "₫0")

                    return (
                      <tr key={fac.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors">
                        {/* CỘT 1: CƠ SỞ KHO */}
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

                        {/* CỘT 4: DOANH THU THEO KHOẢNG THỜI GIAN ĐƯỢC CHỌN */}
                        <td className="py-3 px-4 text-center whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {displayRevenue}
                        </td>

                        {/* CỘT 5: TRẠNG THÁI (ĐẶT TRƯỚC THAO TÁC, BO VIỀN NHẸ GIỐNG NÚT CẤU HÌNH, MÀU NHẠT HƠN) */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center">
                            <select
                              value={fac.status || "ACTIVE"}
                              onChange={async (e) => {
                                const newStatus = e.target.value
                                await handleQuickUpdateStatus(fac, newStatus)
                              }}
                              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border shadow-2xs transition-all duration-150 cursor-pointer appearance-none text-center outline-none ${
                                fac.status === "MAINTENANCE"
                                  ? "bg-amber-50/80 hover:bg-amber-100/80 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60"
                                  : fac.status === "INACTIVE"
                                  ? "bg-rose-50/80 hover:bg-rose-100/80 text-rose-700 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60"
                                  : "bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60"
                              }`}
                              title="Bấm để đổi nhanh trạng thái: Hoạt động / Bảo trì / Tạm ngưng"
                            >
                              <option value="ACTIVE" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🟢 Hoạt động</option>
                              <option value="MAINTENANCE" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🟠 Bảo trì</option>
                              <option value="INACTIVE" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🔴 Tạm ngưng</option>
                            </select>
                          </div>
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
        <div className="fixed inset-0 z-[999] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150 text-slate-900 dark:text-white my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-blue-600 dark:text-blue-400">
                  CHI TIẾT CẤU HÌNH CƠ SỞ KHO
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                  Cơ sở {selectedFacility.name.replace(/\s*\([A-Z0-9-]+\)\s*$/, "")} ({selectedFacility.code})
                </p>
              </div>
              <button
                onClick={() => setIsFacilityModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* PHÂN CÔNG QUẢN LÝ CƠ SỞ */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="size-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 uppercase font-black tracking-wider">
                      Phân công Quản Lý Cơ Sở (Facility Manager)
                    </span>
                  </div>
                  {editManagerName.trim() ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                      Đã gán quản lý
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
                      Chưa phân công
                    </span>
                  )}
                </div>

                {/* 1. MENU SỔ XUỐNG ĐƯA LÊN TRÊN CÙNG */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
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
                        className="text-[10px] text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-bold hover:underline flex items-center gap-1 cursor-pointer transition"
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
                          : editManagerName.trim() && editManagerName !== "Chưa phân công"
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
                      className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer shadow-xs"
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-normal">
                        -- Chọn quản lý chưa phụ trách cơ sở (Mỗi cơ sở 1 quản lý) --
                      </option>
                      {availableManagers.map((p) => (
                        <option key={p.name} value={p.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-medium py-1">
                          👤 {p.name} {p.phone ? `• SĐT: ${p.phone}` : ""}
                        </option>
                      ))}
                      {editManagerName.trim() &&
                        editManagerName !== "Chưa phân công" &&
                        !availableManagers.some(
                          (p) => p.name.trim().toLowerCase() === editManagerName.trim().toLowerCase()
                        ) && (
                          <option value="__CUSTOM__" className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300 font-medium">
                            👤 {editManagerName} (Hiện tại)
                          </option>
                        )}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-3 size-4 text-slate-400 pointer-events-none" />
                  </div>
                  {availableManagers.length === 0 && (!editManagerName || editManagerName === "Chưa phân công") && (
                    <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                      <span>ℹ️</span>
                      <span>Không có Quản lý nào chưa phân công. Mỗi cơ sở chỉ có 1 Quản lý và tất cả quản lý hiện tại đều đã phụ trách cơ sở.</span>
                    </p>
                  )}
                </div>

                {/* 2. KHI BẤM CHỌN -> HIỆN THÔNG TIN MANAGER XUỐNG DƯỚI */}
                {editManagerName.trim() ? (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <User className="size-3 text-slate-500 dark:text-slate-400" />
                        <span>Họ và tên Quản Lý:</span>
                      </label>
                      <input
                        type="text"
                        value={editManagerName}
                        onChange={(e) => setEditManagerName(e.target.value)}
                        placeholder="VD: Trần Văn Quản Lý..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <Phone className="size-3 text-slate-500 dark:text-slate-400" />
                          <span>Số điện thoại:</span>
                        </label>
                        <input
                          type="text"
                          value={editManagerPhone}
                          onChange={(e) => setEditManagerPhone(e.target.value)}
                          placeholder="VD: 0912 345 678"
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <Mail className="size-3 text-slate-500 dark:text-slate-400" />
                          <span>Email liên hệ:</span>
                        </label>
                        <input
                          type="email"
                          value={editManagerEmail}
                          onChange={(e) => setEditManagerEmail(e.target.value)}
                          placeholder="VD: manager@smartstorage.vn"
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 text-center">
                    <span className="text-[11px] text-slate-500 italic">
                      Chưa có quản lý được chọn. Vui lòng chọn nhân sự ở menu sổ xuống phía trên.
                    </span>
                  </div>
                )}
              </div>

              {/* TRẠNG THÁI HOẠT ĐỘNG & BẢO TRÌ */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Activity className="size-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Trạng Thái Hoạt Động Cơ Sở:</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    editFacilityStatus === "MAINTENANCE"
                      ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800"
                      : editFacilityStatus === "INACTIVE"
                      ? "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800"
                  }`}>
                    {editFacilityStatus === "MAINTENANCE" ? "Đang Bảo Trì" : editFacilityStatus === "INACTIVE" ? "Tạm Ngưng" : "Đang Hoạt Động"}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFacilityStatus("ACTIVE")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      editFacilityStatus === "ACTIVE"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500/50 shadow-sm dark:bg-emerald-950/70 dark:border-emerald-500 dark:text-emerald-300"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>🟢 Hoạt Động</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFacilityStatus("MAINTENANCE")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      editFacilityStatus === "MAINTENANCE"
                        ? "bg-amber-50 border-amber-500 text-amber-700 ring-1 ring-amber-500/50 shadow-sm dark:bg-amber-950/70 dark:border-amber-500 dark:text-amber-300"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>🟠 Bảo Trì</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFacilityStatus("INACTIVE")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      editFacilityStatus === "INACTIVE"
                        ? "bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500/50 shadow-sm dark:bg-rose-950/70 dark:border-rose-500 dark:text-rose-300"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>🔴 Tạm Ngưng</span>
                  </button>
                </div>
                {editFacilityStatus === "MAINTENANCE" && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400/90 italic pt-0.5">
                    * Lưu ý: Khi cơ sở ở trạng thái Bảo trì, hệ thống sẽ tạm ngưng tiếp nhận khách đặt thuê mới trên sơ đồ 2D.
                  </p>
                )}
                {editFacilityStatus === "INACTIVE" && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400/90 italic pt-0.5">
                    * Lưu ý: Khi cơ sở Tạm ngưng, toàn bộ hoạt động đặt thuê mới sẽ bị khóa.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Quy Mô Ô Kho:
                  </label>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 font-bold text-xs text-blue-600 dark:text-blue-300 flex items-center justify-between">
                    <span>
                      {selectedFacility.layoutType === "Layout B" ||
                      selectedFacility.layoutType === "B" ||
                      [2, 4, 5, 7, 8].includes(Number(selectedFacility.id))
                        ? "15 Ô kho"
                        : "45 Ô kho"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {selectedFacility.layoutType === "Layout B" ||
                      selectedFacility.layoutType === "B" ||
                      [2, 4, 5, 7, 8].includes(Number(selectedFacility.id))
                        ? "2 Tầng Chuẩn"
                        : "3 Tầng Chuẩn"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Hệ Số Giá Cơ Sở:
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={facilityMultiplier}
                    onChange={(e) => setFacilityMultiplier(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsFacilityModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer transition"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleSaveFacilityModal}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer transition"
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
        <div className="fixed inset-0 z-[999] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-slate-900 dark:text-white my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Warehouse className="size-4.5" />
                  <span>THÊM CƠ SỞ KHO MỚI</span>
                </h3>
              </div>
              <button
                onClick={() => setIsAddFacilityModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="space-y-4">
              {/* Row 1: Tên chi nhánh */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Tên Chi Nhánh Cơ Sở Kho <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={newFacName}
                  onChange={(e) => setNewFacName(e.target.value)}
                  placeholder="VD: SmartStorage Cầu Giấy hoặc SmartStorage Bình Thạnh"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition"
                />
              </div>

              {/* Row 2: Khu vực tỉnh thành & Mã Code tự động */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Tỉnh / Thành Phố <span className="text-rose-500">*</span>:
                  </label>
                  <select
                    value={newFacCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500 cursor-pointer transition"
                  >
                    {CITY_REGIONS.map((city) => (
                      <option key={city.prefix} value={city.prefix}>
                        {city.label} ({city.prefix})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Mã Cơ Sở Hệ Thống:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newFacCode}
                      onChange={(e) => setNewFacCode(e.target.value.toUpperCase())}
                      className="w-full p-2.5 pl-3 rounded-xl border border-blue-300 dark:border-blue-500/40 bg-blue-50/70 dark:bg-blue-950/20 font-mono font-black text-xs text-blue-700 dark:text-blue-300 outline-none focus:border-blue-500 uppercase tracking-wider transition"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Lựa chọn Mô hình Layout Kiến Trúc Thống Nhất */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                  Mô Hình Kiến Trúc &amp; Sơ Đồ Thiết Kế 2D <span className="text-rose-500">*</span>:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card Layout A */}
                  <div
                    onClick={() => {
                      setNewFacLayout("A")
                      setNewFacFloors(3)
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      newFacLayout === "A"
                        ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500"
                        : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">Layout A</span>
                      {newFacLayout === "A" && <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div className="space-y-1.5 text-[10px] bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">Quy mô:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-300 font-mono">45 Ô Kho (3 Tầng)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">Kích thước:</span>
                        <span className="font-bold text-slate-800 dark:text-white">Size S, M, L, XL</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap">Cơ cấu tầng:</span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap text-right">
                          Trệt (10 XL) + 2 Lầu (35-36 ô S, M, L)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Layout B */}
                  <div
                    onClick={() => {
                      setNewFacLayout("B")
                      setNewFacFloors(2)
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      newFacLayout === "B"
                        ? "bg-amber-50 dark:bg-amber-500/10 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400"
                        : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-xs text-amber-600 dark:text-amber-400">Layout B</span>
                      {newFacLayout === "B" && <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-400" />}
                    </div>
                    <div className="space-y-1.5 text-[10px] bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">Quy mô:</span>
                        <span className="font-black text-amber-600 dark:text-amber-300 font-mono">15 Ô Kho (2 Tầng)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">Kích thước:</span>
                        <span className="font-bold text-slate-800 dark:text-white">Size S, M, L, XL</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap">Cơ cấu tầng:</span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap text-right">
                          Trệt (5 XL) + 1 Lầu (10 ô S, M, L)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Địa chỉ chi nhánh */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Địa Chỉ Chi Nhánh <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={newFacAddress}
                  onChange={(e) => setNewFacAddress(e.target.value)}
                  placeholder={
                    CITY_REGIONS.find((c) => c.prefix === newFacCity)?.hint ||
                    "Số nhà, tên đường, phường/xã, quận/huyện..."
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition"
                />
              </div>

              {/* Row 5: Quản lý & Hotline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Quản Lý Chi Nhánh Phụ Trách:
                  </label>
                  <select
                    value={newFacManager}
                    onChange={(e) => {
                      const val = e.target.value
                      setNewFacManager(val)
                      const found = addAvailableManagers.find((m) => m.name === val)
                      if (found && found.phone) {
                        setNewFacPhone(found.phone)
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500 cursor-pointer transition"
                  >
                    <option value="">-- Chưa phân công quản lý --</option>
                    {addAvailableManagers.map((m) => (
                      <option key={m.name} value={m.name}>
                        👤 {m.name} {m.phone ? `• SĐT: ${m.phone}` : ""}
                      </option>
                    ))}
                  </select>
                  {addAvailableManagers.length === 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ Tất cả Quản lý hiện tại đều đã phụ trách cơ sở. Cơ sở mới sẽ để trạng thái "Chưa phân công".
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Hotline Liên Hệ Chi Nhánh:
                  </label>
                  <input
                    type="text"
                    value={newFacPhone}
                    onChange={(e) => setNewFacPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition"
                  />
                </div>
              </div>

              {/* Row 6: Trạng thái ban đầu */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1.5 flex items-center gap-1.5">
                  <Activity className="size-3 text-slate-500 dark:text-slate-400" />
                  <span>Trạng Thái Ban Đầu Khi Khởi Tạo:</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFacStatus("ACTIVE")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newFacStatus === "ACTIVE"
                        ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/50 shadow-sm"
                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span>🟢 Hoạt Động</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFacStatus("MAINTENANCE")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newFacStatus === "MAINTENANCE"
                        ? "bg-amber-50 dark:bg-amber-950/70 border-amber-500 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/50 shadow-sm"
                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span>🟠 Bảo Trì</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFacStatus("INACTIVE")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newFacStatus === "INACTIVE"
                        ? "bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/50 shadow-sm"
                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span>🔴 Tạm Ngưng</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddFacilityModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
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
        <div className="fixed inset-0 z-[999] bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-500/30 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-slate-900 dark:text-white my-auto">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                  Xác Nhận Xóa Cơ Sở Kho?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Bạn có chắc chắn muốn xóa{" "}
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {facilityToDelete.name.replace(/\s*\([A-Z0-9-]+\)\s*$/, "")}
                  </span>{" "}
                  khỏi chuỗi vận hành?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setFacilityToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5 transition"
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
