import { useState } from "react"
import { MapIcon } from "lucide-react"

import StorageMap2D from "@/features/customer/rent/components/StorageMap2D"

interface MapUnit {
  id: string
}

/** Xem sơ đồ kho 2D cho nhân viên — dùng lại đúng component của Cổng Khách Hàng. */
function StaffFloorPlanPage() {
  const [facility, setFacility] = useState("")
  const [currentFloor, setCurrentFloor] = useState(1)
  const [selectedUnit, setSelectedUnit] = useState<MapUnit | null>(null)

  return (
    <section aria-labelledby="staff-floorplan-title" className="space-y-4">
      <div>
        <h1
          id="staff-floorplan-title"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
          <MapIcon className="size-5 text-blue-600 dark:text-blue-400" />
          <span>Sơ đồ kho 2D</span>
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          Chọn cơ sở, loại kho và tầng để xem sơ đồ mặt bằng ô kho.
        </p>
      </div>

      <StorageMap2D
        facility={facility}
        onFacilityChange={(fac) => {
          setFacility(fac)
          setSelectedUnit(null)
        }}
        currentFloor={currentFloor}
        onSelectFloor={(fl) => {
          setCurrentFloor(fl)
          setSelectedUnit(null)
        }}
        selectedUnit={selectedUnit}
        onSelectUnit={setSelectedUnit}
        copyableUnitCode
      />
    </section>
  )
}

export default StaffFloorPlanPage
