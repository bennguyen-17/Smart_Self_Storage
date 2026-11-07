import { useMemo, useState, type ReactNode } from "react"
import { DownloadIcon } from "lucide-react"
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
  isReportRangeValid,
  percentOf,
  presetRange,
  RANGE_PRESET_LABEL,
  reportCsvRows,
  revenueTotal,
  unitMix,
  type RangePreset,
  type ReportRange,
} from "../reportRules"
import type { ManagerDashboard } from "../types"
import { BarList, Meter, UnitDonut } from "./ReportCharts"

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
          <p className="text-muted text-xs">Tổng doanh thu</p>
          <p className="text-title text-3xl font-black tabular-nums">{formatVnd(revenueTotal(d))}</p>
          <p className="text-muted text-xs">Không gồm tiền cọc.</p>
        </div>
        <BarList
          label="Cơ cấu doanh thu"
          items={[
            { label: "Tiền thuê", value: d.rentalRevenue, display: formatVnd(d.rentalRevenue) },
            { label: "Gia hạn", value: d.extensionRevenue, display: formatVnd(d.extensionRevenue) },
            { label: "Phạt trễ hạn", value: d.penaltyRevenue, display: formatVnd(d.penaltyRevenue) },
            { label: "Truy thu đền bù", value: d.compensationRevenue, display: formatVnd(d.compensationRevenue) },
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

      <ChartCard title="Tiền cọc" className="lg:col-span-2">
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Cọc đang giữ", value: d.depositHolding, note: "Không tính vào doanh thu" },
            { label: "Đã hoàn cọc cho khách", value: d.totalRefunds, note: "Sau khi trả kho, đã trừ phạt / phí" },
            { label: "Cọc bị tịch thu", value: d.forfeitedDeposit, note: "Không đến nhận kho, quá hạn 30 ngày" },
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

/**
 * Số liệu tổng quan của đúng cơ sở mình phụ trách (thẻ KPI và biểu đồ);
 * góp ý của Tâm 03/11). Đổi khoảng ngày là tự tải lại; muốn số liệu dạng bảng thì Xuất CSV.
 * Doanh thu không gồm tiền cọc; tiền hoàn cho khách là hoàn cọc nên nằm ở thẻ Tiền cọc.
 */
function FacilityReportPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const [reloadCount, setReloadCount] = useState(0)
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
          <Button size="sm" disabled={!data} onClick={exportCsv} className="bg-blue-600 text-white hover:bg-blue-500">
            <DownloadIcon aria-hidden="true" /> Xuất CSV
          </Button>
        </div>
      </FilterBar>

      {!rangeOk && (
        <p role="alert" className="[overflow-wrap:anywhere] text-xs font-semibold text-rose-600 dark:text-rose-400">
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
      {data && <Charts d={data} />}
    </section>
  )
}

export default FacilityReportPanel
