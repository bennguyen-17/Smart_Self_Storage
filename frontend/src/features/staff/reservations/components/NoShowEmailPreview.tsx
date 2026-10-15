import { useMemo } from "react"
import { CopyIcon, MailIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { buildNoShowEmail } from "../email/noShowEmailTemplate"
import type { Reservation } from "../types"

interface NoShowEmailPreviewProps {
  reservation: Reservation
}

function NoShowEmailPreview({ reservation }: NoShowEmailPreviewProps) {
  const email = useMemo(() => buildNoShowEmail(reservation), [reservation])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email.html)
      toast.success("Đã sao chép HTML email")
    } catch {
      toast.error("Trình duyệt không cho phép sao chép")
    }
  }

  return (
    <section aria-label="Xem trước email thông báo" className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg border bg-muted/50 p-3 text-xs">
        <dl className="grid min-w-0 flex-1 grid-cols-[auto_1fr] gap-x-2 gap-y-1">
          <dt className="text-muted-foreground">Tới:</dt>
          <dd className="truncate font-medium">
            {reservation.customerName} &lt;{reservation.customerEmail}&gt;
          </dd>
          <dt className="text-muted-foreground">Tiêu đề:</dt>
          <dd className="font-medium">{email.subject}</dd>
        </dl>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <CopyIcon aria-hidden="true" />
          Sao chép HTML
        </Button>
      </div>
      {/* sandbox không có allow-scripts: HTML email không thể chạy JS */}
      <iframe
        title={`Xem trước email hủy đặt chỗ ${reservation.reservationCode}`}
        srcDoc={email.html}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        className="h-[520px] w-full rounded-lg border bg-white"
      />
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <MailIcon aria-hidden="true" className="size-3.5" />
        Bản xem trước. Email thật do backend gửi khi cron No-Show chạy.
      </p>
    </section>
  )
}

export default NoShowEmailPreview
