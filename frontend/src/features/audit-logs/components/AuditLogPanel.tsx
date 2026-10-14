import { useState } from "react"
import { DownloadIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { downloadCsv, toCsv } from "@/features/internal-shell/csv"
import {
  DateFilter,
  FilterBar,
  LoadError,
  ResultCount,
  SearchFilter,
  SelectFilter,
  TableCard,
} from "@/features/internal-shell/components/PanelKit"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatDateTime, todayInVietnam } from "@/lib/format"

import { listAuditLogs } from "../api/auditApi"
import {
  actionLabel,
  AUDIT_ACTION_LABEL,
  AUDIT_CSV_HEADER,
  auditCsvRows,
  filterAuditLogs,
  isRangeValid,
  isSensitive,
} from "../auditRules"
import type { AuditAction, AuditFilter } from "../types"

const EMPTY_FILTER: AuditFilter = { query: "", action: "ALL", from: "", to: "" }

/**
 * US-30: Admin tra cứu nhật ký thao tác toàn hệ thống. Chỉ xem và xuất CSV;
 * không có nút sửa hay xóa vì nhật ký chỉ được ghi thêm.
 */
function AuditLogPanel() {
  const [reloadCount, setReloadCount] = useState(0)
  const [filter, setFilter] = useState<AuditFilter>(EMPTY_FILTER)
  const { data, error, isLoading } = useAsyncData(`audit:${filter.from}:${filter.to}#${reloadCount}`, () =>
    listAuditLogs({ from: filter.from, to: filter.to })
  )
  const all = data ?? []
  const rows = filterAuditLogs(all, filter)
  const rangeOk = isRangeValid(filter.from, filter.to)
  const update = (patch: Partial<AuditFilter>) => setFilter((f) => ({ ...f, ...patch }))

  if (error) {
    return <LoadError title="Không tải được nhật ký hệ thống" message={error} onRetry={() => setReloadCount((n) => n + 1)} />
  }

  return (
    <section aria-label="Nhật ký hoạt động hệ thống" className="space-y-4">
      <FilterBar>
        <SearchFilter value={filter.query} onChange={(query) => update({ query })} placeholder="Người thực hiện, vai trò, đối tượng hoặc IP" />
        <SelectFilter
          label="Hành động"
          value={filter.action}
          onChange={(v) => update({ action: v as AuditAction | "ALL" })}
          options={[
            { value: "ALL", label: "Tất cả hành động" },
            ...(Object.keys(AUDIT_ACTION_LABEL) as AuditAction[]).map((a) => ({ value: a, label: AUDIT_ACTION_LABEL[a] })),
          ]}
        />
        <DateFilter label="Từ ngày" value={filter.from} onChange={(from) => update({ from })} invalid={!rangeOk} />
        <DateFilter label="Đến ngày" value={filter.to} onChange={(to) => update({ to })} invalid={!rangeOk} />
        <Button
          size="sm"
          disabled={rows.length === 0}
          onClick={() => downloadCsv(`nhat-ky-he-thong-${todayInVietnam()}.csv`, toCsv(AUDIT_CSV_HEADER, auditCsvRows(rows)))}
          className="ml-auto bg-blue-600 text-white hover:bg-blue-500"
        >
          <DownloadIcon aria-hidden="true" /> Xuất CSV
        </Button>
      </FilterBar>

      {!rangeOk && (
        <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
        </p>
      )}

      <ResultCount shown={rows.length} total={all.length} unit="bản ghi" isLoading={isLoading} />

      <TableCard
        caption="Nhật ký hoạt động hệ thống"
        columns={[
          { header: "Thời gian" },
          { header: "Người thực hiện" },
          { header: "Hành động" },
          { header: "Đối tượng" },
          { header: "Thay đổi" },
          { header: "Cơ sở · IP" },
        ]}
        minWidth={1040}
        isLoading={isLoading}
        isEmpty={rows.length === 0}
        emptyText={all.length === 0 ? "Chưa có bản ghi nào" : "Không có bản ghi phù hợp bộ lọc"}
      >
        {rows.map((l) => (
          <tr key={l.logId} className="border-b align-top last:border-0">
            <td className="text-title px-4 py-3 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
            <td className="px-4 py-3">
              <p className="text-title font-bold">{l.actorName}</p>
              <p className="text-muted">{l.actorRole}</p>
            </td>
            <td className="px-4 py-3">
              <span
                className={cn(
                  "font-semibold whitespace-nowrap",
                  isSensitive(l.action) ? "text-amber-700 dark:text-amber-300" : "text-title"
                )}
              >
                {actionLabel(l.action)}
              </span>
            </td>
            <td className="text-title px-4 py-3 break-words">{l.target ?? "—"}</td>
            <td className="text-title px-4 py-3">
              {l.before || l.after ? (
                <span>
                  {l.before && <span className="text-muted line-through">{l.before}</span>}
                  {l.before && l.after && <span className="text-muted"> → </span>}
                  {l.after && <span className="font-semibold">{l.after}</span>}
                </span>
              ) : (
                <span className="text-muted">—</span>
              )}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <p className="text-title">{l.facilityCode ?? "Toàn hệ thống"}</p>
              <p className="text-muted font-mono">{l.ipAddress ?? "—"}</p>
            </td>
          </tr>
        ))}
      </TableCard>
    </section>
  )
}

export default AuditLogPanel
