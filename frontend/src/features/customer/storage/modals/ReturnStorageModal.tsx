import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { formatDate, todayInVietnam, addDays } from '@/lib/format';

interface ReturnStorageModalProps {
  contract: any;
  onClose: () => void;
  onConfirm: (data: { reason: string; desiredDate: string }) => Promise<void>;
  isSubmitting: boolean;
}

export default function ReturnStorageModal({
  contract,
  onClose,
  onConfirm,
  isSubmitting,
}: ReturnStorageModalProps) {
  const [reason, setReason] = useState('Đã hết nhu cầu sử dụng kho');
  const minReturnDate = addDays(todayInVietnam(), 1);
  const [desiredDate, setDesiredDate] = useState(() => addDays(todayInVietnam(), 1));
  const [error, setError] = useState('');

  const depositAmount = contract?.depositAmount ?? contract?.depositFee ?? 1000000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do trả kho.');
      return;
    }
    if (!desiredDate || desiredDate < minReturnDate) {
      setError('Ngày hẹn bàn giao trả kho phải báo trước ít nhất 1 ngày (sớm nhất là ngày mai).');
      return;
    }
    setError('');
    await onConfirm({
      reason: reason.trim(),
      desiredDate,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
              <i className="fa-solid fa-box-open"></i>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Yêu Cầu Trả Kho Trước Hạn
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hợp đồng: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{contract?.contractId || contract?.reservationCode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Thông tin kho */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Mã ô kho:</span>
              <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                {contract?.unitCode || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Cơ sở:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {contract?.branchName || 'Cơ sở lưu trữ'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Hạn thuê hiện tại:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {contract?.expiryDate || contract?.endDate || '—'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Tiền cọc được bảo lưu:</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                {Number(depositAmount).toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Ngày mong muốn trả kho */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Ngày mong muốn bàn giao trả kho:
            </label>
            <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
              <div className="w-full px-4 py-2.5 flex items-center justify-between pointer-events-none">
                <span className="font-mono font-bold text-xs sm:text-sm tracking-wide text-slate-800 dark:text-slate-200">
                  {formatDate(desiredDate)}
                </span>
                <CalendarDays className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              </div>
              <input
                type="date"
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
                min={minReturnDate}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                title="Chọn ngày mong muốn bàn giao trả kho (sớm nhất là ngày mai)"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Lưu ý: Quý khách cần báo trước tối thiểu 1 ngày (từ ngày mai trở đi) để nhân viên cơ sở chuẩn bị biên bản nghiệm thu.
            </p>
          </div>

          {/* Lý do trả kho */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Lý do trả kho: <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Đã hoàn tất chuyển nhà, hết nhu cầu lưu trữ hàng hóa..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-xs sm:text-sm focus:border-amber-500 focus:outline-none resize-none"
            ></textarea>
            {error && <p className="text-xs text-rose-500 font-semibold mt-1">{error}</p>}
          </div>

          {/* Quy trình nghiệm thu */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info"></i>
              <span>Quy trình nghiệm thu bàn giao:</span>
            </p>
            <p className="leading-relaxed">
              Sau khi bạn gửi yêu cầu, nhân viên trực ca tại cơ sở sẽ nhận thông báo để tiến hành kiểm tra tình trạng ô kho và lập biên bản nghiệm thu. Tiền cọc sẽ được hoàn trả đầy đủ theo chính sách hợp đồng.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  <span>Đang gửi yêu cầu...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane text-xs"></i>
                  <span>Xác nhận gửi yêu cầu trả kho</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
