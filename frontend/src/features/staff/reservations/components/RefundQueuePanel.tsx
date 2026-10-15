import { useState } from "react"
import { BanknoteIcon, InboxIcon, RotateCwIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatDateTime, formatVnd } from "@/lib/format"

import { listPendingRefunds } from "../api/refundApi"
import { formatBankAccount } from "../refundRules"
import type { RefundItem } from "../types"
import RefundConfirmForm from "./RefundConfirmForm"

const CANCEL_REASON_LABEL: Record<string, string> = {
  CUSTOMER_REQUEST: "Khách tự hủy",
  NO_SHOW: "Không đến nhận kho",
}

interface RefundQueuePanelProps {
  /** Đổi giá trị này để tải lại hàng đợi (ví dụ sau khi xác nhận trong chi tiết đơn) */
  reloadKey: number
  /** Báo trang cha đã có phiếu được xác nhận, để làm mới danh sách đơn */
  onRefunded: () => void
}

/**
 * US-26: hàng đợi các phiếu hoàn cọc đang chờ chuyển khoản (GET /staff/refunds?status=PENDING).
 * Nhân viên chọn một phiếu, chuyển khoản ngoài, đính kèm biên lai và xác nhận theo paymentId.
 */
function RefundQueuePanel({ reloadKey, onRefunded }: RefundQueuePanelProps) {
  const [localReload, setLocalReload] = useState(0)
  const [selected, setSelected] = useState<RefundItem | null>(null)
  const { data, error, isLoading } = useAsyncData(`refunds#${reloadKey}#${localReload}`, listPendingRefunds)
  const items = data ?? []

  function handleConfirmed() {
    toast.success(`Đã xác nhận hoàn cọc cho đơn ${selected?.reservationCode ?? ""}`)
    setSelected(null)
    setLocalReload((n) => n + 1)
    onRefunded()
  }

  return (
    <section aria-labelledby="refund-queue-title" className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="refund-queue-title" className="flex items-center gap-2 text-base font-bold">
          <BanknoteIcon aria-hidden="true" className="size-5 text-amber-600 dark:text-amber-400" />
          Hoàn cọc chờ xử lý
          {!isLoading && !error && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              {items.length}
            </span>
          )}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setLocalReload((n) => n + 1)} disabled={isLoading}>
          <RotateCwIcon aria-hidden="true" /> Tải lại
        </Button>
      </div>

      {isLoading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Đang tải phiếu hoàn cọc…
        </p>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Không tải được danh sách hoàn cọc</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && items.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <InboxIcon aria-hidden="true" className="size-4" /> Không có phiếu hoàn cọc nào đang chờ.
        </p>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="relative overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Mã đặt chỗ</th>
                <th scope="col" className="px-3 py-2 font-semibold">Khách hàng</th>
                <th scope="col" className="px-3 py-2 font-semibold">Ô kho</th>
                <th scope="col" className="px-3 py-2 font-semibold">Lý do</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Số tiền hoàn</th>
                <th scope="col" className="px-3 py-2 font-semibold">Lập phiếu lúc</th>
                <th scope="col" className="px-3 py-2"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.paymentId} className="border-t">
                  <td className="px-3 py-2 font-mono font-semibold whitespace-nowrap">{item.reservationCode}</td>
                  <td className="px-3 py-2">{item.customerName}</td>
                  <td className="px-3 py-2 font-mono whitespace-nowrap">{item.unitCode}</td>
                  <td className="px-3 py-2">
                    {item.cancelReason ? (CANCEL_REASON_LABEL[item.cancelReason] ?? item.cancelReason) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold whitespace-nowrap text-amber-700 dark:text-amber-300">
                    {formatVnd(item.refundAmount)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(item.issuedAt)}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      onClick={() => setSelected(item)}
                      aria-label={`Xử lý hoàn cọc đơn ${item.reservationCode}`}
                    >
                      Xử lý
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Hoàn cọc đơn {selected.reservationCode}</DialogTitle>
                <DialogDescription>
                  {selected.customerName}
                  {selected.customerPhone ? ` · ${selected.customerPhone}` : ""} · Ô {selected.unitCode} · Phiếu{" "}
                  {selected.invoiceNumber}
                </DialogDescription>
              </DialogHeader>
              <RefundConfirmForm
                paymentId={selected.paymentId}
                refundAmount={selected.refundAmount}
                bankAccount={formatBankAccount(
                  selected.refundAccountNumber,
                  selected.refundBankName,
                  selected.refundAccountName
                )}
                onConfirmed={handleConfirmed}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default RefundQueuePanel
