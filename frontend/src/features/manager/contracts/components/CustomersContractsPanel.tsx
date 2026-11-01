import { useMemo, useState } from "react"
import { CheckCircle2Icon, GavelIcon, HourglassIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
  forfeitState,
  isExpiringSoon,
  RENEWAL_WINDOW_DAYS,
  type ContractFilter,
} from "../contractRules"
import type { ContractStatus, FacilityContract } from "../types"
import { ContractStatusBadge, DaysLeft } from "./ContractBadges"
import ContractDetailDialog from "./ContractDetailDialog"
import ForfeitProcessedSheet from "./ForfeitProcessedSheet"

const EMPTY_FILTER: ContractFilter = { query: "", status: "ALL", payment: "ALL", expiringSoon: false }

/**
 * Manager › Quản lí hợp đồng: theo dõi khách, hợp đồng, thời hạn thuê và thanh lý tài sản quá hạn.
 * Bấm mã hợp đồng để xem chi tiết (tiền cọc, tiến độ trả kho, phạt / truy thu).
 */
function CustomersContractsPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const today = todayInVietnam()
  const [reloadCount, setReloadCount] = useState(0)
  const [filter, setFilter] = useState<ContractFilter>(EMPTY_FILTER)
  const [forfeiting, setForfeiting] = useState<FacilityContract | null>(null)
  const [viewing, setViewing] = useState<FacilityContract | null>(null)
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
          { header: "Khách hàng", align: "center" },
          { header: "Hợp đồng", align: "center" },
          { header: "Ô kho", align: "center" },
          { header: "Thời hạn", align: "center" },
          { header: "Tình trạng", align: "center" },
          { header: "Trạng thái", align: "center" },
          { header: "Thao tác", align: "center" },
        ]}
        minWidth={960}
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
        {slice.rows.map((c) => {
          // BE chỉ nhận xác nhận thanh lý khi hợp đồng đã FORFEITED; quá hạn đủ 30 ngày mà chưa chuyển thì chờ hệ thống
          const forfeit = forfeitState(c, today)

          return (
            <tr key={c.contractId} className="border-b last:border-0">
              <td className="px-4 py-3 text-center">
                <p className="text-title font-bold">{c.customerName}</p>
                <p className="text-muted">{c.customerPhone}</p>
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setViewing(c)}
                  aria-label={`Xem chi tiết hợp đồng ${c.contractCode}`}
                  className="cursor-pointer font-mono font-semibold text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                >
                  {c.contractCode}
                </button>
              </td>
              <td className="text-title px-4 py-3 font-mono whitespace-nowrap text-center">{c.unitCode}</td>
              <td className="text-title px-4 py-3 whitespace-nowrap text-center">
                {formatDate(c.startDate)} → {formatDate(c.endDate)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                <DaysLeft contract={c} today={today} />
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex justify-center">
                  <ContractStatusBadge status={c.status} />
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                <div className="flex justify-center">
                  {forfeit === "READY" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-xl border-rose-300 bg-rose-50 px-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 cursor-pointer"
                      onClick={() => setForfeiting(c)}
                    >
                      <GavelIcon className="size-3.5" />
                      Thanh lý tài sản
                    </Button>
                  ) : forfeit === "DONE" ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2Icon className="size-4 shrink-0" />
                      Đã thanh lý
                    </span>
                  ) : forfeit === "WAITING" ? (
                    <span
                      className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
                      title="Hệ thống chuyển sang Tịch thu lúc 00:00, sau đó mới xác nhận thanh lý được"
                    >
                      <HourglassIcon className="size-4 shrink-0" />
                      Chờ chuyển tịch thu
                    </span>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </div>
              </td>
            </tr>
          )
        })}
      </TableCard>

      {!isLoading && <Pagination {...pagination} unit="hợp đồng" />}

      {viewing && (
        <ContractDetailDialog
          key={viewing.contractId}
          contract={viewing}
          today={today}
          onClose={() => setViewing(null)}
          onForfeit={(c) => {
            setViewing(null)
            setForfeiting(c)
          }}
        />
      )}

      {forfeiting && (
        <ForfeitProcessedSheet
          key={forfeiting.contractId}
          contract={forfeiting}
          ctx={ctx}
          onClose={() => setForfeiting(null)}
          onDone={(message) => {
            toast.success(message)
            setForfeiting(null)
            setReloadCount((n) => n + 1)
          }}
        />
      )}
    </section>
  )
}

export default CustomersContractsPanel
