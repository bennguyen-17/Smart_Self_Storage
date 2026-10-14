// Xuất bảng ra file CSV mở được bằng Excel (có BOM UTF-8 để Excel đọc đúng tiếng Việt).

type Cell = string | number | null | undefined

/** Một ô CSV: có dấu phẩy, ngoặc kép hoặc xuống dòng thì bọc ngoặc kép và nhân đôi ngoặc kép bên trong */
export function csvCell(value: Cell): string {
  if (value == null) return ""
  const s = String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(header: readonly string[], rows: readonly (readonly Cell[])[]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")
}

/** Tải file về máy người dùng */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
