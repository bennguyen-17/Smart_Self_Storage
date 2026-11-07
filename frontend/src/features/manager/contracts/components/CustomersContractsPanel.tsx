import { useMemo, useState } from "react"
import { GavelIcon, ShieldAlertIcon } from "lucide-react"
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
import ContractDetailModal from "@/features/customer/storage/modals/ContractDetailModal"
import ContractDetailDialog from "./ContractDetailDialog"
import ForfeitProcessedSheet from "./ForfeitProcessedSheet"
import ViolationTerminationModal from "./ViolationTerminationModal"

const EMPTY_FILTER: ContractFilter = { query: "", status: "ALL", payment: "ALL", expiringSoon: false }

/**
 * Manager › Quản lí hợp đồng: theo dõi khách, hợp đồng, thời hạn thuê và thanh lý tài sản quá hạn.
 * Bấm mã hợp đồng để xem chi tiết vận hành (tiền cọc, tiến độ trả kho, phạt / truy thu, ảnh nghiệm thu, thanh lý);
 * từ đó mở được văn bản hợp đồng pháp lý dùng chung với cổng khách (xuất PDF).
 */
function CustomersContractsPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const today = todayInVietnam()
  const [reloadCount, setReloadCount] = useState(0)
  const [filter, setFilter] = useState<ContractFilter>(EMPTY_FILTER)
  const [forfeiting, setForfeiting] = useState<FacilityContract | null>(null)
  const [violating, setViolating] = useState<FacilityContract | null>(null)
  const [viewing, setViewing] = useState<FacilityContract | null>(null)
  // Văn bản hợp đồng pháp lý (dùng chung với cổng khách, xuất PDF) mở từ ngăn chi tiết
  const [documentOf, setDocumentOf] = useState<FacilityContract | null>(null)
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
          { header: "Mã hợp đồng", align: "center" },
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
                  title="Bấm để xem chi tiết hợp đồng"
                  aria-label={`Xem chi tiết hợp đồng ${c.contractCode}`}
                  className="inline-flex items-center justify-center w-[185px] py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 font-mono font-semibold text-xs transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer text-center"
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
                  <ContractStatusBadge status={c.status} forfeitProcessed={c.forfeitProcessed} />
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                <div className="flex items-center justify-center gap-2">
                  {forfeit === "READY" || forfeit === "WAITING" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-xl px-2.5 text-xs font-semibold cursor-pointer shadow-2xs"
                      onClick={() => setForfeiting(c)}
                      title="Thanh lý tài sản quá hạn"
                    >
                      <GavelIcon className="size-3.5" />
                      Thanh lý tài sản
                    </Button>

                  ) : c.status === "ACTIVE" || c.status === "OVERDUE" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-xl px-2.5 text-xs font-semibold cursor-pointer shadow-2xs"
                      onClick={() => setViolating(c)}
                      title="Xử lý vi phạm"
                    >
                      <ShieldAlertIcon className="size-3.5" />
                      Xử lý vi phạm
                    </Button>
                  ) : (
                    <span className="text-muted">—</span>
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
          onViewDocument={(c) => {
            setViewing(null)
            setDocumentOf(c)
          }}
        />
      )}

      {documentOf && <ContractDetailModal contract={documentOf} onClose={() => setDocumentOf(null)} />}

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

      {violating && (
        <ViolationTerminationModal
          key={violating.contractId}
          contract={violating}
          ctx={ctx}
          onClose={() => setViolating(null)}
          onDone={(message) => {
            toast.success(message)
            setViolating(null)
            setReloadCount((n) => n + 1)
          }}
        />
      )}
    </section>

  )
}

export default CustomersContractsPanel
