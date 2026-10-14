import { useMemo, useState } from "react"
import { CalendarCogIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DateFilter, FilterBar, LoadError, StatusBadge, TableCard } from "@/features/internal-shell/components/PanelKit"
import { getManagerContext } from "@/features/unit-management/managerContext"
import { useAsyncData } from "@/hooks/useAsyncData"
import { todayInVietnam } from "@/lib/format"

import { getDaySchedule, listFacilityStaff } from "../api/shiftApi"
import { DUTY_LABEL, missingDuties, SHIFTS } from "../shiftRules"
import type { ShiftKey } from "../types"
import ShiftAssignSheet from "./ShiftAssignSheet"

/** US-32: Manager xếp người trực 3 ca trong ngày cho cơ sở mình và giao việc cho từng người */
function ShiftsPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const [date, setDate] = useState(todayInVietnam())
  const [reloadCount, setReloadCount] = useState(0)
  const [editing, setEditing] = useState<ShiftKey | null>(null)

  const staff = useAsyncData("facility-staff", () => listFacilityStaff(ctx))
  const schedule = useAsyncData(date ? `shifts:${date}#${reloadCount}` : null, () => getDaySchedule(ctx, date))
  const error = staff.error ?? schedule.error
  const isLoading = staff.isLoading || schedule.isLoading

  if (error) {
    return <LoadError title="Không tải được lịch phân ca" message={error} onRetry={() => setReloadCount((n) => n + 1)} />
  }

  return (
    <section aria-label="Phân ca nhân viên" className="space-y-4">
      <FilterBar>
        <DateFilter label="Ngày" value={date} onChange={(v) => v && setDate(v)} />
        <p className="text-muted pb-1.5 text-xs">Khung trực chuẩn 08:00 – 20:00, chia 3 ca.</p>
      </FilterBar>

      <TableCard
        caption="Phân ca trong ngày"
        columns={[
          { header: "Ca" },
          { header: "Người trực" },
          { header: "Còn thiếu" },
          { header: "Thao tác", srOnly: true },
        ]}
        minWidth={820}
        isLoading={isLoading}
        isEmpty={false}
        emptyText=""
      >
        {SHIFTS.map((s) => {
          const assignments = schedule.data?.shifts.find((x) => x.shift === s.key)?.assignments ?? []
          const missing = missingDuties(assignments)
          return (
            <tr key={s.key} className="border-b align-top last:border-0">
              <td className="px-4 py-3 whitespace-nowrap">
                <p className="text-title font-bold">{s.label}</p>
                <p className="text-muted">{s.time}</p>
              </td>
              <td className="px-4 py-3">
                {assignments.length === 0 ? (
                  <span className="font-semibold text-rose-600 dark:text-rose-400">Chưa có người trực</span>
                ) : (
                  <ul className="space-y-1">
                    {assignments.map((a) => (
                      <li key={a.accountId} className="text-title">
                        <span className="font-semibold">{a.fullName}</span>
                        <span className="text-muted"> · {DUTY_LABEL[a.duty]}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="px-4 py-3">
                {missing.length === 0 ? (
                  <StatusBadge tone="green">Đủ việc</StatusBadge>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {missing.map((d) => (
                      <StatusBadge key={d} tone="amber">
                        {DUTY_LABEL[d]}
                      </StatusBadge>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="outline" size="sm" aria-label={`Phân công ${s.label.toLowerCase()}`} onClick={() => setEditing(s.key)}>
                  <CalendarCogIcon aria-hidden="true" /> Phân công
                </Button>
              </td>
            </tr>
          )
        })}
      </TableCard>

      {editing && schedule.data && (
        <ShiftAssignSheet
          key={`${date}:${editing}`}
          ctx={ctx}
          schedule={schedule.data}
          shift={editing}
          staff={staff.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            toast.success(message)
            setEditing(null)
            setReloadCount((n) => n + 1)
          }}
        />
      )}
    </section>
  )
}

export default ShiftsPanel
