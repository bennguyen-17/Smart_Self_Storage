import { useState } from "react"
import { DownloadIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { downloadCsv, toCsv } from "@/features/internal-shell/csv"
import {
  DateFilter,
  FilterBar,
  LoadError,
  Pagination,
  ResultCount,
  SearchFilter,
  SelectFilter,
  TableCard,
} from "@/features/internal-shell/components/PanelKit"
import {
  paginate,
  PAGE_SIZE_OPTIONS,
} from "@/features/internal-shell/pagination"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatDateTime, todayInVietnam } from "@/lib/format"

import { listActivityLogs } from "../api/auditApi"
import {
  ACTION_LABEL,
  ACTIVITY_CSV_HEADER,
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])
  const { data, error, isLoading } = useAsyncData(
    `activity:${filter.from}:${filter.to}#${reloadCount}`,
    () => listActivityLogs({ from: filter.from, to: filter.to })
  )
  const all = data ?? []
  const rows = filterActivityLogs(all, filter)
  const slice = paginate(rows, page, pageSize)
  const rangeOk = isRangeValid(filter.from, filter.to)
  // Đổi bộ lọc thì quay về trang 1, tránh đứng ở trang không còn dữ liệu
  const update = (patch: Partial<ActivityFilter>) => {
    setFilter((f) => ({ ...f, ...patch }))
    setPage(1)
  }

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
              `nhat-ky-hoat-dong-${todayInVietnam()}.csv`,
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
        caption="Nhật ký hoạt động hệ thống"
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
            <td className="text-title max-w-md px-4 py-3 break-words">
              {l.description ?? "—"}
            </td>
            <td className="px-4 py-3 font-mono whitespace-nowrap text-muted">
              {l.ipAddress ?? "—"}
            </td>
          </tr>
        ))}
      </TableCard>

      <Pagination
        slice={slice}
        total={rows.length}
        unit="bản ghi"
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />
    </section>
  )
}

export default AuditLogPanel
