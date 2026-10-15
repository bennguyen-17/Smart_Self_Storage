import { Moon, Sun } from "lucide-react"

import { useTheme } from "@/components/common/theme-provider"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  const toggle = () => setTheme(isDark ? "light" : "dark")

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      className="inline-flex size-10 items-center justify-center rounded-full transition-colors outline-none hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-3 focus-visible:ring-ring/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
    >
      {isDark ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </button>
  )
}

export default ThemeToggle
