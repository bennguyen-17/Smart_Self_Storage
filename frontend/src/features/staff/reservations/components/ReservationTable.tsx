import type { ReactNode } from "react"
import { InboxIcon, RotateCwIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatDate, formatDateTime, formatVnd, maskCccd } from "@/lib/format"

import type { ReservationTab } from "../constants"
import type { Reservation } from "../types"
import ReservationStatusBadge from "./ReservationStatusBadge"

interface Column {
  header: string
  align?: "right"
  render: (r: Reservation) => ReactNode
}

const codeColumn = (onOpen: (code: string) => void): Column => ({
  header: "Mã đặt chỗ",
  render: (r) => (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onOpen(r.reservationCode)
      }}
      className="font-mono font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {r.reservationCode}
    </button>
  ),
})

const statusColumn: Column = {
  header: "Trạng thái",
  render: (r) => (
    <ReservationStatusBadge
      status={r.status}
      cancelReason={r.cancelReason}
      refundStatus={r.refundStatus}
    />
  ),
}

function getColumns(tab: ReservationTab, onOpen: (code: string) => void) {
  const common: Column[] = [
    codeColumn(onOpen),
    { header: "Tên khách", render: (r) => r.customerName },
    {
      header: "Số CCCD",
      render: (r) => <span className="font-mono">{maskCccd(r.cccd)}</span>,
    },
  ]

  if (tab.reason === "NO_SHOW") {
    return [
      ...common,
      {
        header: "Ngày hẹn nhận kho cũ",
        render: (r) => formatDate(r.checkinDate),
      },
      {
        header: "Tiền cọc đã tịch thu",
        align: "right",
        render: (r) => (
          <span className="font-semibold text-rose-700 dark:text-rose-300">
            {formatVnd(r.forfeitedAmount)}
          </span>
        ),
      },
      {
        header: "Thời điểm hệ thống tự động hủy",
        render: (r) => formatDateTime(r.canceledAt),
      },
      statusColumn,
    ] satisfies Column[]
  }

  return [
    ...common,
    {
      header: "Cơ sở / Ô kho",
      render: (r) => `${r.facilityCode} · ${r.unitCode}`,
    },
    { header: "Ngày hẹn nhận kho", render: (r) => formatDate(r.checkinDate) },
    {
      header: "Tiền cọc",
      align: "right",
      render: (r) => formatVnd(r.depositAmount),
    },
    statusColumn,
  ] satisfies Column[]
}

interface ReservationTableProps {
  tab: ReservationTab
  rows: Reservation[] | undefined
  isLoading: boolean
  error: string | undefined
  onRetry: () => void
  onOpen: (reservationCode: string) => void
}

function ReservationTable({
  tab,
  rows,
  isLoading,
  error,
  onRetry,
  onOpen,
}: ReservationTableProps) {
  const columns = getColumns(tab, onOpen)

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không tải được danh sách đơn đặt cọc</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-2">
          {error}
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCwIcon aria-hidden="true" /> Thử lại
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[760px] text-left text-sm">
        <caption className="sr-only">
          Danh sách đơn đặt cọc: {tab.label}. Chọn mã đặt chỗ để xem chi tiết.
        </caption>
        <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                scope="col"
                className={`px-4 py-3 font-semibold ${col.align === "right" ? "text-right" : ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody aria-busy={isLoading}>
          {isLoading &&
            Array.from({ length: 5 }, (_, i) => (
              <tr key={i} className="border-b last:border-0">
                {columns.map((col) => (
                  <td key={col.header} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-muted" />
                  </td>
                ))}
              </tr>
            ))}

          {!isLoading && rows?.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <InboxIcon
                  aria-hidden="true"
                  className="mx-auto mb-2 size-8 text-muted-foreground"
                />
                <p className="font-medium">
                  {tab.reason === "NO_SHOW"
                    ? "Chưa có đơn nào bị hủy do No-Show"
                    : "Không có đơn đặt cọc nào"}
                </p>
              </td>
            </tr>
          )}

          {!isLoading &&
            rows?.map((r) => (
              <tr
                key={r.reservationCode}
                onClick={() => onOpen(r.reservationCode)}
                className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50"
              >
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={`px-4 py-3 whitespace-nowrap ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.render(r)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

export default ReservationTable
