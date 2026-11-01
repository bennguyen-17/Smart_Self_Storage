import { useState } from "react"
import { DownloadIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { downloadCsv, toCsv } from "@/components/internal/csv"
import {
  DateFilter,
  FilterBar,
  LoadError,
  Pagination,
  ResultCount,
  SearchFilter,
  SelectFilter,
  TableCard,
} from "@/components/internal/components/PanelKit"
import { usePagedRows } from "@/components/internal/usePagedRows"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatDateTime, todayInVietnam } from "@/lib/format"

import { listActivityLogs } from "../api/auditApi"
import {
  ACTION_LABEL,
  ACTIVITY_CSV_HEADER,
  AUDIENCE_LABEL,
  LOGIN_HISTORY_FILTER,
  logAudience,
  type LogAudience,
  activityCsvRows,
  actionLabel,
  actorLabel,
  filterActivityLogs,
  isRangeValid,
  isSensitive,
} from "../auditRules"
import type { ActivityFilter } from "../types"

const EMPTY_FILTER: ActivityFilter = {
  query: "",
  action: "ALL",
  from: "",
  to: "",
}

/**
 * US-30: Admin tra cứu nhật ký hoạt động toàn hệ thống (bảng ActivityLog). Chỉ xem và xuất CSV;
 * không có nút sửa hay xóa vì nhật ký chỉ được ghi thêm.
 */
function AuditLogPanel() {
  const [reloadCount, setReloadCount] = useState(0)
  const [filter, setFilter] = useState<ActivityFilter>(EMPTY_FILTER)
  const [audience, setAudience] = useState<LogAudience>("CUSTOMER")
  const { data, error, isLoading } = useAsyncData(
    `activity:${filter.from}:${filter.to}#${reloadCount}`,
    () => listActivityLogs({ from: filter.from, to: filter.to })
  )
  const loaded = data ?? []
  const counts: Record<LogAudience, number> = { CUSTOMER: 0, INTERNAL: 0 }
  for (const l of loaded) counts[logAudience(l)] += 1
  const all = loaded.filter((l) => logAudience(l) === audience)
  const rows = filterActivityLogs(all, filter)
  const { slice, pagination } = usePagedRows(rows, `${audience}|${JSON.stringify(filter)}`)
  const rangeOk = isRangeValid(filter.from, filter.to)
  const update = (patch: Partial<ActivityFilter>) =>
    setFilter((f) => ({ ...f, ...patch }))

  if (error) {
    return (
      <LoadError
        title="Không tải được nhật ký hoạt động"
        message={error}
        onRetry={() => setReloadCount((n) => n + 1)}
      />
    )
  }

  return (
    <section aria-label="Nhật ký hoạt động hệ thống" className="space-y-4">
      <div role="tablist" aria-label="Loại nhật ký" className="card-box inline-flex gap-1 rounded-2xl border p-1 shadow-sm">
        {(Object.keys(AUDIENCE_LABEL) as LogAudience[]).map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={audience === a}
            onClick={() => setAudience(a)}
            className={cn(
              "cursor-pointer rounded-xl px-4 py-2 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none",
              audience === a ? "bg-blue-600 text-white shadow-sm" : "text-title hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            {AUDIENCE_LABEL[a]}{" "}
            <span className={cn("ml-1 tabular-nums", audience === a ? "text-blue-100" : "text-muted")}>
              {isLoading ? "…" : counts[a]}
            </span>
          </button>
        ))}
      </div>

      <FilterBar>
        <SearchFilter
          value={filter.query}
          onChange={(query) => update({ query })}
          placeholder="Người thực hiện, vai trò, mô tả hoặc IP"
        />
        <SelectFilter
          label="Hành động"
          value={filter.action}
          onChange={(action) => update({ action })}
          options={[
            { value: "ALL", label: "Tất cả hành động" },
            { value: LOGIN_HISTORY_FILTER, label: "Lịch sử đăng nhập (đăng nhập, sai mật khẩu, đăng xuất)" },
            ...Object.entries(ACTION_LABEL).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        <DateFilter
          label="Từ ngày"
          value={filter.from}
          onChange={(from) => update({ from })}
          invalid={!rangeOk}
        />
        <DateFilter
          label="Đến ngày"
          value={filter.to}
          onChange={(to) => update({ to })}
          invalid={!rangeOk}
        />
        <Button
          size="sm"
          disabled={rows.length === 0}
          onClick={() =>
            downloadCsv(
              `nhat-ky-${audience === "CUSTOMER" ? "khach-hang" : "noi-bo"}-${todayInVietnam()}.csv`,
              toCsv(ACTIVITY_CSV_HEADER, activityCsvRows(rows))
            )
          }
          className="ml-auto bg-blue-600 text-white hover:bg-blue-500"
        >
          <DownloadIcon aria-hidden="true" /> Xuất CSV
        </Button>
      </FilterBar>

      {!rangeOk && (
        <p
          role="alert"
          className="text-xs font-semibold text-rose-600 dark:text-rose-400"
        >
          Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
        </p>
      )}

      <ResultCount
        shown={rows.length}
        total={all.length}
        unit="bản ghi"
        isLoading={isLoading}
      />

      <TableCard
        caption={`Nhật ký hoạt động: ${AUDIENCE_LABEL[audience].toLowerCase()}`}
        columns={[
          { header: "Thời gian" },
          { header: "Người thực hiện" },
          { header: "Hành động" },
          { header: "Mô tả" },
          { header: "IP" },
        ]}
        minWidth={960}
        isLoading={isLoading}
        isEmpty={rows.length === 0}
        emptyText={
          all.length === 0
            ? "Chưa có bản ghi nào"
            : "Không có bản ghi phù hợp bộ lọc"
        }
      >
        {slice.rows.map((l) => (
          <tr
            key={l.activityLogId}
            className="border-b align-top last:border-0"
          >
            <td className="text-title px-4 py-3 whitespace-nowrap">
              {formatDateTime(l.createdAt)}
            </td>
            <td className="px-4 py-3">
              <p className="text-title font-bold">{actorLabel(l)}</p>
              <p className="text-muted">
                {l.accountId === null ? "Tác vụ tự động" : (l.actorRole ?? "—")}
              </p>
            </td>
            <td className="px-4 py-3">
              <span
                title={l.action}
                className={cn(
                  "font-semibold",
                  isSensitive(l.action)
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-title"
                )}
              >
                {actionLabel(l.action)}
              </span>
            </td>
            <td className="text-title max-w-md px-4 py-3 [overflow-wrap:anywhere]">
              {l.description ?? "—"}
            </td>
            <td className="px-4 py-3 font-mono whitespace-nowrap text-muted">
              {l.ipAddress ?? "—"}
            </td>
          </tr>
        ))}
      </TableCard>

      <Pagination {...pagination} unit="bản ghi" />
    </section>
  )
}

export default AuditLogPanel
