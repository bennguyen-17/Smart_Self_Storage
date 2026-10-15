import { useEffect, useState } from "react"
import {
  CheckIcon,
  CopyIcon,
  HistoryIcon,
  HourglassIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/context/AuthContext"

function randomPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** Tab LẤY MÃ PIN — PIN cổng động 30s, bám prototype staff.html */
function StaffPinPanel() {
  const { user } = useAuth()
  const [pin, setPin] = useState(randomPin)
  const [seconds, setSeconds] = useState(30)
  const [copied, setCopied] = useState(false)

  const branchName =
    (user as { facilityName?: string })?.facilityName || "Quận 9 (Khu FPT)"

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  function regenerate() {
    setPin(randomPin())
    setSeconds(30)
    setCopied(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(pin)
    setCopied(true)
    toast.success(`Đã sao chép mã PIN cổng ${pin} vào bộ nhớ tạm!`)
    setTimeout(() => setCopied(false), 2500)
  }

  const expired = seconds <= 0
  const progressPercent = Math.max(0, (seconds / 30) * 100)

  return (
    <div className="mx-auto my-3 max-w-xl space-y-3">
      <div className="card-box pin-gate-card relative space-y-3 overflow-hidden rounded-3xl border border-blue-500/40 p-5 text-center shadow-xl">
        <div className="flex flex-col items-center justify-center gap-1 sm:flex-row sm:justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] font-black tracking-wider text-blue-600 uppercase dark:text-blue-400">
            <ShieldCheckIcon className="size-4" />
            <span>Staff PIN Entry Pass • Cổng cơ sở 24/7</span>
          </div>
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
            {branchName}
          </span>
        </div>

        <div className="pin-display-box relative mx-auto flex h-28 w-full flex-col items-center justify-center space-y-1 rounded-2xl border p-3 shadow-inner">
          <div className="text-[10px] font-bold tracking-widest text-white uppercase">
            Mã PIN xác thực cổng khẩn cấp
          </div>
          <div className="flex items-center justify-center space-x-3">
            <span className="font-mono text-3xl font-black tracking-widest sm:text-5xl">
              {pin}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              disabled={expired}
              title="Sao chép mã PIN"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? (
                <CheckIcon className="size-5 text-emerald-400" />
              ) : (
                <CopyIcon className="size-5" />
              )}
            </button>
          </div>

          {expired && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-1.5 rounded-2xl bg-slate-950/95 p-2 text-center text-white backdrop-blur-sm">
              <HistoryIcon className="size-6 animate-bounce text-amber-400" />
              <span className="text-xs font-black text-amber-300">
                MÃ PIN ĐÃ HẾT HẠN (30S)!
              </span>
              <button
                type="button"
                onClick={regenerate}
                className="flex cursor-pointer items-center space-x-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-500"
              >
                <RefreshCwIcon className="size-3.5" />
                <span>Bấm tạo mã PIN mới</span>
              </button>
            </div>
          )}
        </div>

        {/* PROGRESS BAR */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
          <div className="flex items-center space-x-1.5">
            <HourglassIcon className="size-3.5 text-amber-500" />
            <span>
              Mã PIN tự đổi sau:{" "}
              <b className="font-mono text-xs text-blue-600 dark:text-blue-400">
                {seconds} giây
              </b>
            </span>
          </div>
          <button
            type="button"
            onClick={regenerate}
            className="flex cursor-pointer items-center space-x-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-500"
          >
            <RefreshCwIcon className="size-3" />
            <span>Tạo mã mới</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StaffPinPanel
