import type { ReactNode } from "react"
import { CheckCircle2Icon, FileTextIcon, GavelIcon, HourglassIcon } from "lucide-react"

import { StatusBadge } from "@/components/internal/components/PanelKit"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { formatDate, formatDateTime, formatVnd } from "@/lib/format"

import { FEE_TYPE_LABEL, FORFEIT_AFTER_DAYS, feeTotals, forfeitState } from "../contractRules"
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
}: {
  contract: FacilityContract
  today: string
  onClose: () => void
  onForfeit: (contract: FacilityContract) => void
}) {
  const totals = feeTotals(contract)
  const forfeit = forfeitState(contract, today)
  const fees = [...contract.fees].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] gap-5 overflow-y-auto rounded-3xl p-6 sm:max-w-2xl">
        {/* Đầu: mã hợp đồng, trạng thái, khách */}
        <div className="flex items-start gap-3.5 border-b pb-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <FileTextIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-1">
            <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-black tracking-tight">
              <span className="font-mono">{contract.contractCode}</span>
              <ContractStatusBadge status={contract.status} />
            </DialogTitle>
            <DialogDescription className="text-xs">
              <span className="text-title font-bold">{contract.customerName}</span>
              <span className="text-muted"> · {contract.customerPhone}</span>
              {contract.reservationCode && <span className="text-muted font-mono"> · Mã đặt chỗ {contract.reservationCode}</span>}
            </DialogDescription>
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
            <DaysLeft contract={contract} today={today} />
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

        {/* Trả kho */}
        <section aria-labelledby="contract-checkout" className="flex flex-wrap items-center gap-2 text-xs">
          <h3 id="contract-checkout" className="text-title text-sm font-black">
            Trả kho:
          </h3>
          <CheckoutProgressBadge status={contract.status} />
        </section>

        {/* Phạt / truy thu */}
        <section aria-labelledby="contract-fees" className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 id="contract-fees" className="text-title text-sm font-black">
              Phạt & truy thu
            </h3>
            {fees.length > 0 && (
              <p className="text-xs">
                <span className="font-bold text-rose-600 dark:text-rose-400">Chưa thu {formatVnd(totals.unpaid)}</span>
                <span className="text-muted"> · Đã thu {formatVnd(totals.paid)}</span>
              </p>
            )}
          </div>
          {fees.length === 0 ? (
            <p className="text-muted inner-box rounded-xl border px-3 py-2.5 text-xs">Hợp đồng chưa phát sinh khoản phạt hay truy thu nào.</p>
          ) : (
            <div className="relative overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[480px] text-left text-xs">
                <caption className="sr-only">Các khoản phạt và truy thu của hợp đồng {contract.contractCode}</caption>
                <thead className="text-muted border-b text-[11px] uppercase">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-bold">Khoản</th>
                    <th scope="col" className="px-3 py-2 font-bold">Hóa đơn</th>
                    <th scope="col" className="px-3 py-2 font-bold">Ngày lập</th>
                    <th scope="col" className="px-3 py-2 text-right font-bold">Số tiền</th>
                    <th scope="col" className="px-3 py-2 font-bold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f) => (
                    <tr key={f.paymentId} className="border-b last:border-0">
                      <td className="text-title px-3 py-2 font-semibold">{FEE_TYPE_LABEL[f.type] ?? f.type}</td>
                      <td className="text-muted px-3 py-2 font-mono">{f.invoiceNumber}</td>
                      <td className="text-muted px-3 py-2 whitespace-nowrap">{formatDateTime(f.issuedAt)}</td>
                      <td className="text-title px-3 py-2 text-right font-bold tabular-nums">{formatVnd(f.amount)}</td>
                      <td className="px-3 py-2">
                        <StatusBadge tone={FEE_STATUS[f.status]?.tone ?? "slate"}>{FEE_STATUS[f.status]?.label ?? f.status}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Thanh lý tài sản (chỉ hiện khi liên quan) */}
        {forfeit !== "NONE" && (
          <section
            aria-labelledby="contract-forfeit"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs dark:border-rose-900/60 dark:bg-rose-950/30"
          >
            <div className="flex items-start gap-2">
              {forfeit === "DONE" ? (
                <CheckCircle2Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              ) : forfeit === "WAITING" ? (
                <HourglassIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-600" />
              ) : (
                <GavelIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-rose-600" />
              )}
              <div>
                <h3 id="contract-forfeit" className="text-title font-black">
                  Thanh lý tài sản
                </h3>
                <p className="text-muted">
                  {forfeit === "DONE"
                    ? "Đã xác nhận xử lý tài sản, ô kho chuyển sang bảo trì."
                    : forfeit === "WAITING"
                      ? `Quá hạn đủ ${FORFEIT_AFTER_DAYS} ngày. Hệ thống sẽ chuyển sang "Tịch thu" lúc 00:00, sau đó mới xác nhận thanh lý được.`
                      : "Hợp đồng đã bị tịch thu. Cắt khóa, niêm phong, xử lý tài sản xong thì xác nhận kèm ảnh minh chứng."}
                </p>
              </div>
            </div>
            {forfeit === "READY" && (
              <Button size="sm" className="bg-rose-600 text-white hover:bg-rose-500" onClick={() => onForfeit(contract)}>
                <GavelIcon aria-hidden="true" /> Thanh lý tài sản
              </Button>
            )}
          </section>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ContractDetailDialog
