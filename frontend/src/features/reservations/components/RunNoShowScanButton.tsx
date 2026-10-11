import { useState } from "react"
import { FlaskConicalIcon, PlayIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { getErrorMessage } from "@/lib/api"
import { formatDateTime } from "@/lib/format"

import { runNoShowScan } from "../api/reservationApi"
import type { NoShowScanResult } from "../types"

type ScanState =
  | { step: "idle" }
  | { step: "confirming" }
  | { step: "running" }
  | { step: "done"; result: NoShowScanResult }
  | { step: "failed"; message: string }

interface RunNoShowScanButtonProps {
  onCompleted: (result: NoShowScanResult) => void
}

/**
 * Công cụ demo khi bảo vệ đồ án: chạy tay cron No-Show (BR-17) thay vì chờ 00:00.
 * Chỉ hiện khi VITE_ENABLE_DEMO_TOOLS=true (xem nơi dùng).
 */
function RunNoShowScanButton({ onCompleted }: RunNoShowScanButtonProps) {
  const [state, setState] = useState<ScanState>({ step: "idle" })

  async function handleRun() {
    setState({ step: "running" })
    try {
      const result = await runNoShowScan()
      setState({ step: "done", result })
      onCompleted(result)
    } catch (error) {
      setState({ step: "failed", message: getErrorMessage(error) })
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-amber-400 bg-amber-50/60 p-4 dark:border-amber-700 dark:bg-amber-950/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
          <FlaskConicalIcon aria-hidden="true" className="size-4" />
          Công cụ demo (Quản trị viên)
        </p>
        {state.step !== "confirming" && (
          <Button
            onClick={() => setState({ step: "confirming" })}
            disabled={state.step === "running"}
          >
            {state.step === "running" ? (
              <Spinner />
            ) : (
              <PlayIcon aria-hidden="true" />
            )}
            Chạy quét No-Show ngay bây giờ
          </Button>
        )}
      </div>

      {state.step === "confirming" && (
        <div
          role="group"
          aria-label="Xác nhận chạy quét No-Show"
          className="space-y-2 text-sm"
        >
          <p>
            Hệ thống sẽ hủy mọi đơn <strong>PENDING_CHECKIN</strong> có ngày hẹn
            trước hôm nay, tịch thu 100% cọc và trả ô kho về AVAILABLE.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleRun}>Xác nhận chạy</Button>
            <Button
              variant="outline"
              onClick={() => setState({ step: "idle" })}
            >
              Hủy
            </Button>
          </div>
        </div>
      )}

      <div aria-live="polite">
        {state.step === "done" && (
          <Alert>
            <AlertTitle>
              Quét xong lúc {formatDateTime(state.result.scannedAt)}
            </AlertTitle>
            <AlertDescription>
              {state.result.canceledCount === 0
                ? "Không có đơn nào quá hạn check-in."
                : `Đã hủy ${state.result.canceledCount} đơn: ${state.result.reservationCodes.join(", ")}`}
            </AlertDescription>
          </Alert>
        )}
        {state.step === "failed" && (
          <Alert variant="destructive">
            <AlertTitle>Chạy quét thất bại</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

export default RunNoShowScanButton
