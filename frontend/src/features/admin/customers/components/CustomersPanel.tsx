import { useState } from "react"
import { LockKeyholeOpenIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  FilterBar,
  LoadError,
  Pagination,
  ResultCount,
  SearchFilter,
  SelectFilter,
  StatusBadge,
  TableCard,
} from "@/components/internal/components/PanelKit"
import { usePagedRows } from "@/components/internal/usePagedRows"
import { useAsyncData } from "@/hooks/useAsyncData"
import { readableError } from "@/components/internal/readableError"
import { formatDateTime } from "@/lib/format"

import { listCustomers, unlockCustomer } from "../api/customerApi"
import { customerStatus, filterCustomers, isLocked, minutesUntilUnlock } from "../customerRules"
import type { AdminCustomer, CustomerFilter, CustomerStatusFilter } from "../types"

const EMPTY_FILTER: CustomerFilter = { query: "", status: "ALL" }

/**
 * Admin › Khách hàng: tra cứu tài khoản khách, thấy ai đang bị khóa do nhập sai mật khẩu 5 lần
 * và mở khóa sớm khi khách gọi hỗ trợ (thao tác được ghi nhật ký).
 */
function CustomersPanel() {
  const [filter, setFilter] = useState<CustomerFilter>(EMPTY_FILTER)
  const [reloadCount, setReloadCount] = useState(0)
  const [unlocking, setUnlocking] = useState<AdminCustomer | null>(null)
  const [busy, setBusy] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)

  const { data, error, isLoading } = useAsyncData(`admin-customers#${reloadCount}`, listCustomers)
  const all = data ?? []
  const rows = filterCustomers(all, filter)
  const { slice, pagination } = usePagedRows(rows, JSON.stringify(filter))
  const lockedCount = all.filter(isLocked).length
  const now = new Date()
  const update = (patch: Partial<CustomerFilter>) => setFilter((f) => ({ ...f, ...patch }))
  const reload = () => setReloadCount((n) => n + 1)

  async function confirmUnlock() {
    if (!unlocking) return
    setBusy(true)
    setUnlockError(null)
    try {
      await unlockCustomer(unlocking.accountId)
      toast.success(`Đã mở khóa tài khoản ${unlocking.fullName ?? unlocking.phone ?? ""}`)
      setUnlocking(null)
      reload()
    } catch (err) {
      setUnlockError(readableError(err))
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return <LoadError title="Không tải được danh sách khách hàng" message={error} onRetry={reload} />
  }

  return (
    <section aria-label="Tài khoản khách hàng" className="space-y-4">
      <FilterBar>
        <SearchFilter value={filter.query} onChange={(query) => update({ query })} placeholder="Tên, số điện thoại hoặc email" />
        <SelectFilter
          label="Trạng thái"
          value={filter.status}
          onChange={(v) => update({ status: v as CustomerStatusFilter })}
          options={[
            { value: "ALL", label: "Tất cả" },
            { value: "LOCKED", label: "Đang bị khóa" },
            { value: "ACTIVE", label: "Đang hoạt động" },
            { value: "OTHER", label: "Khác (chưa xác thực, đã đóng…)" },
          ]}
        />
      </FilterBar>

      {!isLoading && lockedCount > 0 && (
        <p role="status" className="card-box flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 text-xs">
          <span className="font-bold text-rose-600 dark:text-rose-400">{lockedCount} tài khoản đang bị khóa</span>
          <span className="text-muted">
            do nhập sai mật khẩu 5 lần trong 10 phút. Hệ thống tự mở sau 15 phút; mở sớm khi khách đã xác minh qua hỗ trợ.
          </span>
        </p>
      )}

      <ResultCount shown={rows.length} total={all.length} unit="khách hàng" isLoading={isLoading} />

      <TableCard
        caption="Tài khoản khách hàng"
        columns={[
          { header: "Khách hàng" },
          { header: "Số điện thoại" },
          { header: "Email" },
          { header: "Trạng thái" },
          { header: "Thao tác", srOnly: true },
        ]}
        minWidth={820}
        isLoading={isLoading}
        isEmpty={rows.length === 0}
        emptyText={all.length === 0 ? "Chưa có tài khoản khách hàng nào" : "Không có khách hàng phù hợp bộ lọc"}
      >
        {slice.rows.map((c) => {
          const status = customerStatus(c.status)
          const locked = isLocked(c)
          const left = minutesUntilUnlock(c.lockUntil, now)
          return (
            <tr key={c.accountId} className="border-b align-top last:border-0">
              <td className="text-title px-4 py-3 font-bold">{c.fullName ?? `Tài khoản #${c.accountId}`}</td>
              <td className="text-title px-4 py-3 font-mono whitespace-nowrap">{c.phone ?? "—"}</td>
              <td className="text-title max-w-xs px-4 py-3 [overflow-wrap:anywhere]">{c.email ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                {locked && c.lockUntil && (
                  <p className="text-muted mt-1 whitespace-nowrap">
                    Đến {formatDateTime(c.lockUntil)}
                    {left > 0 ? ` (còn ${left} phút)` : ""}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {locked && (
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Mở khóa tài khoản ${c.fullName ?? c.accountId}`}
                    onClick={() => {
                      setUnlockError(null)
                      setUnlocking(c)
                    }}
                  >
                    <LockKeyholeOpenIcon aria-hidden="true" /> Mở khóa
                  </Button>
                )}
              </td>
            </tr>
          )
        })}
      </TableCard>

      {!isLoading && <Pagination {...pagination} unit="khách hàng" />}

      <Dialog open={unlocking !== null} onOpenChange={(open) => !open && !busy && setUnlocking(null)}>
        <DialogContent className="sm:max-w-md">
          {unlocking && (
            <>
              <DialogHeader>
                <DialogTitle>Mở khóa tài khoản?</DialogTitle>
                <DialogDescription>
                  {unlocking.fullName ?? "Khách hàng"} · {unlocking.phone ?? unlocking.email ?? ""}. Chỉ mở khi đã xác minh đúng chủ
                  tài khoản (ví dụ khách gọi tổng đài và đọc đúng thông tin). Số lần nhập sai được đặt lại về 0; thao tác được ghi nhật ký.
                </DialogDescription>
              </DialogHeader>
              {unlockError && (
                <p role="alert" className="[overflow-wrap:anywhere] text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {unlockError}
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" disabled={busy} onClick={() => setUnlocking(null)}>
                  Để sau
                </Button>
                <Button disabled={busy} onClick={confirmUnlock} className="bg-blue-600 text-white hover:bg-blue-500">
                  {busy && <Spinner />}
                  Mở khóa
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default CustomersPanel
