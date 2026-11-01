// Khối dựng dùng chung cho các trang "bộ lọc + bảng" của cổng Manager và Admin,
// để mọi trang có cùng cách trình bày (cùng ô lọc, cùng bảng, cùng trạng thái đang tải / trống / lỗi).

import type { ReactNode } from "react"
import { ChevronLeftIcon, ChevronRightIcon, InboxIcon, RotateCwIcon } from "lucide-react"
import { cn } from "cn"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { sanitizeErrorMessage } from "../readableError"
import { Button } from "@/components/ui/button"

import { PAGE_SIZE_OPTIONS, pageWindow, type PageSlice } from "../pagination"

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("card-box flex flex-wrap items-end gap-3 rounded-2xl border p-4 shadow-sm", className)}>
      {children}
    </div>
  )
}

export function SearchFilter({
  label = "Tìm kiếm",
  value,
  onChange,
  placeholder,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs font-bold">
      <span className="text-title">{label}</span>
      <span className="relative">
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="inner-box text-title w-full rounded-lg border py-1.5 pr-2.5 pl-8 text-xs font-semibold outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
        />
        <i aria-hidden="true" className="fa-solid fa-magnifying-glass pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 z-10"></i>
      </span>
    </label>
  )
}

export function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-bold">
      <span className="text-title">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="inner-box text-title min-w-36 cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function DateFilter({
  label,
  value,
  onChange,
  invalid = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-bold">
      <span className="text-title">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        className="inner-box text-title rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 aria-invalid:border-rose-500"
      />
    </label>
  )
}

export interface TableColumn {
  header: string
  align?: "right" | "center"
  /** Chỉ cho trình đọc màn hình (cột thao tác) */
  srOnly?: boolean
}

/**
 * Bảng trong khung có cuộn ngang. Khung để `relative` để chữ `sr-only` không "thoát" ra ngoài
 * làm cả trang tràn ngang trên điện thoại.
 */
export function TableCard({
  caption,
  columns,
  minWidth = 760,
  isLoading,
  isEmpty,
  emptyText,
  children,
}: {
  caption: string
  columns: readonly TableColumn[]
  minWidth?: number
  isLoading: boolean
  isEmpty: boolean
  emptyText: string
  children: ReactNode
}) {
  return (
    <div className="card-box relative overflow-x-auto rounded-2xl border shadow-sm">
      <table className="w-full text-left text-xs" style={{ minWidth }}>
        <caption className="sr-only">{caption}</caption>
        <thead className="text-muted border-b text-[11px] uppercase">
          <tr>
            {columns.map((c, i) => (
              <th key={i} scope="col" className={cn("px-4 py-3 font-bold", c.align === "right" && "text-right", c.align === "center" && "text-center")}>
                {c.srOnly ? <span className="sr-only">{c.header}</span> : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody aria-busy={isLoading}>
          {isLoading &&
            Array.from({ length: 4 }, (_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td colSpan={columns.length} className="px-4 py-3">
                  <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </td>
              </tr>
            ))}
          {!isLoading && isEmpty && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center">
                <InboxIcon aria-hidden="true" className="text-muted mx-auto mb-2 size-7" />
                <p className="text-title font-semibold">{emptyText}</p>
              </td>
            </tr>
          )}
          {!isLoading && !isEmpty && children}
        </tbody>
      </table>
    </div>
  )
}

export function LoadError({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-2 [overflow-wrap:anywhere]">
        {sanitizeErrorMessage(message)}
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCwIcon aria-hidden="true" /> Thử lại
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export type BadgeTone = "green" | "amber" | "blue" | "red" | "slate" | "cyan"

const TONE_CLASS: Record<BadgeTone, string> = {
  green: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  amber: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  blue: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  red: "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
  slate: "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  cyan: "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300",
}

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", TONE_CLASS[tone])}>
      {children}
    </span>
  )
}

/** Dòng "x / y kết quả" dưới thanh lọc; đọc lại cho trình đọc màn hình khi kết quả đổi */
export function ResultCount({ shown, total, unit, isLoading }: { shown: number; total: number; unit: string; isLoading: boolean }) {
  return (
    <p className="text-muted text-xs" aria-live="polite">
      {isLoading ? "Đang tải…" : `${shown} / ${total} ${unit}`}
    </p>
  )
}

/**
 * Thanh phân trang dưới bảng: "Hiển thị x – y trong tổng số N", chọn số dòng mỗi trang,
 * nút trang trước / sau và số trang (theo kiểu bảng hợp đồng ở cổng khách hàng).
 */
export function Pagination({
  slice,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  slice: PageSlice<unknown>
  total: number
  /** Giữ cho các trang đang truyền; dòng "Hiển thị x – y trong tổng số N" đã bỏ nên chưa dùng */
  unit: string
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  if (total === 0) return null
  const { page, totalPages } = slice
  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-muted flex items-center gap-2">
          Số dòng mỗi trang
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="inner-box text-title rounded-lg border px-2 py-1 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Trang trước" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          {pageWindow(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} aria-hidden="true" className="text-muted px-1">
                …
              </span>
            ) : (
              <Button
                key={p}
                size="icon-sm"
                variant={p === page ? "default" : "outline"}
                aria-label={`Trang ${p}`}
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPageChange(p)}
                className={cn("tabular-nums", p === page && "bg-blue-600 text-white hover:bg-blue-500")}
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Trang sau"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
