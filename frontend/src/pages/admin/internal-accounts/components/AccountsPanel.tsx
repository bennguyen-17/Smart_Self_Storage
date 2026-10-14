import { useMemo, useState } from "react"
import {
  InboxIcon,
  KeyRoundIcon,
  LockIcon,
  LockOpenIcon,
  PlusIcon,
  RotateCwIcon,
  SearchIcon,
  UserCogIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Pagination } from "@/components/internal/components/PanelKit"
import { usePagedRows } from "@/components/internal/usePagedRows"
import { getFacilities } from "@/pages/floorplan/api/floorPlanApi"
import { useAsyncData } from "@/hooks/useAsyncData"
import { getStoredUser } from "@/hooks/useAuthSession"
import { getErrorMessage } from "@/lib/api"
import { formatDateTime } from "@/lib/format"
import type { Facility } from "@/types"

import { createAccount, listAccounts, setAccountStatus, updateAccountAssignment } from "../api/accountApi"
import {
  filterAccounts,
  INTERNAL_ROLES,
  isSelf,
  ROLE_LABEL,
  roleNeedsFacility,
  validateAccountForm,
  type AccountFormErrors,
} from "../accountRules"
import type { AccountFilter, AccountFormValues, InternalAccount, InternalRole } from "../types"

/** Tên cơ sở thường đã chứa mã, ví dụ "SmartStorage Cầu Giấy (HN-01)": chỉ ghép mã khi tên chưa có */
function facilityDisplayName(f: Facility): string {
  return f.facilityName.includes(f.facilityCode) ? f.facilityName : `${f.facilityCode} · ${f.facilityName}`
}

const EMPTY_FILTER: AccountFilter = { query: "", role: "ALL", facilityId: "ALL", status: "ALL" }
const EMPTY_FORM: AccountFormValues = { fullName: "", email: "", phone: "", role: "STAFF", facilityId: "" }

const ROLE_BADGE: Record<InternalRole, string> = {
  ADMIN: "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
  BOM: "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
  MANAGER: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  STAFF: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
}

type DialogState =
  | { kind: "create" }
  | { kind: "assign"; account: InternalAccount }
  | { kind: "status"; account: InternalAccount }

/** US-29: Admin tạo tài khoản nội bộ, gán vai trò và cơ sở, khóa / mở khóa */
function AccountsPanel() {
  const currentId = useMemo(() => {
    const id = Number(getStoredUser()?.id)
    return Number.isInteger(id) && id > 0 ? id : null
  }, [])
  const [reloadCount, setReloadCount] = useState(0)
  const [filter, setFilter] = useState<AccountFilter>(EMPTY_FILTER)
  const [dialog, setDialog] = useState<DialogState | null>(null)

  const accounts = useAsyncData(`accounts#${reloadCount}`, listAccounts)
  const facilities = useAsyncData("facilities", getFacilities)
  const facilityList = facilities.data ?? []
  const facilityLabel = (id: number | null) => {
    if (id === null) return "Toàn hệ thống"
    const f = facilityList.find((x) => x.facilityId === id)
    return f ? facilityDisplayName(f) : `Cơ sở #${id}`
  }

  const all = accounts.data ?? []
  const rows = filterAccounts(all, filter)
  const { slice, pagination } = usePagedRows(rows, JSON.stringify(filter))
  const update = (patch: Partial<AccountFilter>) => setFilter((f) => ({ ...f, ...patch }))

  function done(message: string) {
    toast.success(message)
    setDialog(null)
    setReloadCount((n) => n + 1)
  }

  return (
    <section aria-label="Quản lý tài khoản nội bộ" className="space-y-4">
      {accounts.error ? (
        <Alert variant="destructive">
          <AlertTitle>Không tải được danh sách tài khoản</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {accounts.error}
            <Button variant="outline" size="sm" onClick={() => setReloadCount((n) => n + 1)}>
              <RotateCwIcon aria-hidden="true" /> Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="card-box flex flex-wrap items-end gap-3 rounded-2xl border p-4 shadow-sm">
            <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs font-bold">
              <span className="text-title">Tìm kiếm</span>
              <span className="relative">
                <SearchIcon
                  aria-hidden="true"
                  className="text-muted pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
                />
                <input
                  type="search"
                  value={filter.query}
                  onChange={(e) => update({ query: e.target.value })}
                  placeholder="Họ tên, email hoặc số điện thoại"
                  className="inner-box text-title w-full rounded-lg border py-1.5 pr-2.5 pl-8 text-xs font-semibold outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                />
              </span>
            </label>
            <SelectField
              label="Vai trò"
              value={filter.role}
              onChange={(v) => update({ role: v as AccountFilter["role"] })}
              options={[{ value: "ALL", label: "Tất cả vai trò" }, ...INTERNAL_ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))]}
            />
            <SelectField
              label="Cơ sở"
              value={String(filter.facilityId)}
              onChange={(v) => update({ facilityId: v === "ALL" ? "ALL" : Number(v) })}
              options={[
                { value: "ALL", label: "Tất cả cơ sở" },
                ...facilityList.map((f) => ({ value: String(f.facilityId), label: f.facilityCode })),
              ]}
            />
            <SelectField
              label="Trạng thái"
              value={filter.status}
              onChange={(v) => update({ status: v as AccountFilter["status"] })}
              options={[
                { value: "ALL", label: "Tất cả" },
                { value: "ACTIVE", label: "Đang hoạt động" },
                { value: "LOCKED", label: "Đã khóa" },
              ]}
            />
            <Button
              onClick={() => setDialog({ kind: "create" })}
              className="ml-auto bg-blue-600 text-white hover:bg-blue-500"
            >
              <PlusIcon aria-hidden="true" /> Tạo tài khoản
            </Button>
          </div>

          <p className="text-muted text-xs" aria-live="polite">
            {accounts.isLoading ? "Đang tải tài khoản…" : `${rows.length} / ${all.length} tài khoản`}
          </p>

          <div className="card-box overflow-x-auto rounded-2xl border shadow-sm">
            <table className="w-full min-w-[860px] text-left text-xs">
              <caption className="sr-only">Danh sách tài khoản nội bộ</caption>
              <thead className="text-muted border-b text-[11px] uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Tài khoản</th>
                  <th scope="col" className="px-4 py-3 font-bold">Vai trò</th>
                  <th scope="col" className="px-4 py-3 font-bold">Cơ sở</th>
                  <th scope="col" className="px-4 py-3 font-bold">Trạng thái</th>
                  <th scope="col" className="px-4 py-3 font-bold">Đăng nhập cuối</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody aria-busy={accounts.isLoading}>
                {accounts.isLoading &&
                  Array.from({ length: 4 }, (_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))}
                {!accounts.isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <InboxIcon aria-hidden="true" className="text-muted mx-auto mb-2 size-7" />
                      <p className="text-title font-semibold">Không có tài khoản phù hợp bộ lọc</p>
                    </td>
                  </tr>
                )}
                {!accounts.isLoading &&
                  slice.rows.map((a) => {
                    const self = isSelf(a, currentId)
                    const selfNote = self ? "Không thể tự khóa hoặc tự đổi vai trò của chính mình" : undefined
                    return (
                      <tr key={a.accountId} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <p className="text-title font-bold">
                            {a.fullName}
                            {self && <span className="text-muted ml-1 font-semibold">(bạn)</span>}
                          </p>
                          <p className="text-muted">{a.email}</p>
                          {a.phone && <p className="text-muted">{a.phone}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", ROLE_BADGE[a.role])}>
                            {ROLE_LABEL[a.role]}
                          </span>
                        </td>
                        <td className="text-title px-4 py-3">{facilityLabel(a.facilityId)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
                                a.status === "ACTIVE"
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              )}
                            >
                              {a.status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
                            </span>
                            {a.mustChangePassword && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                <KeyRoundIcon aria-hidden="true" className="size-3" /> Chờ đổi mật khẩu tạm
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-muted px-4 py-3 whitespace-nowrap">
                          {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "Chưa đăng nhập"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={self}
                              title={selfNote}
                              aria-label={`Phân quyền ${a.fullName}`}
                              onClick={() => setDialog({ kind: "assign", account: a })}
                            >
                              <UserCogIcon aria-hidden="true" /> Phân quyền
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={self}
                              title={selfNote}
                              aria-label={`${a.status === "ACTIVE" ? "Khóa" : "Mở khóa"} ${a.fullName}`}
                              onClick={() => setDialog({ kind: "status", account: a })}
                            >
                              {a.status === "ACTIVE" ? <LockIcon aria-hidden="true" /> : <LockOpenIcon aria-hidden="true" />}
                              {a.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          {!accounts.isLoading && <Pagination {...pagination} unit="tài khoản" />}
        </>
      )}

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          {dialog?.kind === "create" && (
            <AccountForm
              mode="create"
              initial={EMPTY_FORM}
              facilities={facilityList}
              onCancel={() => setDialog(null)}
              onSubmit={async (values) => {
                const created = await createAccount(values)
                done(`Đã tạo tài khoản ${created.email}. Mật khẩu tạm đã được gửi qua email.`)
              }}
            />
          )}
          {dialog?.kind === "assign" && (
            <AccountForm
              mode="assign"
              initial={{
                fullName: dialog.account.fullName,
                email: dialog.account.email,
                phone: dialog.account.phone ?? "",
                role: dialog.account.role,
                facilityId: dialog.account.facilityId ?? "",
              }}
              facilities={facilityList}
              onCancel={() => setDialog(null)}
              onSubmit={async (values) => {
                await updateAccountAssignment(dialog.account.accountId, values)
                done(`Đã cập nhật phân quyền cho ${dialog.account.fullName}`)
              }}
            />
          )}
          {dialog?.kind === "status" && (
            <StatusConfirm
              account={dialog.account}
              onCancel={() => setDialog(null)}
              onConfirm={async () => {
                const next = dialog.account.status === "ACTIVE" ? "LOCKED" : "ACTIVE"
                await setAccountStatus(dialog.account.accountId, next)
                done(`${next === "LOCKED" ? "Đã khóa" : "Đã mở khóa"} tài khoản ${dialog.account.fullName}`)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function AccountForm({
  mode,
  initial,
  facilities,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "assign"
  initial: AccountFormValues
  facilities: Facility[]
  onCancel: () => void
  onSubmit: (values: AccountFormValues) => Promise<void>
}) {
  const [values, setValues] = useState<AccountFormValues>(initial)
  const [showErrors, setShowErrors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const errors: AccountFormErrors = validateAccountForm(values)
  const visible = showErrors ? errors : {}
  const needsFacility = roleNeedsFacility(values.role)
  const set = (patch: Partial<AccountFormValues>) => setValues((v) => ({ ...v, ...patch }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setShowErrors(true)
    if (Object.keys(errors).length > 0) return
    setSubmitting(true)
    setServerError(null)
    try {
      await onSubmit(values)
    } catch (err) {
      setServerError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Tạo tài khoản nội bộ" : `Phân quyền ${initial.fullName}`}</DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Hệ thống sẽ gửi mật khẩu tạm tới email này; người dùng phải đổi mật khẩu ở lần đăng nhập đầu."
            : `${initial.email} · Đổi vai trò hoặc cơ sở làm việc.`}
        </DialogDescription>
      </DialogHeader>

      {mode === "create" && (
        <>
          <TextField id="acc-name" label="Họ và tên" required value={values.fullName} error={visible.fullName} onChange={(fullName) => set({ fullName })} />
          <TextField id="acc-email" label="Email" type="email" required value={values.email} error={visible.email} onChange={(email) => set({ email })} />
          <TextField id="acc-phone" label="Số điện thoại (tùy chọn)" type="tel" value={values.phone} error={visible.phone} onChange={(phone) => set({ phone })} />
        </>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-bold">
          <span>
            Vai trò <span className="text-rose-500">*</span>
          </span>
          <select
            value={values.role}
            onChange={(e) => set({ role: e.target.value as InternalRole })}
            className="rounded-lg border bg-background px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          >
            {INTERNAL_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold">
          <span>Cơ sở {needsFacility && <span className="text-rose-500">*</span>}</span>
          <select
            value={needsFacility ? String(values.facilityId) : ""}
            disabled={!needsFacility}
            onChange={(e) => set({ facilityId: e.target.value === "" ? "" : Number(e.target.value) })}
            aria-invalid={Boolean(visible.facilityId)}
            aria-describedby={visible.facilityId ? "acc-facility-error" : undefined}
            className="rounded-lg border bg-background px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 aria-invalid:border-rose-500"
          >
            <option value="">{needsFacility ? "Chọn cơ sở" : "Toàn hệ thống"}</option>
            {facilities.map((f) => (
              <option key={f.facilityId} value={f.facilityId}>
                {facilityDisplayName(f)}
              </option>
            ))}
          </select>
          {visible.facilityId && (
            <span id="acc-facility-error" className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              {visible.facilityId}
            </span>
          )}
        </label>
      </div>

      {serverError && (
        <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          {serverError}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={submitting} className="bg-blue-600 text-white hover:bg-blue-500">
          {submitting && <Spinner />}
          {mode === "create" ? "Tạo tài khoản" : "Lưu thay đổi"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function StatusConfirm({
  account,
  onCancel,
  onConfirm,
}: {
  account: InternalAccount
  onCancel: () => void
  onConfirm: () => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const locking = account.status === "ACTIVE"

  async function confirm() {
    setSubmitting(true)
    setServerError(null)
    try {
      await onConfirm()
    } catch (err) {
      setServerError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{locking ? `Khóa tài khoản ${account.fullName}?` : `Mở khóa tài khoản ${account.fullName}?`}</DialogTitle>
        <DialogDescription>
          {locking
            ? "Người dùng sẽ bị đăng xuất và không đăng nhập được cho đến khi được mở khóa. Dữ liệu và nhật ký vẫn được giữ nguyên."
            : "Người dùng đăng nhập lại được với mật khẩu hiện tại."}
        </DialogDescription>
      </DialogHeader>
      {serverError && (
        <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          {serverError}
        </p>
      )}
      <DialogFooter>
        <Button variant="outline" disabled={submitting} onClick={onCancel}>
          Hủy
        </Button>
        <Button
          disabled={submitting}
          onClick={confirm}
          className={locking ? "bg-rose-600 text-white hover:bg-rose-500" : "bg-blue-600 text-white hover:bg-blue-500"}
        >
          {submitting && <Spinner />}
          {locking ? "Khóa tài khoản" : "Mở khóa"}
        </Button>
      </DialogFooter>
    </>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  type?: string
}) {
  return (
    <div className="flex flex-col gap-1 text-xs font-bold">
      <label htmlFor={id}>
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="rounded-lg border bg-background px-2.5 py-2 text-xs font-semibold outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 aria-invalid:border-rose-500"
      />
      {error && (
        <span id={`${id}-error`} className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </span>
      )}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-bold">
      <span className="text-title">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="inner-box text-title min-w-36 cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default AccountsPanel
