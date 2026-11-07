import { useState } from "react"
import { AlertTriangleIcon, ShieldAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import type { ManagerContext } from "@/features/manager/units/types"
import { readableError } from "@/components/internal/readableError"
import ImagePicker, { type PickedImage } from "@/components/internal/images/ImagePicker"
import { IMAGE_MAX_PER_ACTION } from "@/components/internal/images/imageApi"
import { formatVnd } from "@/lib/format"

import { terminateViolationContract } from "../api/contractApi"
import type { FacilityContract } from "../types"

export const DEFAULT_VIOLATION_REASON = "Lưu trữ hàng cấm / vi phạm quy chế an toàn theo điều khoản hợp đồng."

export function ViolationTerminationModal({
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
  const [images, setImages] = useState<PickedImage[]>([])
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const isFormValid = reason.trim().length > 0

  async function submit() {
    if (!isFormValid) return
    setSubmitting(true)
    setServerError(null)
    try {
      await terminateViolationContract(
        ctx,
        contract.contractId,
        reason.trim(),
        images.map((i) => i.imageId)
      )
      onDone(`Đã chấm dứt hợp đồng ${contract.contractCode} do vi phạm.`)
    } catch (err) {
      setServerError(readableError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="portal-dialog max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:max-w-xl shadow-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 gap-5">
        {/* Header */}
        <div className="flex items-start gap-3.5 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <ShieldAlertIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Chấm dứt hợp đồng do vi phạm
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100">{contract.customerName}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="font-mono font-semibold text-slate-600 dark:text-slate-400">{contract.contractCode}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Ô {contract.unitCode}
              </span>
            </div>
            <DialogDescription className="sr-only">
              Đơn phương chấm dứt hợp đồng do vi phạm hàng cấm hoặc an ninh {contract.contractCode}
            </DialogDescription>
          </div>
        </div>

        {/* Lưu ý quan trọng */}
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4 dark:border-rose-950/40 dark:bg-rose-950/20 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-200 mb-1">
            <AlertTriangleIcon className="size-4 shrink-0" />
            Lưu ý
          </div>
          <p className="leading-relaxed">
            Khi xác nhận vi phạm, hợp đồng sẽ bị chấm dứt ngay lập tức, toàn bộ tiền cọc <strong className="font-bold text-rose-600 dark:text-rose-400">{formatVnd(contract.depositAmount)}</strong> sẽ bị tịch thu và mã PIN mở kho của khách hàng sẽ bị vô hiệu hóa. Ô kho sẽ được thu hồi để tiếp tục phục vụ khách hàng khác.
          </p>
        </div>

        {/* Mô tả vi phạm */}
        <div className="space-y-1.5">
          <label htmlFor="violation-reason" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Mô tả vi phạm
          </label>
          <textarea
            id="violation-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập nội dung vi phạm thực tế (ví dụ: phát hiện hàng cấm, chất cháy nổ...)"
            className="w-full rounded-2xl border border-slate-200 p-3 text-xs focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Ảnh bằng chứng biên bản */}
        <ImagePicker
          label="Ảnh biên bản / hiện trường"
          category="FORFEIT_EVIDENCE"
          max={IMAGE_MAX_PER_ACTION}
          value={images}
          onChange={setImages}
          disabled={submitting}
        />

        {/* Thông báo lỗi nếu có */}
        {serverError && (
          <div className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {serverError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={submitting}
            onClick={onClose}
            className="rounded-xl cursor-pointer"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!isFormValid || submitting}
            onClick={submit}
            className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {submitting && <Spinner className="size-3.5" />}
            Xác nhận vi phạm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ViolationTerminationModal
