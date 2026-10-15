import { useState } from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { ManagerContext } from "@/features/manager/unit-management/types"
import { getErrorMessage } from "@/lib/api"
import { formatVnd } from "@/lib/format"

import { applyFeeDiscount } from "../api/contractApi"
import {
  DISCOUNT_REASON_MIN,
  discountValue,
  FEE_TYPE_LABEL,
  toDiscountRequest,
  validateDiscount,
  type DiscountDraft,
  type DiscountMode,
} from "../contractRules"
import type { FacilityContract, FeeInvoice } from "../types"

const MODES: { mode: DiscountMode; title: string; detail: string }[] = [
  { mode: "PERCENT", title: "Giảm theo %", detail: "Nhập phần trăm từ 1 đến 100." },
  { mode: "AMOUNT", title: "Giảm số tiền", detail: "Nhập số tiền không vượt quá khoản phí." },
  { mode: "WAIVE", title: "Miễn toàn bộ", detail: "Khoản phí chuyển sang đã hủy (CANCELED)." },
]

/**
 * US-31: Manager miễn / giảm một khoản phí phạt trễ hạn hoặc truy thu đền bù.
 * Bắt buộc lý do; mức giảm không vượt khoản phí. BE ghi nhật ký và gửi email cho khách.
 */
function FeeDiscountSheet({
  contract,
  fee,
  ctx,
  onClose,
  onDone,
}: {
  contract: FacilityContract
  fee: FeeInvoice
  ctx: ManagerContext
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [draft, setDraft] = useState<DiscountDraft>({ mode: "PERCENT", value: "", reason: "" })
  const [showErrors, setShowErrors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const errors = validateDiscount(draft, fee.amount)
  const visible = showErrors ? errors : {}
  const off = discountValue(draft, fee.amount)
  const set = (patch: Partial<DiscountDraft>) => setDraft((d) => ({ ...d, ...patch }))

  async function submit() {
    setShowErrors(true)
    if (Object.keys(errors).length > 0) return
    setSubmitting(true)
    setServerError(null)
    try {
      await applyFeeDiscount(ctx, fee.paymentId, toDiscountRequest(draft, fee.amount))
      onDone(draft.mode === "WAIVE" ? `Đã miễn khoản phí ${fee.invoiceNumber}` : `Đã giảm khoản phí ${fee.invoiceNumber}`)
    } catch (err) {
      setServerError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="top-0 right-0 left-auto flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-md data-open:slide-in-from-right-10 data-open:zoom-in-100 data-closed:slide-out-to-right-10 data-closed:zoom-out-100">
        <DialogHeader className="border-b p-4 pr-12">
          <DialogTitle className="text-base font-black">Miễn / giảm phí</DialogTitle>
          <DialogDescription>
            {contract.customerName} · {contract.contractCode} · Ô {contract.unitCode}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Khoản phí</dt>
              <dd className="font-semibold">
                {FEE_TYPE_LABEL[fee.type]} · <span className="font-mono">{fee.invoiceNumber}</span>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Số tiền</dt>
              <dd className="font-semibold">{formatVnd(fee.amount)}</dd>
            </div>
          </dl>

          <fieldset className="space-y-2" disabled={submitting}>
            <legend className="mb-2 text-sm font-bold">Hình thức</legend>
            {MODES.map((m) => (
              <label
                key={m.mode}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                  draft.mode === m.mode ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "hover:bg-muted/60"
                )}
              >
                <input
                  type="radio"
                  name="discount-mode"
                  checked={draft.mode === m.mode}
                  onChange={() => set({ mode: m.mode, value: "" })}
                  className="mt-0.5 size-4 accent-blue-600"
                />
                <span>
                  <span className="block text-sm font-semibold">{m.title}</span>
                  <span className="block text-xs text-muted-foreground">{m.detail}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {draft.mode !== "WAIVE" && (
            <div className="space-y-1.5">
              <label htmlFor="discount-value" className="text-xs font-bold">
                {draft.mode === "PERCENT" ? "Phần trăm giảm (%)" : "Số tiền giảm (VND)"} <span className="text-rose-500">*</span>
              </label>
              <input
                id="discount-value"
                inputMode="numeric"
                value={draft.value}
                disabled={submitting}
                onChange={(e) => set({ value: e.target.value })}
                aria-invalid={Boolean(visible.value)}
                aria-describedby="discount-value-hint"
                placeholder={draft.mode === "PERCENT" ? "VD: 50" : "VD: 200000"}
                className="w-full rounded-lg border bg-background px-2.5 py-2 text-sm font-semibold outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 aria-invalid:border-rose-500"
              />
              <p id="discount-value-hint" className={cn("text-[11px]", visible.value ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
                {visible.value ?? "Mức giảm tối đa theo chính sách sẽ áp khi BE có cấu hình."}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="discount-reason" className="text-xs font-bold">
              Lý do <span className="text-rose-500">*</span>
            </label>
            <Textarea
              id="discount-reason"
              rows={3}
              value={draft.reason}
              disabled={submitting}
              onChange={(e) => set({ reason: e.target.value })}
              aria-invalid={Boolean(visible.reason)}
              aria-describedby="discount-reason-hint"
              placeholder="VD: Khách bị trễ do sự cố cổng của cơ sở, đã xác minh camera"
              className="placeholder:text-slate-400"
            />
            <p id="discount-reason-hint" className={cn("text-[11px]", visible.reason ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
              {visible.reason ?? `Ít nhất ${DISCOUNT_REASON_MIN} ký tự. Lý do được ghi vào nhật ký và gửi email cho khách.`}
            </p>
          </div>

          <div className="rounded-xl border bg-muted/40 p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Được giảm</span>
              <span className="font-semibold">{off !== null ? formatVnd(off) : "—"}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="font-bold">Còn phải thu</span>
              <span className="font-black">{off !== null ? formatVnd(fee.amount - off) : formatVnd(fee.amount)}</span>
            </div>
          </div>

          {serverError && (
            <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {serverError}
            </p>
          )}
        </div>

        <DialogFooter className="m-0 flex-row justify-end gap-2 rounded-none border-t p-4">
          <Button variant="outline" disabled={submitting} onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={submitting} onClick={submit} className="bg-blue-600 text-white hover:bg-blue-500">
            {submitting && <Spinner />}
            {draft.mode === "WAIVE" ? "Xác nhận miễn phí" : "Xác nhận giảm phí"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FeeDiscountSheet
