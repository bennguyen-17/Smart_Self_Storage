import { useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
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
} from "lucide-react"
import apiClient from "@/lib/apiClient"
import { getStorageUnits } from "@/features/customer/rent/rentApi"
import { useBomContext } from "@/features/bom/context/BomContext"
import { type FacilityPerformance } from "@/features/bom/data/bomData"

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
      const res: any = await apiClient.get("/units/filter", {
        params: { facilityId: facId }
      })
      const raw = Array.isArray(res) ? res : (res?.data || [])
      if (raw.length > 0) {
        setFacilityUnits(raw)
      } else {
        const u1 = (await getStorageUnits(fac.code, 1))?.data || []
        const u2 = (await getStorageUnits(fac.code, 2))?.data || []
        const u3 = (await getStorageUnits(fac.code, 3))?.data || []
        setFacilityUnits([...u1, ...u2, ...u3])
      }
    } catch (err) {
      console.warn("Lỗi tải ô kho cơ sở:", err)
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
      {/* Bảng Giám Sát & Danh Sách Cơ Sở Kho Toàn Chuỗi */}
      <div className="bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-sky-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-white">
              <Warehouse className="size-4.5 text-sky-400" />
              <span>GIÁM SÁT HOẠT ĐỘNG VÀ CƠ SỞ KHO TOÀN CHUỖI</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Quản lý danh sách chi nhánh, mã cơ sở tự động, cấu hình mô hình kiến trúc chuẩn &amp; đồng bộ sơ đồ 2D
            </p>
          </div>
          {/* NÚT THÊM CƠ SỞ KHO MỚI */}
          <button
            onClick={handleOpenAddModal}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/20 shrink-0"
          >
            <Plus className="size-4" />
            <span>Thêm Cơ Sở Kho Mới</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-sky-500/30 text-sky-400 uppercase font-bold text-[11px] sm:text-xs tracking-wider">
                <th className="py-3 px-4 text-center whitespace-nowrap">MÃ CƠ SỞ</th>
                <th className="py-3 px-4 text-left whitespace-nowrap">CƠ SỞ KHO</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">QUẢN LÝ CHI NHÁNH</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">KHO THUÊ</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">TỶ LỆ LẤP ĐẦY</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">DOANH THU</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
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

                  return (
                    <tr key={fac.id} className="hover:bg-slate-900/60 transition">
                      {/* CỘT 1: MÃ CƠ SỞ (Tối giản, không màu mè, không badge layout) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-200 text-xs sm:text-[13px]">
                          {fac.code}
                        </span>
                      </td>

                      {/* CỘT 2: TÊN CƠ SỞ KHO */}
                      <td className="py-4 px-4 text-left whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenFacilityDetail(fac)}
                          className="font-extrabold text-white text-xs sm:text-sm hover:text-sky-400 hover:underline transition-colors text-left cursor-pointer"
                          title="Bấm để xem chi tiết cơ sở & danh sách ô kho"
                        >
                          {cleanName}
                        </button>
                      </td>

                      {/* CỘT 3: QUẢN LÝ CHI NHÁNH */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="font-bold text-white text-xs sm:text-sm text-center">
                          {cleanManager || "Chưa phân công"}
                        </div>
                      </td>

                      {/* CỘT 4: KHO THUÊ (ĐANG THUÊ / TỔNG SỐ KHO) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="font-bold text-slate-200 text-xs sm:text-sm font-mono">
                          <span className="text-white">{rented}</span>
                          <span className="text-slate-400"> / {stdUnits} Kho</span>
                        </div>
                      </td>

                      {/* CỘT 5: TỶ LỆ LẤP ĐẦY */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-200 font-mono text-xs sm:text-sm">
                          {displayOccRate}%
                        </span>
                      </td>

                      {/* CỘT 6: DOANH THU */}
                      <td className="py-4 px-4 text-center whitespace-nowrap font-bold text-slate-200 font-mono text-xs sm:text-sm">
                        {fac.monthlyRevenue || "₫0"}
                      </td>

                      {/* CỘT 7: THAO TÁC */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
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
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-sky-400" />
                  <span className="text-[11px] text-slate-300 uppercase font-black tracking-wider">
                    Phân công Quản Lý Cơ Sở (Facility Manager)
                  </span>
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
                      className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-slate-700 bg-slate-900 font-bold text-xs text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition cursor-pointer shadow-inner"
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
                          <option value="__CUSTOM__" className="bg-slate-900 text-sky-300 font-medium">
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
                        className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
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
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 font-medium text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
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
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 font-medium text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
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
                    Quy Mô Ô Kho (Theo Layout):
                  </label>
                  <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 font-bold text-xs text-sky-300 flex items-center justify-between">
                    <span>
                      {selectedFacility.layoutType === "Layout B" ||
                      selectedFacility.layoutType === "B" ||
                      [2, 4, 5, 7].includes(Number(selectedFacility.id))
                        ? "15 Ô kho (Layout B)"
                        : "46 Ô kho (Layout A)"}
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

      {/* MODAL 2: THÊM CƠ SỞ KHO MỚI & CHỌN LAYOUT 2D - PORTAL RA BODY */}
      {isAddFacilityModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-white my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-sky-400 flex items-center gap-2">
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
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400 placeholder:text-slate-600"
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
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-bold text-xs text-white outline-none focus:border-sky-400 cursor-pointer"
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
                      className="w-full p-2.5 pl-3 rounded-xl border border-sky-500/40 bg-sky-950/20 font-mono font-black text-xs text-sky-300 outline-none focus:border-sky-400 uppercase tracking-wider"
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
                        ? "bg-sky-500/10 border-sky-400 shadow-md shadow-sky-500/10 ring-1 ring-sky-400"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-xs text-sky-400">Layout A</span>
                      {newFacLayout === "A" && <CheckCircle2 className="size-4 text-sky-400" />}
                    </div>
                    <div className="space-y-1.5 text-[10px] bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 shrink-0">Quy mô:</span>
                        <span className="font-black text-sky-300 font-mono">46 Ô Kho (3 Tầng)</span>
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
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-semibold text-xs text-white outline-none focus:border-sky-400 placeholder:text-slate-600"
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
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-semibold text-xs text-white outline-none focus:border-sky-400 placeholder:text-slate-600"
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
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-semibold text-xs text-white outline-none focus:border-sky-400 placeholder:text-slate-600"
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
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5 transition"
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

      {/* MODAL 4: XEM CHI TIẾT CƠ SỞ KHO & TÌNH TRẠNG Ô KHO - PORTAL RA BODY */}
      {isDetailModalOpen && detailFacility && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl border border-sky-500/30 p-5 sm:p-6 max-w-5xl w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-white my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {detailFacility.code}
                  </span>
                  <h3 className="font-black text-base sm:text-lg text-white">
                    {detailFacility.name.replace(/\s*\([A-Z0-9-]+\)\s*$/, "")}
                  </h3>
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-sky-400 shrink-0" />
                    {detailFacility.address}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="size-3.5 text-slate-400 shrink-0" />
                    Quản lý: <strong className="text-slate-200">{detailFacility.managerName?.replace(/\s*\([A-Z0-9-]+\)\s*$/, "") || "Chưa phân công"}</strong>
                  </span>
                  {detailFacility.managerPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3.5 text-slate-400 shrink-0" />
                      {detailFacility.managerPhone}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Thống kê 4 thẻ KPI nhanh - ĐỒNG BỘ 1 MÀU DUY NHẤT */}
            {(() => {
              const all = facilityUnits
              const total = all.length || (detailFacility.totalUnits || 46)
              const occupied = all.filter(u => (u.status || '').toUpperCase() === 'OCCUPIED' || (u.status || '').toUpperCase() === 'RENTED').length
              const available = all.filter(u => (u.status || '').toUpperCase() === 'AVAILABLE').length
              const holdMaint = Math.max(0, total - occupied - available)

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Tổng Số Ô Kho</div>
                      <div className="text-xl font-black font-mono text-white mt-0.5">{total}</div>
                    </div>
                    <div className="size-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">
                      🏢
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Còn Trống</div>
                      <div className="text-xl font-black font-mono text-white mt-0.5">{available}</div>
                    </div>
                    <div className="size-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">
                      📦
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Đang Thuê</div>
                      <div className="text-xl font-black font-mono text-white mt-0.5">{occupied}</div>
                    </div>
                    <div className="size-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">
                      🔑
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Giữ Chỗ / Bảo Trì</div>
                      <div className="text-xl font-black font-mono text-white mt-0.5">{holdMaint}</div>
                    </div>
                    <div className="size-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">
                      🛠️
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* BÁO CÁO CƠ CẤU VÀ TÌNH TRẠNG Ô KHO (DẠNG BÁO CÁO TỔNG HỢP CHO BOM) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {isLoadingUnits ? (
                <div className="p-12 text-center text-slate-400 font-bold space-y-2">
                  <div className="size-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs">Đang tổng hợp số liệu báo cáo cơ sở...</p>
                </div>
              ) : (
                <>
                  {/* BẢNG 1: BÁO CÁO CƠ CẤU Ô KHO THEO SIZE */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-xs uppercase text-slate-200 tracking-wider">
                        BÁO CÁO CƠ CẤU Ô KHO THEO SIZE &amp; LOẠI HÌNH
                      </h4>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-800">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 uppercase font-black text-[10px]">
                            <th className="p-3 text-left whitespace-nowrap">Phân Loại / Size</th>
                            <th className="p-3 text-center whitespace-nowrap">Quy Cách Sàn</th>
                            <th className="p-3 text-center whitespace-nowrap">Tổng Số Ô</th>
                            <th className="p-3 text-center whitespace-nowrap">Đang Thuê</th>
                            <th className="p-3 text-center whitespace-nowrap">Còn Trống</th>
                            <th className="p-3 text-center whitespace-nowrap">Giữ Chỗ / Bảo Trì</th>
                            <th className="p-3 text-center whitespace-nowrap">Tỷ Lệ Lấp Đầy</th>
                            <th className="p-3 text-right whitespace-nowrap">Doanh Thu / Tháng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 font-semibold text-slate-300">
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
                            let grandHoldMaint = 0
                            let grandRevenue = 0

                            const rows = SIZES.map((cfg) => {
                              const list = facilityUnits.filter((u) => {
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
                              const occupied = list.filter((u) => {
                                const st = (u.status || "").toUpperCase()
                                return st === "OCCUPIED" || st === "RENTED"
                              }).length
                              const available = list.filter((u) => (u.status || "").toUpperCase() === "AVAILABLE").length
                              const holdMaint = Math.max(0, total - occupied - available)
                              const occRate = total > 0 ? Math.round((occupied / total) * 100) : 0
                              const revenue = list
                                .filter((u) => {
                                  const st = (u.status || "").toUpperCase()
                                  return st === "OCCUPIED" || st === "RENTED"
                                })
                                .reduce((sum, u) => sum + Number(u.monthlyPrice || cfg.defaultNorm), 0)

                              grandTotal += total
                              grandOccupied += occupied
                              grandAvailable += available
                              grandHoldMaint += holdMaint
                              grandRevenue += revenue

                              return (
                                <tr key={cfg.size} className="hover:bg-slate-950/40 transition">
                                  <td className="p-3 text-left whitespace-nowrap">
                                    <div className="font-extrabold text-white whitespace-nowrap">{cfg.name}</div>
                                  </td>
                                  <td className="p-3 text-center font-mono text-slate-400 whitespace-nowrap">{cfg.dim}</td>
                                  <td className="p-3 text-center font-bold text-white font-mono whitespace-nowrap">{total} ô</td>
                                  <td className="p-3 text-center font-bold text-white font-mono whitespace-nowrap">{occupied}</td>
                                  <td className="p-3 text-center font-bold text-white font-mono whitespace-nowrap">{available}</td>
                                  <td className="p-3 text-center font-bold text-white font-mono whitespace-nowrap">{holdMaint}</td>
                                  <td className="p-3 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="font-mono font-bold text-white">{occRate}%</span>
                                      <div className="w-14 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className="h-full bg-slate-300 rounded-full"
                                          style={{ width: `${Math.min(occRate, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-white whitespace-nowrap">
                                    ₫{revenue.toLocaleString("vi-VN")}
                                  </td>
                                </tr>
                              )
                            })

                            const grandRate = grandTotal > 0 ? Math.round((grandOccupied / grandTotal) * 100) : 0

                            return (
                              <>
                                {rows}
                                <tr className="bg-slate-950 font-black border-t-2 border-slate-700 text-white">
                                  <td className="p-3 text-left uppercase text-white tracking-wider whitespace-nowrap">
                                    TỔNG CỘNG CƠ CẤU
                                  </td>
                                  <td className="p-3 text-center text-slate-400 font-mono whitespace-nowrap">—</td>
                                  <td className="p-3 text-center font-mono text-white text-sm whitespace-nowrap">{grandTotal} ô</td>
                                  <td className="p-3 text-center font-mono text-white text-sm whitespace-nowrap">{grandOccupied}</td>
                                  <td className="p-3 text-center font-mono text-white text-sm whitespace-nowrap">{grandAvailable}</td>
                                  <td className="p-3 text-center font-mono text-white text-sm whitespace-nowrap">{grandHoldMaint}</td>
                                  <td className="p-3 text-center font-mono text-white text-sm whitespace-nowrap">{grandRate}%</td>
                                  <td className="p-3 text-right font-mono text-white text-sm whitespace-nowrap">
                                    ₫{grandRevenue.toLocaleString("vi-VN")}
                                  </td>
                                </tr>
                              </>
                            )
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
