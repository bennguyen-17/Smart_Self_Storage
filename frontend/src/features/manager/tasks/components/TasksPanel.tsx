import { useMemo, useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
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
import { getManagerContext } from "@/features/manager/managerContext"
import { useAsyncData } from "@/hooks/useAsyncData"
import { getErrorMessage } from "@/lib/api"
import { formatDateTime, todayInVietnam } from "@/lib/format"

import { cancelTask, listTasks } from "../api/taskApi"
import {
  filterTasks,
  TASK_STATUS_LABEL,
  taskStatus,
  taskStatusTone,
  taskSummary,
  taskTypeLabel,
} from "../taskRules"
import type { StaffTask, TaskFilter, TaskStatus } from "../types"
import AssignTaskSheet from "./AssignTaskSheet"

const EMPTY_FILTER: TaskFilter = { query: "", status: "ALL" }

/**
 * Manager › Giao việc: giao việc cụ thể (bảo trì ô kho, nghiệm thu trả kho) cho Staff đang trực ca,
 * theo dõi việc nào đã xong, hủy việc chưa làm. Staff nhận việc ở cổng Staff › Việc của tôi.
 */
function TasksPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const today = todayInVietnam()
  const [date, setDate] = useState(today)
  const [filter, setFilter] = useState<TaskFilter>(EMPTY_FILTER)
  const [reloadCount, setReloadCount] = useState(0)
  const [assigning, setAssigning] = useState(false)
  const [canceling, setCanceling] = useState<StaffTask | null>(null)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const { data, error, isLoading } = useAsyncData(`tasks:${date}#${reloadCount}`, () => listTasks(ctx, date))
  const all = data ?? []
  const rows = filterTasks(all, filter)
  const { slice, pagination } = usePagedRows(rows, `${date}|${JSON.stringify(filter)}`)
  const summary = taskSummary(all)
  const isPast = date < today
  const update = (patch: Partial<TaskFilter>) => setFilter((f) => ({ ...f, ...patch }))
  const reload = () => setReloadCount((n) => n + 1)

  function handleAssigned(message: string) {
    toast.success(message)
    setAssigning(false)
    reload()
  }

  async function confirmCancel() {
    if (!canceling) return
    setCancelBusy(true)
    setCancelError(null)
    try {
      await cancelTask(ctx, canceling.taskId)
      toast.success(`Đã hủy việc của ${canceling.employeeName ?? "nhân viên"}`)
      setCanceling(null)
      reload()
    } catch (err) {
      setCancelError(getErrorMessage(err))
    } finally {
      setCancelBusy(false)
    }
  }

  if (error) {
    return <LoadError title="Không tải được danh sách việc" message={error} onRetry={reload} />
  }

  return (
    <section aria-label="Giao việc cho nhân viên" className="space-y-4">
      <FilterBar>
        <DateFilter label="Ngày làm việc" value={date} onChange={(v) => v && setDate(v)} />
        <SelectFilter
          label="Trạng thái"
          value={filter.status}
          onChange={(v) => update({ status: v as TaskStatus | "ALL" })}
          options={[
            { value: "ALL", label: "Tất cả" },
            { value: "ASSIGNED", label: TASK_STATUS_LABEL.ASSIGNED },
            { value: "DONE", label: TASK_STATUS_LABEL.DONE },
            { value: "CANCELED", label: TASK_STATUS_LABEL.CANCELED },
          ]}
        />
        <SearchFilter
          value={filter.query}
          onChange={(query) => update({ query })}
          placeholder="Tên nhân viên, ca, mã ô hoặc ghi chú"
        />
        <div className="flex flex-col gap-1">
          <Button
            onClick={() => setAssigning(true)}
            disabled={isPast}
            aria-describedby={isPast ? "task-past-hint" : undefined}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            <PlusIcon aria-hidden="true" /> Giao việc mới
          </Button>
          {isPast && (
            <span id="task-past-hint" className="text-muted text-[11px]">
              Không giao việc cho ngày đã qua
            </span>
          )}
        </div>
      </FilterBar>

      {!isLoading && all.length > 0 && (
        <p role="status" className="card-box flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border px-4 py-3 text-xs">
          <span className="text-title font-bold">{all.length} việc trong ngày</span>
          <span className="font-semibold text-amber-700 dark:text-amber-300">{summary.ASSIGNED} đang chờ làm</span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">{summary.DONE} đã xong</span>
          {summary.CANCELED > 0 && <span className="text-muted">{summary.CANCELED} đã hủy</span>}
        </p>
      )}

      <ResultCount shown={rows.length} total={all.length} unit="việc" isLoading={isLoading} />

      <TableCard
        caption="Việc đã giao cho nhân viên trong ngày"
        columns={[
          { header: "Nhân viên" },
          { header: "Ca" },
          { header: "Loại việc" },
          { header: "Ô kho / Hợp đồng" },
          { header: "Ghi chú" },
          { header: "Trạng thái" },
          { header: "Thao tác", srOnly: true },
        ]}
        minWidth={980}
        isLoading={isLoading}
        isEmpty={rows.length === 0}
        emptyText={all.length === 0 ? "Chưa giao việc nào trong ngày này" : "Không có việc phù hợp bộ lọc"}
      >
        {slice.rows.map((t) => {
          const status = taskStatus(t.status)
          return (
            <tr key={t.taskId} className="border-b align-top last:border-0">
              <td className="text-title px-4 py-3 font-bold">{t.employeeName ?? `Nhân viên #${t.assignedEmployeeId}`}</td>
              <td className="text-title px-4 py-3 whitespace-nowrap">{t.shiftName ?? `Ca #${t.shiftId}`}</td>
              <td className="text-title px-4 py-3">{taskTypeLabel(t.taskType)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <p className="text-title font-mono">{t.unitCode ?? "—"}</p>
                {t.contractId !== null && <p className="text-muted">Hợp đồng #{t.contractId}</p>}
              </td>
              <td className="text-muted max-w-64 px-4 py-3">{t.note ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={taskStatusTone(t.status)}>{TASK_STATUS_LABEL[status]}</StatusBadge>
                {status === "DONE" && t.doneAt && (
                  <p className="text-muted mt-1 whitespace-nowrap">Xong lúc {formatDateTime(t.doneAt)}</p>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {status === "ASSIGNED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Hủy việc của ${t.employeeName ?? "nhân viên"}`}
                    onClick={() => {
                      setCancelError(null)
                      setCanceling(t)
                    }}
                  >
                    Hủy việc
                  </Button>
                )}
              </td>
            </tr>
          )
        })}
      </TableCard>

      {!isLoading && <Pagination {...pagination} unit="việc" />}

      {assigning && (
        <AssignTaskSheet ctx={ctx} date={date} tasks={all} onClose={() => setAssigning(false)} onDone={handleAssigned} />
      )}

      <Dialog open={canceling !== null} onOpenChange={(open) => !open && !cancelBusy && setCanceling(null)}>
        <DialogContent className="sm:max-w-md">
          {canceling && (
            <>
              <DialogHeader>
                <DialogTitle>Hủy việc đã giao?</DialogTitle>
                <DialogDescription>
                  {taskTypeLabel(canceling.taskType)}
                  {canceling.unitCode ? ` ô ${canceling.unitCode}` : ""} của {canceling.employeeName ?? "nhân viên"} (
                  {canceling.shiftName ?? "ca"}). Việc sẽ biến khỏi danh sách "Việc của tôi" của nhân viên.
                </DialogDescription>
              </DialogHeader>
              {cancelError && (
                <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {cancelError}
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" disabled={cancelBusy} onClick={() => setCanceling(null)}>
                  Giữ lại
                </Button>
                <Button disabled={cancelBusy} onClick={confirmCancel} className="bg-rose-600 text-white hover:bg-rose-500">
                  {cancelBusy && <Spinner />}
                  Hủy việc
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default TasksPanel
