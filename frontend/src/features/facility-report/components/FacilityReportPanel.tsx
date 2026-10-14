import { useMemo, useState } from "react"
import { DownloadIcon, RotateCwIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { downloadCsv, toCsv } from "@/features/internal-shell/csv"
import { FilterBar, LoadError } from "@/features/internal-shell/components/PanelKit"
import { getManagerContext } from "@/features/unit-management/managerContext"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatVnd, todayInVietnam } from "@/lib/format"

import { getManagerDashboard } from "../api/reportApi"
import { buildReportSections, reportCsvRows, type MetricRow } from "../reportRules"

function formatMetric(row: MetricRow): string {
  if (row.kind === "money") return formatVnd(row.value)
  if (row.kind === "percent") return `${row.value.toLocaleString("vi-VN")}%`
  return row.value.toLocaleString("vi-VN")
}

/**
 * US-33 (phần Manager): số liệu tổng quan của đúng cơ sở mình phụ trách.
 * Doanh thu chỉ gồm hóa đơn đã thu trừ phần đã hoàn; tiền cọc đang giữ để ở bảng riêng.
 */
function FacilityReportPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const [reloadCount, setReloadCount] = useState(0)
  const { data, error, isLoading } = useAsyncData(`report#${reloadCount}`, () => getManagerDashboard(ctx))

  if (error) {
    return <LoadError title="Không tải được báo cáo cơ sở" message={error} onRetry={() => setReloadCount((n) => n + 1)} />
  }

  const sections = data ? buildReportSections(data) : []

  function exportCsv() {
    if (!data) return
    const csv = toCsv(["Nhóm", "Chỉ số", "Giá trị"], reportCsvRows(data))
    downloadCsv(`bao-cao-${data.facilityCode}-${todayInVietnam()}.csv`, csv)
  }

  return (
    <section aria-label="Báo cáo cơ sở" className="space-y-4">
      <FilterBar className="items-center justify-between">
        <div className="text-xs">
          <p className="text-title font-bold">{data ? data.facilityName : "Đang tải…"}</p>
          <p className="text-muted">Số liệu tính đến thời điểm hiện tại</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={isLoading} onClick={() => setReloadCount((n) => n + 1)}>
            <RotateCwIcon aria-hidden="true" /> Tải lại
          </Button>
          <Button size="sm" disabled={!data} onClick={exportCsv} className="bg-blue-600 text-white hover:bg-blue-500">
            <DownloadIcon aria-hidden="true" /> Xuất CSV
          </Button>
        </div>
      </FilterBar>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="card-box h-56 animate-pulse rounded-2xl border" aria-hidden="true" />
          ))}
        {sections.map((s) => (
          <div key={s.key} className="card-box overflow-hidden rounded-2xl border shadow-sm">
            <table className="w-full text-xs">
              <caption className="text-title border-b px-4 py-3 text-left text-sm font-black">{s.title}</caption>
              <tbody>
                {s.rows.map((r) => (
                  <tr key={r.label} className={cn("border-b last:border-0", r.emphasis && "bg-blue-50/60 dark:bg-blue-950/20")}>
                    <th scope="row" className="text-title px-4 py-2.5 text-left font-semibold">
                      {r.label}
                      {r.note && <span className="text-muted ml-1 font-normal">({r.note})</span>}
                    </th>
                    <td
                      className={cn(
                        "text-title px-4 py-2.5 text-right tabular-nums whitespace-nowrap",
                        r.emphasis ? "font-black" : "font-semibold",
                        r.value < 0 && "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {formatMetric(r)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {s.key === "units" && data && (
              <div className="px-4 pb-4" aria-hidden="true">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, data.occupancyRate)}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default FacilityReportPanel
