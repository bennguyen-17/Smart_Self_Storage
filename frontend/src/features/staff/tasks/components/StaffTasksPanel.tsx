import { useEffect, useState } from "react"
import {
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  InboxIcon,
  PlayIcon,
  RotateCwIcon,
} from "lucide-react"
import { startCurrentShift } from "@/features/staff/shifts/api/staffShiftApi"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAsyncData } from "@/hooks/useAsyncData"
import { getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"

import { completeTask, listMyTasks } from "../api/staffTaskApi"
import type { StaffTask, StaffTaskStatus, StaffTaskType } from "../types"

const TASK_TYPE_LABEL: Record<StaffTaskType, string> = {
  MAINTENANCE: "Bảo trì kho",
  CHECKOUT_INSPECTION: "Nghiệm thu trả kho",
}

const TASK_STATUS_LABEL: Record<StaffTaskStatus, string> = {
  ASSIGNED: "Cần làm",
  DONE: "Đã xong",
  CANCELLED: "Đã hủy",
}

const TASK_STATUS_CLASS: Record<StaffTaskStatus, string> = {
  ASSIGNED:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  DONE: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  CANCELLED:
    "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

/** US-32: danh sách việc Manager giao cho Staff trong ca hiện tại. */
function StaffTasksPanel() {
  const [reload, setReload] = useState(0)
  const [completingId, setCompletingId] = useState<number | null>(null)

  useEffect(() => {
    const handleShiftChange = () => setReload((n) => n + 1)
    window.addEventListener("staff-shift-changed", handleShiftChange)
    return () => window.removeEventListener("staff-shift-changed", handleShiftChange)
  }, [])

  const { data, error, isLoading } = useAsyncData(
    `staff-tasks:${reload}`,
    listMyTasks
  )

  const tasks = [...(data ?? [])].sort((a, b) => {
    if (a.status === b.status) return a.taskId - b.taskId
    return a.status === "ASSIGNED" ? -1 : 1
  })
  const pendingCount = tasks.filter((task) => task.status === "ASSIGNED").length

  async function handleDone(task: StaffTask) {
    setCompletingId(task.taskId)
    try {
      await completeTask(task.taskId)
      toast.success(
        `Đã báo hoàn thành: ${TASK_TYPE_LABEL[task.taskType] ?? task.taskType}`
      )
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCompletingId(null)
    }
  }

  return (
    <section aria-labelledby="staff-tasks-title" className="space-y-4">
      <div>
        <h1
          id="staff-tasks-title"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
          <ClipboardListIcon className="size-5 text-blue-600 dark:text-blue-400" />
          <span>Việc được giao</span>
          {!isLoading && !error && pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              {pendingCount}
            </span>
          )}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Các việc Quản lý giao trong ca hiện tại. Bấm "Đã xong" sau khi hoàn
          thành để ghi nhận.
        </p>
      </div>

      <div className="card-box rounded-2xl border p-4 shadow-sm">
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReload((n) => n + 1)}
            disabled={isLoading}
          >
            <RotateCwIcon aria-hidden="true" /> Tải lại
          </Button>
        </div>

        {isLoading && (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Spinner /> Đang tải danh sách việc…
          </p>
        )}

        {error && (
          error.toLowerCase().includes("bắt đầu ca") || error.toLowerCase().includes("ca được phân công") ? (
            <div className="mt-3 relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-indigo-50/80 p-6 text-center dark:border-blue-900/60 dark:from-slate-900 dark:to-slate-950">
              <ClockIcon className="mx-auto mb-2 size-10 text-blue-600 dark:text-blue-400" />
              <p className="font-bold text-slate-900 dark:text-white">Bạn chưa bắt đầu ca trực để nhận việc</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Vui lòng bắt đầu ca trực để xem và xử lý danh sách công việc Quản lý giao cho ca này.
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await startCurrentShift()
                    window.dispatchEvent(new CustomEvent("staff-shift-changed"))
                    toast.success("Đã bắt đầu ca trực thành công!")
                    setReload((n) => n + 1)
                  } catch (err) {
                    toast.error(getErrorMessage(err))
                  }
                }}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition"
              >
                <PlayIcon className="size-3.5 fill-current" />
                <span>Bắt Đầu Ca Ngay</span>
              </button>
            </div>
          ) : (
            <Alert variant="destructive" className="mt-3">
              <AlertTitle>Không tải được danh sách việc</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )
        )}

        {!isLoading && !error && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <InboxIcon className="mb-2 size-8 text-slate-400 dark:text-slate-500" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Chưa có việc nào được giao trong ca hiện tại
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Hãy bắt đầu ca để nhận việc từ Quản lý.
            </p>
          </div>
        )}

        {!isLoading && !error && tasks.length > 0 && (
          <ul className="mt-3 space-y-2">
            {tasks.map((task) => {
              const statusClass =
                TASK_STATUS_CLASS[task.status] ?? TASK_STATUS_CLASS.ASSIGNED
              return (
                <li
                  key={task.taskId}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {TASK_TYPE_LABEL[task.taskType] ?? task.taskType}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass}`}
                      >
                        {TASK_STATUS_LABEL[task.status] ?? task.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {[
                        task.unitCode ? `Kho ${task.unitCode}` : null,
                        task.contractCode ? `HĐ ${task.contractCode}` : null,
                        task.shiftName,
                        task.workDate ? formatDate(task.workDate) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    {task.note && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {task.note}
                      </p>
                    )}
                  </div>

                  {task.status === "ASSIGNED" ? (
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleDone(task)}
                      disabled={completingId === task.taskId}
                    >
                      <CheckCircle2Icon aria-hidden="true" />
                      {completingId === task.taskId ? "Đang lưu…" : "Đã xong"}
                    </Button>
                  ) : (
                    task.status === "DONE" &&
                    task.doneAt && (
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        Xong lúc {formatDate(task.doneAt)}
                      </span>
                    )
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

export default StaffTasksPanel
