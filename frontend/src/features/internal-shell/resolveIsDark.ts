/** Theme "system" thì đọc theo cài đặt của máy */
export function resolveIsDark(theme: string): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
}
