import { useCallback, useEffect, useState } from "react"
import {
  CheckIcon,
  CopyIcon,
  HourglassIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/context/AuthContext"
import { fetchStaffGatePin } from "@/features/staff/checkin/api/checkinApi"

const TTL_TOTAL = 15 // Business Rule: IoT Gate PIN TTL 15s

/** Tab LẤY MÃ PIN — PIN cổng động 15s cho Nhân viên cơ sở 24/7 */
function StaffPinPanel() {
  const { user } = useAuth()
  const [pin, setPin] = useState<string>("--- ---")
  const [seconds, setSeconds] = useState<number>(TTL_TOTAL)
  const [copied, setCopied] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [facilityName, setFacilityName] = useState<string>(
    (user as { facilityName?: string })?.facilityName || "Cơ sở Cầu Giấy (Hà Nội)"
  )

  const loadLivePin = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true)
      const data = await fetchStaffGatePin()
      if (data && data.success) {
        setPin(data.pin || data.rawPin)
        setSeconds(data.ttlSeconds > 0 ? data.ttlSeconds : TTL_TOTAL)
        if (data.facilityName) {
          setFacilityName(
            data.facilityCode ? `${data.facilityName} (${data.facilityCode})` : data.facilityName
          )
        }
        if (isManual) {
          toast.success("Đã làm mới mã PIN cổng thành công!")
        }
      }
    } catch (err: any) {
      console.warn("Không thể tải mã PIN cổng từ server:", err)
    } finally {
      if (isManual) setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadLivePin()
  }, [loadLivePin])

  // Countdown timer & auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          // Auto-refresh seamlessly on expiry
          loadLivePin()
          return TTL_TOTAL
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loadLivePin])

  function handleCopy() {
    if (!pin || pin === "--- ---") return
    navigator.clipboard.writeText(pin.replace(/\s+/g, ""))
    setCopied(true)
    toast.success(`Đã sao chép mã PIN cổng ${pin} vào bộ nhớ tạm!`)
    setTimeout(() => setCopied(false), 2500)
  }

  const progressPercent = Math.max(0, Math.min(100, (seconds / TTL_TOTAL) * 100))

  return (
    <div className="mx-auto my-3 max-w-xl space-y-3">
      <div className="card-box pin-gate-card relative space-y-3 overflow-hidden rounded-3xl border border-blue-500/40 p-5 text-center shadow-xl">
        <div className="flex flex-col items-center justify-center gap-1 sm:flex-row sm:justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] font-black tracking-wider text-blue-600 uppercase dark:text-blue-400">
            <ShieldCheckIcon className="size-4" />
            <span>Mã pin mở cổng 24/7</span>
          </div>
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
            {facilityName}
          </span>
        </div>

        <div className="pin-display-box relative mx-auto flex h-28 w-full flex-col items-center justify-center space-y-1 rounded-2xl border p-3 shadow-inner">
          <div className="text-[10px] font-bold tracking-widest text-white uppercase">
            Mã PIN xác thực cổng khẩn cấp
          </div>
          <div className="flex items-center justify-center space-x-3">
            <span className="font-mono text-3xl font-black tracking-widest sm:text-5xl text-white">
              {loading ? (
                <span className="animate-pulse tracking-widest">--- ---</span>
              ) : (
                pin
              )}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || pin === "--- ---"}
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
        </div>

        {/* PROGRESS BAR */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              seconds <= 5 ? "bg-amber-500" : "bg-blue-600"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
          <div className="flex items-center space-x-1.5">
            <HourglassIcon className="size-3.5 text-amber-500" />
            <span>
              Mã PIN tự đổi sau:{" "}
              <b className="font-mono text-xs text-blue-600 dark:text-blue-400">
                {seconds}s
              </b>
            </span>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => loadLivePin(true)}
            className="flex cursor-pointer items-center space-x-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-50"
          >
            <RefreshCwIcon className={`size-3 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Đang tạo..." : "Tạo mã mới"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StaffPinPanel
