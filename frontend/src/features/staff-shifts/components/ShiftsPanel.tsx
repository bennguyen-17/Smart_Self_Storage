import { useMemo, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  DateFilter,
  FilterBar,
  LoadError,
} from "@/features/internal-shell/components/PanelKit"
import { getManagerContext } from "@/features/unit-management/managerContext"
import { useAsyncData } from "@/hooks/useAsyncData"
import { addDays, todayInVietnam } from "@/lib/format"

import { getDaySchedule, listFacilityStaff } from "../api/shiftApi"
import { weekDays } from "../shiftRules"
import ShiftCard from "./ShiftCard"

/**
 * US-32: ma trận phân ca theo prototype manager_portal: chọn ngày trên dải tuần (thứ 2 → chủ nhật),
 * mỗi ca (tên, giờ lấy từ bảng Shift) là một thẻ, thêm người và lưu ngay trong từng thẻ.
 * Chỉ phân ai trực ca nào; không chia việc trong ca.
 */
function ShiftsPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const today = todayInVietnam()
  const [date, setDate] = useState(today)
  const [reloadCount, setReloadCount] = useState(0)

  const staff = useAsyncData("facility-staff", () => listFacilityStaff(ctx))
  const schedule = useAsyncData(`shifts:${date}#${reloadCount}`, () =>
    getDaySchedule(ctx, date)
  )
  const error = staff.error ?? schedule.error
  const isLoading = staff.isLoading || schedule.isLoading
  const week = weekDays(date)

  if (error) {
    return (
      <LoadError
        title="Không tải được lịch phân ca"
        message={error}
        onRetry={() => setReloadCount((n) => n + 1)}
      />
    )
  }

  return (
    <section aria-label="Phân ca nhân viên" className="space-y-4">
      <FilterBar className="items-center">
        <DateFilter
          label="Ngày phân ca"
          value={date}
          onChange={(v) => v && setDate(v)}
        />
        <div className="flex min-w-0 flex-1 items-end gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Tuần trước"
            onClick={() => setDate(addDays(date, -7))}
          >
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          <div
            role="group"
            aria-label="Chọn ngày trong tuần"
            className="flex min-w-0 flex-1 gap-1 overflow-x-auto"
          >
            {week.map((d) => {
              const active = d.date === date
              return (
                <button
                  key={d.date}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${d.weekday} ${d.dayMonth}`}
                  onClick={() => setDate(d.date)}
                  className={cn(
                    "flex min-w-14 flex-1 cursor-pointer flex-col items-center rounded-xl border px-2 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none",
                    active
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "inner-box text-title hover:border-blue-400"
                  )}
                >
                  <span className="font-black">{d.weekday}</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      active ? "text-blue-100" : "text-muted"
                    )}
                  >
                    {d.dayMonth}
                    {d.date === today && " ·"}
                  </span>
                </button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Tuần sau"
            onClick={() => setDate(addDays(date, 7))}
          >
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </div>
      </FilterBar>

      <p className="text-xs text-muted">
        Chỉ chọn được nhân viên đang làm việc tại cơ sở của bạn.
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        {isLoading || !schedule.data
          ? [0, 1, 2].map((i) => (
              <div
                key={i}
                aria-hidden="true"
                className="card-box h-64 animate-pulse rounded-2xl border"
              />
            ))
          : schedule.data.shifts.map((s) => (
              <ShiftCard
                key={`${date}:${s.shiftId}#${reloadCount}`}
                ctx={ctx}
                schedule={schedule.data!}
                shift={s}
                staff={staff.data ?? []}
                onSaved={(message) => {
                  toast.success(message)
                  setReloadCount((n) => n + 1)
                }}
              />
            ))}
      </div>
    </section>
  )
}

export default ShiftsPanel
