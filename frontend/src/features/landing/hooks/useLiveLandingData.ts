// Dùng dữ liệu tĩnh làm fallback để trang landing không bị trống khi BE lỗi hoặc chậm

import { useAsyncData } from "@/hooks/useAsyncData"

import { availabilityByFacility, getPublicFacilities, getPublicPrices } from "../api/landingApi"
import { FACILITIES } from "../content/facilities"
import { UNITS } from "../content/units"
import { mergeFacilities, mergeUnitPrices } from "../lib/liveData"

export function useLiveUnits() {
  const prices = useAsyncData("landing-prices", getPublicPrices)
  return mergeUnitPrices(UNITS, prices.data)
}

export function useLiveFacilities() {
  const facilities = useAsyncData("landing-facilities", getPublicFacilities)
  const available = useAsyncData(facilities.data ? "landing-available" : null, () =>
    availabilityByFacility(facilities.data ?? [])
  )
  return mergeFacilities(FACILITIES, facilities.data, available.data)
}
