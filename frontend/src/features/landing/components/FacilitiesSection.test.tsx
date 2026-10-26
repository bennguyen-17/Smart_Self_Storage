import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { FacilitiesSection } from "./FacilitiesSection"

const api = vi.hoisted(() => ({
  getPublicFacilities: vi.fn(),
  availabilityByFacility: vi.fn(),
  getPublicPrices: vi.fn(),
}))
vi.mock("../api/landingApi", () => api)

// Hiệu ứng hiện dần khi cuộn (motion whileInView) cần IntersectionObserver; jsdom không có nên giả lập tối thiểu
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
vi.stubGlobal("IntersectionObserver", IntersectionObserverStub)

beforeEach(() => {
  api.getPublicFacilities.mockReset().mockResolvedValue([
    { facilityId: 1, facilityCode: "HN-01", facilityName: "SmartStorage Cầu Giấy", address: "391 Cầu Giấy", status: "ACTIVE" },
    { facilityId: 2, facilityCode: "HN-02", facilityName: "SmartStorage Thanh Xuân", address: "120 Khuất Duy Tiến", status: "INACTIVE" },
  ])
  api.availabilityByFacility.mockReset().mockResolvedValue({ "HN-01": 12, "HN-02": 3 })
})

describe("FacilitiesSection: khách xem cơ sở và số ô còn trống", () => {
  test("hiện số ô trống thật; cơ sở tạm ngưng thì ghi rõ", async () => {
    render(<FacilitiesSection />)
    expect(await screen.findByText("Còn 12 ô trống")).toBeInTheDocument()
    expect(screen.getByText("Tạm ngưng nhận khách")).toBeInTheDocument()
  })

  test("API lỗi thì vẫn hiện danh sách cơ sở viết sẵn, không có nhãn số ô", async () => {
    api.getPublicFacilities.mockRejectedValue(new Error("Lỗi mạng"))
    render(<FacilitiesSection />)
    expect(await screen.findByText("SmartStorage Cầu Giấy")).toBeInTheDocument()
    expect(screen.queryByText(/ô trống/)).not.toBeInTheDocument()
    expect(api.availabilityByFacility).not.toHaveBeenCalled()
  })
})
