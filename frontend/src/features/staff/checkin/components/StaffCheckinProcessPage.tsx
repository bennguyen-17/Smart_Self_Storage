import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import CheckinCustomerCard from "./CheckinCustomerCard"
import CheckinUnitChangeModal from "./CheckinUnitChangeModal"
import CheckinSuccessView from "./CheckinSuccessView"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClockIcon,
  KeyRoundIcon,
  PackageIcon,
  ShieldCheckIcon,
  UserIcon,
  ChevronRightIcon,
  BanknoteIcon,
  PrinterIcon,
  AlertCircleIcon,
  RepeatIcon,
  XIcon,
  SparklesIcon,
  LayersIcon,
  CheckIcon,
  InfoIcon,
  PencilIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { formatDate, formatVnd } from "@/lib/format"
import { unitSizeOf, unitSizeFromCode } from "@/features/floorplan/unitDisplay"
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

function getUnitTypeAndClimateDisplay(
  unitCode?: string | null,
  unitTypeName?: string | null,
  unitSize?: string | null,
  isClimate?: boolean | null,
  unitDetail?: UnitDetailResponse | null
): string {
  let size = ""
  if (unitDetail) {
    size = unitSizeOf(unitDetail) ?? ""
  }
  if (!size && unitCode) {
    size = unitSizeFromCode(unitCode) ?? ""
  }
  if (!size && unitSize) {
    const s = unitSize.replace(/size/i, "").trim()
    if (["S", "M", "L", "XL"].includes(s.toUpperCase())) {
      size = s.toUpperCase()
    }
  }
  if (!size && unitTypeName) {
    const m = /size\s*(XL|S|M|L)\b/i.exec(unitTypeName)
    if (m) size = m[1].toUpperCase()
  }
  if (!size) size = "M"

  const isCold = isClimate ?? unitDetail?.isClimate ?? (
    unitTypeName?.toLowerCase().includes("mát") ||
    unitTypeName?.toLowerCase().includes("lạnh") ||
    unitTypeName?.toLowerCase().includes("climate") ||
    unitTypeName?.toLowerCase().includes("điều hòa")
  ) ?? false

  return `Size ${size} - ${isCold ? "Kho lạnh" : "Kho thường"}`
}

function getDisplayRentalDuration(contract: StaffReservationLookup | null): string {
  if (!contract) return "—"

  // Nếu BE đã tính sẵn rentalDuration có nội dung
  if (contract.rentalDuration && contract.rentalDuration.trim()) {
    return contract.rentalDuration
  }

  // Tính toán động từ ngày bắt đầu và kết thúc của hợp đồng
  const startDateStr = contract.reservationStartDate || contract.checkInDate
  const endDateStr = contract.reservationEndDate || contract.endDate

  if (startDateStr && endDateStr) {
    const start = new Date(startDateStr)
    const end = new Date(endDateStr)
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffMs = end.getTime() - start.getTime()
      const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))

      const months = Math.floor(days / 30)
      const remainingDays = days % 30

      if (months < 1) {
        return `${days} ngày`
      }
      if (remainingDays === 0) {
        return `${months} tháng`
      }
      return `${months} tháng ${remainingDays} ngày`
    }
  }

  return "—"
}

function getChangeType(
  oldSizeStr?: string | null,
  newSizeStr?: string | null,
  oldClimate?: boolean,
  newClimate?: boolean
) {
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

  if (newRank > oldRank) return { type: "UPSIZE", label: "NÂNG CẤP KHO (UPSIZE)", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300" }
  if (newRank < oldRank) return { type: "DOWNSIZE", label: "HẠ KÍCH THƯỚC (DOWNSIZE)", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300" }
  if (newClimate && !oldClimate) return { type: "UPSIZE", label: "NÂNG LÊN KHO ĐIỀU HÒA (UPSIZE)", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300" }
  if (!newClimate && oldClimate) return { type: "DOWNSIZE", label: "CHUYỂN SANG KHO THƯỜNG (DOWNSIZE)", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300" }
  return { type: "SAME_SIZE", label: "ĐỔI VỊ TRÍ CÙNG SIZE", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300" }
}

export default function StaffCheckinProcessPage() {
  const { reservationId } = useParams<{ reservationId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [contract, setContract] = useState<StaffReservationLookup | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Đổi ô kho state (Cách 1: Modal Sơ đồ 2D)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<UnitDetailResponse | null>(null)
  const [newPricing, setNewPricing] = useState<{
    finalRentalAmount: number
    depositAmount: number
    totalInitialPayment: number
  } | null>(null)

  // State tạm thời khi click ô trên Sơ đồ 2D trong Modal
  const [mapFloor, setMapFloor] = useState<number>(1)
  const [confirmingUnit, setConfirmingUnit] = useState<UnitDetailResponse | null>(null)
  const [confirmingPricing, setConfirmingPricing] = useState<{
    finalRentalAmount: number
    depositAmount: number
    totalInitialPayment: number
    message?: string
  } | null>(null)
  const [isCalculatingConfirm, setIsCalculatingConfirm] = useState(false)

  // Lấy toàn bộ ô kho để đối chiếu thông tin khi staff click chọn ô trên sơ đồ
  const [units, setUnits] = useState<UnitDetailResponse[]>([])

  useEffect(() => {
    fetchAllUnits().then(setUnits).catch(() => {})
  }, [])

  // Ô kho hiện tại của hợp đồng
  const currentUnit = useMemo(() => {
    if (!contract || !units.length) return null
    return units.find((u) => u.unitCode === contract.unitCode) ?? null
  }, [contract, units])

  // Thanh toán & check-in state
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<StaffCheckInResponse | null>(null)

  // Hiệu chỉnh thông tin khách hàng (Tên & CCCD)
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [cccdInput, setCccdInput] = useState("")
  const [isSavingCustomer, setIsSavingCustomer] = useState(false)

  // Checklist xác nhận với khách
  const [verifiedCustomer, setVerifiedCustomer] = useState(false)
  const [verifiedUnit, setVerifiedUnit] = useState(false)
  const [collectedMoney, setCollectedMoney] = useState(false)

  const loadData = () => {
    if (!reservationId) return
    setLoading(true)
    setError(null)
    getReservationDetail(Number(reservationId))
      .then((data) => {
        setContract(data)
        setNameInput(data.customerName ?? "")
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

  // Cơ sở và Tầng mặc định từ hợp đồng
  const contractFacility = useMemo(() => {
    if (!contract?.unitCode) return "HN01"
    const prefix = contract.unitCode.split("-")[0]
    return prefix || "HN01"
  }, [contract])

  const contractFloor = useMemo(() => {
    if (!contract?.unitCode) return 1
    const match = contract.unitCode.match(/-F(\d+)-/i)
    if (match) return Number(match[1]) + 1
    if (contract.unitCode.includes("-G-")) return 1
    return 1
  }, [contract])

  useEffect(() => {
    if (contractFloor) {
      setMapFloor(contractFloor)
    }
  }, [contractFloor])

  // Tính thời gian thuê để gửi lên API tính giá
  const rentalDurationInfo = useMemo(() => {
    const startDateStr = contract?.reservationStartDate || contract?.checkInDate
    const endDateStr = contract?.reservationEndDate || contract?.endDate
    if (!startDateStr || !endDateStr) {
      return { rentalType: "MONTHLY", duration: 1 }
    }
    const start = new Date(startDateStr)
    const end = new Date(endDateStr)
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)))
    if (days < 30) {
      return { rentalType: "DAILY", duration: days }
    }
    return { rentalType: "MONTHLY", duration: Math.max(1, Math.round(days / 30)) }
  }, [contract])

  // Click vào ô trên Sơ đồ 2D trong Modal
  const handleInitiateUnitChange = async (u: any) => {
    if (!contract) return
    if (u.id === contract.unitCode) {
      toast.info(`Đây là ô kho ban đầu của khách (${u.id})`)
      return
    }

    const matched = units.find((x) => x.unitCode === u.id || x.unitId === u.unitId)
    const targetUnit: UnitDetailResponse = matched || {
      unitId: u.unitId || 0,
      unitCode: u.id,
      unitTypeId: u.unitTypeId || 1,
      typeName: u.typeLabel || `Kho Size ${u.size}`,
      size: u.size,
      lengthM: u.lengthM,
      widthM: u.widthM,
      areaM2: u.areaM2,
      dailyPrice: u.price || 0,
      monthlyPrice: u.monthlyPrice || 0,
      status: u.status || "AVAILABLE",
      isClimate: Boolean(u.isClimate),
      floorId: u.floor || 1,
      floorName: u.floorName || (u.floor === 1 ? "Tầng trệt" : `Tầng ${u.floor - 1}`),
    }

    setConfirmingUnit(targetUnit)
    setConfirmingPricing(null)
    setIsCalculatingConfirm(true)

    try {
      const res = await calculateRentalPrice({
        unitTypeId: targetUnit.unitTypeId,
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

  // Xác nhận đổi sang ô đã chọn trên sơ đồ 2D
  const handleApplyUnitChange = () => {
    if (!confirmingUnit || !confirmingPricing) return
    setSelectedUnit(confirmingUnit)
    setNewPricing(confirmingPricing)
    setConfirmingUnit(null)
    setIsMapModalOpen(false)
    toast.success(`Đã chọn đổi sang ô ${confirmingUnit.unitCode} thành công!`)
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

    // Trường hợp CÓ ĐỔI Ô KHO MỚI
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
  const handleSaveCustomerInfo = async () => {
    if (!contract || !reservationId) return
    const cleanName = nameInput.trim()
    if (!cleanName) {
      toast.error("Họ và tên khách hàng không được để trống.")
      return
    }
    const cleanCccd = cccdInput.trim()
    if (!/^\d{12}$/.test(cleanCccd)) {
      toast.error("Số CCCD phải gồm đúng 12 chữ số.")
      return
    }
    setIsSavingCustomer(true)
    try {
      const res = await updateCustomerCccd(Number(reservationId), cleanCccd, cleanName)
      setContract({ ...contract, customerName: cleanName, customerIdNumber: cleanCccd })
      toast.success("Hiệu chỉnh thông tin thành công!")
      setIsEditingCustomer(false)
    } catch (err) {
      toast.error(checkinErrorMessage(err))
    } finally {
      setIsSavingCustomer(false)
    }
  }

  const handleCancelEditCustomer = () => {
    if (contract) {
      setNameInput(contract.customerName ?? "")
      setCccdInput(contract.customerIdNumber ?? "")
    }
    setIsEditingCustomer(false)
  }

  // Thực hiện Check-in
  const handleExecuteCheckin = async () => {
    if (!contract || !financialSummary) return

    setIsSubmitting(true)
    try {
      // BƯỚC 1: Nếu có đổi kho, gọi API change-unit trước
      let activeUnitCode = contract.unitCode
      let activeFloorName = contract.floorName

      if (selectedUnit) {
        await changeUnit(contract.reservationId, {
          newUnitCode: selectedUnit.unitCode,
        })
        activeUnitCode = selectedUnit.unitCode
        activeFloorName = selectedUnit.floorName || activeFloorName
      }

      // BƯỚC 2: Gọi API check-in thu tiền & kích hoạt HĐ sang ACTIVE
      const res = await confirmCheckin(contract.reservationId, {
        collectedAmount: financialSummary.remainingDue,
        paymentMethod,
      })

      setContract((prev) =>
        prev
          ? {
              ...prev,
              unitCode: activeUnitCode,
              floorName: activeFloorName,
            }
          : null
      )

      setActionSuccess(res)
      toast.success("Bàn giao & Check-in kho thành công!", {
        description: `Hợp đồng ${res.reservationCode ?? contract.reservationCode} đã kích hoạt.`,
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
      <CheckinSuccessView
        actionSuccess={actionSuccess}
        contract={contract}
        unitCode={selectedUnit?.unitCode ?? contract.unitCode}
        floorName={selectedUnit?.floorName ?? contract.floorName}
      />
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
          <CheckinCustomerCard
            contract={contract}
            isEditingCustomer={isEditingCustomer}
            isSavingCustomer={isSavingCustomer}
            nameInput={nameInput}
            cccdInput={cccdInput}
            setNameInput={setNameInput}
            setCccdInput={setCccdInput}
            setIsEditingCustomer={setIsEditingCustomer}
            onSaveCustomerInfo={handleSaveCustomerInfo}
            onCancelEditCustomer={handleCancelEditCustomer}
          />

          {/* CARD 2: CHI TIẾT HỢP ĐỒNG THUÊ KHO */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-3">
            {/* Header hợp đồng */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PackageIcon className="size-4 text-slate-600 dark:text-slate-400" />
                <span>Thông tin hợp đồng thuê kho</span>
              </h2>

              {/* NÚT SÁT GÓC PHẢI THEO YÊU CẦU */}
              {selectedUnit ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUnit(null)
                      setNewPricing(null)
                    }}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
                  >
                    <XIcon className="size-3.5" />
                    <span>Hủy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition active:scale-95"
                  >
                    <RepeatIcon className="size-3.5" />
                    <span>Đổi ô khác</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition active:scale-95"
                >
                  <RepeatIcon className="size-3.5" />
                  <span>Đổi ô kho</span>
                </button>
              )}
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
                  {selectedUnit ? (
                    <span className="flex items-center gap-1.5">
                      <span className="line-through text-slate-400">{contract.unitCode}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{selectedUnit.unitCode}</span>
                    </span>
                  ) : (
                    contract.unitCode
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Loại kho:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedUnit ? (
                    <span className="text-indigo-700 dark:text-indigo-300 font-bold">
                      {getUnitTypeAndClimateDisplay(
                        selectedUnit.unitCode,
                        selectedUnit.typeName,
                        selectedUnit.size,
                        selectedUnit.isClimate,
                        selectedUnit
                      )}
                    </span>
                  ) : (
                    getUnitTypeAndClimateDisplay(
                      contract.unitCode,
                      contract.unitTypeName,
                      contract.unitSize,
                      currentUnit?.isClimate,
                      currentUnit
                    )
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Thời hạn thuê:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {getDisplayRentalDuration(contract)}
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
            </div>
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
                      <p className="mt-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                        Khách hàng sẽ được hoàn lại: {formatVnd(financialSummary.refundAmount)}
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

      {/* MODAL SƠ ĐỒ KHO 2D TRỰC QUAN */}
      <CheckinUnitChangeModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false)
          setConfirmingUnit(null)
          setConfirmingPricing(null)
        }}
        contract={contract}
        contractFacility={contractFacility}
        mapFloor={mapFloor}
        setMapFloor={setMapFloor}
        confirmingUnit={confirmingUnit}
        selectedUnit={selectedUnit}
        onInitiateUnitChange={handleInitiateUnitChange}
        onApplyUnitChange={handleApplyUnitChange}
        onCancelConfirmUnit={() => {
          setConfirmingUnit(null)
          setConfirmingPricing(null)
        }}
        isCalculatingConfirm={isCalculatingConfirm}
        getUnitTypeAndClimateDisplay={getUnitTypeAndClimateDisplay}
      />
    </div>
  )
}
