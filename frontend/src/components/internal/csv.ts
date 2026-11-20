// Xuất CSV kèm BOM UTF-8 để Excel mở đúng tiếng Việt

type Cell = string | number | null | undefined

export function csvCell(value: Cell): string {
  if (value == null) return ""
  const s = String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(header: readonly string[], rows: readonly (readonly Cell[])[]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")
}

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
