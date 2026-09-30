import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { MapIcon, RotateCwIcon, SearchXIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAsyncData } from "@/hooks/useAsyncData"

import { getFacilities, getFloors, getUnits } from "../api/floorPlanApi"
import FloorPlanFilters from "../components/FloorPlanFilters"
import StatusLegend from "../components/StatusLegend"
import UnitDetailDialog from "../components/UnitDetailDialog"
import UnitGrid from "../components/UnitGrid"
import type { ClimateFilter, SizeFilter, UnitDetailResponse } from "../types"
import { UNIT_SIZES, unitSizeOf } from "../unitDisplay"

const CLIMATE_VALUES: ClimateFilter[] = ["ALL", "NORMAL", "CLIMATE_CONTROLLED"]

interface FloorPlanPageProps {
  /** Bước tiếp theo khi khách bấm đặt cọc (US-04). Mặc định: về trang chủ kèm ô đã chọn. */
  onReserve?: (unit: UnitDetailResponse) => void
}

/** US-03: Sơ đồ 2D chọn ô kho theo cơ sở / tầng / size / loại kho */
function FloorPlanPage({ onReserve }: FloorPlanPageProps) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [reloadCount, setReloadCount] = useState(0)
  const [selectedUnit, setSelectedUnit] = useState<UnitDetailResponse | null>(
    null
  )

  const size = ([...UNIT_SIZES, "ALL"] as SizeFilter[]).includes(
    params.get("size") as SizeFilter
  )
    ? (params.get("size") as SizeFilter)
    : "ALL"
  const climate = CLIMATE_VALUES.includes(
    params.get("climate") as ClimateFilter
  )
    ? (params.get("climate") as ClimateFilter)
    : "ALL"

  const facilitiesQuery = useAsyncData(
    `facilities#${reloadCount}`,
    getFacilities
  )
  const facilities = facilitiesQuery.data ?? []
  const facility =
    facilities.find((f) => String(f.facilityId) === params.get("facility")) ??
    facilities[0]

  const floorsQuery = useAsyncData(
    facility ? `floors:${facility.facilityId}#${reloadCount}` : null,
    () => getFloors(facility!.facilityId)
  )
  const floor =
    floorsQuery.data?.find((f) => String(f.floorId) === params.get("floor")) ??
    floorsQuery.data?.[0]

  const unitsQuery = useAsyncData(
    facility && floor
      ? `units:${facility.facilityId}:${floor.floorId}:${climate}#${reloadCount}`
      : null,
    () =>
      getUnits({
        facilityId: facility!.facilityId,
        floorId: floor!.floorId,
        storageCondition: climate === "ALL" ? undefined : climate,
      })
  )
  const units = unitsQuery.data ?? []
  const visibleUnits =
    size === "ALL" ? units : units.filter((u) => unitSizeOf(u) === size)

  function updateParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  function handleReserve(unit: UnitDetailResponse) {
    setSelectedUnit(null)
    if (onReserve) return onReserve(unit)
    // Chờ chốt cách ghép với luồng đặt cọc US-04 của Tâm trong CustomerPortal
    toast.info(`Chuyển sang bước đặt cọc giữ chỗ cho ô ${unit.unitCode}`)
    navigate("/", { state: { reserveUnit: unit } })
  }

  const error = facilitiesQuery.error ?? floorsQuery.error ?? unitsQuery.error
  const isLoading =
    facilitiesQuery.isLoading || floorsQuery.isLoading || unitsQuery.isLoading

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MapIcon aria-hidden="true" className="size-6 text-primary" />
            Sơ đồ kho 2D
          </h1>
          <p className="text-sm text-muted-foreground">
            Chọn cơ sở, tầng và loại kho, sau đó bấm vào ô màu xanh để xem chi
            tiết và đặt cọc giữ chỗ.
          </p>
        </header>

        {facilitiesQuery.data && (
          <FloorPlanFilters
            facilities={facilities}
            facilityId={facility?.facilityId ?? null}
            onFacilityChange={(id) =>
              updateParams({ facility: String(id), floor: null })
            }
            floors={floorsQuery.data}
            floorId={floor?.floorId ?? null}
            onFloorChange={(id) => updateParams({ floor: String(id) })}
            size={size}
            onSizeChange={(s) => updateParams({ size: s === "ALL" ? null : s })}
            climate={climate}
            onClimateChange={(c) =>
              updateParams({ climate: c === "ALL" ? null : c })
            }
          />
        )}

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Không tải được sơ đồ kho</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-2">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReloadCount((n) => n + 1)}
              >
                <RotateCwIcon aria-hidden="true" /> Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 rounded-xl border bg-card py-16 text-muted-foreground"
          >
            <Spinner /> Đang tải sơ đồ kho…
          </div>
        ) : (
          <section aria-label="Sơ đồ ô kho" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">
                {facility?.facilityName} · {floor?.floorName}
                {floor?.maxLoadPerM2 != null &&
                  ` · Tải sàn tối đa ${floor.maxLoadPerM2.toLocaleString("vi-VN")} kg/m²`}
              </h2>
              <StatusLegend units={visibleUnits} />
            </div>

            {visibleUnits.length > 0 ? (
              <UnitGrid units={visibleUnits} onSelect={setSelectedUnit} />
            ) : (
              <div className="rounded-xl border bg-card px-4 py-12 text-center">
                <SearchXIcon
                  aria-hidden="true"
                  className="mx-auto mb-2 size-8 text-muted-foreground"
                />
                <p className="font-medium">
                  {facility?.isAllClimate && climate === "NORMAL"
                    ? "Cơ sở này 100% là kho điều hòa, không có kho thường."
                    : "Không có ô kho phù hợp với bộ lọc trên tầng này."}
                </p>
                <p className="text-sm text-muted-foreground">
                  Thử đổi tầng, kích thước hoặc loại kho.
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      <UnitDetailDialog
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onReserve={handleReserve}
      />
    </div>
  )
}

export default FloorPlanPage
