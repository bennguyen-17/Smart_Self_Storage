import React from 'react';
import { formatDate } from '@/lib/format';
import { AT_COUNTER_NOTE, canExtendOnline, extendModeOf } from '../contractRules';

interface StorageCardListProps {
  contracts: any[];
  onViewContract: (contract: any) => void;
  onCancelDeposit: (contract: any) => void;
  onExtend: (contract: any) => void;
  onRequestReturn: (contract: any) => void;
  getCancelReasonLabel: (reason?: string) => string;
}

export default function StorageCardList({
  contracts,
  onViewContract,
  onCancelDeposit,
  onExtend,
  onRequestReturn,
  getCancelReasonLabel
}: StorageCardListProps) {
  return (
    <div className="xl:hidden divide-y divide-slate-100 dark:divide-slate-800">
      {contracts.map((item) => {
        const isPending = item.status === 'PENDING_CHECKIN';
        const isActive = item.status === 'ACTIVE';
        const isCompleted = item.status === 'COMPLETED';
        const isTerminated = item.status === 'TERMINATED';
        const isCanceled = item.status === 'CANCELLED';
        const isReturnRequested = isActive && Boolean(item.returnRequested || item.cancelReason === 'EARLY_TERMINATION');

        return (
          <div key={item.contractId} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
            {/* Top Row: Mã hợp đồng, Mã ô kho, Trạng thái */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewContract(item)}
                  title="Bấm để xem chi tiết hợp đồng"
                  className="inline-flex items-center justify-center w-[185px] py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 font-mono font-semibold text-xs transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer text-center"
                >
                  {item.reservationCode || item.bookingCode || item.contractId}
                </button>
                <span className="font-normal text-slate-800 dark:text-slate-200 text-sm">
                  {item.unitCode}
                </span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isReturnRequested
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : isPending
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : isCompleted
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  : isTerminated
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  isReturnRequested
                    ? 'bg-amber-500 animate-pulse'
                    : isActive
                    ? 'bg-emerald-500'
                    : isPending
                    ? 'bg-amber-500'
                    : isCompleted
                    ? 'bg-emerald-500'
                    : isTerminated
                    ? 'bg-slate-500'
                    : 'bg-slate-400'
                }`}></span>
                {isReturnRequested
                  ? 'Chờ trả kho'
                  : isPending
                  ? 'Chờ check-in'
                  : isCompleted
                  ? 'Đã hoàn tất'
                  : isTerminated
                  ? 'Đã thanh lý'
                  : (item.statusLabel || item.status)}
              </span>
            </div>

            {/* Middle Grid: Cơ sở, Kích cỡ, Ngày trả kho */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 dark:text-slate-400 block text-xs font-medium">Cơ sở</span>
                <span className="font-normal text-slate-800 dark:text-slate-200 block mt-0.5 truncate" title={item.branchName}>
                  <span className="truncate">{item.branchName ? item.branchName.replace(/\s*\([A-Z0-9-]+\)/g, '') : ''}</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-400 block text-xs font-medium">Ngày nhận kho</span>
                <span className="font-normal text-slate-800 dark:text-slate-200 block mt-0.5">
                  {formatDate(item.startDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-400 block text-xs font-medium">Ngày trả kho</span>
                <span className="font-normal text-slate-800 dark:text-slate-200 block mt-0.5">
                  {formatDate(item.expiryDate || item.endDate)}
                </span>
              </div>
            </div>

            {/* Bottom Row: Nút hành động */}
            <div className="flex items-center justify-end pt-1 gap-1.5">
              {isPending && (
                <button
                  type="button"
                  onClick={() => onCancelDeposit(item)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
                  title="Hủy đặt cọc ô kho"
                >
                  <i className="fa-solid fa-ban text-xs"></i> Hủy cọc
                </button>
              )}

              {/* Chỉ HĐ ACTIVE chưa yêu cầu trả kho mới được gia hạn online */}
              {canExtendOnline(item.status) && !isReturnRequested && (
                <button
                  type="button"
                  onClick={() => onExtend(item)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
                >
                  <i className="fa-solid fa-arrows-rotate text-xs"></i> Gia Hạn
                </button>
              )}

              {(isCompleted || isTerminated || isCanceled) && (
                <span className="text-slate-400 dark:text-slate-600 font-mono text-sm select-none" title="Không có hành động khả dụng">
                  —
                </span>
              )}

              {extendModeOf(item.status) === 'AT_COUNTER' && (
                <span
                  title={AT_COUNTER_NOTE}
                  className="text-xs text-amber-700 dark:text-amber-300 font-medium italic whitespace-nowrap"
                >
                  Gia hạn tại quầy
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
