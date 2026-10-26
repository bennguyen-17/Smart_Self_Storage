import { useMemo, useState } from "react"
import { cn } from "cn"

import {
  DateFilter,
  FilterBar,
  LoadError,
  Pagination,
  ResultCount,
  SearchFilter,
  SelectFilter,
  StatusBadge,
  TableCard,
} from "@/components/internal/components/PanelKit"
import { usePagedRows } from "@/components/internal/usePagedRows"
import { actionLabel, actorLabel, isSensitive } from "@/features/admin/audit-logs/auditRules"
import { getManagerContext } from "@/features/manager/managerContext"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatDate, formatDateTime, todayInVietnam } from "@/lib/format"
import { getRoleTitle, normalizeRole } from "@/lib/roles"

import { getStaffActivity, listFacilityLogs } from "../api/activityApi"
import {
  acceptTimeLabel,
  dayTotals,
  filterFacilityLogs,
  isLateToShift,
  shiftsWithStaff,
  staffOptions,
  vietnamTime,
  WORK_COUNTS,
} from "../activityRules"

/**
 * Manager › Hoạt động nhân viên: theo từng ca, ai đã vào ca và làm được những gì (nhận kho, trả kho, ticket,
 * bảo trì, việc được giao); bên dưới là nhật ký thao tác nội bộ của cơ sở trong ngày, lọc được theo người.
 */
function StaffActivityPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const today = todayInVietnam()
  const [date, setDate] = useState(today)
  const [reloadCount, setReloadCount] = useState(0)
  const [logFilter, setLogFilter] = useState({ accountId: "ALL", query: "" })

  const activity = useAsyncData(`staff-activity:${date}#${reloadCount}`, () => getStaffActivity(ctx, date))
  const logs = useAsyncData(`facility-logs:${date}#${reloadCount}`, () => listFacilityLogs(ctx, date))

  const shifts = shiftsWithStaff(activity.data)
  const totals = dayTotals(activity.data)
  const people = staffOptions(activity.data)
  const allLogs = logs.data ?? []
  const logRows = filterFacilityLogs(allLogs, logFilter)
  const { slice, pagination } = usePagedRows(logRows, `${date}|${JSON.stringify(logFilter)}`)
  const now = date === today ? vietnamTime(new Date()) : null
  const reload = () => setReloadCount((n) => n + 1)

  function showLogsOf(accountId: number) {
    setLogFilter({ accountId: String(accountId), query: "" })
    document.getElementById("facility-logs")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (activity.error) {
    return <LoadError title="Không tải được hoạt động nhân viên" message={activity.error} onRetry={reload} />
  }

  return (
    <section aria-label="Hoạt động nhân viên" className="space-y-4">
      <FilterBar>
        <DateFilter
          label="Ngày"
          value={date}
          onChange={(v) => {
            if (!v) return
            setDate(v)
            setLogFilter({ accountId: "ALL", query: "" })
          }}
        />
        <p className="text-muted max-w-md self-center text-xs">
          Số liệu tính trong ngày đã chọn. Bấm tên nhân viên để xem nhật ký thao tác của người đó.
        </p>
      </FilterBar>

      {!activity.isLoading && totals.scheduled > 0 && (
        <p role="status" className="card-box flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border px-4 py-3 text-xs">
          <span className="text-title font-bold">
            {totals.attended}/{totals.scheduled} lượt trực đã vào ca
          </span>
          {WORK_COUNTS.map((c) => (
            <span key={c.key} className="text-title">
              {c.label}: <b className="tabular-nums">{totals.counts[c.key]}</b>
            </span>
          ))}
        </p>
      )}

      {activity.isLoading ? (
        <TableCard caption="Đang tải hoạt động nhân viên" columns={[{ header: "Nhân viên" }]} isLoading isEmpty={false} emptyText="">
          {null}
        </TableCard>
      ) : shifts.length === 0 ? (
        <TableCard
          caption="Hoạt động nhân viên theo ca"
          columns={[{ header: "Nhân viên" }]}
          isLoading={false}
          isEmpty
          emptyText={`Ngày ${formatDate(date)} chưa có ai được xếp ca. Xếp người trực ở trang Phân công.`}
        >
          {null}
        </TableCard>
      ) : (
        shifts.map((shift) => (
          <div key={shift.shiftId} className="space-y-2">
            <h3 className="text-title text-sm font-black">
              {shift.shiftName}{" "}
              <span className="text-muted font-semibold">
                {shift.startTime}–{shift.endTime} · {shift.staff.length} người
              </span>
            </h3>
            <TableCard
              caption={`Hoạt động ${shift.shiftName}`}
              columns={[
                { header: "Nhân viên" },
                { header: "Vào ca" },
                ...WORK_COUNTS.map((c) => ({ header: c.label, align: "right" as const })),
                { header: "TB nhận ticket", align: "right" },
              ]}
              minWidth={900}
              isLoading={false}
              isEmpty={false}
              emptyText=""
            >
              {shift.staff.map((s) => {
                const late = now !== null && isLateToShift(shift, s, now)
                return (
                  <tr key={s.employeeId} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => showLogsOf(s.accountId)}
                        className="text-title font-bold hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                        aria-label={`Xem nhật ký của ${s.fullName}`}
                      >
                        {s.fullName}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {s.attended ? (
                        <StatusBadge tone="green">Đã vào ca</StatusBadge>
                      ) : (
                        <StatusBadge tone={late ? "red" : "slate"}>{late ? "Chưa vào ca (đã tới giờ)" : "Chưa vào ca"}</StatusBadge>
                      )}
                    </td>
                    {WORK_COUNTS.map((c) => (
                      <td
                        key={c.key}
                        className={cn("px-4 py-3 text-right tabular-nums", s[c.key] > 0 ? "text-title font-bold" : "text-muted")}
                      >
                        {s[c.key]}
                      </td>
                    ))}
                    <td className="text-title px-4 py-3 text-right whitespace-nowrap">{acceptTimeLabel(s.avgTicketAcceptMinutes)}</td>
                  </tr>
                )
              })}
            </TableCard>
          </div>
        ))
      )}

      <div id="facility-logs" className="scroll-mt-4 space-y-3 pt-2">
        <h3 className="text-title text-sm font-black">Nhật ký thao tác của cơ sở</h3>
        {logs.error ? (
          <LoadError title="Không tải được nhật ký" message={logs.error} onRetry={reload} />
        ) : (
          <>
            <FilterBar>
              <SelectFilter
                label="Nhân viên"
                value={logFilter.accountId}
                onChange={(accountId) => setLogFilter((f) => ({ ...f, accountId }))}
                options={[
                  { value: "ALL", label: "Tất cả" },
                  ...people.map((p) => ({ value: String(p.accountId), label: p.fullName })),
                ]}
              />
              <SearchFilter
                value={logFilter.query}
                onChange={(query) => setLogFilter((f) => ({ ...f, query }))}
                placeholder="Hành động hoặc mô tả"
              />
            </FilterBar>
            <ResultCount shown={logRows.length} total={allLogs.length} unit="bản ghi" isLoading={logs.isLoading} />
            <TableCard
              caption="Nhật ký thao tác nội bộ của cơ sở"
              columns={[{ header: "Thời gian" }, { header: "Người thực hiện" }, { header: "Hành động" }, { header: "Mô tả" }]}
              minWidth={760}
              isLoading={logs.isLoading}
              isEmpty={logRows.length === 0}
              emptyText={allLogs.length === 0 ? "Chưa có thao tác nào trong ngày" : "Không có bản ghi phù hợp bộ lọc"}
            >
              {slice.rows.map((l) => (
                <tr key={l.activityLogId} className="border-b align-top last:border-0">
                  <td className="text-muted px-4 py-3 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="text-title font-bold">{actorLabel(l)}</p>
                    {l.actorRole && <p className="text-muted">{getRoleTitle(normalizeRole(l.actorRole))}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={isSensitive(l.action) ? "amber" : "blue"}>{actionLabel(l.action)}</StatusBadge>
                  </td>
                  <td className="text-title px-4 py-3">{l.description ?? "—"}</td>
                </tr>
              ))}
            </TableCard>
            {!logs.isLoading && <Pagination {...pagination} unit="bản ghi" />}
          </>
        )}
      </div>
    </section>
  )
}

export default StaffActivityPanel
