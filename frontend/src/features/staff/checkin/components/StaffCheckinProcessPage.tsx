import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
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
  XIcon,
  EyeIcon,
  LayersIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { formatDate, formatVnd } from "@/lib/format"
import { unitAreaOf, unitSizeOf, unitSizeFromCode } from "@/features/floorplan/unitDisplay"
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
  const modalFloorUnits = useMemo(() => {
    if (!contract || !units.length) return []
    const prefix = contract.unitCode?.split("-")[0] ?? ""
    return units.filter((u) => {
      const matchPrefix = prefix ? u.unitCode.startsWith(prefix) : true
      return matchPrefix && u.floorId === activeModalFloorId
    })
  }, [contract, units, activeModalFloorId])

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
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
            {/* Header hợp đồng: Tên HĐ + Mã HĐ + Nút xem sơ đồ 2D */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold">
                  <PackageIcon className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Hợp đồng thuê kho tự quản</span>
                  </h2>
                  <p className="text-[11px] text-muted">
                    Mã hợp đồng:{" "}
                    <strong className="font-mono text-blue-600 dark:text-blue-400">
                      {contract.reservationCode}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalFloorId(currentUnitFloorId ?? facilityFloors[0]?.floorId ?? 1)
                    setIsMapModalOpen(true)
                  }}
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100 transition dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  title="Mở sơ đồ 2D để hướng dẫn vị trí kho cho khách"
                >
                  <MapIcon className="size-3.5" />
                  <span>Xem sơ đồ 2D</span>
                </button>
              </div>
            </div>

            {/* 4 Cards Grid tiêu chuẩn hợp đồng */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Card 1: Mã kho */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3 flex flex-col justify-between text-left shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted">Mã ô kho</span>
                  <button
                    type="button"
                    onClick={() => {
                      setModalFloorId(currentUnitFloorId ?? facilityFloors[0]?.floorId ?? 1)
                      setIsMapModalOpen(true)
                    }}
                    className="cursor-pointer text-[10.5px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Xem 2D
                  </button>
                </div>
                <div className="mt-1">
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm block">
                    {contract.unitCode}
                  </span>
                  <span className="text-[10px] text-muted block truncate mt-0.5">
                    {contract.floorName ?? "Tầng lưu trữ"}
                  </span>
                </div>
              </div>

              {/* Card 2: Ngày Check-in */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3 flex flex-col justify-between text-left shadow-2xs">
                <span className="text-[11px] font-medium text-muted">Ngày Check-in</span>
                <div className="mt-1">
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm block">
                    {contract.reservationStartDate
                      ? formatDate(contract.reservationStartDate)
                      : "Hôm nay"}
                  </span>
                  <span className="text-[10px] text-muted block mt-0.5">
                    Nhận kho
                  </span>
                </div>
              </div>

              {/* Card 3: Hạn Check-out */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3 flex flex-col justify-between text-left shadow-2xs">
                <span className="text-[11px] font-medium text-muted">Hạn Check-out</span>
                <div className="mt-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm block">
                    {contract.reservationEndDate
                      ? formatDate(contract.reservationEndDate)
                      : "—"}
                  </span>
                  <span className="text-[10px] text-muted block mt-0.5">
                    Hết hạn thuê
                  </span>
                </div>
              </div>

              {/* Card 4: Thời hạn thuê */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3 flex flex-col justify-between text-left shadow-2xs">
                <span className="text-[11px] font-medium text-muted">Thời hạn thuê</span>
                <div className="mt-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">
                    {contract.rentalDuration ?? "1 tháng"}
                  </span>
                  <span className="text-[10px] text-muted block mt-0.5">
                    Theo hợp đồng
                  </span>
                </div>
              </div>
            </div>

            {/* Bảng chi tiết quy cách kho & Tài chính hợp đồng */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-850/60 space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                <div>
                  <span className="text-[11px] text-muted block">Loại kho &amp; Kích thước:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {contract.unitTypeName ?? "Kho tiêu chuẩn"} ({contract.unitSize ?? "Chuẩn"})
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-muted block">Ngày cọc giữ chỗ:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {contract.depositDate
                      ? formatDate(contract.depositDate)
                      : formatDate(contract.reservationStartDate)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[11px] text-muted block">Tiền cọc giữ chỗ:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs sm:text-sm mt-0.5 block">
                    {formatVnd(contract.depositAmount ?? 0)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-muted block">Tiền thuê kho:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm mt-0.5 block">
                    {formatVnd(contract.rentalAmount ?? 0)}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-muted block">Tổng giá trị hợp đồng:</span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-xs sm:text-sm mt-0.5 block">
                    {formatVnd(
                      (contract.depositAmount ?? 0) + (contract.rentalAmount ?? 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-muted">Tình trạng thanh toán:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2Icon className="size-3.5" />
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
                {/* Thanh chọn bộ lọc Size */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-muted text-[11px] shrink-0 font-medium">Lọc theo kích thước:</span>
                  {["ALL", "SIZE S", "SIZE M", "SIZE L", "SIZE XL"].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSizeFilter(sz)}
                      className={cn(
                        "rounded-lg px-3 py-1 font-bold transition whitespace-nowrap cursor-pointer text-xs",
                        sizeFilter === sz
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {sz === "ALL" ? "Tất cả size" : sz}
                    </button>
                  ))}
                </div>

                {/* Danh sách ô kho trống cùng cơ sở */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>
                      Danh sách ô kho <strong>TRỐNG (AVAILABLE)</strong> sẵn sàng bàn giao ({filteredAvailableUnits.length} ô):
                    </span>
                    {selectedUnit && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUnit(null)
                          setNewPricing(null)
                        }}
                        className="text-rose-600 hover:underline dark:text-rose-400 font-bold cursor-pointer"
                      >
                        Bỏ chọn ô đổi
                      </button>
                    )}
                  </div>

                  {filteredAvailableUnits.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-muted dark:border-slate-800">
                      Không có ô kho trống phù hợp với bộ lọc size này trong cơ sở.
                    </div>
                  ) : (
                    <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 pr-1">
                      {filteredAvailableUnits.map((u) => {
                        const isSelected = selectedUnit?.unitCode === u.unitCode
                        return (
                          <div
                            key={u.unitCode}
                            onClick={() => handleSelectUnit(u)}
                            className={cn(
                              "cursor-pointer rounded-xl border p-3 transition text-xs relative",
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/80 shadow-sm ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40"
                                : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-slate-900 dark:text-white">
                                {u.unitCode}
                              </span>
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {u.typeName ?? "Kho"}
                              </span>
                            </div>

                            <p className="mt-1 text-[11px] text-muted">
                              {u.floorName ?? "Tầng lưu trữ"} · {u.size ?? ""}
                            </p>

                            {isSelected && (
                              <div className="absolute bottom-2 right-2 flex size-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                                <CheckIcon className="size-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Kết quả so sánh ô cũ vs ô mới khi đã chọn */}
                {calcLoading && (
                  <div className="py-2 text-center text-xs text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">
                    Đang tính lại giá thuê &amp; tiền cọc kho mới…
                  </div>
                )}

                {selectedUnit && newPricing && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 text-xs dark:border-indigo-900/60 dark:bg-indigo-950/30 space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200 text-xs">
                      <SparklesIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Kết quả điều chỉnh kho mới:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-indigo-200/60 dark:border-indigo-900/60">
                      <div>
                        <span className="text-[11px] text-muted block">Ô kho chuyển đổi:</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold mt-0.5 text-xs">
                          <span className="line-through text-slate-400">{contract.unitCode}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-indigo-700 dark:text-indigo-300 text-sm">
                            {selectedUnit.unitCode}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-muted block">Loại kho mới:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {selectedUnit.typeName} ({selectedUnit.size})
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] text-muted block">Tiền cọc quy định mới:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {formatVnd(newPricing.depositAmount)}
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
                        <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {formatVnd(newPricing.finalRentalAmount)}
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

      {/* MODAL XEM SƠ ĐỒ MẶT BẰNG 2D CHO KHÁCH (CHỈ XEM) */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <MapIcon className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Sơ đồ mặt bằng kho 2D
                    </h3>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Chế độ chỉ xem cho khách
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Vị trí ô kho:{" "}
                    <strong className="font-mono text-blue-600 dark:text-blue-400">
                      {contract.unitCode}
                    </strong>{" "}
                    · {contract.floorName ?? "Tầng lưu trữ"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="cursor-pointer rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            {/* MODAL CONTROLS (FLOOR TABS & LEGEND) */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
              {/* THANH CHỌN TẦNG */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                  <LayersIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
                  Tầng:
                </span>
                {facilityFloors.map((f) => {
                  const isActive = f.floorId === activeModalFloorId
                  const isCurrentFloor = currentUnitFloorId === f.floorId
                  return (
                    <button
                      key={f.floorId}
                      type="button"
                      onClick={() => setModalFloorId(f.floorId)}
                      className={cn(
                        "cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap",
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      <span>{f.floorName}</span>
                      {isCurrentFloor && (
                        <span
                          className={cn(
                            "text-[9px] px-1.5 py-0.2 rounded-full font-black",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-blue-200 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                          )}
                        >
                          Ô của khách
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* CHÚ THÍCH */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                  <span className="size-2.5 rounded-full bg-blue-600 ring-2 ring-blue-300 dark:ring-blue-800 animate-pulse" />
                  Ô của khách ({contract.unitCode})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  Còn trống
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-rose-400" />
                  Đã thuê
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-amber-400" />
                  Đang giữ chỗ
                </span>
              </div>
            </div>

            {/* MODAL BODY (BLUEPRINT 2D SCROLLABLE) */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {modalFloorUnits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-xs text-muted dark:border-slate-800">
                  Không có dữ liệu mặt bằng cho tầng này.
                </div>
              ) : (
                <div className="floor-blueprint-container p-4 space-y-4 shadow-inner relative">
                  {(["XL", "L", "M", "S"] as const).map((sz, rowIdx) => {
                    const unitsInSize = modalFloorUnits.filter(
                      (u) => getUnitSize(u) === sz
                    )
                    if (unitsInSize.length === 0) return null

                    const corridorTitle =
                      sz === "XL"
                        ? "HÀNH LANG TRỤC XE TẢI / XE NÂNG (TẦNG TRỆT)"
                        : "HÀNH LANG LỐI ĐI NỘI BỘ 24/7"

                    const gridColsClass =
                      sz === "S"
                        ? "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2"
                        : sz === "M"
                        ? "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5"
                        : sz === "L"
                        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5"
                        : "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5"

                    const sectionTitle =
                      sz === "XL"
                        ? "Dãy Kho Lớn Mặt Bằng (XL - 10m²)"
                        : sz === "L"
                        ? "Khu Phòng Lớn (Size L - 6m²)"
                        : sz === "M"
                        ? "Khu Phòng Vừa (Size M - 3m²)"
                        : "Cụm Tủ Cá Nhân (Size S - 1m²)"

                    return (
                      <div key={sz} className="space-y-2">
                        {rowIdx > 0 && (
                          <div className="floor-corridor-strip my-1">
                            {corridorTitle}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-800 dark:text-slate-200">
                          <span className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "size-2.5 rounded-full",
                                sz === "XL"
                                  ? "bg-amber-500"
                                  : sz === "L"
                                  ? "bg-blue-500"
                                  : sz === "M"
                                  ? "bg-indigo-500"
                                  : "bg-emerald-500"
                              )}
                            />
                            {sectionTitle}
                          </span>
                          <span className="text-[10px] font-medium text-muted">
                            {unitsInSize.length} ô
                          </span>
                        </div>

                        <div className={gridColsClass}>
                          {unitsInSize.map((u) => {
                            const isCurrent = u.unitCode === contract.unitCode
                            const st = String(u.status)
                            const isOccupied =
                              st === "RENTED" ||
                              st === "OCCUPIED" ||
                              st === "OVERDUE"
                            const isHold =
                              st === "HOLD" || (st === "RESERVED" && !isCurrent)
                            const isAvailable = st === "AVAILABLE" && !isCurrent

                            const heightClass =
                              sz === "S"
                                ? "min-h-[58px]"
                                : sz === "M"
                                ? "min-h-[66px]"
                                : sz === "L"
                                ? "min-h-[76px]"
                                : "min-h-[86px]"

                            return (
                              <div
                                key={u.unitCode}
                                className={cn(
                                  "relative flex flex-col justify-between rounded-xl border p-2 text-center select-none transition",
                                  heightClass,
                                  isCurrent
                                    ? "border-blue-600 bg-blue-100 text-blue-950 ring-4 ring-blue-500/50 shadow-lg scale-103 font-bold dark:border-blue-400 dark:bg-blue-950 dark:text-white"
                                    : isAvailable
                                    ? "border-emerald-300 bg-emerald-50/70 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                                    : isHold
                                    ? "border-amber-300 bg-amber-50/60 text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200 opacity-70"
                                    : "border-slate-200 bg-slate-100/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400 opacity-60"
                                )}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono font-black text-xs tracking-tight flex items-center gap-1">
                                    {u.isClimate && (
                                      <span
                                        className="text-[10px] text-cyan-600 dark:text-blue-400"
                                        title="Kho mát điều hòa 22-25°C"
                                      >
                                        ❄️
                                      </span>
                                    )}
                                    {u.unitCode}
                                  </span>
                                  <span className="rounded bg-white/80 px-1 py-0.2 text-[9px] font-extrabold text-slate-700 border border-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {sz}
                                  </span>
                                </div>

                                <div className="mt-1 flex items-center justify-between text-[10px] font-bold">
                                  {isCurrent ? (
                                    <span className="text-blue-700 dark:text-blue-300 flex items-center gap-0.5">
                                      ⭐ Ô của khách
                                    </span>
                                  ) : isAvailable ? (
                                    <span className="text-emerald-700 dark:text-emerald-400">
                                      Trống
                                    </span>
                                  ) : isHold ? (
                                    <span className="text-amber-700 dark:text-amber-400">
                                      Giữ chỗ
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">
                                      Đã thuê
                                    </span>
                                  )}

                                  <span className="text-[9px] font-normal text-muted">
                                    {u.areaM2 ? `${u.areaM2}m²` : ""}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <span className="text-xs text-muted">
                💡 Sơ đồ trực quan giúp nhân viên hướng dẫn khách hàng vị trí ô kho và đường đi nhận kho.
              </span>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="cursor-pointer rounded-xl bg-slate-200 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
              >
                Đóng sơ đồ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
