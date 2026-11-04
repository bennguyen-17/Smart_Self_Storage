import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import AuthImage from "./AuthImage"
import ImageGallery from "./ImageGallery"
import { apiPathOf, imageFileError, isExternalUrl } from "./imageApi"

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: http, isMockMode: () => false }))

beforeEach(() => {
  http.get.mockReset().mockResolvedValue(new Blob(["x"], { type: "image/png" }))
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:anh-12"), revokeObjectURL: vi.fn() }))
})

describe("imageFileError: kiểm tra trước giống giới hạn của BE", () => {
  test.each([
    { name: "a.jpg", type: "image/jpeg", size: 1000, expected: null },
    { name: "a.png", type: "image/png", size: 5 * 1024 * 1024, expected: null },
    { name: "a.webp", type: "image/webp", size: 10, expected: null },
    { name: "a.gif", type: "image/gif", size: 10, expected: '"a.gif" không phải ảnh JPG, PNG hoặc WEBP' },
    { name: "a.pdf", type: "application/pdf", size: 10, expected: '"a.pdf" không phải ảnh JPG, PNG hoặc WEBP' },
    { name: "to.jpg", type: "image/jpeg", size: 5 * 1024 * 1024 + 1, expected: '"to.jpg" lớn hơn 5 MB' },
  ])("$name ($type, $size byte) → $expected", (file) => {
    expect(imageFileError(file)).toBe(file.expected)
  })
})

describe("đường dẫn ảnh", () => {
  test.each([
    { url: "/api/images/12", path: "/images/12", external: false },
    { url: "https://drive.google.com/x.png", path: "https://drive.google.com/x.png", external: true },
  ])("$url → gọi $path, link ngoài: $external", ({ url, path, external }) => {
    expect(apiPathOf(url)).toBe(path)
    expect(isExternalUrl(url)).toBe(external)
  })
})

describe("AuthImage: ảnh hệ thống lưu phải tải kèm token (img src không gửi được token)", () => {
  test("tải bằng apiClient dạng blob rồi hiện object URL", async () => {
    render(<AuthImage url="/api/images/12" alt="Ảnh nghiệm thu" />)
    expect(screen.getByRole("img", { name: /đang tải ảnh nghiệm thu/i })).toBeInTheDocument()
    expect(await screen.findByRole("img", { name: "Ảnh nghiệm thu" })).toHaveAttribute("src", "blob:anh-12")
    expect(http.get).toHaveBeenCalledWith("/images/12", { responseType: "blob" })
  })

  test("BE từ chối (403 / 404) → báo không tải được ảnh", async () => {
    http.get.mockRejectedValue(new Error("403"))
    render(<AuthImage url="/api/images/12" alt="Ảnh nghiệm thu" />)
    expect(await screen.findByText("Không tải được ảnh")).toBeInTheDocument()
  })

  test("link ngoài → dùng thẳng, không gọi BE", () => {
    render(<AuthImage url="https://drive.google.com/x.png" alt="Biên lai" />)
    expect(screen.getByRole("img", { name: "Biên lai" })).toHaveAttribute("src", "https://drive.google.com/x.png")
    expect(http.get).not.toHaveBeenCalled()
  })
})

describe("ImageGallery: ảnh thu nhỏ, bấm để phóng to", () => {
  test("không có ảnh → câu thông báo, không để khung trống", () => {
    render(<ImageGallery images={[]} label="Ảnh nghiệm thu" emptyText="Chưa có ảnh nghiệm thu cho hợp đồng này." />)
    expect(screen.getByText("Chưa có ảnh nghiệm thu cho hợp đồng này.")).toBeInTheDocument()
  })

  test("bấm ảnh → mở hộp thoại ảnh lớn kèm người chụp", async () => {
    const user = userEvent.setup()
    render(
      <ImageGallery
        images={[{ imageId: 12, url: "/api/images/12", uploadedBy: "Nguyễn Văn Hùng", uploadedAt: "2026-11-04T09:05:00" }]}
        label="Ảnh nghiệm thu"
        emptyText="Chưa có ảnh"
      />
    )
    await user.click(screen.getByRole("button", { name: "Xem ảnh nghiệm thu 1" }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveTextContent("Nguyễn Văn Hùng")
    await waitFor(() => expect(http.get).toHaveBeenCalledWith("/images/12", { responseType: "blob" }))
  })
})
