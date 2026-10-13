import { useState } from "react"
import { DoorOpenIcon, InboxIcon, InfoIcon, RotateCwIcon, SearchIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAsyncData } from "@/hooks/useAsyncData"
import { isMockMode } from "@/lib/apiClient"
import { formatDateTime } from "@/lib/format"

import { listManualGateOpenLogs } from "../api/gateLogApi"
import { filterGateLogs, isDateRangeValid } from "../gateLogRules"
import type { GateLogFilter } from "../types"

const EMPTY_FILTER: GateLogFilter = { query: "", from: "", to: "" }

/**
 * US-18 (phần Manager): xem và lọc nhật ký mở cổng thủ công của cơ sở mình.
 * Nhật ký chỉ đọc: không có nút sửa hay xóa. BE chỉ trả log thuộc cơ sở của Manager.
 */
function GateLogPanel() {
  const [reloadCount, setReloadCount] = useState(0)
  const [filter, setFilter] = useState<GateLogFilter>(EMPTY_FILTER)
  const { data, error, isLoading } = useAsyncData(`gate-logs#${reloadCount}`, listManualGateOpenLogs)

  const all = data ?? []
  const rows = filterGateLogs(all, filter)
  const rangeOk = isDateRangeValid(filter.from, filter.to)
  const filtered = filter.query.trim() !== "" || filter.from !== "" || filter.to !== ""
  const update = (patch: Partial<GateLogFilter>) => setFilter((f) => ({ ...f, ...patch }))

  return (
    <section aria-label="Nhật ký mở cổng thủ công" className="space-y-4">
      <div className="card-box space-y-1 rounded-2xl border p-4 shadow-sm">
        <h3 className="text-title flex items-center gap-2 text-sm font-black tracking-wide sm:text-base">
          <DoorOpenIcon aria-hidden="true" className="size-4 text-purple-500" />
          NHẬT KÝ MỞ CỔNG THỦ CÔNG
        </h3>
        <p className="text-muted text-xs">
          Mỗi lần nhân viên mở cổng bằng Thẻ Master hoặc chìa cơ đều được ghi lại kèm mã khách và lý do. Nhật ký
          chỉ để xem và đối soát, không sửa hay xóa được.
        </p>
        {isMockMode() && (
          <p className="flex items-center gap-1.5 pt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            <InfoIcon aria-hidden="true" className="size-3.5" />
            Đang xem dữ liệu mẫu (cơ sở HN-01).
          </p>
        )}
      </div>

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
          <div className="card-box flex flex-wrap items-end gap-3 rounded-2xl border p-4 shadow-sm">
            <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs font-bold">
              <span className="text-title">Tìm kiếm</span>
              <span className="relative">
                <SearchIcon
                  aria-hidden="true"
                  className="text-muted pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
                />
                <input
                  type="search"
                  value={filter.query}
                  onChange={(e) => update({ query: e.target.value })}
                  placeholder="Mã khách, mã nhân viên hoặc lý do"
                  className="inner-box text-title w-full rounded-lg border py-1.5 pr-2.5 pl-8 text-xs font-semibold outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500"
                />
              </span>
            </label>
            <DateInput label="Từ ngày" value={filter.from} onChange={(from) => update({ from })} invalid={!rangeOk} />
            <DateInput label="Đến ngày" value={filter.to} onChange={(to) => update({ to })} invalid={!rangeOk} />
            {filtered && (
              <Button variant="outline" size="sm" onClick={() => setFilter(EMPTY_FILTER)}>
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {!rangeOk && (
            <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
            </p>
          )}

          <p className="text-muted text-xs" aria-live="polite">
            {isLoading ? "Đang tải nhật ký…" : `${rows.length} / ${all.length} lần mở cổng`}
          </p>

          <div className="card-box overflow-x-auto rounded-2xl border shadow-sm">
            <table className="w-full min-w-[680px] text-left text-xs">
              <caption className="sr-only">Nhật ký mở cổng thủ công của cơ sở</caption>
              <thead className="text-muted border-b text-[11px] uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Thời gian mở</th>
                  <th scope="col" className="px-4 py-3 font-bold">Mã khách hàng</th>
                  <th scope="col" className="px-4 py-3 font-bold">Nhân viên</th>
                  <th scope="col" className="px-4 py-3 font-bold">Lý do mở thủ công</th>
                  <th scope="col" className="px-4 py-3 font-bold">Ghi nhận lúc</th>
                </tr>
              </thead>
              <tbody aria-busy={isLoading}>
                {isLoading &&
                  Array.from({ length: 4 }, (_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))}
                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <InboxIcon aria-hidden="true" className="text-muted mx-auto mb-2 size-7" />
                      <p className="text-title font-semibold">
                        {all.length === 0 ? "Chưa có lần mở cổng thủ công nào" : "Không có nhật ký phù hợp bộ lọc"}
                      </p>
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  rows.map((log) => (
                    <tr key={log.auditLogId} className="border-b last:border-0">
                      <td className="text-title px-4 py-3 font-semibold whitespace-nowrap">
                        {formatDateTime(log.openedAt)}
                      </td>
                      <td className="text-title px-4 py-3 font-mono whitespace-nowrap">
                        {log.customerId != null ? `KH-${log.customerId}` : "—"}
                      </td>
                      <td className="text-title px-4 py-3 whitespace-nowrap">
                        {log.accountId != null ? `NV #${log.accountId}` : "—"}
                      </td>
                      <td className="text-title px-4 py-3">{log.reason || "—"}</td>
                      <td className="text-muted px-4 py-3 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    </tr>
                  ))}
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
        className="inner-box text-title rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 aria-invalid:border-rose-500"
      />
    </label>
  )
}

export default GateLogPanel
