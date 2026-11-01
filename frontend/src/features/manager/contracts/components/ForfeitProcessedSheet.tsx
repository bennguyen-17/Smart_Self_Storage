import { useState } from "react"
import { AlertTriangleIcon, GavelIcon, LinkIcon } from "lucide-react"

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
import { EVIDENCE_URL_MAX, isValidEvidenceLink } from "@/features/manager/refunds/refundRules"
import { formatDate, formatVnd } from "@/lib/format"

import { markForfeitProcessed } from "../api/contractApi"
import type { FacilityContract } from "../types"

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
  const [imageUrl, setImageUrl] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Bắt buộc link ảnh thật (http/https): ghi chú thanh lý là minh chứng, không nhận chữ tùy ý
  const linkOk = isValidEvidenceLink(imageUrl)
  // Gõ link sai thì báo ngay (nút xác nhận đang khóa nên không đợi bấm mới báo)
  const imageError = imageUrl.trim()
    ? linkOk
      ? null
      : `Link ảnh phải bắt đầu bằng http:// hoặc https:// và tối đa ${EVIDENCE_URL_MAX} ký tự`
    : showErrors
      ? "Vui lòng dán đường link ảnh hiện trường tài sản hoặc biên bản thanh lý"
      : null
  const isFormValid = linkOk

  async function submit() {
    setShowErrors(true)
    if (!linkOk) return
    setSubmitting(true)
    setServerError(null)
    try {
      const fullNote = `Đã cắt khóa niêm phong và thanh lý tài sản. Ảnh bằng chứng: ${imageUrl.trim()}`
      await markForfeitProcessed(ctx, contract.contractId, fullNote)
      onDone(`Đã xác nhận thanh lý tài sản hợp đồng ${contract.contractCode}`)
    } catch (err) {
      setServerError(readableError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:max-w-xl shadow-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 gap-5">
        {/* Header */}
        <div className="flex items-start gap-3.5 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <GavelIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Xác nhận thanh lý tài sản
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
              Xác nhận thanh lý tài sản hợp đồng quá hạn {contract.contractCode}
            </DialogDescription>
          </div>
        </div>

        {/* Thông tin cọc & Hạn */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Hết hạn hợp đồng từ</p>
            <p className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100">
              {formatDate(contract.endDate)}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-3.5 dark:border-rose-950/40 dark:bg-rose-950/20">
            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Tiền cọc bị tịch thu</p>
            <p className="mt-1 font-mono text-base font-black text-rose-600 dark:text-rose-400">
              {formatVnd(contract.depositAmount)}
            </p>
          </div>
        </div>

        {/* Thông báo nghiệp vụ */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3.5 text-xs text-amber-900 leading-relaxed dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-200">Lưu ý nghiệp vụ giải phóng kho</p>
            <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/90">
              Hợp đồng đã quá hạn trên 30 ngày và khách hàng không đến nhận lại đồ. Cơ sở tiến hành cắt khóa niêm phong và thanh lý tài sản. Sau khi xác nhận, ô kho sẽ chuyển sang <b>bảo trì / vệ sinh</b> để chuẩn bị cho lượt thuê mới. Thao tác này không thể hoàn tác.
            </p>
          </div>
        </div>

        {/* Input link ảnh */}
        <div className="space-y-1.5">
          <label htmlFor="forfeit-image" className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <LinkIcon className="size-3.5 text-slate-500" />
            <span>Đường link ảnh tài sản / biên bản thanh lý</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            id="forfeit-image"
            type="url"
            value={imageUrl}
            disabled={submitting}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... Dán link ảnh hiện trường cắt khóa hoặc biên bản thanh lý"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 shadow-2xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
          {imageError && (
            <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">{imageError}</p>
          )}

          {imageUrl.trim().startsWith("http") && (
            <div className="mt-2 relative h-36 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 flex items-center justify-center">
              <img
                src={imageUrl.trim()}
                alt="Ảnh tài sản thanh lý"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none"
                }}
              />
            </div>
          )}
        </div>

        {serverError && (
          <p role="alert" className="[overflow-wrap:anywhere] rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            {serverError}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            disabled={submitting || !isFormValid}
            onClick={submit}
            className="h-10 rounded-xl bg-rose-600 px-5 text-xs font-bold text-white shadow-md transition hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600"
          >
            {submitting && <Spinner className="size-4 mr-1.5" />}
            Xác nhận thanh lý tài sản
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ForfeitProcessedSheet
