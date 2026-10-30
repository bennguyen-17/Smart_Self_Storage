import { PencilIcon, UserIcon } from "lucide-react"
import type { StaffReservationLookup } from "../types"

interface CheckinCustomerCardProps {
  contract: StaffReservationLookup
  isEditingCustomer: boolean
  isSavingCustomer: boolean
  nameInput: string
  cccdInput: string
  setNameInput: (val: string) => void
  setCccdInput: (val: string) => void
  setIsEditingCustomer: (val: boolean) => void
  onSaveCustomerInfo: () => void
  onCancelEditCustomer: () => void
}

export default function CheckinCustomerCard({
  contract,
  isEditingCustomer,
  isSavingCustomer,
  nameInput,
  cccdInput,
  setNameInput,
  setCccdInput,
  setIsEditingCustomer,
  onSaveCustomerInfo,
  onCancelEditCustomer,
}: CheckinCustomerCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserIcon className="size-4 text-blue-600 dark:text-blue-400" />
          <span>Thông tin khách hàng</span>
        </h2>

        {/* Nút thao tác góc phải */}
        {isEditingCustomer ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSaveCustomerInfo}
              disabled={isSavingCustomer}
              className="cursor-pointer rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition active:scale-95"
            >
              {isSavingCustomer ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              type="button"
              onClick={onCancelEditCustomer}
              disabled={isSavingCustomer}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setNameInput(contract.customerName ?? "")
              setCccdInput(contract.customerIdNumber ?? "")
              setIsEditingCustomer(true)
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 transition active:scale-95"
          >
            <PencilIcon className="size-3.5" />
            <span>Hiệu chỉnh</span>
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Họ và tên khách:</span>
          {isEditingCustomer ? (
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Họ và tên khách hàng"
              className="w-56 rounded-lg border border-blue-400 bg-white px-2.5 py-1 text-right text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-blue-500 dark:bg-slate-800 dark:text-white"
              autoFocus
            />
          ) : (
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {contract.customerName ?? "—"}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Số điện thoại:</span>
            {isEditingCustomer && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                (Cố định theo tài khoản)
              </span>
            )}
          </div>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {contract.customerPhone ?? "—"}
          </span>
        </div>

        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Email liên hệ:</span>
            {isEditingCustomer && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                (Cố định theo tài khoản)
              </span>
            )}
          </div>
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[260px]">
            {contract.customerEmail ?? "—"}
          </span>
        </div>

        <div className="flex items-center justify-between py-2.5">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Số CCCD / Định danh:</span>
          {isEditingCustomer ? (
            <input
              type="text"
              maxLength={12}
              value={cccdInput}
              onChange={(e) => setCccdInput(e.target.value.replace(/\D/g, ""))}
              placeholder="12 chữ số CCCD"
              className="w-56 rounded-lg border border-blue-400 bg-white px-2.5 py-1 text-right font-mono text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-blue-500 dark:bg-slate-800 dark:text-white"
            />
          ) : (
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {contract.customerIdNumber ?? "Chưa đối chiếu thẻ gốc"}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
