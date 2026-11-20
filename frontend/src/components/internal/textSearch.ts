// Chuẩn hóa chuỗi bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu và hoa thường
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
}

export function matchesQuery(query: string, fields: readonly (string | number | null | undefined)[]): boolean {
  const q = normalizeText(query)
  if (!q) return true
  return normalizeText(fields.filter((f) => f != null).join(" ")).includes(q)
}
