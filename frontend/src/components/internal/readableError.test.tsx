import { render, screen } from "@testing-library/react"
import { AxiosError, type AxiosResponse } from "axios"
import { describe, expect, test, vi } from "vitest"

import { LoadError } from "./components/PanelKit"
import { GENERIC_ERROR, readableError, sanitizeErrorMessage } from "./readableError"

// Đúng các câu BE trả khi thử thật ngày 01/11 (rút gọn phần câu lệnh SQL)
const SQL_DUP_PHONE = "could not execute statement [Duplicate entry '0987654321' for key 'account.phone'] [insert into Account (createdAt,email)]; constraint [account.phone]"
const SQL_TOO_LONG = "Lỗi hệ thống: could not execute statement [Data truncation: Data too long for column 'fullName' at row 1] [insert into Account (createdAt,email)]"
const SQL_FK = "Lỗi hệ thống: could not execute statement [Cannot add or update a child row: a foreign key constraint fails (`smart_storage`.`employeeprofile`)]"
const JAVA_CONVERT = "Lỗi hệ thống: Method parameter 'date': Failed to convert value of type 'java.lang.String' to required type 'java.time.LocalDate'"

describe("sanitizeErrorMessage: không đưa câu SQL / lỗi Java lên giao diện", () => {
  test.each([
    { name: "trùng SĐT", input: SQL_DUP_PHONE, expected: "Số điện thoại 0987654321 đã được dùng cho một tài khoản khác." },
    { name: "trùng email", input: "Duplicate entry 'a@b.vn' for key 'account.email'", expected: "Email a@b.vn đã được dùng cho một tài khoản khác." },
    { name: "trùng khóa khác", input: "Duplicate entry 'X' for key 'unit.code'", expected: "Dữ liệu bị trùng với bản ghi đã có. Kiểm tra lại rồi thử lại." },
    { name: "nội dung quá dài", input: SQL_TOO_LONG, expected: "Nội dung nhập quá dài. Vui lòng rút gọn rồi thử lại." },
    { name: "khóa ngoại (cơ sở đã xóa)", input: SQL_FK, expected: "Dữ liệu liên quan không còn tồn tại (ví dụ cơ sở đã bị xóa). Tải lại trang rồi thử lại." },
    { name: "lỗi Java chuyển kiểu", input: JAVA_CONVERT, expected: GENERIC_ERROR },
    { name: "mất kết nối", input: "Network Error", expected: "Không kết nối được máy chủ. Kiểm tra mạng hoặc máy chủ đang tắt rồi thử lại." },
    { name: "câu rỗng", input: "  ", expected: "Không xử lý được yêu cầu. Vui lòng thử lại." },
    { name: "câu tiếng Việt của BE giữ nguyên", input: "Không tìm thấy ô kho: KHONGCO", expected: "Không tìm thấy ô kho: KHONGCO" },
    { name: "câu nghiệp vụ có chữ trạng thái tiếng Anh giữ nguyên", input: "Chỉ hợp đồng FORFEITED mới được xác nhận đã xử lý tài sản.", expected: "Chỉ hợp đồng FORFEITED mới được xác nhận đã xử lý tài sản." },
  ])("$name", ({ input, expected }) => {
    expect(sanitizeErrorMessage(input)).toBe(expected)
  })
})

describe("readableError: lỗi axios từ BE", () => {
  test("lấy message của BE rồi lọc câu kỹ thuật", () => {
    const err = new AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, {
      status: 500,
      data: { message: SQL_TOO_LONG },
    } as AxiosResponse)
    expect(readableError(err)).toBe("Nội dung nhập quá dài. Vui lòng rút gọn rồi thử lại.")
  })
})

describe("LoadError: ô báo lỗi tải dữ liệu dùng chung", () => {
  test("không hiện câu SQL, câu dài được phép xuống dòng", () => {
    render(<LoadError title="Không tải được dữ liệu" message={SQL_FK} onRetry={vi.fn()} />)
    expect(screen.queryByText(/foreign key|smart_storage/)).not.toBeInTheDocument()
    const text = screen.getByText(/Dữ liệu liên quan không còn tồn tại/)
    expect(text.closest("[class*='overflow-wrap']")).not.toBeNull()
  })
})
