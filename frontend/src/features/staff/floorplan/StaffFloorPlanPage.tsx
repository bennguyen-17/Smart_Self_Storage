import { useEffect, useState } from "react"
import { BuildingIcon, MapIcon } from "lucide-react"

import StorageMap2D from "@/features/customer/rent/components/StorageMap2D"
import { useAuth } from "@/context/AuthContext"
import { getStaffProfile } from "@/features/staff/shifts/api/staffProfileService"

interface MapUnit {
  id: string
}

/** Xem sơ đồ kho 2D cho nhân viên — Khóa cứng theo đúng cơ sở trực thuộc của nhân viên. */
function StaffFloorPlanPage() {
  const { user } = useAuth()
  const [facility, setFacility] = useState<string>(user?.facilityCode || "")
  const [facilityName, setFacilityName] = useState<string>(user?.facilityName || "")
  const [loading, setLoading] = useState<boolean>(!user?.facilityCode)
  const [currentFloor, setCurrentFloor] = useState(1)
  const [selectedUnit, setSelectedUnit] = useState<MapUnit | null>(null)

  useEffect(() => {
    let isMounted = true
    getStaffProfile()
      .then((data) => {
        if (isMounted && data?.facilityCode) {
          setFacility(data.facilityCode)
          if (data.facilityName) setFacilityName(data.facilityName)
        }
      })
      .catch((err) => {
        console.error("Lỗi tải thông tin cơ sở nhân viên:", err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        <i className="fa-solid fa-spinner animate-spin text-2xl mb-2 block text-blue-500"></i>
        <span>Đang tải thông tin cơ sở trực thuộc của bạn...</span>
      </div>
    )
  }

  if (!facility) {
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
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          <BuildingIcon className="mx-auto size-8 text-amber-600 dark:text-amber-400 mb-2" />
          <p className="font-bold text-sm">Chưa phân bổ cơ sở làm việc</p>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Tài khoản nhân viên của bạn hiện chưa được gán vào cơ sở cụ thể nào. Vui lòng liên hệ Quản lý cơ sở để được phân bổ ca trực và cơ sở.
          </p>
        </div>
      </section>
    )
  }

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
          Sơ đồ mặt bằng ô kho theo từng tầng tại cơ sở trực thuộc của bạn {facilityName ? `(${facilityName})` : ""}.
        </p>
      </div>

      <StorageMap2D
        facility={facility}
        onFacilityChange={() => {}}
        currentFloor={currentFloor}
        onSelectFloor={(fl) => {
          setCurrentFloor(fl)
          setSelectedUnit(null)
        }}
        selectedUnit={selectedUnit}
        onSelectUnit={setSelectedUnit}
        copyableUnitCode
        lockFacility
      />
    </section>
  )
}

export default StaffFloorPlanPage
