import { useState } from "react"
import { SnowflakeIcon } from "lucide-react"

import { getFacilities } from "@/features/floor-plan/api/floorPlanApi"
import {
  FilterBar,
  LoadError,
  ResultCount,
  SearchFilter,
  SelectFilter,
  StatusBadge,
  TableCard,
  type BadgeTone,
} from "@/features/internal-shell/components/PanelKit"
import { useAsyncData } from "@/hooks/useAsyncData"
import type { FacilityStatus } from "@/types"

import { FACILITY_STATUS_LABEL, filterBranches, REGION_LABEL, regionOf, type BranchFilter, type Region } from "../branchRules"

const EMPTY_FILTER: BranchFilter = { query: "", region: "ALL", status: "ALL" }
const STATUS_TONE: Record<FacilityStatus, BadgeTone> = { ACTIVE: "green", MAINTENANCE: "amber", INACTIVE: "slate" }
const LAYOUT_LABEL: Record<string, string> = { A: "Đô thị (mẫu A)", B: "Kho vận (mẫu B)" }

/** Admin › Chi nhánh: danh sách cơ sở toàn chuỗi (GET /api/facilities), chỉ xem */
function BranchesPanel() {
  const [reloadCount, setReloadCount] = useState(0)
  const [filter, setFilter] = useState<BranchFilter>(EMPTY_FILTER)
  const { data, error, isLoading } = useAsyncData(`facilities#${reloadCount}`, getFacilities)
  const all = data ?? []
  const rows = filterBranches(all, filter)
  const update = (patch: Partial<BranchFilter>) => setFilter((f) => ({ ...f, ...patch }))

  if (error) {
    return <LoadError title="Không tải được danh sách chi nhánh" message={error} onRetry={() => setReloadCount((n) => n + 1)} />
  }

  return (
    <section aria-label="Danh sách chi nhánh" className="space-y-4">
      <FilterBar>
        <SearchFilter value={filter.query} onChange={(query) => update({ query })} placeholder="Mã, tên, địa chỉ hoặc số điện thoại" />
        <SelectFilter
          label="Khu vực"
          value={filter.region}
          onChange={(v) => update({ region: v as Region | "ALL" })}
          options={[
            { value: "ALL", label: "Tất cả khu vực" },
            ...(["HN", "HCM", "DN", "CT"] as const).map((r) => ({ value: r, label: REGION_LABEL[r] })),
          ]}
        />
        <SelectFilter
          label="Trạng thái"
          value={filter.status}
          onChange={(v) => update({ status: v as FacilityStatus | "ALL" })}
          options={[
            { value: "ALL", label: "Tất cả" },
            ...(Object.keys(FACILITY_STATUS_LABEL) as FacilityStatus[]).map((s) => ({ value: s, label: FACILITY_STATUS_LABEL[s] })),
          ]}
        />
      </FilterBar>

      <ResultCount shown={rows.length} total={all.length} unit="chi nhánh" isLoading={isLoading} />

      <TableCard
        caption="Danh sách chi nhánh"
        columns={[
          { header: "Mã" },
          { header: "Chi nhánh" },
          { header: "Khu vực" },
          { header: "Liên hệ" },
          { header: "Quy mô" },
          { header: "Trạng thái" },
        ]}
        minWidth={860}
        isLoading={isLoading}
        isEmpty={rows.length === 0}
        emptyText={all.length === 0 ? "Chưa có chi nhánh nào" : "Không có chi nhánh phù hợp bộ lọc"}
      >
        {rows.map((f) => (
          <tr key={f.facilityId} className="border-b last:border-0">
            <td className="text-title px-4 py-3 font-mono font-bold whitespace-nowrap">{f.facilityCode}</td>
            <td className="px-4 py-3">
              <p className="text-title font-bold">{f.facilityName}</p>
              <p className="text-muted">{f.address}</p>
            </td>
            <td className="text-title px-4 py-3 whitespace-nowrap">{REGION_LABEL[regionOf(f.facilityCode)]}</td>
            <td className="text-title px-4 py-3 whitespace-nowrap">{f.phone || "—"}</td>
            <td className="px-4 py-3">
              <p className="text-title whitespace-nowrap">
                {f.floorCount} tầng · {LAYOUT_LABEL[f.layoutType] ?? f.layoutType}
              </p>
              {f.isAllClimate && (
                <p className="flex items-center gap-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                  <SnowflakeIcon aria-hidden="true" className="size-3" /> Toàn bộ kho điều hòa
                </p>
              )}
            </td>
            <td className="px-4 py-3">
              <StatusBadge tone={STATUS_TONE[f.status] ?? "slate"}>{FACILITY_STATUS_LABEL[f.status] ?? f.status}</StatusBadge>
            </td>
          </tr>
        ))}
      </TableCard>
    </section>
  )
}

export default BranchesPanel
