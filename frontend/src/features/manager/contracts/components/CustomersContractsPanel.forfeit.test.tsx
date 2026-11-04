import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { addDays, todayInVietnam } from "@/lib/format"

import type { FacilityContract } from "../types"
import CustomersContractsPanel from "./CustomersContractsPanel"

vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => false }))
vi.mock("@/features/manager/managerContext", () => ({
  getManagerContext: () => ({ facilityId: 1, accountId: 3, fullName: "Trần Văn Quản Lý", isDemo: false }),
}))

const today = todayInVietnam()
function contract(id: number, customerName: string, patch: Partial<FacilityContract>): FacilityContract {
  return {
    contractId: id,
    contractCode: `CTR-HN01-0${id}`,
    customerName,
    customerPhone: "0912345678",
    unitCode: `HN01-F1-M0${id}`,
    startDate: addDays(today, -120),
    endDate: addDays(today, -5),
    status: "OVERDUE",
    depositAmount: 1_000_000,
    checkoutStage: "NONE",
    fees: [],
    ...patch,
  }
}

const CONTRACTS = [
  contract(1, "Khách Một", {}),
  contract(2, "Khách Hai", { endDate: addDays(today, -35) }),
  contract(3, "Khách Ba", { status: "FORFEITED", endDate: addDays(today, -60) }),
  contract(4, "Khách Bốn", { status: "FORFEITED", endDate: addDays(today, -70), forfeitProcessed: true }),
]

const api = vi.hoisted(() => ({ markForfeitProcessed: vi.fn() }))
vi.mock("../api/contractApi", () => ({
  listFacilityContracts: vi.fn(async () => CONTRACTS),
  markForfeitProcessed: api.markForfeitProcessed,
}))

// Tải ảnh lên quầy chung: giả lập BE trả mã ảnh tăng dần
const images = vi.hoisted(() => ({ uploadImage: vi.fn() }))
vi.mock("@/components/internal/images/imageApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/internal/images/imageApi")>()),
  uploadImage: images.uploadImage,
}))

beforeEach(() => {
  let next = 40
  images.uploadImage.mockReset().mockImplementation(async () => ({ imageId: ++next, url: `/api/images/${next}` }))
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:preview"), revokeObjectURL: vi.fn() }))
})

const row = (name: string) => screen.getByText(name).closest("tr") as HTMLElement
const photo = (name = "niem-phong.jpg", type = "image/jpeg", bytes = 1024) => new File([new Uint8Array(bytes)], name, { type })

async function openForfeit() {
  const user = userEvent.setup()
  render(<CustomersContractsPanel />)
  await screen.findByText("Khách Ba")
  await user.click(within(row("Khách Ba")).getByRole("button", { name: /Thanh lý tài sản/ }))
  const dialog = await screen.findByRole("dialog")
  const confirm = within(dialog).getByRole("button", { name: "Xác nhận thanh lý tài sản" })
  const picker = within(dialog).getByLabelText(/chọn ảnh minh chứng thanh lý/i)
  return { user, dialog, confirm, picker }
}

describe("Quản lí hợp đồng: thanh lý tài sản quá hạn", () => {
  test("chỉ hợp đồng đã chuyển Tịch thu mới có nút; quá hạn 35 ngày (BE chưa chuyển) ghi 'Chờ chuyển tịch thu'; đã xử lý ghi 'Đã thanh lý'", async () => {
    render(<CustomersContractsPanel />)
    await screen.findByText("Khách Một")
    expect(within(row("Khách Một")).queryByRole("button", { name: /Thanh lý tài sản/ })).not.toBeInTheDocument()
    expect(within(row("Khách Hai")).queryByRole("button", { name: /Thanh lý tài sản/ })).not.toBeInTheDocument()
    expect(within(row("Khách Hai")).getByText("Chờ chuyển tịch thu")).toBeInTheDocument()
    expect(within(row("Khách Ba")).getByRole("button", { name: /Thanh lý tài sản/ })).toBeInTheDocument()
    expect(within(row("Khách Bốn")).getByText("Đã thanh lý")).toBeInTheDocument()
  })

  test("chưa có ảnh minh chứng thì không xác nhận được; tải 2 ảnh → gửi kèm 2 mã ảnh và ghi chú mặc định, đóng hộp thoại", async () => {
    api.markForfeitProcessed.mockReset().mockResolvedValue(undefined)
    const { user, dialog, confirm, picker } = await openForfeit()
    expect(confirm).toBeDisabled()
    await user.upload(picker, [photo("a.jpg"), photo("b.png", "image/png")])
    expect(await within(dialog).findByRole("list", { name: /đã chọn/ })).toBeInTheDocument()
    expect(images.uploadImage).toHaveBeenCalledWith(expect.any(File), "FORFEIT_EVIDENCE")
    await waitFor(() => expect(confirm).toBeEnabled())
    await user.click(confirm)
    expect(api.markForfeitProcessed).toHaveBeenCalledWith(expect.anything(), 3, expect.stringMatching(/thanh lý tài sản/), [41, 42])
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("có gõ ghi chú → gửi đúng ghi chú đó", async () => {
    api.markForfeitProcessed.mockReset().mockResolvedValue(undefined)
    const { user, dialog, confirm, picker } = await openForfeit()
    await user.upload(picker, photo())
    await user.type(within(dialog).getByLabelText(/ghi chú xử lý tài sản/i), "Cắt khóa có camera, 2 nhân viên chứng kiến")
    await waitFor(() => expect(confirm).toBeEnabled())
    await user.click(confirm)
    expect(api.markForfeitProcessed).toHaveBeenCalledWith(expect.anything(), 3, "Cắt khóa có camera, 2 nhân viên chứng kiến", [41])
  })

  test("chọn file không phải ảnh hoặc quá 5 MB → báo ngay, không tải lên, vẫn khóa nút", async () => {
    const { user, dialog, confirm, picker } = await openForfeit()
    await user.upload(picker, photo("bien-ban.pdf", "application/pdf"))
    expect(images.uploadImage).not.toHaveBeenCalled()
    expect(confirm).toBeDisabled()
    await user.upload(picker, photo("to-qua.jpg", "image/jpeg", 6 * 1024 * 1024))
    expect(within(dialog).getByRole("alert")).toHaveTextContent(/lớn hơn 5 MB/)
    expect(images.uploadImage).not.toHaveBeenCalled()
  })

  test("BE trả lỗi SQL → hiện câu dễ hiểu, không lộ câu lệnh", async () => {
    api.markForfeitProcessed.mockReset().mockRejectedValue(new Error("Lỗi hệ thống: could not execute statement [Data too long for column description] [insert into ActivityLog ...]"))
    const { user, dialog, confirm, picker } = await openForfeit()
    await user.upload(picker, photo())
    await waitFor(() => expect(confirm).toBeEnabled())
    await user.click(confirm)
    expect(await within(dialog).findByText(/Nội dung nhập quá dài/)).toBeInTheDocument()
    expect(within(dialog).queryByText(/could not execute|insert into/)).not.toBeInTheDocument()
  })

  test("BE từ chối → giữ hộp thoại mở, hiện nguyên câu lỗi của BE", async () => {
    api.markForfeitProcessed.mockReset().mockRejectedValue(new Error("Hợp đồng đã được xác nhận xử lý tài sản."))
    const { user, dialog, confirm, picker } = await openForfeit()
    await user.upload(picker, photo())
    await waitFor(() => expect(confirm).toBeEnabled())
    await user.click(confirm)
    expect(await within(dialog).findByText("Hợp đồng đã được xác nhận xử lý tài sản.")).toBeInTheDocument()
  })

  test("từ hộp thoại chi tiết: hợp đồng đã tịch thu có nút thanh lý, bấm thì chuyển sang hộp thoại thanh lý", async () => {
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    await screen.findByText("Khách Ba")
    await user.click(screen.getByRole("button", { name: "Xem chi tiết hợp đồng CTR-HN01-03" }))
    const detail = await screen.findByRole("dialog")
    await user.click(within(detail).getByRole("button", { name: /Thanh lý tài sản/ }))
    expect(await screen.findByRole("button", { name: "Xác nhận thanh lý tài sản" })).toBeInTheDocument()
  })

  test("chi tiết hợp đồng quá hạn 35 ngày (chưa chuyển) giải thích phải chờ hệ thống, không có nút", async () => {
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    await screen.findByText("Khách Hai")
    await user.click(screen.getByRole("button", { name: "Xem chi tiết hợp đồng CTR-HN01-02" }))
    const detail = await screen.findByRole("dialog")
    expect(within(detail).getByText(/Hệ thống sẽ chuyển sang "Tịch thu" lúc 00:00/)).toBeInTheDocument()
    expect(within(detail).queryByRole("button", { name: /Thanh lý tài sản/ })).not.toBeInTheDocument()
  })
})
