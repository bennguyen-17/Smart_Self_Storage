import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { SearchIcon, UsersIcon } from "lucide-react"
import { cn } from "cn"

import { useAsyncData } from "@/hooks/useAsyncData"
import { unitAreaOf, unitSizeOf } from "@/features/floor-plan/unitDisplay"

import {
  checkinErrorMessage,
  fetchAllUnits,
  listCheckinContracts,
  lookupContract,
} from "../api/checkinApi"
import { CHECKIN_TABS, findCheckinTab, type CheckinTabKey } from "../constants"
import type { StaffReservationItem } from "../types"
import CheckinContractTable from "./CheckinContractTable"
import ChangeUnitDialog from "./ChangeUnitDialog"
import ConfirmCheckinDialog from "./ConfirmCheckinDialog"
import CounterCancelDialog from "./CounterCancelDialog"
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
  canceled:
    "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300",
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_CHECKIN: "CHỜ CHECK-IN",
  ACTIVE: "ĐANG THUÊ",
  OVERDUE: "QUÁ HẠN",
  CANCELED: "ĐÃ HỦY",
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
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = findCheckinTab(searchParams.get("tab"))

  const [reload, setReload] = useState(0)
  const [query, setQuery] = useState("")
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

  const all = data ?? []
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
    <div className="card-box space-y-5 rounded-3xl border p-5 shadow-xl sm:p-6">
      <div className="flex flex-col items-start justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center">
        <h3 className="text-title flex items-center space-x-2 text-sm font-extrabold sm:text-base">
          <UsersIcon className="size-4 text-blue-600" />
          <span>
            QUẢN LÝ DANH SÁCH KHÁCH HÀNG &amp; HỖ TRỢ CHECK-IN BÀN GIAO KHO
          </span>
        </h3>
      </div>

      {/* SEARCH & FILTER TOOLBAR */}
      <div className="space-y-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex max-w-xl flex-1 space-x-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-3 left-3.5 size-3.5 text-muted" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleLookup()
                }}
                placeholder="Tìm theo Mã HĐ, Tên khách hàng, SĐT hoặc Mã kho..."
                className="inner-box text-title w-full rounded-xl border px-3.5 py-2.5 pl-9 font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleLookup}
              className="shrink-0 cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow transition hover:bg-blue-700"
            >
              {isLookingUp ? "Đang tìm..." : "Tra cứu"}
            </button>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] font-extrabold sm:pb-0">
            {CHECKIN_TABS.map((t) => {
              const active = t.key === tab.key
              return (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSearchParams({ tab: t.key })}
                  className={cn(
                    "cursor-pointer rounded-xl border px-3 py-1.5 whitespace-nowrap shadow-sm transition",
                    active
                      ? "border-transparent bg-blue-600 font-extrabold text-white"
                      : cn("border-white", TAB_COLORS[t.key])
                  )}
                >
                  {t.label} ({countOf(t.contractStatus)})
                </button>
              )
            })}
          </div>
        </div>

        {lookupError && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
            {lookupError}
          </div>
        )}
      </div>

      <CheckinContractTable
        rows={rows}
        isLoading={isLoading}
        error={error}
        onRetry={refresh}
        onOpenDetail={setDetailContract}
        onCheckin={setCheckinContract}
        onCheckout={(item) =>
          setInspection({
            contractCode: item.reservationCode,
            customerName: item.customerName ?? "—",
            unitCode: item.unitCode ?? "—",
            depositAmount: item.depAmount,
          })
        }
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
      />
    </div>
  )
}

export default CheckinPanel
