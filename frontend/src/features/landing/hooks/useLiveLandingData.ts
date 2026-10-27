// Landing hiện nội dung viết sẵn ngay, có dữ liệu BE thì thay vào.
// BE lỗi hoặc chậm thì Landing vẫn đầy đủ (không chặn trang giới thiệu vì một API).

import { useAsyncData } from "@/hooks/useAsyncData"

import { availabilityByFacility, getPublicFacilities, getPublicPrices } from "../api/landingApi"
import { FACILITIES } from "../content/facilities"
import { UNITS } from "../content/units"
import { mergeFacilities, mergeUnitPrices } from "../lib/liveData"

/** 4 cỡ kho với giá ngày / tháng / cọc theo bảng giá BOM đang áp dụng */
export function useLiveUnits() {
  const prices = useAsyncData("landing-prices", getPublicPrices)
  return mergeUnitPrices(UNITS, prices.data)
}

/** 7 cơ sở với tên, địa chỉ, trạng thái từ BE và số ô còn trống */
export function useLiveFacilities() {
  const facilities = useAsyncData("landing-facilities", getPublicFacilities)
  const available = useAsyncData(facilities.data ? "landing-available" : null, () =>
    availabilityByFacility(facilities.data ?? [])
  )
  return mergeFacilities(FACILITIES, facilities.data, available.data)
}
