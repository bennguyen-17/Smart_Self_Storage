import React from 'react';
import { formatDate } from '@/lib/format';
import { AT_COUNTER_NOTE, canExtendOnline, extendModeOf } from '../contractRules';

interface StorageTableProps {
  contracts: any[];
  onViewContract: (contract: any) => void;
  onCancelDeposit: (contract: any) => void;
  onExtend: (contract: any) => void;
  onRequestReturn: (contract: any) => void;
  getCancelReasonLabel: (reason?: string) => string;
}

export default function StorageTable({
  contracts,
  onViewContract,
  onCancelDeposit,
  onExtend,
  onRequestReturn,
  getCancelReasonLabel
}: StorageTableProps) {
  return (
    <div className="hidden xl:block overflow-x-auto w-full">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            <th className="py-3 px-4 text-center whitespace-nowrap">Mã Hợp Đồng</th>
            <th className="py-3 px-3 text-center whitespace-nowrap">Mã Ô Kho</th>
            <th className="py-3 px-3 text-center">Cơ Sở</th>
            <th className="py-3 px-3 text-center whitespace-nowrap">Ngày Nhận Kho</th>
            <th className="py-3 px-3 text-center whitespace-nowrap">Ngày Trả Kho</th>
            <th className="py-3 px-3 text-center whitespace-nowrap">Trạng Thái</th>
            <th className="py-3 px-3 text-center whitespace-nowrap">Hành Động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
          {contracts.map((item) => {
            const isPending = item.status === 'PENDING_CHECKIN';
            const isActive = item.status === 'ACTIVE';
            const isTerminated = item.status === 'TERMINATED';
            const isCanceled = item.status === 'CANCELED';
            const isReturnRequested = isActive && Boolean(item.returnRequested || item.cancelReason === 'EARLY_TERMINATION');

            return (
              <tr key={item.contractId} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors group">
                <td className="py-3 px-4 whitespace-nowrap align-middle text-left">
                  <button
                    type="button"
                    onClick={() => onViewContract(item)}
                    title="Xem chi tiết hợp đồng"
                    className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors cursor-pointer text-left"
                  >
                    {item.reservationCode || item.bookingCode || item.contractId}
                  </button>
                </td>
                <td className="py-3 px-3 whitespace-nowrap align-middle text-center">
                  <span className="font-normal text-slate-800 dark:text-slate-200 text-sm">{item.unitCode}</span>
                </td>
                <td className="py-3 px-3 align-middle text-center">
                  <div className="text-sm font-normal text-slate-800 dark:text-slate-200 truncate max-w-[200px] mx-auto" title={item.branchName}>
                    <span className="truncate">{item.branchName ? item.branchName.replace(/\s*\([A-Z0-9-]+\)/g, '') : ''}</span>
                  </div>
                </td>
                <td className="py-3 px-3 whitespace-nowrap align-middle text-center">
                  <span className="text-slate-800 dark:text-slate-200 text-sm font-normal">{formatDate(item.startDate)}</span>
                </td>
                <td className="py-3 px-3 whitespace-nowrap align-middle text-center">
                  <span className="text-slate-800 dark:text-slate-200 text-sm font-normal">{formatDate(item.expiryDate || item.endDate)}</span>
                </td>
                <td className="py-3 px-3 whitespace-nowrap align-middle text-center">
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold border ${
                    isReturnRequested
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : isPending
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : isTerminated
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      isReturnRequested
                        ? 'bg-amber-500 animate-pulse'
                        : isActive
                        ? 'bg-emerald-500'
                        : isPending
                        ? 'bg-amber-500'
                        : isTerminated
                        ? 'bg-slate-500'
                        : 'bg-slate-400'
                    }`}></span>
                    {isReturnRequested
                      ? 'CHỜ TRẢ KHO'
                      : isPending
                      ? 'CHỜ CHECK-IN'
                      : isTerminated
                      ? 'ĐÃ THANH LÝ'
                      : (item.statusLabel || item.status)}
                  </span>
                </td>

                {/* CỘT HÀNH ĐỘNG */}
                <td className="py-3 px-3 text-center whitespace-nowrap align-middle">
                  <div className="inline-flex items-center justify-center gap-1.5">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => onCancelDeposit(item)}
                        className="px-3.5 py-1.5 rounded-xl text-sm font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
                        title="Hủy đặt cọc ô kho"
                      >
                        <i className="fa-solid fa-ban text-sm"></i> Hủy cọc
                      </button>
                    )}

                    {/* Chỉ HĐ ACTIVE chưa yêu cầu trả kho mới được gia hạn online */}
                    {canExtendOnline(item.status) && !isReturnRequested && (
                      <button
                        type="button"
                        onClick={() => onExtend(item)}
                        className="px-3.5 py-1.5 rounded-xl text-sm font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
                      >
                        <i className="fa-solid fa-arrows-rotate text-sm"></i> Gia Hạn
                      </button>
                    )}

                    {isTerminated && (
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">
                        Đã thanh lý &amp; hoàn cọc
                      </span>
                    )}

                    {isCanceled && (
                      <span className="text-sm text-rose-500/90 dark:text-rose-400 font-medium italic" title={getCancelReasonLabel(item.cancelReason)}>
                        {getCancelReasonLabel(item.cancelReason)}
                      </span>
                    )}

                    {/* HĐ OVERDUE */}
                    {extendModeOf(item.status) === 'AT_COUNTER' && (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          disabled
                          className="px-3.5 py-1.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <i className="fa-solid fa-arrows-rotate text-sm"></i> Gia Hạn
                        </button>
                        <span
                          title={AT_COUNTER_NOTE}
                          className="text-xs leading-tight font-semibold text-amber-700 dark:text-amber-300 whitespace-nowrap"
                        >
                          <i className="fa-solid fa-store text-xs mr-1" aria-hidden="true"></i>
                          <span>Gia hạn tại quầy (Tiền mặt)</span>
                        </span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
