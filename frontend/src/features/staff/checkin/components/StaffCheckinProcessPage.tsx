import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import FloorPlanPage from "@/features/floorplan/FloorPlanPage"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClockIcon,
  IdCardIcon,
  KeyRoundIcon,
  PackageIcon,
  ShieldCheckIcon,
  UserIcon,
  RepeatIcon,
  ChevronRightIcon,
  SparklesIcon,
  BanknoteIcon,
  InfoIcon,
  PrinterIcon,
  BuildingIcon,
  AlertCircleIcon,
  CheckIcon,
  MapIcon,
  SearchXIcon,
  XIcon,
  EyeIcon,
  LayersIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { formatDate, formatVnd } from "@/lib/format"
import StatusLegend from "@/features/floorplan/components/StatusLegend"
import UnitGrid from "@/features/floorplan/components/UnitGrid"
import type { ClimateFilter, SizeFilter } from "@/features/floorplan/types"
import { SIZE_AREA_M2, UNIT_SIZES, unitAreaOf, unitSizeOf, unitSizeFromCode } from "@/features/floorplan/unitDisplay"
import {
  calculateRentalPrice,
  changeUnit,
  checkinErrorMessage,
  confirmCheckin,
  fetchAllUnits,
  getReservationDetail,
  updateCustomerCccd,
} from "../api/checkinApi"
import type { StaffCheckInResponse, StaffReservationLookup } from "../types"
import type { UnitDetailResponse } from "@/types"


function getChangeType(oldSizeStr?: string | null, newSizeStr?: string | null, oldClimate?: boolean, newClimate?: boolean) {
  const getRank = (s?: string | null) => {
    if (!s) return 1
    const upper = s.toUpperCase()
    if (upper.includes("XL")) return 4
    if (upper.includes("L")) return 3
    if (upper.includes("M")) return 2
    return 1
  }
  const oldRank = getRank(oldSizeStr)
  const newRank = getRank(newSizeStr)

  if (newRank > oldRank) return { type: "UPSIZE", label: "NÂNG CẤP KHO (UPSIZE)", color: "indigo" }
  if (newRank < oldRank) return { type: "DOWNSIZE", label: "HẠ KÍCH THƯỚC (DOWNSIZE)", color: "amber" }
  if (newClimate && !oldClimate) return { type: "UPSIZE", label: "NÂNG LÊN KHO ĐIỀU HÒA (UPSIZE)", color: "indigo" }
  if (!newClimate && oldClimate) return { type: "DOWNSIZE", label: "CHUYỂN SANG KHO THƯỜNG (DOWNSIZE)", color: "amber" }
  return { type: "SAME_SIZE", label: "ĐỔI VỊ TRÍ CÙNG SIZE", color: "emerald" }
}

export default function StaffCheckinProcessPage() {
  const { reservationId } = useParams<{ reservationId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [contract, setContract] = useState<StaffReservationLookup | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Đổi ô kho state
  const [isChangingUnit, setIsChangingUnit] = useState(false)
  const [sizeFilter, setSizeFilter] = useState<string>("ALL")
  const [selectedUnit, setSelectedUnit] = useState<UnitDetailResponse | null>(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const [newPricing, setNewPricing] = useState<{
    finalRentalAmount: number
    depositAmount: number
    totalInitialPayment: number
  } | null>(null)

  // Thanh toán & check-in state
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<StaffCheckInResponse | null>(null)

  // Hiệu chỉnh CCCD
  const [isEditingCccd, setIsEditingCccd] = useState(false)
  const [cccdInput, setCccdInput] = useState("")
  const [isSavingCccd, setIsSavingCccd] = useState(false)

  // Checklist xác nhận với khách
  const [verifiedCustomer, setVerifiedCustomer] = useState(false)
  const [verifiedUnit, setVerifiedUnit] = useState(false)
  const [collectedMoney, setCollectedMoney] = useState(false)

  // Lấy toàn bộ ô kho trong hệ thống để tìm ô trống cùng cơ sở
  const [units, setUnits] = useState<UnitDetailResponse[]>([])

  // Modal xem sơ đồ mặt bằng 2D cho khách (chỉ xem)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [confirmingUnit, setConfirmingUnit] = useState<UnitDetailResponse | null>(null)
  const [confirmingPricing, setConfirmingPricing] = useState<{
    finalRentalAmount: number
    depositAmount: number
    totalInitialPayment: number
    message?: string
  } | null>(null)
  const [isCalculatingConfirm, setIsCalculatingConfirm] = useState(false)
  const [modalFloorId, setModalFloorId] = useState<number | null>(null)

  useEffect(() => {
    fetchAllUnits().then(setUnits).catch(() => {})
  }, [])

  const loadData = () => {
    if (!reservationId) return
    setLoading(true)
    setError(null)
    getReservationDetail(Number(reservationId))
      .then((data) => {
        setContract(data)
        setCccdInput(data.customerIdNumber ?? "")
      })
      .catch((err) => {
        setError(checkinErrorMessage(err))
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [reservationId])

  // Lấy ô hiện tại từ danh sách ô
  const currentUnit = useMemo(() => {
    if (!contract || !units.length) return null
    return units.find((u) => u.unitCode === contract.unitCode) ?? null
  }, [contract, units])

  // Tầng của ô hiện tại khách thuê
  const currentUnitFloorId = useMemo(() => {
    if (!contract || !units.length) return null
    const found = units.find((u) => u.unitCode === contract.unitCode)
    return found?.floorId ?? null
  }, [contract, units])

  // Helper suy size chuẩn ("S" | "M" | "L" | "XL")
  const getUnitSize = (u: UnitDetailResponse): "S" | "M" | "L" | "XL" => {
    const sz = unitSizeOf(u)
    if (sz) return sz
    const fromCode = unitSizeFromCode(u.unitCode)
    if (fromCode) return fromCode
    const t = `${u.typeName ?? ""} ${u.size ?? ""}`.toUpperCase()
    if (t.includes("XL")) return "XL"
    if (t.includes("SIZE L") || t.includes(" L") || t.includes("-L")) return "L"
    if (t.includes("SIZE M") || t.includes(" M") || t.includes("-M")) return "M"
    if (t.includes("SIZE S") || t.includes(" S") || t.includes("-S")) return "S"
    return "M"
  }

  // Danh sách các tầng của cơ sở hiện tại
  const facilityFloors = useMemo(() => {
    if (!contract || !units.length) return []
    const prefix = contract.unitCode?.split("-")[0] ?? ""
    const facUnits = prefix ? units.filter((u) => u.unitCode.startsWith(prefix)) : units
    const floorMap = new Map<number, string>()
    facUnits.forEach((u) => {
      if (u.floorId != null) {
        floorMap.set(
          u.floorId,
          u.floorName || (u.floorId === 1 ? "Tầng trệt" : `Tầng ${u.floorId - 1}`)
        )
      }
    })
    return Array.from(floorMap.entries())
      .map(([floorId, floorName]) => ({ floorId, floorName }))
      .sort((a, b) => a.floorId - b.floorId)
  }, [contract, units])

  // Tầng đang active trên Modal sơ đồ 2D
  const activeModalFloorId = useMemo(() => {
    if (modalFloorId != null) return modalFloorId
    if (currentUnitFloorId != null) return currentUnitFloorId
    return facilityFloors[0]?.floorId ?? 1
  }, [modalFloorId, currentUnitFloorId, facilityFloors])

  // Danh sách ô kho hiển thị trên Modal theo tầng đang chọn
  const [modalSizeFilter, setModalSizeFilter] = useState<SizeFilter>("ALL")
  const [modalClimateFilter, setModalClimateFilter] = useState<ClimateFilter>("ALL")

  const modalFloorUnits = useMemo(() => {
    if (!contract || !units.length) return []
    const prefix = contract.unitCode?.split("-")[0] ?? ""
    return units.filter((u) => {
      const matchPrefix = prefix ? u.unitCode.startsWith(prefix) : true
      return matchPrefix && u.floorId === activeModalFloorId
    })
  }, [contract, units, activeModalFloorId])

  // Lọc ô kho trên Modal theo Tầng + Kích thước + Loại kho (Y hệt Customer)
  const visibleModalUnits = useMemo(() => {
    return modalFloorUnits.filter((u) => {
      if (modalSizeFilter !== "ALL" && unitSizeOf(u) !== modalSizeFilter) {
        return false
      }
      if (modalClimateFilter === "NORMAL" && u.isClimate) {
        return false
      }
      if (modalClimateFilter === "CLIMATE_CONTROLLED" && !u.isClimate) {
        return false
      }
      return true
    })
  }, [modalFloorUnits, modalSizeFilter, modalClimateFilter])

  // Lọc ô AVAILABLE cùng cơ sở (dựa trên prefix mã ô ví dụ HCM02-...)
  const availableUnits = useMemo(() => {
    if (!contract || !units.length) return []
    const prefix = contract.unitCode?.split("-")[0] ?? ""
    return units.filter((u) => {
      if (u.status !== "AVAILABLE") return false
      if (u.unitCode === contract.unitCode) return false
      return prefix ? u.unitCode.startsWith(prefix) : true
    })
  }, [contract, units])

  // Lọc theo Size
  const filteredAvailableUnits = useMemo(() => {
    if (sizeFilter === "ALL") return availableUnits
    return availableUnits.filter((u) => {
      const type = (u.typeName ?? "").toUpperCase()
      const sz = (u.size ?? "").toUpperCase()
      return type.includes(sizeFilter) || sz.includes(sizeFilter)
    })
  }, [availableUnits, sizeFilter])

  // Tính thời gian thuê để gửi lên API tính giá
  const rentalDurationInfo = useMemo(() => {
    if (!contract?.reservationStartDate || !contract?.reservationEndDate) {
      return { rentalType: "MONTHLY", duration: 1 }
    }
    const start = new Date(contract.reservationStartDate)
    const end = new Date(contract.reservationEndDate)
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)))
    if (days < 30) {
      return { rentalType: "DAILY", duration: days }
    }
    return { rentalType: "MONTHLY", duration: Math.max(1, Math.round(days / 30)) }
  }, [contract])

  // Khi chọn ô mới, gọi API tính giá thuê & cọc mới
  const handleOpenConfirmUnitChange = async (u: UnitDetailResponse) => {
    if (u.unitCode === contract?.unitCode) return
    setConfirmingUnit(u)
    setIsCalculatingConfirm(true)
    try {
      const res = await calculateRentalPrice({
        unitTypeId: u.unitTypeId,
        rentalType: rentalDurationInfo.rentalType,
        duration: rentalDurationInfo.duration,
      })
      if (res && res.success) {
        setConfirmingPricing(res)
      } else {
        toast.error(res?.message || "Không thể tính giá cho ô kho này.")
      }
    } catch (err) {
      toast.error(checkinErrorMessage(err))
    } finally {
      setIsCalculatingConfirm(false)
    }
  }

  const handleApplyUnitChange = () => {
    if (!confirmingUnit || !confirmingPricing) return
    setSelectedUnit(confirmingUnit)
    setNewPricing(confirmingPricing)
    setIsChangingUnit(true)
    setConfirmingUnit(null)
    setIsMapModalOpen(false)
    toast.success(`Đã chọn đổi sang ô kho ${confirmingUnit.unitCode}!`)
  }

  const handleSelectUnit = async (u: UnitDetailResponse) => {
    if (selectedUnit?.unitCode === u.unitCode) {
      setSelectedUnit(null)
      setNewPricing(null)
      return
    }
    setSelectedUnit(u)
    setCalcLoading(true)
    try {
      const res = await calculateRentalPrice({
        unitTypeId: u.unitTypeId,
        rentalType: rentalDurationInfo.rentalType,
        duration: rentalDurationInfo.duration,
      })
      if (res && res.success) {
        setNewPricing(res)
      } else {
        toast.error(res?.message || "Không thể tính giá cho ô kho này.")
      }
    } catch (err) {
      toast.error(checkinErrorMessage(err))
    } finally {
      setCalcLoading(false)
    }
  }

  // Tính toán số tiền tài chính tổng quát
  const financialSummary = useMemo(() => {
    if (!contract) return null

    // Tiền cọc cũ khách đã đóng (100% tiền cọc ban đầu)
    const oldDepositPaid = contract.depPaidAmount ?? contract.depositAmount ?? 0
    const oldRentalAmount = contract.rentalAmount ?? 0
    const oldDepositAmount = contract.depositAmount ?? 0

    if (!selectedUnit || !newPricing) {
      // Trường hợp không đổi ô kho
      const totalAmount = (contract.depAmount ?? 0) > 0 ? (contract.depAmount ?? 0) : (oldDepositAmount + oldRentalAmount)
      const remainingCollect = contract.depRemainingAmount ?? oldRentalAmount
      return {
        isChanged: false,
        depositPaid: oldDepositPaid,
        newDeposit: oldDepositAmount,
        newRental: oldRentalAmount,
        totalNew: totalAmount,
        remainingDue: Math.max(0, remainingCollect),
        refundAmount: 0,
        diffDeposit: 0,
        diffRental: 0,
      }
    }

    // Trường hợp ĐỔI Ô KHO MỚI
    const newDeposit = newPricing.depositAmount
    const newRental = newPricing.finalRentalAmount
    const totalNew = newDeposit + newRental

    // Tiền còn phải thu = Tổng mới - Đã cọc cũ
    const balance = totalNew - oldDepositPaid
    const remainingDue = balance > 0 ? balance : 0
    const refundAmount = balance < 0 ? Math.abs(balance) : 0

    const diffDeposit = newDeposit - oldDepositAmount
    const diffRental = newRental - oldRentalAmount

    return {
      isChanged: true,
      depositPaid: oldDepositPaid,
      newDeposit,
      newRental,
      totalNew,
      remainingDue,
      refundAmount,
      diffDeposit,
      diffRental,
    }
  }, [contract, selectedUnit, newPricing])

  // Lưu CCCD mới nếu staff sửa
  const handleSaveCccd = async () => {
    if (!contract) return
    if (!/^\d{12}$/.test(cccdInput.trim())) {
      toast.error("Số CCCD phải gồm đúng 12 chữ số.")
      return
    }
    setIsSavingCccd(true)
    try {
      await updateCustomerCccd(contract.reservationId, cccdInput.trim())
      setContract({ ...contract, customerIdNumber: cccdInput.trim() })
      toast.success("Hiệu chỉnh số CCCD khách hàng thành công!")
      setIsEditingCccd(false)
    } catch (err) {
      toast.error(checkinErrorMessage(err))
    } finally {
      setIsSavingCccd(false)
    }
  }

  // Thực hiện Check-in
  const handleExecuteCheckin = async () => {
    if (!contract || !financialSummary) return

    setIsSubmitting(true)
    try {
      // BƯỚC 1: Nếu có đổi kho, gọi API change-unit trước
      if (selectedUnit) {
        await changeUnit(contract.reservationId, {
          newUnitCode: selectedUnit.unitCode,
        })
        toast.info(`Đã cập nhật đổi sang ô kho ${selectedUnit.unitCode}`)
      }

      // BƯỚC 2: Gọi API check-in thu tiền & kích hoạt HĐ sang ACTIVE
      const res = await confirmCheckin(contract.reservationId, {
        collectedAmount: financialSummary.remainingDue,
        paymentMethod,
      })

      setActionSuccess(res)
      toast.success("Bàn giao & Check-in kho thành công!", {
        description: `Hợp đồng ${res.reservationCode ?? contract.reservationCode} đã kích hoạt ĐANG THUÊ.`,
      })
    } catch (err) {
      toast.error(checkinErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Đang tải hồ sơ hợp đồng check-in…
          </p>
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="mx-auto max-w-2xl mt-8 rounded-2xl border border-rose-200 bg-rose-50/80 p-8 text-center dark:border-rose-900/60 dark:bg-rose-950/30">
        <AlertCircleIcon className="mx-auto size-12 text-rose-600 dark:text-rose-400" />
        <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
          Không tìm thấy hợp đồng
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {error || "Hợp đồng không tồn tại hoặc không thuộc cơ sở phân công của bạn."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/staff/checkin")}
          className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
        >
          <ArrowLeftIcon className="size-4" />
          <span>Quay lại danh sách</span>
        </button>
      </div>
    )
  }

  // Màn hình thành công sau khi Check-in xong
  if (actionSuccess) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 animate-in fade-in duration-300">
        <div className="rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white p-8 text-center shadow-lg dark:border-emerald-900 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <CheckCircle2Icon className="size-9 stroke-[2.5]" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Bàn Giao &amp; Kích Hoạt Kho Thành Công!
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Hợp đồng{" "}
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {actionSuccess.reservationCode ?? contract.reservationCode}
            </span>{" "}
            của khách hàng{" "}
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {contract.customerName}
            </span>{" "}
            đã chính thức chuyển sang trạng thái <strong>ĐANG THUÊ</strong>.
          </p>

          <div className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-4 text-left">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Ô kho bàn giao
              </span>
              <p className="mt-1 font-mono text-xl font-black text-blue-600 dark:text-blue-400">
                {selectedUnit?.unitCode ?? contract.unitCode}
              </p>
              <p className="text-xs text-muted mt-0.5">{contract.floorName}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Mã PIN mở cổng của khách
              </span>
              <p className="mt-1 font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                {actionSuccess.gatePin ?? "Đã gửi SMS / App"}
              </p>
              <p className="text-xs text-muted mt-0.5">Thời hạn: Suốt thời gian thuê</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <PrinterIcon className="size-4" />
              <span>In biên bản bàn giao</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/staff/checkin")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700"
            >
              <span>Về danh sách hợp đồng</span>
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* THANH ĐIỀU HƯỚNG BREADCRUMB */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link
            to="/staff/checkin"
            className="flex items-center gap-1.5 font-semibold transition hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ArrowLeftIcon className="size-3.5" />
            <span>Danh sách hợp đồng</span>
          </Link>
          <ChevronRightIcon className="size-3 text-slate-400" />
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Xác nhận Check-in &amp; Bàn giao
          </span>
          <ChevronRightIcon className="size-3 text-slate-400" />
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {contract.reservationCode}
          </span>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <ClockIcon className="size-3.5" />
          <span>CHỜ CHECK-IN BÀN GIAO TẠI QUẦY</span>
        </div>
      </div>

      {/* TIÊU ĐỀ TRANG */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRoundIcon className="size-6 text-blue-600 dark:text-blue-400" />
            <span>Đối soát hợp đồng &amp; Xác nhận Check-in bàn giao kho</span>
          </h1>
        </div>
      </div>

      {/* KHỐI NỘI DUNG CHÍNH (2 CỘT) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* CỘT TRÁI: THÔNG TIN HỢP ĐỒNG & KHÁCH & Ô KHO (7 CỘT) */}
        <div className="space-y-6 lg:col-span-7">
          {/* CARD 1: THÔNG TIN KHÁCH HÀNG */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserIcon className="size-4 text-blue-600 dark:text-blue-400" />
                <span>Thông tin khách hàng đối chiếu</span>
              </h2>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheckIcon className="size-3.5" />
                Đã xác thực tài khoản
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-muted text-[11px]">Họ và tên khách:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {contract.customerName ?? "—"}
                </p>
              </div>

              <div>
                <span className="text-muted text-[11px]">Số điện thoại:</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {contract.customerPhone ?? "—"}
                </p>
              </div>

              <div>
                <span className="text-muted text-[11px]">Email liên hệ:</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {contract.customerEmail ?? "—"}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-muted text-[11px]">Số CCCD / Định danh:</span>
                  {!isEditingCccd && (
                    <button
                      type="button"
                      onClick={() => setIsEditingCccd(true)}
                      className="text-[10px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Hiệu chỉnh
                    </button>
                  )}
                </div>
                {isEditingCccd ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      maxLength={12}
                      value={cccdInput}
                      onChange={(e) => setCccdInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="12 chữ số CCCD"
                      className="w-full rounded-lg border border-blue-400 px-2 py-1 font-mono text-xs outline-none dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCccd}
                      disabled={isSavingCccd}
                      className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700"
                    >
                      {isSavingCccd ? "Lưu…" : "Lưu"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCccdInput(contract.customerIdNumber ?? "")
                        setIsEditingCccd(false)
                      }}
                      className="rounded-lg bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {contract.customerIdNumber ?? "Chưa đối chiếu thẻ gốc"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: CHI TIẾT HỢP ĐỒNG THUÊ KHO */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-3">
            {/* Header hợp đồng + Nút xem sơ đồ 2D */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PackageIcon className="size-4 text-slate-600 dark:text-slate-400" />
                <span>Thông tin hợp đồng thuê kho</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  setModalFloorId(currentUnitFloorId ?? facilityFloors[0]?.floorId ?? 1)
                  setIsMapModalOpen(true)
                }}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
                title="Mở sơ đồ 2D để hướng dẫn vị trí kho cho khách"
              >
                <MapIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span>Xem sơ đồ 2D</span>
              </button>
            </div>

            {/* Các dòng ngang thông tin hợp đồng */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Mã hợp đồng:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {contract.reservationCode}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Mã kho:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {contract.unitCode} {contract.floorName ? `(${contract.floorName})` : ""}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Loại kho:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {contract.unitTypeName ?? "Kho tiêu chuẩn"} ({contract.unitSize ?? "Tiêu chuẩn"})
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Thời hạn thuê:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {contract.rentalDuration ?? "1 tháng"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Ngày cọc giữ chỗ:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {contract.depositDate
                    ? formatDate(contract.depositDate)
                    : formatDate(contract.reservationStartDate)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Ngày nhận kho (Check-in):</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {contract.reservationStartDate
                    ? formatDate(contract.reservationStartDate)
                    : "Hôm nay"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Hạn trả kho (Check-out):</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {contract.reservationEndDate
                    ? formatDate(contract.reservationEndDate)
                    : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Tiền cọc giữ chỗ:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {formatVnd(contract.depositAmount ?? 0)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Tiền thuê kho:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {formatVnd(contract.rentalAmount ?? 0)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Tổng giá trị hợp đồng:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatVnd((contract.depositAmount ?? 0) + (contract.rentalAmount ?? 0))}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Tình trạng thanh toán:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Đã cọc online {formatVnd(contract.depPaidAmount ?? contract.depositAmount ?? 0)} · Cần thu tại quầy {formatVnd(contract.depRemainingAmount ?? contract.rentalAmount ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: HỖ TRỢ ĐỔI Ô KHO / THAY ĐỔI SIZE THEO YÊU CẦU CỦA KHÁCH */}
          <div className="rounded-2xl border border-indigo-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-sm dark:border-indigo-900/60 dark:bg-slate-900/90 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <RepeatIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Hỗ trợ khách hàng đổi ô kho tại quầy (Tùy chọn)</span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Bật tùy chọn này nếu khách đến nhận kho muốn nâng size (S→M→L→XL) hoặc hạ size kho nhỏ hơn.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isChangingUnit}
                  onChange={(e) => {
                    setIsChangingUnit(e.target.checked)
                    if (!e.target.checked) {
                      setSelectedUnit(null)
                      setNewPricing(null)
                    }
                  }}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700" />
              </label>
            </div>

            {isChangingUnit && (
              <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
                {!selectedUnit ? (
                  <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 p-6 text-center dark:border-indigo-800 dark:bg-indigo-950/20 space-y-3">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300">
                      <MapIcon className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        Mở sơ đồ mặt bằng 2D để chọn ô kho đổi
                      </h3>
                      <p className="text-xs text-muted mt-1 max-w-md mx-auto">
                        Sơ đồ 2D trực quan thể hiện toàn bộ tầng kho, vị trí ô kho ban đầu và các ô trống (AVAILABLE) sẵn sàng bàn giao.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalFloorId(currentUnitFloorId ?? facilityFloors[0]?.floorId ?? 1)
                        setIsMapModalOpen(true)
                      }}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition active:scale-95"
                    >
                      <MapIcon className="size-4" />
                      <span>Mở sơ đồ 2D chọn ô kho</span>
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                        {availableUnits.length} ô trống
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 text-xs dark:border-indigo-900/60 dark:bg-indigo-950/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SparklesIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-bold text-indigo-950 dark:text-indigo-100">
                          Ô kho mới đã chọn: <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">{selectedUnit.unitCode}</span>
                        </span>
                      </div>
                      {(() => {
                        const change = getChangeType(
                          contract.unitSize,
                          selectedUnit.size,
                          contract.unitTypeName?.includes("mát") || contract.unitTypeName?.includes("Climate"),
                          selectedUnit.isClimate
                        )
                        return (
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                              change.type === "UPSIZE"
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300"
                                : change.type === "DOWNSIZE"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                            )}
                          >
                            {change.label}
                          </span>
                        )
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-indigo-200/60 dark:border-indigo-900/60 text-xs">
                      <div>
                        <span className="text-[11px] text-muted block">Ô kho ban đầu:</span>
                        <p className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {contract.unitCode} ({contract.unitTypeName} · {contract.unitSize})
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted block">Ô kho mới:</span>
                        <p className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                          {selectedUnit.unitCode} ({selectedUnit.typeName} · {selectedUnit.size} · {selectedUnit.floorName})
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted block">Tiền cọc quy định mới:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {newPricing ? formatVnd(newPricing.depositAmount) : "—"}
                          {financialSummary && financialSummary.diffDeposit !== 0 && (
                            <span className={cn(
                              "text-[10px] ml-1.5 font-bold",
                              financialSummary.diffDeposit > 0 ? "text-amber-600" : "text-emerald-600"
                            )}>
                              ({financialSummary.diffDeposit > 0 ? "+" : ""}{formatVnd(financialSummary.diffDeposit)})
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted block">Tiền thuê mới ({contract.rentalDuration}):</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {newPricing ? formatVnd(newPricing.finalRentalAmount) : "—"}
                          {financialSummary && financialSummary.diffRental !== 0 && (
                            <span className={cn(
                              "text-[10px] ml-1.5 font-bold",
                              financialSummary.diffRental > 0 ? "text-amber-600" : "text-emerald-600"
                            )}>
                              ({financialSummary.diffRental > 0 ? "+" : ""}{formatVnd(financialSummary.diffRental)})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60 dark:border-indigo-900/60">
                      <button
                        type="button"
                        onClick={() => {
                          setModalFloorId(currentUnitFloorId ?? facilityFloors[0]?.floorId ?? 1)
                          setIsMapModalOpen(true)
                        }}
                        className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        <MapIcon className="size-3.5" />
                        <span>Xem lại sơ đồ 2D / Đổi ô khác</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUnit(null)
                          setNewPricing(null)
                          setIsChangingUnit(false)
                        }}
                        className="cursor-pointer text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                      >
                        Bỏ chọn đổi ô (Giữ ô ban đầu)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: BẢNG TÍNH TÀI CHÍNH & NÚT XÁC NHẬN CHECK-IN (5 CỘT) */}
        <div className="space-y-6 lg:col-span-5">
          {/* CARD TÀI CHÍNH THU TIỀN TẠI QUẦY */}
          <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 p-5 shadow-md dark:border-blue-900/60 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BanknoteIcon className="size-4 text-blue-600 dark:text-blue-400" />
                <span>Bảng thanh toán tại quầy</span>
              </h2>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10.5px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Đối soát tiền
              </span>
            </div>

            {/* Chi tiết từng mục tiền */}
            {financialSummary && (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Tiền cọc quy chuẩn {financialSummary.isChanged ? "(Kho mới)" : ""}:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatVnd(financialSummary.newDeposit)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Tiền thuê kho {financialSummary.isChanged ? "(Kho mới)" : ""}:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatVnd(financialSummary.newRental)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-medium">Tổng giá trị hợp đồng:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatVnd(financialSummary.totalNew)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2Icon className="size-3.5" />
                    Đã thanh toán cọc online:
                  </span>
                  <span className="font-bold">
                    - {formatVnd(financialSummary.depositPaid)}
                  </span>
                </div>

                {financialSummary.isChanged && financialSummary.diffDeposit < 0 && (
                  <div className="rounded-lg bg-emerald-50 p-2.5 text-[11px] text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 leading-relaxed">
                    💡 <strong>Giảm size kho:</strong> Tiền cọc kho mới thấp hơn cọc cũ, phần cọc dư ({formatVnd(Math.abs(financialSummary.diffDeposit))}) đã được hệ thống <strong>khấu trừ trực tiếp vào tiền thuê kho mới</strong>.
                  </div>
                )}

                {financialSummary.isChanged && financialSummary.diffDeposit > 0 && (
                  <div className="rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 leading-relaxed">
                    💡 <strong>Nâng size kho:</strong> Tiền cọc &amp; tiền thuê kho mới lớn hơn, khách thanh toán thêm phần bù cọc ({formatVnd(financialSummary.diffDeposit)}) và tiền thuê mới.
                  </div>
                )}
              </div>
            )}

            {/* SỐ TIỀN THỰC THU TẠI QUẦY (BIG HERO) */}
            {financialSummary && (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-50/70 p-4 text-center dark:border-blue-800 dark:bg-blue-950/40">
                {financialSummary.remainingDue > 0 ? (
                  <>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Số tiền khách cần thanh toán thêm tại quầy
                    </span>
                    <div className="mt-1 font-mono text-3xl font-black text-blue-600 dark:text-blue-400">
                      {formatVnd(financialSummary.remainingDue)}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Đã thanh toán đủ toàn bộ
                    </span>
                    <div className="mt-1 font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      0 đ
                    </div>
                    {financialSummary.refundAmount > 0 && (
                      <p className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        Cơ sở tạo yêu cầu hoàn cọc dư: {formatVnd(financialSummary.refundAmount)}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* CHECKLIST ĐỐI SOÁT VỚI KHÁCH */}
            <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-850">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Xác nhận trực tiếp với khách trước khi hoàn tất:
              </span>

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={verifiedCustomer}
                  onChange={(e) => setVerifiedCustomer(e.target.checked)}
                  className="mt-0.5 size-4 rounded text-blue-600 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-300 leading-tight">
                  Đã đối chiếu thông tin cá nhân &amp; CCCD gốc của khách hàng.
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedUnit}
                  onChange={(e) => setVerifiedUnit(e.target.checked)}
                  className="mt-0.5 size-4 rounded text-blue-600 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-300 leading-tight">
                  Khách đã đồng ý nhận ô kho{" "}
                  <strong>{selectedUnit?.unitCode ?? contract.unitCode}</strong> và nội quy lưu kho.
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectedMoney}
                  onChange={(e) => setCollectedMoney(e.target.checked)}
                  className="mt-0.5 size-4 rounded text-blue-600 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-300 leading-tight">
                  Đã xác nhận thanh toán đủ số tiền{" "}
                  <strong>{financialSummary ? formatVnd(financialSummary.remainingDue) : "0 đ"}</strong>.
                </span>
              </label>
            </div>

            {/* NÚT HOÀN TẤT CHECK-IN */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleExecuteCheckin}
                disabled={isSubmitting || !verifiedCustomer || !verifiedUnit || !collectedMoney}
                className="w-full cursor-pointer rounded-2xl bg-blue-600 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <KeyRoundIcon className="size-4" />
                <span>
                  {isSubmitting
                    ? "Đang xử lý check-in & bàn giao…"
                    : "Xác Nhận Check-in & Bàn Giao Kho"}
                </span>
              </button>

              {(!verifiedCustomer || !verifiedUnit || !collectedMoney) && (
                <p className="text-center text-[11px] text-amber-600 dark:text-amber-400">
                  * Vui lòng tích chọn đủ 3 bước xác nhận bên trên để kích hoạt nút Check-in.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SƠ ĐỒ KHO 2D NGUYÊN BẢN CỦA CUSTOMER */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-3 sm:p-6">
          <div className="max-w-6xl mx-auto rounded-3xl bg-background shadow-2xl border overflow-hidden">
            <FloorPlanPage
              onSelectUnit={handleOpenConfirmUnitChange}
              currentUnitCode={contract.unitCode}
              selectedUnitCode={selectedUnit?.unitCode}
              initialFacilityId={
                contract.unitCode?.startsWith("HN01") ? 1 :
                contract.unitCode?.startsWith("HN02") ? 2 :
                contract.unitCode?.startsWith("SG01") ? 3 :
                contract.unitCode?.startsWith("SG02") ? 4 :
                contract.unitCode?.startsWith("SG03") ? 5 :
                contract.unitCode?.startsWith("DN01") ? 6 :
                contract.unitCode?.startsWith("CT01") ? 7 : 1
              }
              initialFloorId={currentUnitFloorId ?? undefined}
              onClose={() => setIsMapModalOpen(false)}
              title="Sơ đồ kho 2D"
              subtitle={`Khách hàng: ${contract.customerName} · Mã hợp đồng: ${contract.reservationCode} · Ô kho ban đầu: ${contract.unitCode} (${contract.floorName ?? "Tầng lưu trữ"}) · Bấm vào ô màu xanh để đối soát & đổi ô kho`}
            />
          </div>
        </div>
      )}
      {/* MODAL XÁC NHẬN ĐỔI Ô KHO CHO KHÁCH (POPUP KHI CLICK VÀO Ô TRÊN SƠ ĐỒ 2D) */}
      {confirmingUnit && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <RepeatIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Xác nhận đổi ô kho bàn giao
                  </h3>
                  <p className="text-xs text-muted">
                    Khách: <strong>{contract?.customerName}</strong> · HĐ: <span className="font-mono">{contract?.reservationCode}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmingUnit(null)}
                className="cursor-pointer rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Phân loại biến động */}
              {(() => {
                const change = getChangeType(
                  contract?.unitSize,
                  confirmingUnit.size,
                  contract?.unitTypeName?.includes("mát") || contract?.unitTypeName?.includes("Climate"),
                  confirmingUnit.isClimate
                )
                return (
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-700/80">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Loại thay đổi hợp đồng:</span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide",
                        change.type === "UPSIZE"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300"
                          : change.type === "DOWNSIZE"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                      )}
                    >
                      {change.label}
                    </span>
                  </div>
                )
              })()}

              {/* Bảng so sánh trực quan 2 ô kho */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Ô hiện tại */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-500">Ô ban đầu đã cọc</span>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Hiện tại
                    </span>
                  </div>
                  <div className="font-mono text-lg font-black text-slate-900 dark:text-white">
                    {contract?.unitCode}
                  </div>
                  <div className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                    <p>Loại: <strong>{contract?.unitTypeName ?? "Kho tiêu chuẩn"}</strong></p>
                    <p>Kích thước: <strong>{contract?.unitSize ?? "Tiêu chuẩn"}</strong></p>
                    <p>Vị trí: <strong>{contract?.floorName ?? "Tầng lưu trữ"}</strong></p>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-muted">Cọc đã nộp:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatVnd(contract?.depPaidAmount ?? contract?.depositAmount ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Tiền thuê gốc:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatVnd(contract?.rentalAmount ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ô mới muốn đổi */}
                <div className="rounded-2xl border-2 border-indigo-400 bg-indigo-50/40 p-4 dark:border-indigo-600 dark:bg-indigo-950/30 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-indigo-700 dark:text-indigo-400">Ô mới muốn đổi</span>
                    <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Mới chọn
                    </span>
                  </div>
                  <div className="font-mono text-lg font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    {confirmingUnit.isClimate && <span title="Kho mát điều hòa">❄️</span>}
                    {confirmingUnit.unitCode}
                  </div>
                  <div className="space-y-1 text-slate-700 dark:text-slate-200 text-[11px]">
                    <p>Loại: <strong>{confirmingUnit.typeName ?? "Kho"}</strong></p>
                    <p>Kích thước: <strong>{confirmingUnit.size ?? ""} ({confirmingUnit.areaM2}m²)</strong></p>
                    <p>Vị trí: <strong>{confirmingUnit.floorName ?? "Tầng lưu trữ"}</strong></p>
                  </div>
                  <div className="pt-2 border-t border-indigo-200 dark:border-indigo-900/60 text-[11px] space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-muted">Cọc quy định:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {isCalculatingConfirm ? "Đang tính..." : formatVnd(confirmingPricing?.depositAmount ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Tiền thuê mới:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {isCalculatingConfirm ? "Đang tính..." : formatVnd(confirmingPricing?.finalRentalAmount ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bảng hạch toán minh bạch tiền cọc & tiền thuê */}
              {isCalculatingConfirm ? (
                <div className="rounded-2xl border border-dashed border-indigo-200 p-6 text-center text-xs text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">
                  Đang đối soát biểu phí và tính toán chênh lệch tài chính…
                </div>
              ) : confirmingPricing && contract ? (
                (() => {
                  const oldDepositPaid = contract.depPaidAmount ?? contract.depositAmount ?? 0
                  const newDeposit = confirmingPricing.depositAmount
                  const newRental = confirmingPricing.finalRentalAmount
                  const totalNew = newDeposit + newRental
                  const balance = totalNew - oldDepositPaid
                  const diffDeposit = newDeposit - (contract.depositAmount ?? 0)

                  return (
                    <div className="rounded-2xl border border-indigo-200/90 bg-indigo-50/50 p-4 dark:border-indigo-900/80 dark:bg-indigo-950/30 space-y-3 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-200 text-xs">
                        <BanknoteIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Đối soát tài chính tại quầy tiếp đón:</span>
                      </div>

                      <div className="space-y-1.5 divide-y divide-indigo-100 dark:divide-indigo-900/50 text-[11px]">
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-600 dark:text-slate-400">1. Tiền cọc giữ chỗ đã thanh toán online:</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatVnd(oldDepositPaid)}
                          </span>
                        </div>

                        <div className="flex justify-between pt-1">
                          <span className="text-slate-600 dark:text-slate-400">2. Tiền cọc quy định kho mới:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatVnd(newDeposit)}
                            {diffDeposit !== 0 && (
                              <span className={cn(
                                "ml-1.5 font-bold text-[10px]",
                                diffDeposit > 0 ? "text-amber-600" : "text-emerald-600"
                              )}>
                                ({diffDeposit > 0 ? `Bù thêm +${formatVnd(diffDeposit)}` : `Cấn trừ -${formatVnd(Math.abs(diffDeposit))}`})
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between pt-1">
                          <span className="text-slate-600 dark:text-slate-400">3. Tiền thuê mới ({contract.rentalDuration}):</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatVnd(newRental)}
                          </span>
                        </div>

                        <div className="flex justify-between pt-1 font-semibold text-slate-700 dark:text-slate-300">
                          <span>Tổng giá trị hợp đồng mới (Cọc + Thuê):</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatVnd(totalNew)}
                          </span>
                        </div>
                      </div>

                      {/* Hộp kết quả thanh toán tại quầy */}
                      {balance > 0 ? (
                        <div className="rounded-xl border border-blue-300 bg-white p-3 dark:border-blue-800 dark:bg-slate-900 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-900 dark:text-blue-300">
                              Khách thanh toán thêm tại quầy:
                            </span>
                            <span className="font-mono text-base font-black text-blue-600 dark:text-blue-400">
                              {formatVnd(balance)}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted">
                            💡 Số tiền trên đã khấu trừ toàn bộ tiền cọc cũ đã thanh toán online ({formatVnd(oldDepositPaid)}).
                          </p>
                        </div>
                      ) : balance === 0 ? (
                        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200 font-bold">
                          ✓ Tiền cọc đã đóng cấn trừ vừa đủ trọn gói kho mới. Khách không cần thanh toán thêm tại quầy.
                        </div>
                      ) : (
                        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-900 dark:text-amber-200">
                              Số tiền cọc dư hoàn lại cho khách:
                            </span>
                            <span className="font-mono text-base font-black text-amber-600 dark:text-amber-400">
                              {formatVnd(Math.abs(balance))}
                            </span>
                          </div>
                          <p className="text-[10px] text-amber-800 dark:text-amber-300">
                            💡 Hệ thống sẽ tự động tạo yêu cầu hoàn tiền (RefundRequest) để kế toán chuyển khoản hoàn trả về tài khoản ngân hàng của khách theo quy định.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : null}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
              <button
                type="button"
                onClick={() => setConfirmingUnit(null)}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Chọn ô khác trên sơ đồ
              </button>

              <button
                type="button"
                onClick={handleApplyUnitChange}
                disabled={isCalculatingConfirm || !confirmingPricing}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <CheckIcon className="size-4 stroke-[3]" />
                <span>Xác nhận đổi sang ô {confirmingUnit.unitCode}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
