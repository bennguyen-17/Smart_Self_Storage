import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { IdCardIcon, RotateCwIcon, SearchIcon } from "lucide-react"
import { cn } from "cn"

import { useAsyncData } from "@/hooks/useAsyncData"

import {
  checkinErrorMessage,
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

/** Tab "Dịch vụ khách hàng" — tra cứu mã, check-in, đổi ô, hủy tại quầy (US-16) */
function CheckinPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = findCheckinTab(searchParams.get("tab"))

  const [reload, setReload] = useState(0)
  const [query, setQuery] = useState("")
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  const [detailContract, setDetailContract] = useState<CheckinTarget | null>(null)
  const [checkinContract, setCheckinContract] = useState<CheckinTarget | null>(null)
  const [changeContract, setChangeContract] = useState<CheckinTarget | null>(null)
  const [cancelContract, setCancelContract] = useState<CheckinTarget | null>(null)

  const { data, error, isLoading } = useAsyncData(`checkin:${tab.key}|${reload}`, () =>
    listCheckinContracts()
  )

  const keyword = query.trim().toLowerCase()
  const rows = (data ?? [])
    .filter((item) => !tab.contractStatus || item.contractStatus === tab.contractStatus)
    .filter((item) => matches(item, keyword))

  async function handleLookup() {
    const code = query.trim()
    if (!code) return
    setIsLookingUp(true)
    setLookupError(null)
    try {
      const found = await lookupContract(code)
      if (found.contractStatus !== "PENDING_CHECKIN") {
        const label = STATUS_LABEL[found.contractStatus ?? ""] ?? found.contractStatus
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
      <div className="border-b pb-4">
        <h3 className="flex items-center space-x-2 text-sm font-extrabold text-title sm:text-base">
          <IdCardIcon className="size-4 text-blue-600" />
          <span>
            QUẢN LÝ DANH SÁCH KHÁCH HÀNG & HỖ TRỢ CHECK-IN BÀN GIAO KHO
          </span>
        </h3>
      </div>

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
              placeholder="Nhập Mã Đặt Chỗ, VD: RES-CG-8899-K7X2"
              className="inner-box w-full rounded-xl border px-3.5 py-2.5 pl-9 font-mono text-xs font-bold text-title outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={handleLookup}
            disabled={isLookingUp || query.trim().length === 0}
            className="shrink-0 cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isLookingUp ? "Đang tìm..." : "Tra cứu"}
          </button>
          <button
            type="button"
            onClick={refresh}
            title="Tải lại danh sách"
            className="shrink-0 cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RotateCwIcon className={cn("size-4", isLoading && "animate-spin")} />
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
                    ? "border-blue-600 bg-blue-600 text-white"
                    : TAB_COLORS[t.key]
                )}
              >
                {t.label}
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

      <CheckinContractTable
        rows={rows}
        isLoading={isLoading}
        error={error}
        onRetry={refresh}
        onOpenDetail={setDetailContract}
        onCheckin={setCheckinContract}
      />

      <StaffCustomerDetailModal
        contract={detailContract}
        onClose={() => setDetailContract(null)}
        onCheckin={(c) => {
          setDetailContract(null)
          setCheckinContract(c)
        }}
        onChangeUnit={(c) => {
          setDetailContract(null)
          setChangeContract(c)
        }}
        onCancel={(c) => {
          setDetailContract(null)
          setCancelContract(c)
        }}
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
    </div>
  )
}

export default CheckinPanel
