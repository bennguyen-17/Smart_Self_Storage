import { useMemo, useState, type ReactNode } from "react"
import { ChartColumnIcon, DownloadIcon, RotateCwIcon, TableIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { downloadCsv, toCsv } from "@/components/internal/csv"
import { DateFilter, FilterBar, LoadError, SelectFilter } from "@/components/internal/components/PanelKit"
import { getManagerContext } from "@/features/manager/managerContext"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatVnd, todayInVietnam } from "@/lib/format"

import { getManagerDashboard } from "../api/reportApi"
import {
  ALL_TIME,
  buildReportSections,
  isReportRangeValid,
  percentOf,
  presetRange,
  RANGE_PRESET_LABEL,
  rangeLabel,
  reportCsvRows,
  unitMix,
  type MetricRow,
  type RangePreset,
  type ReportRange,
} from "../reportRules"
import type { ManagerDashboard } from "../types"
import { BarList, Meter, UnitDonut } from "./ReportCharts"

type View = "charts" | "table"

function formatMetric(row: MetricRow): string {
  if (row.kind === "money") return formatVnd(row.value)
  if (row.kind === "percent") return `${row.value.toLocaleString("vi-VN")}%`
  return row.value.toLocaleString("vi-VN")
}

function ChartCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("card-box space-y-4 rounded-2xl border p-5 shadow-sm", className)}>
      <h2 className="text-title text-sm font-black">{title}</h2>
      {children}
    </section>
  )
}

function Charts({ d }: { d: ManagerDashboard }) {
  const count = (n: number) => n.toLocaleString("vi-VN")
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Ô kho">
        <UnitDonut segments={unitMix(d)} total={d.totalUnits} occupancyRate={d.occupancyRate} />
      </ChartCard>

      <ChartCard title="Doanh thu">
        <div>
          <p className="text-muted text-xs">Doanh thu thuần</p>
          <p className="text-title text-3xl font-black tabular-nums">{formatVnd(d.netRevenue)}</p>
          <p className="text-muted text-xs">Các khoản đã thu trừ phần đã hoàn; không gồm tiền cọc đang giữ.</p>
        </div>
        <BarList
          label="Cơ cấu doanh thu"
          items={[
            { label: "Tiền thuê", value: d.rentalRevenue, display: formatVnd(d.rentalRevenue) },
            { label: "Gia hạn", value: d.extensionRevenue, display: formatVnd(d.extensionRevenue) },
            { label: "Phạt trễ hạn", value: d.penaltyRevenue, display: formatVnd(d.penaltyRevenue) },
            { label: "Truy thu đền bù", value: d.compensationRevenue, display: formatVnd(d.compensationRevenue) },
            { label: "Đã hoàn tiền", value: d.totalRefunds, display: `−${formatVnd(d.totalRefunds)}`, subtract: true },
          ]}
        />
      </ChartCard>

      <ChartCard title="Hợp đồng">
        <BarList
          label="Hợp đồng theo trạng thái"
          items={[
            { label: "Đang hiệu lực", value: d.activeContracts, display: count(d.activeContracts) },
            { label: "Chờ nhận kho", value: d.pendingCheckinContracts, display: count(d.pendingCheckinContracts) },
            { label: "Quá hạn", value: d.overdueContracts, display: count(d.overdueContracts) },
            { label: "Đã trả kho / hoàn tất", value: d.terminatedContracts, display: count(d.terminatedContracts) },
          ]}
        />
      </ChartCard>

      <ChartCard title="Yêu cầu hỗ trợ & SLA">
        <Meter label="Tỷ lệ xử lý đúng SLA" percent={100 - percentOf(d.slaBreachedTickets, d.totalTickets)} />
        <BarList
          label="Yêu cầu theo trạng thái"
          items={[
            { label: "Mới gửi", value: d.submittedTickets, display: count(d.submittedTickets) },
            { label: "Đang xử lý", value: d.inProgressTickets, display: count(d.inProgressTickets) },
            { label: "Đã xử lý", value: d.resolvedTickets, display: count(d.resolvedTickets) },
            { label: "Trễ SLA", value: d.slaBreachedTickets, display: count(d.slaBreachedTickets) },
          ]}
        />
      </ChartCard>

      <ChartCard title="Tiền cọc & miễn giảm" className="lg:col-span-2">
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Cọc đang giữ", value: d.depositHolding, note: "Không tính vào doanh thu" },
            { label: "Cọc bị tịch thu", value: d.forfeitedDeposit, note: "Không đến nhận kho, quá hạn 30 ngày" },
            { label: "Đã miễn / giảm phí", value: d.waivedAmount, note: "Theo duyệt của quản lý" },
          ].map((s) => (
            <div key={s.label}>
              <dt className="text-muted text-xs">{s.label}</dt>
              <dd className="text-title text-xl font-black tabular-nums">{formatVnd(s.value)}</dd>
              <dd className="text-muted text-xs">{s.note}</dd>
            </div>
          ))}
        </dl>
      </ChartCard>
    </div>
  )
}

function Tables({ d }: { d: ManagerDashboard }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {buildReportSections(d).map((s) => (
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
        </div>
      ))}
    </div>
  )
}

/**
 * US-33 (phần Manager): số liệu tổng quan của đúng cơ sở mình phụ trách, dạng biểu đồ (mặc định) hoặc bảng số liệu.
 * Doanh thu chỉ gồm hóa đơn đã thu trừ phần đã hoàn; tiền cọc đang giữ để riêng.
 */
function FacilityReportPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const [reloadCount, setReloadCount] = useState(0)
  const [view, setView] = useState<View>("charts")
  const [preset, setPreset] = useState<RangePreset>("ALL")
  const [range, setRange] = useState<ReportRange>(ALL_TIME)
  const rangeOk = isReportRangeValid(range)
  // Khoảng ngày ngược thì không gọi API (key = null), chỉ báo lỗi
  const { data, error, isLoading } = useAsyncData(
    rangeOk ? `report:${range.from}:${range.to}#${reloadCount}` : null,
    () => getManagerDashboard(ctx, range)
  )

  function choosePreset(next: RangePreset) {
    setPreset(next)
    const r = presetRange(next, todayInVietnam())
    if (r) setRange(r)
  }

  function editRange(patch: Partial<ReportRange>) {
    setPreset("CUSTOM")
    setRange((r) => ({ ...r, ...patch }))
  }

  if (error) {
    return <LoadError title="Không tải được báo cáo cơ sở" message={error} onRetry={() => setReloadCount((n) => n + 1)} />
  }

  function exportCsv() {
    if (!data) return
    const period = range.from || range.to ? `${range.from || "dau"}_${range.to || todayInVietnam()}` : todayInVietnam()
    downloadCsv(`bao-cao-${data.facilityCode}-${period}.csv`, toCsv(["Nhóm", "Chỉ số", "Giá trị"], reportCsvRows(data, range)))
  }

  return (
    <section aria-label="Báo cáo cơ sở" className="space-y-4">
      <FilterBar>
        <SelectFilter
          label="Khoảng thời gian"
          value={preset}
          onChange={(v) => choosePreset(v as RangePreset)}
          options={(Object.keys(RANGE_PRESET_LABEL) as RangePreset[]).map((p) => ({ value: p, label: RANGE_PRESET_LABEL[p] }))}
        />
        <DateFilter label="Từ ngày" value={range.from} onChange={(from) => editRange({ from })} invalid={!rangeOk} />
        <DateFilter label="Đến ngày" value={range.to} onChange={(to) => editRange({ to })} invalid={!rangeOk} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Cách xem" className="inner-box flex rounded-lg border p-0.5">
            {([
              { key: "charts", label: "Biểu đồ", icon: ChartColumnIcon },
              { key: "table", label: "Bảng số liệu", icon: TableIcon },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none",
                  view === key ? "bg-blue-600 text-white" : "text-title hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" disabled={isLoading} onClick={() => setReloadCount((n) => n + 1)}>
            <RotateCwIcon aria-hidden="true" /> Tải lại
          </Button>
          <Button size="sm" disabled={!data} onClick={exportCsv} className="bg-blue-600 text-white hover:bg-blue-500">
            <DownloadIcon aria-hidden="true" /> Xuất CSV
          </Button>
        </div>
      </FilterBar>

      {rangeOk ? (
        <p className="text-muted text-xs">
          <span className="text-title font-bold">{data ? data.facilityName : "Đang tải…"}</span> ·{" "}
          <span className="text-title font-semibold">{rangeLabel(range)}</span>. Doanh thu, hoàn tiền, miễn giảm và yêu cầu hỗ trợ tính
          trong khoảng này; số ô kho, hợp đồng và tiền cọc đang giữ là số hiện tại.
        </p>
      ) : (
        <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
        </p>
      )}

      {isLoading && (
        <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card-box h-56 animate-pulse rounded-2xl border" />
          ))}
        </div>
      )}
      {data && (view === "charts" ? <Charts d={data} /> : <Tables d={data} />)}
    </section>
  )
}

export default FacilityReportPanel
