/** "Trần Văn Quản Lý (HN-01)" → "QL": bỏ phần trong ngoặc, lấy chữ cái đầu của 2 từ cuối */
export function initials(fullName: string): string {
  const words = fullName
    .replace(/\(.*?\)/g, " ")
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
  if (words.length === 0) return "?"
  return words
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join("")
}
