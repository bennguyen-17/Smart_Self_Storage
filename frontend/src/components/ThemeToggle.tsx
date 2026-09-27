import { Moon, Sun } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title="Chuyển chế độ Sáng / Tối"
      className="h-auto gap-1.5 px-3 py-2 text-xs font-semibold shadow-sm dark:border-border dark:bg-background dark:hover:bg-muted"
    >
      {isDark ? (
        <Moon className="size-3.5 text-blue-400" />
      ) : (
        <Sun className="size-3.5 text-amber-500" />
      )}

      <span className="text-[11px]">{isDark ? "Tối" : "Sáng"}</span>
    </Button>
  )
}

export default ThemeToggle
