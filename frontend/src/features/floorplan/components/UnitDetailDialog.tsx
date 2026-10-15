import { useState } from "react"
import { LockKeyholeIcon, SnowflakeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatVnd } from "@/lib/format"

import type { UnitDetailResponse } from "../types"
import { unitAreaOf, unitDimensionsOf, unitSizeOf } from "../unitDisplay"

interface UnitDetailDialogProps {
  /** Ô đang xem; null = đóng */
  unit: UnitDetailResponse | null
  onClose: () => void
  onReserve: (unit: UnitDetailResponse) => void
}

const meters = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 2 })

function UnitDetailDialog({ unit, onClose, onReserve }: UnitDetailDialogProps) {
  // Giữ ô cuối cùng để nội dung không trống trong lúc chạy hiệu ứng đóng
  const [lastUnit, setLastUnit] = useState(unit)
  if (unit !== null && unit !== lastUnit) setLastUnit(unit)

  return (
    <Dialog
      open={unit !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        {lastUnit && <DetailBody unit={lastUnit} onReserve={onReserve} />}
      </DialogContent>
    </Dialog>
  )
}

function DetailBody({
  unit,
  onReserve,
}: {
  unit: UnitDetailResponse
  onReserve: (unit: UnitDetailResponse) => void
}) {
  const dims = unitDimensionsOf(unit)
  const area = unitAreaOf(unit)
  const size = unitSizeOf(unit)

  const fields: [string, string][] = [
    ["Loại kho", unit.typeName ?? (size ? `Size ${size}` : "—")],
    [
      "Kích thước (Dài × Rộng × Cao)",
      dims ? `${dims.map(meters).join(" × ")} m` : "—",
    ],
    ["Diện tích", area != null ? `${meters(area)} m²` : "—"],
    [
      "Tải trọng tối đa sàn",
      unit.maxLoadKgM2 != null
        ? `${unit.maxLoadKgM2.toLocaleString("vi-VN")} kg/m²`
        : "—",
    ],
    ["Giá thuê theo ngày", formatVnd(unit.dailyPrice)],
    ["Giá thuê theo tháng", formatVnd(unit.monthlyPrice)],
    ["Tiền cọc", formatVnd(unit.depositAmount)],
  ]

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-mono text-lg">{unit.unitCode}</DialogTitle>
        <DialogDescription>
          {unit.floorName ?? "Ô kho"} · Còn trống, có thể đặt cọc giữ chỗ
        </DialogDescription>
      </DialogHeader>

      {unit.isClimate && (
        <p className="flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:bg-sky-950 dark:text-sky-200">
          <SnowflakeIcon aria-hidden="true" className="size-4" />
          Kho điều hòa nhiệt độ
          {unit.climateSurchargePercent
            ? ` · phụ thu ${unit.climateSurchargePercent}%`
            : ""}
        </p>
      )}

      <dl className="divide-y rounded-lg border">
        {fields.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 px-3 py-2"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <DialogFooter>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => onReserve(unit)}
        >
          <LockKeyholeIcon aria-hidden="true" />
          Tiến hành đặt cọc giữ chỗ 5 phút
        </Button>
      </DialogFooter>
    </>
  )
}

export default UnitDetailDialog
