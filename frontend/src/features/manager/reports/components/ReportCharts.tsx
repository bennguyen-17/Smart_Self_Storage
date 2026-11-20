import { cn } from "cn"

import { barWidths, donutArcs, type UnitSegment, type UnitSegmentKey } from "../reportRules"

const UNIT_COLOR: Record<UnitSegmentKey, string> = {
  occupied: "bg-[#2a78d6] dark:bg-[#3987e5]",
  reserved: "bg-[#eb6834] dark:bg-[#d95926]",
  available: "bg-[#1baf7a] dark:bg-[#199e70]",
  maintenance: "bg-[#eda100] dark:bg-[#c98500]",
}

const UNIT_STROKE: Record<UnitSegmentKey, string> = {
  occupied: "stroke-[#2a78d6] dark:stroke-[#3987e5]",
  reserved: "stroke-[#eb6834] dark:stroke-[#d95926]",
  available: "stroke-[#1baf7a] dark:stroke-[#199e70]",
  maintenance: "stroke-[#eda100] dark:stroke-[#c98500]",
}

// Chọn R sao cho chu vi = 100 để dùng trực tiếp % cho strokeDasharray
const R = 100 / (2 * Math.PI)

export function UnitDonut({
  segments,
  total,
  occupancyRate,
}: {
  segments: readonly UnitSegment[]
  total: number
  occupancyRate: number
}) {
  const arcs = donutArcs(segments)
  const summary = segments.map((s) => `${s.label} ${s.count} ô (${s.percent}%)`).join(", ")
  return (
    <figure className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative size-44 shrink-0">
        <svg viewBox="0 0 42 42" role="img" aria-label={`Cơ cấu ${total} ô kho: ${summary}`} className="size-full -rotate-90">
          <circle cx="21" cy="21" r={R} fill="none" strokeWidth="6" className="stroke-slate-100 dark:stroke-slate-800" />
          {arcs.map((a) => {
            const seg = segments.find((s) => s.key === a.key)!
            return (
              <circle
                key={a.key}
                cx="21"
                cy="21"
                r={R}
                fill="none"
                strokeWidth="6"
                strokeDasharray={`${a.length} ${100 - a.length}`}
                strokeDashoffset={-a.start}
                className={UNIT_STROKE[a.key]}
              >
                <title>{`${seg.label}: ${seg.count} ô (${seg.percent}%)`}</title>
              </circle>
            )
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-title text-2xl font-black tabular-nums">{occupancyRate.toLocaleString("vi-VN")}%</span>
          <span className="text-muted text-[11px]">lấp đầy</span>
        </div>
      </div>
      <figcaption className="w-full min-w-0 flex-1">
        <ul className="space-y-2 text-xs">
          {segments.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span aria-hidden="true" className={cn("size-3 shrink-0 rounded-sm", UNIT_COLOR[s.key])} />
              <span className="text-title min-w-0 flex-1 truncate">{s.label}</span>
              <span className="text-title font-semibold tabular-nums">{s.count} ô</span>
              <span className="text-muted w-12 text-right tabular-nums">{s.percent}%</span>
            </li>
          ))}
        </ul>
        <p className="text-muted mt-3 border-t pt-2 text-xs">Tổng {total.toLocaleString("vi-VN")} ô tại cơ sở</p>
      </figcaption>
    </figure>
  )
}

export function Meter({ label, percent }: { label: string; percent: number }) {
  const value = Math.max(0, Math.min(100, percent))
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-title font-semibold">{label}</span>
        <span className="text-title text-lg font-black tabular-nums">{value.toLocaleString("vi-VN")}%</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-2 overflow-hidden rounded bg-blue-100 dark:bg-blue-950"
      >
        <div className="h-full rounded bg-[#2a78d6] dark:bg-[#3987e5]" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export interface BarItem {
  label: string
  value: number
  display: string
  // Khoản trừ (hoàn tiền) vẽ màu xám để tách khỏi khoản thu
  subtract?: boolean
}

export function BarList({ items, label }: { items: readonly BarItem[]; label: string }) {
  const widths = barWidths(items.map((i) => i.value))
  return (
    <ul aria-label={label} className="space-y-2.5">
      {items.map((item, i) => (
        <li key={item.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="text-title font-semibold">
              {item.label}
              {item.subtract && <span className="text-muted ml-1 font-normal">(trừ ra)</span>}
            </span>
            <span className={cn("font-semibold tabular-nums", item.subtract ? "text-muted" : "text-title")}>{item.display}</span>
          </div>
          <div className="h-2 rounded bg-slate-100 dark:bg-slate-800/70" title={`${item.label}: ${item.display}`}>
            <div
              className={cn("h-full rounded", item.subtract ? "bg-slate-400 dark:bg-slate-500" : "bg-[#2a78d6] dark:bg-[#3987e5]")}
              style={{ width: `${widths[i]}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
