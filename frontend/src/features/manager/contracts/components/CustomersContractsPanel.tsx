import { useMemo, useState } from "react"

import {
  FilterBar,
  LoadError,
  Pagination,
  ResultCount,
  SearchFilter,
  SelectFilter,
  TableCard,
} from "@/components/internal/components/PanelKit"
import { usePagedRows } from "@/components/internal/usePagedRows"
import { getManagerContext } from "@/features/manager/managerContext"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatDate, todayInVietnam } from "@/lib/format"

import { listFacilityContracts } from "../api/contractApi"
import {
  CONTRACT_STATUS_LABEL,
  filterContracts,
  isExpiringSoon,
  RENEWAL_WINDOW_DAYS,
  type ContractFilter,
  type PaymentFilter,
} from "../contractRules"
import type { ContractStatus } from "../types"
import { ContractStatusBadge, DaysLeft, PaymentState } from "./ContractBadges"

const EMPTY_FILTER: ContractFilter = { query: "", status: "ALL", payment: "ALL", expiringSoon: false }

/** Manager › Khách & hợp đồng: theo dõi khách, hợp đồng, thời hạn thuê và công nợ của cơ sở (chỉ xem) */
function CustomersContractsPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const today = todayInVietnam()
  const [reloadCount, setReloadCount] = useState(0)
  const [filter, setFilter] = useState<ContractFilter>(EMPTY_FILTER)
  const { data, error, isLoading } = useAsyncData(`contracts#${reloadCount}`, () => listFacilityContracts(ctx))
  const all = data ?? []
  const rows = filterContracts(all, filter, today)
  const expiringCount = all.filter((c) => isExpiringSoon(c, today)).length
  const { slice, pagination } = usePagedRows(rows, JSON.stringify(filter))
  const update = (patch: Partial<ContractFilter>) => setFilter((f) => ({ ...f, ...patch }))

  if (error) {
    return <LoadError title="Không tải được danh sách hợp đồng" message={error} onRetry={() => setReloadCount((n) => n + 1)} />
  }

  return (
    <section aria-label="Khách hàng và hợp đồng của cơ sở" className="space-y-4">
      <FilterBar>
        <SearchFilter value={filter.query} onChange={(query) => update({ query })} placeholder="Tên khách, số điện thoại, mã hợp đồng hoặc mã ô" />
        <SelectFilter
          label="Trạng thái hợp đồng"
          value={filter.status}
          onChange={(v) => update({ status: v as ContractStatus | "ALL" })}
          options={[
            { value: "ALL", label: "Tất cả" },
            ...(Object.keys(CONTRACT_STATUS_LABEL) as ContractStatus[]).map((s) => ({ value: s, label: CONTRACT_STATUS_LABEL[s] })),
          ]}
        />
        <SelectFilter
          label="Thanh toán"
          value={filter.payment}
          onChange={(v) => update({ payment: v as PaymentFilter })}
          options={[
            { value: "ALL", label: "Tất cả" },
            { value: "DEBT", label: "Còn nợ" },
            { value: "CLEAR", label: "Đã thanh toán đủ" },
          ]}
        />
        <SelectFilter
          label="Thời hạn"
          value={filter.expiringSoon ? "SOON" : "ALL"}
          onChange={(v) => update({ expiringSoon: v === "SOON" })}
          options={[
            { value: "ALL", label: "Tất cả" },
            { value: "SOON", label: `Sắp hết hạn (≤ ${RENEWAL_WINDOW_DAYS} ngày)` },
          ]}
        />
      </FilterBar>

      {!isLoading && expiringCount > 0 && (
        <p role="status" className="card-box flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border px-4 py-3 text-xs">
          <span className="font-bold text-amber-700 dark:text-amber-300">
            {expiringCount} hợp đồng hết hạn trong {RENEWAL_WINDOW_DAYS} ngày tới
          </span>
          <span className="text-muted">Hệ thống đã gửi email nhắc gia hạn trước 7, 3 và 1 ngày; khách chưa gia hạn sẽ chuyển quá hạn.</span>
          {!filter.expiringSoon && (
            <button
              type="button"
              onClick={() => update({ expiringSoon: true })}
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Xem danh sách
            </button>
          )}
        </p>
      )}

      <ResultCount shown={rows.length} total={all.length} unit="hợp đồng" isLoading={isLoading} />

      <TableCard
        caption="Khách hàng và hợp đồng"
        columns={[
          { header: "Khách hàng" },
          { header: "Hợp đồng" },
          { header: "Ô kho" },
          { header: "Thời hạn" },
          { header: "Còn lại" },
          { header: "Trạng thái" },
          { header: "Thanh toán" },
        ]}
        minWidth={980}
        isLoading={isLoading}
        isEmpty={rows.length === 0}
        emptyText={
          all.length === 0
            ? "Cơ sở chưa có hợp đồng nào"
            : filter.expiringSoon
              ? `Không có hợp đồng nào hết hạn trong ${RENEWAL_WINDOW_DAYS} ngày tới`
              : "Không có hợp đồng phù hợp bộ lọc"
        }
      >
        {slice.rows.map((c) => (
          <tr key={c.contractId} className="border-b last:border-0">
            <td className="px-4 py-3">
              <p className="text-title font-bold">{c.customerName}</p>
              <p className="text-muted">{c.customerPhone}</p>
            </td>
            <td className="text-title px-4 py-3 font-mono font-semibold whitespace-nowrap">{c.contractCode}</td>
            <td className="text-title px-4 py-3 font-mono whitespace-nowrap">{c.unitCode}</td>
            <td className="text-title px-4 py-3 whitespace-nowrap">
              {formatDate(c.startDate)} → {formatDate(c.endDate)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <DaysLeft contract={c} today={today} />
            </td>
            <td className="px-4 py-3">
              <ContractStatusBadge status={c.status} />
            </td>
            <td className="px-4 py-3">
              <PaymentState contract={c} />
            </td>
          </tr>
        ))}
      </TableCard>

      {!isLoading && <Pagination {...pagination} unit="hợp đồng" />}
    </section>
  )
}

export default CustomersContractsPanel
