import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { IdCardIcon, SearchIcon } from "lucide-react"
import { cn } from "cn"

import { useAsyncData } from "@/hooks/useAsyncData"
import { getErrorMessage } from "@/lib/api"

import { listCheckinContracts, lookupContract } from "../api/checkinApi"
import {
  CHECKIN_TABS,
  PAGE_SIZE,
  findCheckinTab,
  type CheckinTabKey,
} from "../constants"
import type { CheckinContract } from "../types"
import { CheckinApiError } from "../types"
import CheckinContractTable from "./CheckinContractTable"
import ChangeUnitDialog from "./ChangeUnitDialog"
import ConfirmCheckinDialog from "./ConfirmCheckinDialog"
import CounterCancelDialog from "./CounterCancelDialog"
import StaffCustomerDetailModal from "./StaffCustomerDetailModal"

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

/** Tab "Dịch vụ khách hàng" — tra cứu mã, check-in, đổi ô, hủy tại quầy (US-16) */
function CheckinPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = findCheckinTab(searchParams.get("tab"))

  const [reloadCount, setReloadCount] = useState(0)
  const [query, setQuery] = useState("")
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  const [detailContract, setDetailContract] = useState<CheckinContract | null>(null)
  const [checkinContract, setCheckinContract] = useState<CheckinContract | null>(null)
  const [changeContract, setChangeContract] = useState<CheckinContract | null>(null)
  const [cancelContract, setCancelContract] = useState<CheckinContract | null>(null)

  const { data, error, isLoading } = useAsyncData(
    `${tab.key}|${reloadCount}`,
    () =>
      listCheckinContracts({ status: tab.status, page: 0, size: PAGE_SIZE })
  )

  const keyword = query.trim().toLowerCase()
  const rows = data?.content.filter((c) => {
    if (!keyword) return true
    return (
      c.code.toLowerCase().includes(keyword) ||
      c.customerName.toLowerCase().includes(keyword) ||
      c.customerPhone.includes(keyword) ||
      c.unitCode.toLowerCase().includes(keyword)
    )
  })

  async function handleLookup() {
    const code = query.trim()
    if (!code) return
    setIsLookingUp(true)
    setLookupError(null)
    try {
      const found = await lookupContract(code)
      setDetailContract(found)
    } catch (err) {
      setLookupError(
        err instanceof CheckinApiError ? err.message : getErrorMessage(err)
      )
    } finally {
      setIsLookingUp(false)
    }
  }

  function refresh() {
    setReloadCount((n) => n + 1)
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

      {/* SEARCH & FILTER TOOLBAR */}
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
        </div>

        {/* FILTER STATUS PILLS */}
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
