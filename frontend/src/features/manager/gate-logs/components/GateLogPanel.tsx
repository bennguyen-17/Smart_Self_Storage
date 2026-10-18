import { useMemo, useState } from "react"
import {
  CheckCircle2Icon,
  CreditCardIcon,
  FilterIcon,
  InboxIcon,
  KeyRoundIcon,
  RotateCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatDateTime } from "@/lib/format"

import { listManualGateOpenLogs } from "../api/gateLogApi"
import { filterGateLogs, isDateRangeValid } from "../gateLogRules"
import type { GateLog, GateLogFilter } from "../types"

const EMPTY_FILTER: GateLogFilter = {
  query: "",
  method: "ALL",
  from: "",
  to: "",
}

/**
 * US-18 (Manager Portal): Nhật ký kiểm soát ra vào cổng cơ sở.
 * Hiển thị đầy đủ thông tin người ra vào (Họ tên, SĐT, CCCD, vai trò, vị trí cổng, phương thức mở).
 * Nhật ký chỉ đọc, dữ liệu thuộc cơ sở của Manager.
 */
function GateLogPanel() {
  const [reloadCount, setReloadCount] = useState(0)
  const [filter, setFilter] = useState<GateLogFilter>(EMPTY_FILTER)
  const { data, error, isLoading } = useAsyncData(`gate-logs#${reloadCount}`, listManualGateOpenLogs)

  const all = data ?? []
  const rows = filterGateLogs(all, filter)
  const rangeOk = isDateRangeValid(filter.from, filter.to)
  const filtered =
    filter.query.trim() !== "" ||
    filter.method !== "ALL" ||
    filter.from !== "" ||
    filter.to !== ""

  const update = (patch: Partial<GateLogFilter>) => setFilter((f) => ({ ...f, ...patch }))

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    let pinCount = 0
    let manualCount = 0
    const peopleSet = new Set<string>()

    all.forEach((log) => {
      const isManual =
        (log.action && log.action.toUpperCase().includes("MANUAL")) ||
        (log.accessMethod && log.accessMethod.includes("Thẻ Master")) ||
        (log.reason && log.reason.toLowerCase().includes("thẻ master"))

      if (isManual) {
        manualCount++
      } else {
        pinCount++
      }

      const personId = log.personName || (log.customerId ? `KH-${log.customerId}` : log.accountId ? `NV-${log.accountId}` : null)
      if (personId) peopleSet.add(personId)
    })

    return {
      total: all.length,
      pinCount,
      manualCount,
      uniquePeople: peopleSet.size,
    }
  }, [all])

  return (
    <section aria-label="Nhật ký kiểm soát ra vào cổng" className="space-y-5">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Không tải được nhật ký mở cổng</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {error}
            <Button variant="outline" size="sm" onClick={() => setReloadCount((n) => n + 1)}>
              <RotateCwIcon aria-hidden="true" /> Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* KPI Tóm tắt */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card-box flex items-center gap-3.5 rounded-2xl border p-4 shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <UsersIcon className="size-5" />
              </div>
              <div>
                <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">Tổng lượt ra vào</p>
                <p className="text-title text-xl font-bold">{stats.total}</p>
              </div>
            </div>

            <div className="card-box flex items-center gap-3.5 rounded-2xl border p-4 shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <SmartphoneIcon className="size-5" />
              </div>
              <div>
                <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">Mã PIN động IoT</p>
                <p className="text-title text-xl font-bold">{stats.pinCount}</p>
              </div>
            </div>

            <div className="card-box flex items-center gap-3.5 rounded-2xl border p-4 shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <KeyRoundIcon className="size-5" />
              </div>
              <div>
                <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">Thẻ Master thủ công</p>
                <p className="text-title text-xl font-bold">{stats.manualCount}</p>
              </div>
            </div>

            <div className="card-box flex items-center gap-3.5 rounded-2xl border p-4 shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <UserCheckIcon className="size-5" />
              </div>
              <div>
                <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">Người ra vào</p>
                <p className="text-title text-xl font-bold">{stats.uniquePeople}</p>
              </div>
            </div>
          </div>

          {/* Bộ lọc */}
          <div className="card-box flex flex-wrap items-end gap-3 rounded-2xl border p-4 shadow-sm">
            <label className="flex min-w-64 flex-1 flex-col gap-1 text-xs font-bold">
              <span className="text-title">Tìm kiếm thông tin người ra vào</span>
              <span className="relative">
                <SearchIcon
                  aria-hidden="true"
                  className="text-muted pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
                />
                <input
                  type="search"
                  value={filter.query}
                  onChange={(e) => update({ query: e.target.value })}
                  placeholder="Họ tên, SĐT, CCCD, vị trí cổng, lý do..."
                  className="inner-box text-title w-full rounded-lg border py-1.5 pr-2.5 pl-8 text-xs font-semibold outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                />
              </span>
            </label>

            <label className="flex min-w-44 flex-col gap-1 text-xs font-bold">
              <span className="text-title">Phương thức mở</span>
              <select
                value={filter.method}
                onChange={(e) => update({ method: e.target.value as GateLogFilter["method"] })}
                className="inner-box text-title rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả phương thức</option>
                <option value="PIN">📱 Mã PIN động IoT</option>
                <option value="MANUAL">🔑 Thẻ Master thủ công</option>
              </select>
            </label>

            <DateInput label="Từ ngày" value={filter.from} onChange={(from) => update({ from })} invalid={!rangeOk} />
            <DateInput label="Đến ngày" value={filter.to} onChange={(to) => update({ to })} invalid={!rangeOk} />

            {filtered && (
              <Button variant="outline" size="sm" onClick={() => setFilter(EMPTY_FILTER)} className="text-xs">
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {!rangeOk && (
            <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
            </p>
          )}

          <div className="flex items-center justify-between text-xs">
            <p className="text-muted" aria-live="polite">
              {isLoading ? "Đang tải nhật ký…" : `Hiển thị ${rows.length} / ${all.length} lượt ra vào cổng`}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReloadCount((n) => n + 1)}
              className="h-7 text-xs text-slate-500 hover:text-slate-800"
            >
              <RotateCwIcon className="mr-1 size-3" /> Làm mới
            </Button>
          </div>

          {/* Bảng dữ liệu người ra vào cổng */}
          <div className="card-box overflow-x-auto rounded-2xl border shadow-sm">
            <table className="w-full min-w-[880px] text-left text-xs">
              <caption className="sr-only">Nhật ký kiểm soát người ra vào cổng của cơ sở</caption>
              <thead className="text-muted border-b bg-slate-50/50 text-[11px] uppercase dark:bg-slate-900/50">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Thời gian</th>
                  <th scope="col" className="px-4 py-3 font-bold">Người ra vào</th>
                  <th scope="col" className="px-4 py-3 font-bold">Vị trí cổng</th>
                  <th scope="col" className="px-4 py-3 font-bold">Phương thức</th>
                  <th scope="col" className="px-4 py-3 font-bold">Trạng thái</th>
                  <th scope="col" className="px-4 py-3 font-bold">Nhân viên hỗ trợ</th>
                  <th scope="col" className="px-4 py-3 font-bold">Ghi chú / Lý do</th>
                </tr>
              </thead>
              <tbody aria-busy={isLoading}>
                {isLoading &&
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))}

                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <InboxIcon aria-hidden="true" className="text-muted mx-auto mb-2 size-8 text-slate-400" />
                      <p className="text-title font-semibold text-sm">
                        {all.length === 0 ? "Chưa có lượt ra vào cổng nào" : "Không tìm thấy nhật ký phù hợp bộ lọc"}
                      </p>
                      <p className="text-muted text-xs mt-1">
                        Hệ thống tự động ghi nhận khi khách hàng dùng mã PIN IoT hoặc nhân viên mở Thẻ Master.
                      </p>
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  rows.map((log) => {
                    const isManual =
                      (log.action && log.action.toUpperCase().includes("MANUAL")) ||
                      (log.accessMethod && log.accessMethod.includes("Thẻ Master")) ||
                      (log.reason && log.reason.toLowerCase().includes("thẻ master"))

                    const personName = log.personName || (log.customerId ? `Khách hàng #${log.customerId}` : "Khách vãng lai")
                    const role = log.personRole || (log.customerId ? "Khách hàng" : "Nhân viên")
                    const isCustomer = role.toLowerCase().includes("khách")

                    return (
                      <tr key={log.auditLogId} className="border-b last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                        {/* Thời gian */}
                        <td className="text-title px-4 py-3 font-semibold whitespace-nowrap">
                          {formatDateTime(log.openedAt || log.createdAt)}
                        </td>

                        {/* Người ra vào */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-[13px]">
                                {personName}
                              </span>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                  isCustomer
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                    : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                }`}
                              >
                                {role}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                              {log.customerId && <span className="font-mono">Mã: KH-{log.customerId}</span>}
                              {log.personPhone && <span>SĐT: {log.personPhone}</span>}
                              {log.identityNumber && <span>CCCD: {log.identityNumber}</span>}
                            </div>
                          </div>
                        </td>

                        {/* Vị trí cổng */}
                        <td className="text-title px-4 py-3 whitespace-nowrap font-medium">
                          <span className="inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            {log.gateName || "Cổng Chính"}
                          </span>
                        </td>

                        {/* Phương thức */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isManual ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800">
                              <KeyRoundIcon className="size-3" />
                              Thẻ Master
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-800">
                              <SmartphoneIcon className="size-3" />
                              Mã PIN IoT
                            </span>
                          )}
                        </td>

                        {/* Trạng thái */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2Icon className="size-3.5" />
                            Hợp lệ
                          </span>
                        </td>

                        {/* Nhân viên hỗ trợ */}
                        <td className="text-title px-4 py-3 whitespace-nowrap">
                          {isManual ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {log.staffName || `Nhân viên #${log.accountId || "NV"}`}
                              </span>
                              {log.accountId && (
                                <span className="font-mono text-[10px] text-slate-400">ID: #{log.accountId}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted text-[11px] italic">Tự động (IoT)</span>
                          )}
                        </td>

                        {/* Lý do / Ghi chú */}
                        <td className="text-title px-4 py-3 max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-300">
                          {log.reason || "Mở cổng tự động qua mã PIN hợp lệ"}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function DateInput({
  label,
  value,
  onChange,
  invalid,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  invalid: boolean
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-bold">
      <span className="text-title">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        className="inner-box text-title rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 aria-invalid:border-rose-500"
      />
    </label>
  )
}

export default GateLogPanel
