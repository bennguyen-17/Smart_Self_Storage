import { useState } from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { ManagerContext } from "@/features/manager/unit-management/types"
import { getErrorMessage } from "@/lib/api"
import { formatDate, formatVnd } from "@/lib/format"

import { markForfeitProcessed } from "../api/contractApi"
import { FORFEIT_NOTE_MIN, forfeitNoteError } from "../contractRules"
import type { FacilityContract } from "../types"

/**
 * US-27: hợp đồng quá hạn đủ 30 ngày đã bị tịch thu (FORFEITED). Sau khi cắt khóa, niêm phong và xử lý tài sản,
 * Manager xác nhận kèm ghi chú → BE chuyển ô kho sang bảo trì và ghi nhật ký.
 */
function ForfeitProcessedSheet({
  contract,
  ctx,
  onClose,
  onDone,
}: {
  contract: FacilityContract
  ctx: ManagerContext
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [note, setNote] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const error = forfeitNoteError(note)
  const visibleError = showErrors ? error : null

  async function submit() {
    setShowErrors(true)
    if (error) return
    setSubmitting(true)
    setServerError(null)
    try {
      await markForfeitProcessed(ctx, contract.contractId, note)
      onDone(`Đã xác nhận xử lý tài sản hợp đồng ${contract.contractCode}`)
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
          <DialogTitle className="text-base font-black">Xác nhận đã xử lý tài sản</DialogTitle>
          <DialogDescription>
            {contract.customerName} · {contract.contractCode} · Ô {contract.unitCode}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Hết hạn từ</dt>
              <dd className="font-semibold">{formatDate(contract.endDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tiền cọc tịch thu</dt>
              <dd className="font-semibold">{formatVnd(contract.depositAmount)}</dd>
            </div>
          </dl>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            Chỉ xác nhận sau khi đã <b>cắt khóa, niêm phong và xử lý xong tài sản</b> trong ô. Sau khi xác nhận, ô kho chuyển sang{" "}
            <b>bảo trì / vệ sinh</b> để nhân viên dọn trước khi cho thuê lại. Thao tác không hoàn tác được.
          </div>

          <div className="space-y-1.5">
            <label htmlFor="forfeit-note" className="text-xs font-bold">
              Ghi chú xử lý tài sản <span className="text-rose-500">*</span>
            </label>
            <Textarea
              id="forfeit-note"
              rows={4}
              value={note}
              disabled={submitting}
              onChange={(e) => setNote(e.target.value)}
              aria-invalid={Boolean(visibleError)}
              aria-describedby="forfeit-note-hint"
              placeholder="VD: Đã cắt khóa lúc 09:00 có camera và 2 nhân viên chứng kiến; tài sản gồm 5 thùng đồ gia dụng, đã thanh lý."
              className="placeholder:text-slate-400"
            />
            <p id="forfeit-note-hint" className={cn("text-[11px]", visibleError ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
              {visibleError ?? `Ít nhất ${FORFEIT_NOTE_MIN} ký tự. Ghi chú được lưu vào nhật ký để đối soát.`}
            </p>
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
          <Button disabled={submitting} onClick={submit} className="bg-rose-600 text-white hover:bg-rose-500">
            {submitting && <Spinner />}
            Xác nhận đã xử lý tài sản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ForfeitProcessedSheet
