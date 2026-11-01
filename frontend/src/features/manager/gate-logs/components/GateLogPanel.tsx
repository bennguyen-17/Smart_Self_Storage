import { useMemo, useState } from "react"
import { CheckCircle2Icon, InboxIcon, RotateCwIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/internal/components/PanelKit"
import { usePagedRows } from "@/components/internal/usePagedRows"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatDateTime } from "@/lib/format"

import { listManualGateOpenLogs } from "../api/gateLogApi"
import { filterGateLogs, isDateRangeValid } from "../gateLogRules"
import type { GateLogFilter } from "../types"

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

  // Giữ cùng một mảng giữa các lần render để useMemo thống kê bên dưới chỉ tính lại khi dữ liệu đổi
  const all = useMemo(() => data ?? [], [data])
  const rows = filterGateLogs(all, filter)
  const { slice, pagination } = usePagedRows(rows, JSON.stringify(filter))
  const rangeOk = isDateRangeValid(filter.from, filter.to)
  const filtered =
    filter.query.trim() !== "" ||
    filter.method !== "ALL" ||
    filter.from !== "" ||
    filter.to !== ""

  const update = (patch: Partial<GateLogFilter>) => setFilter((f) => ({ ...f, ...patch }))

  // Thống kê nhanh KPI

  return (
    <section aria-label="Nhật ký kiểm soát ra vào cổng" className="space-y-4">
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
          {/* Bộ lọc */}
          <div className="card-box flex flex-wrap items-end gap-3 rounded-2xl border p-4 shadow-sm">
            <label className="flex min-w-64 flex-1 flex-col gap-1 text-xs font-bold">
              <span className="text-title">Tìm kiếm thông tin người ra vào</span>
              <span className="relative">
                <input
                  type="search"
                  value={filter.query}
                  onChange={(e) => update({ query: e.target.value })}
                  placeholder="Họ tên, SĐT, CCCD, lý do..."
                  className="inner-box text-title w-full rounded-lg border py-1.5 pr-2.5 pl-8 text-xs font-semibold outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                />
                <i aria-hidden="true" className="fa-solid fa-magnifying-glass pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 z-10"></i>
              </span>
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
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Nhật ký kiểm soát người ra vào cổng của cơ sở</caption>
              <thead className="text-muted border-b bg-slate-50/50 text-[11px] uppercase dark:bg-slate-900/50">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold w-[20%]">Thời gian</th>
                  <th scope="col" className="px-4 py-3 font-bold w-[35%]">Người ra vào</th>
                  <th scope="col" className="px-4 py-3 font-bold w-[15%]">Trạng thái</th>
                  <th scope="col" className="px-4 py-3 font-bold w-[30%]">Ghi chú / Lý do</th>
                </tr>
              </thead>
              <tbody aria-busy={isLoading}>
                {isLoading &&
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="h-5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))}

                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
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
                  slice.rows.map((log) => {
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



                        {/* Trạng thái */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2Icon className="size-3.5" />
                            Hợp lệ
                          </span>
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

          {!isLoading && <Pagination {...pagination} unit="lượt ra vào" />}
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
