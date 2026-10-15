/** Bỏ dấu tiếng Việt, viết thường, cắt khoảng trắng: để gõ "cau giay" vẫn tìm ra "Cầu Giấy" */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
}

/** Từ khóa rỗng thì khớp tất cả; ngược lại một trong các trường chứa từ khóa là khớp */
export function matchesQuery(query: string, fields: readonly (string | number | null | undefined)[]): boolean {
  const q = normalizeText(query)
  if (!q) return true
  return normalizeText(fields.filter((f) => f != null).join(" ")).includes(q)
}
