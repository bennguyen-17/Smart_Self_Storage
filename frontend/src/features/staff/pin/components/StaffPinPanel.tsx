import { useCallback, useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/context/AuthContext"
import { fetchStaffGatePin } from "@/features/staff/checkin/api/checkinApi"

const TTL_TOTAL = 15 // Business Rule: IoT Gate PIN TTL 15s

/** Tab LẤY MÃ PIN — PIN cổng động 15s cho Nhân viên cơ sở 24/7 */
function StaffPinPanel() {
  const { user } = useAuth()
  const [pin, setPin] = useState<string>("--- ---")
  const [seconds, setSeconds] = useState<number>(TTL_TOTAL)
  const [loading, setLoading] = useState<boolean>(false)
  const [facilityCode, setFacilityCode] = useState<string>(
    ((user as { facilityCode?: string })?.facilityCode || "HN-01").replace("-", "")
  )

  const loadLivePin = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true)
      const data = await fetchStaffGatePin()
      if (data && data.success) {
        const raw = data.pin || data.rawPin || ""
        // Chuẩn hóa định dạng "XXX XXX" cho khớp với giao diện mẫu
        const clean = raw.replace(/\s+/g, "")
        const formatted = clean.length === 6 ? `${clean.slice(0, 3)} ${clean.slice(3)}` : (raw || "--- ---")
        setPin(formatted)
        setSeconds(data.ttlSeconds > 0 ? data.ttlSeconds : TTL_TOTAL)
        if (data.facilityCode) {
          setFacilityCode(data.facilityCode.replace("-", ""))
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
          loadLivePin()
          return TTL_TOTAL
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loadLivePin])

  const handleCopy = () => {
    if (!pin || pin === "--- ---") return
    navigator.clipboard.writeText(pin.replace(/\s+/g, ""))
    toast.success(`Đã sao chép mã PIN cổng: ${pin}`)
  }

  return (
    <div className="mx-auto my-6 max-w-xl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
        {/* Header Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold">
            <Clock className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span>Đổi sau: {seconds}s</span>
          </div>
        </div>

        {/* Dãy Số PIN 6 Chữ Số Lớn */}
        <div className="py-6 sm:py-8 text-center space-y-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
            MÃ BÀN PHÍM CỬA CHÍNH (6 CHỮ SỐ)
          </p>
          <div
            onClick={handleCopy}
            title="Bấm để sao chép"
            className="text-4xl sm:text-6xl font-bold font-mono tracking-[0.25em] select-all transition-all duration-300 text-blue-600 dark:text-blue-400 cursor-pointer hover:opacity-90"
          >
            {loading ? "--- ---" : pin}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto px-4">
            Nhập trực tiếp dãy 6 số này tại bàn phím số gắn trước cổng chính để mở cửa.
          </p>
        </div>

        {/* Footer info bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            CƠ SỞ: {facilityCode}
          </span>
          <span>Tự động mã hóa động mỗi 15s</span>
        </div>
      </div>
    </div>
  )
}

export default StaffPinPanel
