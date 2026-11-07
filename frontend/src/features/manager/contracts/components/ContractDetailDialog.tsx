import type { ReactNode } from "react"
import { CheckCircle2Icon, FileSignatureIcon, FileTextIcon, GavelIcon, HourglassIcon, ShieldAlertIcon } from "lucide-react"

import { StatusBadge } from "@/components/internal/components/PanelKit"
import ImageGallery from "@/components/internal/images/ImageGallery"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { formatDate, formatDateTime, formatVnd } from "@/lib/format"

import { FEE_TYPE_LABEL, FORFEIT_AFTER_DAYS, feeTotals, forfeitState, isClosedContract } from "../contractRules"
import type { FacilityContract, FeeStatus } from "../types"
import { CheckoutProgressBadge, ContractStatusBadge, DaysLeft } from "./ContractBadges"

const FEE_STATUS: Record<FeeStatus, { label: string; tone: "red" | "green" | "slate" }> = {
  UNPAID: { label: "Chưa thu", tone: "red" },
  PAID: { label: "Đã thu", tone: "green" },
  CANCELLED: { label: "Đã hủy", tone: "slate" },
}

const RENTAL_TYPE_LABEL = { DAILY: "Thuê theo ngày", MONTHLY: "Thuê theo tháng" } as const

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="inner-box rounded-xl border px-3 py-2.5">
      <dt className="text-muted text-[11px] font-medium">{label}</dt>
      <dd className="text-title mt-0.5 text-sm font-bold">{children}</dd>
    </div>
  )
}

/**
 * Manager xem chi tiết một hợp đồng (bấm mã hợp đồng ở trang Quản lí hợp đồng):
 * khách, ô kho, thời hạn, tiền cọc, tiến độ trả kho, các khoản phạt / truy thu và tình trạng thanh lý.
 * Chỉ xem; thao tác thanh lý mở ngăn riêng qua `onForfeit`.
 */
function ContractDetailDialog({
  contract,
  today,
  onClose,
  onForfeit,
  onViewDocument,
  onTerminateViolation,
}: {
  contract: FacilityContract
  today: string
  onClose: () => void
  onForfeit: (contract: FacilityContract) => void
  /** Mở văn bản hợp đồng pháp lý (bản dùng chung với khách, tải PDF được) */
  onViewDocument?: (contract: FacilityContract) => void
  onTerminateViolation?: (contract: FacilityContract) => void
}) {
  const totals = feeTotals(contract)
  const forfeit = forfeitState(contract, today)
  const fees = [...contract.fees].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
  const inspectionImages = contract.inspectionImages ?? []
  const forfeitImages = contract.forfeitEvidenceImages ?? []
  // Ảnh nghiệm thu chỉ có ý nghĩa khi khách đã trả kho; hợp đồng đang thuê thì không hiện mục này
  const showInspection = inspectionImages.length > 0 || contract.status === "TERMINATED" || contract.status === "COMPLETED"

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="portal-dialog max-h-[92vh] gap-5 overflow-y-auto rounded-3xl p-6 sm:max-w-2xl">
        {/* Đầu: mã hợp đồng, trạng thái, khách */}
        <div className="flex items-start gap-3.5 border-b pb-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <FileTextIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-1">
            <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-black tracking-tight">
              <span className="font-mono">{contract.contractCode}</span>
              <ContractStatusBadge status={contract.status} forfeitProcessed={contract.forfeitProcessed} />
            </DialogTitle>
            <DialogDescription className="text-xs">
              <span className="text-title font-bold">{contract.customerName}</span>
              <span className="text-muted"> · {contract.customerPhone}</span>
              {contract.reservationCode && <span className="text-muted font-mono"> · Mã đặt chỗ {contract.reservationCode}</span>}
            </DialogDescription>
            {onViewDocument && (
              <Button variant="outline" size="sm" className="mt-1.5" onClick={() => onViewDocument(contract)}>
                <FileSignatureIcon aria-hidden="true" /> Xem văn bản hợp đồng / Tải PDF
              </Button>
            )}
          </div>
        </div>

        {/* Thời hạn và ô kho */}
        <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Field label="Ô kho">
            <span className="font-mono">{contract.unitCode}</span>
          </Field>
          <Field label="Ngày nhận kho">{formatDate(contract.startDate)}</Field>
          <Field label="Hạn trả kho">{formatDate(contract.endDate)}</Field>
          <Field label="Thời hạn còn lại">
            {/* Hợp đồng đã đóng: ghi rõ thay vì dấu "—" mờ (trông như ô trống) */}
            {isClosedContract(contract.status) ? (
              <span className="text-muted">Đã kết thúc</span>
            ) : (
              <DaysLeft contract={contract} today={today} />
            )}
          </Field>
        </dl>

        {/* Tiền */}
        <section aria-labelledby="contract-money" className="space-y-2">
          <h3 id="contract-money" className="text-title text-sm font-black">
            Tiền thuê & tiền cọc
          </h3>
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Field label="Tiền cọc">{formatVnd(contract.depositAmount)}</Field>
            {contract.rentalAmount != null && <Field label="Tiền thuê">{formatVnd(contract.rentalAmount)}</Field>}
            {contract.rentalType && <Field label="Gói thuê">{RENTAL_TYPE_LABEL[contract.rentalType]}</Field>}
          </dl>
          <p className="text-muted text-[11px]">
            Tiền cọc hoàn lại khi trả kho sau khi trừ phạt và phí đền bù (nếu có). Trả kho trước hạn không hoàn tiền thuê.
          </p>
        </section>

                        {/* Xử lý vi phạm hàng cấm / an ninh nghiêm trọng */}
        {(contract.status === "ACTIVE" || contract.status === "OVERDUE") && onTerminateViolation && (
          <section aria-labelledby="contract-violation" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
            <div className="flex items-start gap-2.5">
              <ShieldAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <div>
                <h3 id="contract-violation" className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Xử lý vi phạm hàng cấm / an ninh
                </h3>
                <p className="text-muted text-xs">
                  Đơn phương chấm dứt hợp đồng, tịch thu 100% tiền cọc, thu hồi ô kho và vô hiệu hóa mã PIN khi phát hiện vi phạm.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-rose-300 bg-white text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 font-bold gap-1.5 cursor-pointer"
              onClick={() => onTerminateViolation(contract)}
            >
              <ShieldAlertIcon className="size-3.5" /> Chấm dứt do vi phạm
            </Button>
          </section>
        )}
      </DialogContent>

    </Dialog>
  )
}

export default ContractDetailDialog
