import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { UsersIcon } from "lucide-react"
import { cn } from "cn"

import { useAsyncData } from "@/hooks/useAsyncData"
import { unitAreaOf, unitSizeOf } from "@/features/floorplan/unitDisplay"

import {
  checkinErrorMessage,
  fetchAllUnits,
  listCheckinContracts,
  lookupContract,
} from "../api/checkinApi"
import { CHECKIN_TABS, findCheckinTab, type CheckinTabKey } from "../constants"
import type { StaffReservationItem } from "../types"
import CheckinContractTable from "./CheckinContractTable"
import StaffShiftBadge from "@/features/staff/components/StaffShiftBadge"
import ChangeUnitDialog from "./ChangeUnitDialog"
import CollectPenaltyDialog from "./CollectPenaltyDialog"
import ConfirmCheckinDialog from "./ConfirmCheckinDialog"
import CounterCancelDialog from "./CounterCancelDialog"
import RenewAtCounterDialog from "./RenewAtCounterDialog"
import StaffCustomerDetailModal, {
  type CheckinTarget,
} from "./StaffCustomerDetailModal"
import StaffInspectionModal, {
  type InspectionTarget,
} from "./StaffInspectionModal"

const TAB_COLORS: Record<CheckinTabKey, string> = {
  all: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
  pending:
    "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300",
  active:
    "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
  overdue:
    "bg-rose-100 text-rose-900 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300",
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_CHECKIN: "CHỜ CHECK-IN",
  ACTIVE: "ĐANG THUÊ",
  OVERDUE: "QUÁ HẠN",
  TERMINATED: "ĐÃ TRẢ KHO",
  CANCELLED: "ĐÃ HỦY",
}

function matches(item: StaffReservationItem, keyword: string): boolean {
  if (!keyword) return true
  return (
    (item.reservationCode ?? "").toLowerCase().includes(keyword) ||
    (item.customerName ?? "").toLowerCase().includes(keyword) ||
    (item.customerPhone ?? "").includes(keyword) ||
    (item.unitCode ?? "").toLowerCase().includes(keyword)
  )
}

/** TAB 1: Dịch vụ khách hàng & hợp đồng — tra cứu, check-in, đổi ô, hủy (US-16/17) */
function CheckinPanel() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = findCheckinTab(searchParams.get("tab"))

  const [reload, setReload] = useState(0)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const handleShiftChange = () => setReload((n) => n + 1)
    window.addEventListener("staff-shift-changed", handleShiftChange)
    return () => window.removeEventListener("staff-shift-changed", handleShiftChange)
  }, [])
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  const [detailContract, setDetailContract] = useState<CheckinTarget | null>(
    null
  )
  const [checkinContract, setCheckinContract] = useState<CheckinTarget | null>(
    null
  )
  const [changeContract, setChangeContract] = useState<CheckinTarget | null>(
    null
  )
  const [cancelContract, setCancelContract] = useState<CheckinTarget | null>(
    null
  )
  const [inspection, setInspection] = useState<InspectionTarget | null>(null)
  // US-20: thu phạt quá hạn & gia hạn tại quầy
  const [penaltyContract, setPenaltyContract] = useState<CheckinTarget | null>(
    null
  )
  const [renewContract, setRenewContract] = useState<CheckinTarget | null>(null)

  const { data, error, isLoading } = useAsyncData(`checkin:${reload}`, () =>
    listCheckinContracts()
  )

  // Map unitCode → "Size M (3m²)" cho cột Kho & Vị trí (dùng chung cache với dialog đổi ô).
  const { data: units } = useAsyncData("checkin:all-units", fetchAllUnits)
  const unitMeta = useMemo(() => {
    const map: Record<string, string> = {}
    for (const unit of units ?? []) {
      const size = unitSizeOf(unit)
      const area = unitAreaOf(unit)
      const parts = [
        size ? `Size ${size}` : unit.typeName,
        area != null ? `(${area}m²)` : null,
      ].filter(Boolean)
      if (parts.length) map[unit.unitCode] = parts.join(" ")
    }
    return map
  }, [units])

  const all = useMemo(() => {
    const getStatusPriority = (status?: string): number => {
      if (status === "PENDING_CHECKIN") return 0
      if (status === "ACTIVE") return 1
      if (status === "OVERDUE") return 2
      return 3
    }

    return (data ?? [])
      .filter((item) =>
        ["PENDING_CHECKIN", "ACTIVE", "OVERDUE"].includes(
          item.contractStatus ?? ""
        )
      )
      .sort((a, b) => {
        const pA = getStatusPriority(a.contractStatus)
        const pB = getStatusPriority(b.contractStatus)
        if (pA !== pB) return pA - pB
        return (a.checkInDate ?? "").localeCompare(b.checkInDate ?? "")
      })
  }, [data])
  const keyword = query.trim().toLowerCase()
  const rows = all
    .filter(
      (item) =>
        !tab.contractStatus || item.contractStatus === tab.contractStatus
    )
    .filter((item) => matches(item, keyword))

  function countOf(status?: string): number {
    return status
      ? all.filter((item) => item.contractStatus === status).length
      : all.length
  }

  async function handleLookup() {
    const code = query.trim()
    if (!code) return
    setIsLookingUp(true)
    setLookupError(null)
    try {
      const found = await lookupContract(code)
      if (found.contractStatus !== "PENDING_CHECKIN") {
        const label =
          STATUS_LABEL[found.contractStatus ?? ""] ?? found.contractStatus
        setLookupError(
          `Hợp đồng ${found.reservationCode} đang ở trạng thái ${label} — không thể check-in.`
        )
        return
      }
      setDetailContract(found)
    } catch (err) {
      setLookupError(checkinErrorMessage(err))
    } finally {
      setIsLookingUp(false)
    }
  }

  function refresh() {
    setReload((n) => n + 1)
  }

  return (
    <section aria-label="Quản lý khách hàng và check-in" className="space-y-4">
      {/* Tiêu đề trang - Nằm trực tiếp trên nền ambient xanh mờ như Manager */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <UsersIcon className="size-5 text-blue-600 dark:text-blue-400" />
          <span>Quản lý danh sách khách hàng &amp; Hỗ trợ check-in bàn giao kho</span>
        </h1>
      </div>

      {/* Cụm Tìm kiếm & Trạng thái Ca trực */}
      <div className="card-box flex flex-col justify-between gap-3 rounded-2xl border p-4 shadow-sm md:flex-row md:items-center">
        <div className="flex max-w-xl flex-1 space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleLookup()
              }}
              placeholder="Tìm theo Mã HĐ, Tên khách hàng, SĐT hoặc Mã kho..."
              className="inner-box w-full rounded-xl border border-slate-200/80 px-3.5 py-2 pl-9 text-xs font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700"
            />
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 z-10"></i>
          </div>
          <button
            type="button"
            onClick={handleLookup}
            className="shrink-0 cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
          >
            {isLookingUp ? "Đang tìm..." : "Tra cứu"}
          </button>
        </div>

        <StaffShiftBadge />
      </div>

      {lookupError && (
        <div className="rounded-xl border border-rose-300 bg-rose-50/80 p-3 text-xs font-semibold text-rose-700 backdrop-blur-sm dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {lookupError}
        </div>
      )}

      {/* Cụm Filter Chips theo trạng thái - Nằm trực tiếp trên nền như Manager */}
      <div role="group" aria-label="Lọc theo trạng thái hợp đồng" className="flex flex-wrap items-center gap-2">
        {CHECKIN_TABS.map((t) => {
          const active = t.key === tab.key
          return (
            <button
              key={t.key}
              type="button"
              aria-pressed={active}
              onClick={() => setSearchParams({ tab: t.key })}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap shadow-2xs transition backdrop-blur-sm",
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "border-slate-200/90 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
              )}
            >
              {t.label} ({countOf(t.contractStatus)})
            </button>
          )
        })}
      </div>

      {/* Bảng danh sách hợp đồng - Thẻ card kính mờ riêng biệt */}
      <CheckinContractTable
        rows={rows}
        isLoading={isLoading}
        error={error}
        onRetry={refresh}
        onOpenDetail={setDetailContract}
        onCheckin={(item) => navigate(`/staff/checkin/${item.reservationId}`)}
        onCheckout={(item) =>
          setInspection({
            contractId: item.contractId,
            reservationId: item.reservationId,
            contractCode: item.reservationCode,
            customerName: item.customerName ?? "—",
            unitCode: item.unitCode ?? "—",
            depositAmount: item.depositAmount ?? item.depPaidAmount ?? (item.depAmount != null && item.depAmount <= 3_000_000 ? item.depAmount : 2_000_000),
          })
        }
        onCollectPenalty={setPenaltyContract}
        onRenew={setRenewContract}
        unitMeta={unitMeta}
      />

      <StaffCustomerDetailModal
        contract={detailContract}
        onClose={() => setDetailContract(null)}
      />

      <ConfirmCheckinDialog
        contract={checkinContract}
        onClose={() => setCheckinContract(null)}
        onConfirmed={() => {
          setCheckinContract(null)
          refresh()
        }}
      />

      <ChangeUnitDialog
        contract={changeContract}
        onClose={() => setChangeContract(null)}
        onChanged={() => {
          setChangeContract(null)
          refresh()
        }}
      />

      <CounterCancelDialog
        contract={cancelContract}
        onClose={() => setCancelContract(null)}
        onCanceled={() => {
          setCancelContract(null)
          refresh()
        }}
      />

      <StaffInspectionModal
        target={inspection}
        onClose={() => setInspection(null)}
        onConfirmed={() => {
          setInspection(null)
          refresh()
        }}
      />

      <CollectPenaltyDialog
        contract={penaltyContract}
        onClose={() => setPenaltyContract(null)}
        onCollected={() => {
          setPenaltyContract(null)
          refresh()
        }}
      />

      <RenewAtCounterDialog
        contract={renewContract}
        onClose={() => {
          setRenewContract(null)
          refresh()
        }}
        onRenewed={() => {
          setRenewContract(null)
          refresh()
        }}
        onPenaltyCollected={refresh}
      />
    </section>
  )
}

export default CheckinPanel
