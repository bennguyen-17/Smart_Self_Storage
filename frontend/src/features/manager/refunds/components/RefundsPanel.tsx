import { useState } from "react"
import { BanknoteIcon, ExternalLinkIcon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
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
import RefundConfirmForm from "./RefundConfirmForm"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatDateTime, formatVnd } from "@/lib/format"

import { confirmRefund, listRefunds } from "../api/refundApi"
import {
  bankAccountLabel,
  filterRefunds,
  hoursWaiting,
  pendingSummary,
  REFUND_SLA_HOURS,
  REFUND_STATE_LABEL,
  refundReasonLabel,
  refundState,
} from "../refundRules"
import type { ManagerRefund, RefundFilter, RefundState } from "../types"

const EMPTY_FILTER: RefundFilter = { query: "", state: "PENDING" }

/**
 * Manager › Hoàn tiền (BR-35, US-26): các phiếu hoàn (REF) của khách: hủy cọc, hủy tại quầy, hoàn cọc khi trả kho.
 * Manager chuyển khoản ngoài (Internet Banking), đính kèm biên lai rồi xác nhận → phiếu thành "Đã hoàn".
 */
function RefundsPanel() {
  const [reloadCount, setReloadCount] = useState(0)
  const [filter, setFilter] = useState<RefundFilter>(EMPTY_FILTER)
  const [selected, setSelected] = useState<ManagerRefund | null>(null)
  const { data, error, isLoading } = useAsyncData(`refunds:${filter.state}#${reloadCount}`, () =>
    listRefunds(filter.state)
  )
  const all = data ?? []
  const rows = filterRefunds(all, filter)
  const { slice, pagination } = usePagedRows(rows, JSON.stringify(filter))
  const summary = pendingSummary(all)
  const update = (patch: Partial<RefundFilter>) => setFilter((f) => ({ ...f, ...patch }))

  function handleConfirmed() {
    toast.success(`Đã xác nhận hoàn tiền phiếu ${selected?.invoiceNumber ?? ""}`)
    setSelected(null)
    setReloadCount((n) => n + 1)
  }

  if (error) {
    return <LoadError title="Không tải được danh sách hoàn tiền" message={error} onRetry={() => setReloadCount((n) => n + 1)} />
  }

  return (
    <section aria-label="Hoàn tiền cho khách hàng" className="space-y-4">
      <FilterBar>
        <SearchFilter
          value={filter.query}
          onChange={(query) => update({ query })}
          placeholder="Tên khách, số điện thoại, mã phiếu, mã đặt chỗ hoặc mã ô"
        />
        <SelectFilter
          label="Trạng thái"
          value={filter.state}
          onChange={(v) => update({ state: v as RefundState | "ALL" })}
          options={[
            { value: "PENDING", label: REFUND_STATE_LABEL.PENDING },
            { value: "REFUNDED", label: REFUND_STATE_LABEL.REFUNDED },
            { value: "ALL", label: "Tất cả" },
          ]}
        />
      </FilterBar>

      {!isLoading && summary.count > 0 && (
        <p role="status" className="card-box flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border px-4 py-3 text-xs">
          <BanknoteIcon aria-hidden="true" className="size-4 text-amber-600 dark:text-amber-400" />
          <span className="text-title font-bold">
            {summary.count} phiếu chờ hoàn · tổng {formatVnd(summary.amount)}
          </span>
          {summary.late > 0 && (
            <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
              <TriangleAlertIcon aria-hidden="true" className="size-3.5" />
              {summary.late} phiếu đã chờ quá {REFUND_SLA_HOURS} giờ
            </span>
          )}
          <span className="text-muted">Cam kết hoàn trong 24–48 giờ làm việc.</span>
        </p>
      )}

      <ResultCount shown={rows.length} total={all.length} unit="phiếu hoàn" isLoading={isLoading} />

      <TableCard
        caption="Phiếu hoàn tiền cho khách hàng"
        columns={[
          { header: "Phiếu hoàn" },
          { header: "Khách hàng" },
          { header: "Đơn / Ô kho" },
          { header: "Lý do" },
          { header: "Số tiền", align: "right" },
          { header: "Tài khoản nhận" },
          { header: "Trạng thái" },
          { header: "Thao tác", srOnly: true },
        ]}
        minWidth={1100}
        isLoading={isLoading}
        isEmpty={rows.length === 0}
        emptyText={
          all.length === 0
            ? filter.state === "PENDING"
              ? "Không có phiếu nào đang chờ hoàn"
              : "Chưa có phiếu hoàn nào"
            : "Không có phiếu phù hợp bộ lọc"
        }
      >
        {slice.rows.map((r) => {
          const pending = refundState(r.status) === "PENDING"
          const waited = hoursWaiting(r.issuedAt)
          const account = bankAccountLabel(r)
          return (
            <tr key={r.paymentId} className="border-b align-top last:border-0">
              <td className="px-4 py-3">
                <p className="text-title font-mono font-semibold whitespace-nowrap">{r.invoiceNumber}</p>
                <p className="text-muted whitespace-nowrap">{formatDateTime(r.issuedAt)}</p>
                {pending && waited > REFUND_SLA_HOURS && (
                  <p className="font-semibold whitespace-nowrap text-rose-600 dark:text-rose-400">Đã chờ {waited} giờ</p>
                )}
              </td>
              <td className="px-4 py-3">
                <p className="text-title font-bold">{r.customerName ?? "—"}</p>
                <p className="text-muted">{r.customerPhone ?? ""}</p>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <p className="text-title font-mono">{r.contractCode ?? r.reservationCode ?? `#${r.contractId}`}</p>
                <p className="text-muted font-mono">{r.unitCode ?? ""}</p>
              </td>
              <td className="text-title px-4 py-3">{refundReasonLabel(r)}</td>
              <td className="text-title px-4 py-3 text-right font-bold whitespace-nowrap tabular-nums">
                {formatVnd(r.refundAmount)}
              </td>
              <td className="px-4 py-3">
                {account ? (
                  <span className="text-title">{account}</span>
                ) : (
                  <span className="font-semibold text-rose-600 dark:text-rose-400">Khách chưa cung cấp số tài khoản</span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={pending ? "amber" : "green"}>{REFUND_STATE_LABEL[refundState(r.status)]}</StatusBadge>
                {!pending && r.transactionCode && (
                  <p className="text-muted mt-1 font-mono whitespace-nowrap">Mã GD: {r.transactionCode}</p>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {pending ? (
                  <Button
                    size="sm"
                    className="bg-blue-600 whitespace-nowrap text-white hover:bg-blue-500"
                    aria-label={`Xác nhận đã hoàn tiền phiếu ${r.invoiceNumber}`}
                    onClick={() => setSelected(r)}
                  >
                    Xác nhận đã hoàn
                  </Button>
                ) : r.evidenceUrl ? (
                  <a
                    href={r.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold whitespace-nowrap text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Biên lai <ExternalLinkIcon aria-hidden="true" className="size-3" />
                  </a>
                ) : null}
              </td>
            </tr>
          )
        })}
      </TableCard>

      {!isLoading && <Pagination {...pagination} unit="phiếu hoàn" />}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Hoàn tiền phiếu {selected.invoiceNumber}</DialogTitle>
                <DialogDescription>
                  {selected.customerName ?? "Khách hàng"} · {refundReasonLabel(selected)} · {formatVnd(selected.refundAmount)}.
                  Chuyển khoản cho khách qua Internet Banking, sau đó đính kèm biên lai để xác nhận.
                </DialogDescription>
              </DialogHeader>
              <RefundConfirmForm
                paymentId={selected.paymentId}
                refundAmount={selected.refundAmount}
                bankAccount={bankAccountLabel(selected)}
                submit={confirmRefund}
                onConfirmed={handleConfirmed}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default RefundsPanel
