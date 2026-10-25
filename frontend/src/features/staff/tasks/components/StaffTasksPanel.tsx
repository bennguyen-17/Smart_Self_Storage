import { useEffect, useState } from "react"
import {
  CheckCircle2Icon,
  ClipboardListIcon,
  InboxIcon,
  SearchIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAsyncData } from "@/hooks/useAsyncData"
import { getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import StaffShiftBadge from "@/features/staff/components/StaffShiftBadge"
import StaffShiftRequiredCard from "@/features/staff/components/StaffShiftRequiredCard"

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

const TASK_FILTERS: { key: "ALL" | StaffTaskStatus; label: string }[] = [
  { key: "ALL", label: "Tất Cả" },
  { key: "ASSIGNED", label: "Cần Làm" },
  { key: "DONE", label: "Đã Hoàn Thành" }
]

/** US-32: danh sách việc Manager giao cho Staff trong ca hiện tại — giao diện đồng bộ 100% với Checkin & Support. */
function StaffTasksPanel() {
  const [reload, setReload] = useState(0)
  const [filter, setFilter] = useState<"ALL" | StaffTaskStatus>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
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

  const isShiftError =
    Boolean(error) &&
    (error!.toLowerCase().includes("bắt đầu ca") ||
      error!.toLowerCase().includes("ca được phân công") ||
      error!.toLowerCase().includes("ca trực") ||
      error!.toLowerCase().includes("chưa tiếp nhận ca") ||
      error!.toLowerCase().includes("quyền") ||
      error!.toLowerCase().includes("chưa được gắn cơ sở"))

  function countOf(status: "ALL" | StaffTaskStatus): number {
    if (status === "ALL") return tasks.length
    return tasks.filter((t) => t.status === status).length
  }

  const query = searchQuery.trim().toLowerCase()
  const filteredTasks = tasks.filter((t) => {
    if (filter !== "ALL" && t.status !== filter) return false
    if (!query) return true
    const typeLabel = (TASK_TYPE_LABEL[t.taskType] ?? "").toLowerCase()
    const statusLabel = (TASK_STATUS_LABEL[t.status] ?? "").toLowerCase()
    return (
      typeLabel.includes(query) ||
      statusLabel.includes(query) ||
      (t.unitCode && t.unitCode.toLowerCase().includes(query)) ||
      (t.contractCode && t.contractCode.toLowerCase().includes(query)) ||
      (t.note && t.note.toLowerCase().includes(query))
    )
  })

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
      {/* Tiêu đề trang - Nằm trực tiếp trên nền ambient xanh mờ như Checkin & Support */}
      <div>
        <h1
          id="staff-tasks-title"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
          <ClipboardListIcon className="size-5 text-blue-600 dark:text-blue-400" />
          <span>Công việc đảm nhiệm</span>
        </h1>
      </div>

      {/* Cụm Tìm kiếm & Trạng thái Ca trực */}
      <div className="card-box flex flex-col justify-between gap-3 rounded-2xl border p-4 shadow-sm md:flex-row md:items-center">
        <div className="flex max-w-xl flex-1 space-x-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-2.5 left-3.5 size-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Mã việc, Vị trí ô kho, Ghi chú..."
              className="inner-box w-full rounded-xl border border-slate-200/80 px-3.5 py-2 pl-9 text-xs font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700"
            />
          </div>
          <button
            type="button"
            className="shrink-0 cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
          >
            Tra cứu
          </button>
        </div>

        <StaffShiftBadge />
      </div>

      {/* Cụm Filter Chips theo trạng thái - Đồng bộ với Checkin & Support */}
      <div
        role="group"
        aria-label="Lọc theo trạng thái công việc"
        className="flex flex-wrap items-center gap-2"
      >
        {TASK_FILTERS.map((f) => {
          const active = f.key === filter
          const count = isShiftError ? 0 : countOf(f.key)
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.key)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap shadow-2xs transition backdrop-blur-sm",
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "border-slate-200/90 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
              )}
            >
              {f.label} ({count})
            </button>
          )
        })}
      </div>

      {/* VIEW NỘI DUNG CHÍNH */}
      {isLoading ? (
        <div className="card-box flex items-center justify-center rounded-2xl border py-12 text-center text-sm text-muted-foreground">
          <Spinner /> Đang tải danh sách công việc…
        </div>
      ) : isShiftError ? (
        <StaffShiftRequiredCard onStarted={() => setReload((n) => n + 1)} />
      ) : error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertTitle>Không tải được danh sách việc</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : filteredTasks.length === 0 ? (
        <div className="card-box flex flex-col items-center justify-center rounded-2xl border py-12 text-center text-muted">
          <InboxIcon className="mb-2 size-8 text-slate-400 dark:text-slate-500" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {tasks.length === 0
              ? "Chưa có việc nào được giao trong ca hiện tại"
              : "Không có công việc nào khớp với bộ lọc"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tasks.length === 0
              ? "Hãy bắt đầu ca để nhận việc từ Quản lý."
              : "Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác."}
          </p>
        </div>
      ) : (
        <div className="card-box rounded-2xl border p-4 shadow-sm">
          <ul className="space-y-2">
            {filteredTasks.map((task) => {
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
        </div>
      )}
    </section>
  )
}

export default StaffTasksPanel
