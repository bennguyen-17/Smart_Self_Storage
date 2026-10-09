import { useEffect, useState } from "react"
import { ClockIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react"

function randomPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** Tab LẤY MÃ PIN — PIN cổng động 30s, bám prototype staff.html */
function StaffPinPanel() {
  const [pin, setPin] = useState(randomPin)
  const [seconds, setSeconds] = useState(30)

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  function regenerate() {
    setPin(randomPin())
    setSeconds(30)
  }

  const expired = seconds <= 0

  return (
    <div className="mx-auto my-3 max-w-xl space-y-2.5">
      <div className="card-box relative space-y-2.5 overflow-hidden rounded-2xl border border-blue-500 p-4 text-center shadow-xl">
        <div className="flex items-center justify-center space-x-1 text-[10px] font-black tracking-wider text-blue-600 uppercase dark:text-blue-400">
          <ShieldCheckIcon className="size-3.5" />
          <span>Staff PIN Entry Pass • Cổng tòa nhà 24/7</span>
        </div>

        <div className="pin-display-box relative mx-auto flex h-24 w-full flex-col items-center justify-center space-y-0.5 rounded-xl border p-2.5 shadow-inner">
          <div className="text-[9px] font-bold tracking-widest uppercase">
            Mã PIN xác thực cổng
          </div>
          <div className="font-mono text-3xl font-black tracking-widest sm:text-4xl">
            {pin}
          </div>

          {expired && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-1 rounded-xl bg-slate-950/95 p-2 text-center text-white backdrop-blur-sm">
              <ClockIcon className="size-5 animate-bounce text-amber-400" />
              <span className="text-[10px] font-black text-amber-300">
                MÃ PIN ĐÃ HẾT HẠN (30S)!
              </span>
              <button
                type="button"
                onClick={regenerate}
                className="flex cursor-pointer items-center space-x-1 rounded-lg bg-blue-600 px-3 py-1 text-[10px] font-extrabold text-white shadow transition hover:bg-blue-500"
              >
                <RefreshCwIcon className="size-3" />
                <span>Bấm lấy mã PIN mới</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-1 text-[10px] font-bold text-slate-700 dark:text-slate-300">
          <div className="flex items-center space-x-1.5">
            <ClockIcon className="size-3.5 text-amber-500" />
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
            className="flex cursor-pointer items-center space-x-1 rounded-md bg-blue-600 px-2.5 py-1 text-[10.5px] font-extrabold text-white transition hover:bg-blue-500"
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
