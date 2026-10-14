import { useMemo, useState } from "react"
import { BadgePercentIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  FilterBar,
  LoadError,
  ResultCount,
  SearchFilter,
  SelectFilter,
  TableCard,
} from "@/features/internal-shell/components/PanelKit"
import { matchesQuery } from "@/features/internal-shell/textSearch"
import { getManagerContext } from "@/features/unit-management/managerContext"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatVnd } from "@/lib/format"

import { listFacilityContracts } from "../api/contractApi"
import { FEE_TYPE_LABEL, needsFollowUp, unpaidTotal } from "../contractRules"
import type { FacilityContract, FeeInvoice } from "../types"
import { CheckoutStageBadge, ContractStatusBadge } from "./ContractBadges"
import FeeDiscountSheet from "./FeeDiscountSheet"

type Focus = "ALL" | "OVERDUE" | "CHECKOUT" | "DEBT"

function matchesFocus(c: FacilityContract, focus: Focus): boolean {
  if (focus === "OVERDUE") return c.status === "OVERDUE"
  if (focus === "CHECKOUT") return c.status !== "TERMINATED" && c.checkoutStage !== "NONE"
  if (focus === "DEBT") return unpaidTotal(c) > 0
  return true
}

/**
 * Manager › Trả kho & công nợ (US-24, 25, 26, 31): những hợp đồng cần theo dõi
 * (quá hạn, đang trả kho, còn phí chưa thu) và nút miễn / giảm từng khoản phí.
 */
function CheckoutDebtPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const [reloadCount, setReloadCount] = useState(0)
  const [query, setQuery] = useState("")
  const [focus, setFocus] = useState<Focus>("ALL")
  const [discounting, setDiscounting] = useState<{ contract: FacilityContract; fee: FeeInvoice } | null>(null)
  const { data, error, isLoading } = useAsyncData(`debt#${reloadCount}`, () => listFacilityContracts(ctx))

  const followUps = (data ?? []).filter(needsFollowUp)
  const rows = followUps
    .filter((c) => matchesFocus(c, focus))
    .filter((c) => matchesQuery(query, [c.customerName, c.customerPhone, c.contractCode, c.unitCode]))
    .sort((a, b) => unpaidTotal(b) - unpaidTotal(a))

  if (error) {
    return <LoadError title="Không tải được hồ sơ trả kho & công nợ" message={error} onRetry={() => setReloadCount((n) => n + 1)} />
  }

  return (
    <section aria-label="Hồ sơ trả kho và công nợ" className="space-y-4">
      <FilterBar>
        <SearchFilter value={query} onChange={setQuery} placeholder="Tên khách, số điện thoại, mã hợp đồng hoặc mã ô" />
        <SelectFilter
          label="Cần xử lý"
          value={focus}
          onChange={(v) => setFocus(v as Focus)}
          options={[
            { value: "ALL", label: "Tất cả" },
            { value: "OVERDUE", label: "Quá hạn" },
            { value: "CHECKOUT", label: "Đang trả kho" },
            { value: "DEBT", label: "Còn phí chưa thu" },
          ]}
        />
      </FilterBar>

      <ResultCount shown={rows.length} total={followUps.length} unit="hồ sơ cần theo dõi" isLoading={isLoading} />

      <TableCard
        caption="Hồ sơ trả kho và công nợ"
        columns={[
          { header: "Hợp đồng" },
          { header: "Ô kho" },
          { header: "Trạng thái" },
          { header: "Trả kho" },
          { header: "Phí chưa thu" },
        ]}
        minWidth={960}
        isLoading={isLoading}
        isEmpty={rows.length === 0}
        emptyText={followUps.length === 0 ? "Không có hồ sơ nào cần xử lý" : "Không có hồ sơ phù hợp bộ lọc"}
      >
        {rows.map((c) => {
          const unpaid = c.fees.filter((f) => f.status === "UNPAID")
          return (
            <tr key={c.contractId} className="border-b align-top last:border-0">
              <td className="px-4 py-3">
                <p className="text-title font-bold">{c.customerName}</p>
                <p className="text-muted font-mono">{c.contractCode}</p>
              </td>
              <td className="text-title px-4 py-3 font-mono whitespace-nowrap">{c.unitCode}</td>
              <td className="px-4 py-3">
                <ContractStatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3">
                <CheckoutStageBadge stage={c.checkoutStage} />
              </td>
              <td className="px-4 py-3">
                {unpaid.length === 0 ? (
                  <span className="text-muted">Không có</span>
                ) : (
                  <ul className="space-y-2">
                    {unpaid.map((f) => (
                      <li key={f.paymentId} className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          <span className="text-title font-semibold">{FEE_TYPE_LABEL[f.type]}</span>
                          <span className="ml-1.5 font-bold text-rose-600 tabular-nums dark:text-rose-400">{formatVnd(f.amount)}</span>
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Miễn / giảm ${FEE_TYPE_LABEL[f.type].toLowerCase()} ${f.invoiceNumber}`}
                          onClick={() => setDiscounting({ contract: c, fee: f })}
                        >
                          <BadgePercentIcon aria-hidden="true" /> Miễn / giảm
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          )
        })}
      </TableCard>

      {discounting && (
        <FeeDiscountSheet
          key={discounting.fee.paymentId}
          contract={discounting.contract}
          fee={discounting.fee}
          ctx={ctx}
          onClose={() => setDiscounting(null)}
          onDone={(message) => {
            toast.success(message)
            setDiscounting(null)
            setReloadCount((n) => n + 1)
          }}
        />
      )}
    </section>
  )
}

export default CheckoutDebtPanel
