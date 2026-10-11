import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
} from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { useAsyncData } from "@/hooks/useAsyncData"

import { listReservations } from "../api/reservationApi"
import ReservationDetailDialog from "../components/ReservationDetailDialog"
import ReservationTable from "../components/ReservationTable"
import RunNoShowScanButton from "../components/RunNoShowScanButton"
import { PAGE_SIZE, RESERVATION_TABS, findTab } from "../constants"

const DEMO_TOOLS_ENABLED = import.meta.env.VITE_ENABLE_DEMO_TOOLS === "true"

/** US-06: Quản lý đơn đặt cọc (Staff / Admin), gồm tab "Đã hủy do No-Show" */
function ReservationManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = findTab(searchParams.get("tab"))
  const page = Math.max(0, Number(searchParams.get("page") ?? 0) || 0)

  const [reloadCount, setReloadCount] = useState(0)
  const [openCode, setOpenCode] = useState<string | null>(null)

  const { data, error, isLoading } = useAsyncData(
    `${tab.key}|${page}|${reloadCount}`,
    () =>
      listReservations({
        status: tab.status,
        reason: tab.reason,
        page,
        size: PAGE_SIZE,
      })
  )

  function goTo(tabKey: string, nextPage = 0) {
    setSearchParams(
      nextPage > 0 ? { tab: tabKey, page: String(nextPage) } : { tab: tabKey }
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <header className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Cổng nhân viên · Quản trị
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ClipboardListIcon
              aria-hidden="true"
              className="size-6 text-primary"
            />
            Quản lý đơn đặt cọc
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi đơn giữ chỗ chờ nhận kho và các đơn bị hệ thống tự động hủy
            do khách không đến nhận kho (BR-17).
          </p>
        </header>

        {DEMO_TOOLS_ENABLED && (
          <RunNoShowScanButton
            onCompleted={() => {
              goTo("no-show")
              setReloadCount((n) => n + 1)
            }}
          />
        )}

        <nav
          aria-label="Lọc theo trạng thái đơn"
          className="flex flex-wrap gap-2"
        >
          {RESERVATION_TABS.map((t) => {
            const active = t.key === tab.key
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={active}
                onClick={() => goTo(t.key)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active
                    ? t.reason === "NO_SHOW"
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-muted"
                )}
              >
                {t.label}
              </button>
            )
          })}
        </nav>

        <ReservationTable
          tab={tab}
          rows={data?.content}
          isLoading={isLoading}
          error={error}
          onRetry={() => setReloadCount((n) => n + 1)}
          onOpen={setOpenCode}
        />

        {data && data.totalElements > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              {data.totalElements} đơn · Trang {data.page + 1}/{data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => goTo(tab.key, page - 1)}
              >
                <ChevronLeftIcon aria-hidden="true" /> Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= data.totalPages}
                onClick={() => goTo(tab.key, page + 1)}
              >
                Sau <ChevronRightIcon aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        <ReservationDetailDialog
          reservationCode={openCode}
          onClose={() => setOpenCode(null)}
        />
      </main>
    </div>
  )
}

export default ReservationManagementPage
