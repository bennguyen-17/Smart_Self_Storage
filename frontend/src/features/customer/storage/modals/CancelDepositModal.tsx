import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CancelDepositModalProps {
  contract: any;
  onClose: () => void;
  onConfirm: (bankInfo: { bankName: string; bankAccountNumber: string; bankAccountName: string }) => Promise<void>;
  isCancelling: boolean;
}

export default function CancelDepositModal({
  contract,
  onClose,
  onConfirm,
  isCancelling
}: CancelDepositModalProps) {
  const [bankName, setBankName] = useState('Vietcombank');
  const [customBankName, setCustomBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Tự điền tên tài khoản từ profile
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.fullName) setAccountName(u.fullName.toUpperCase());
      }
    } catch (e) { }
  }, []);

  // Tính số ngày còn lại đến ngày nhận kho
  const daysUntilStart = (() => {
    if (!contract?.startDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(contract.startDate);
    start.setHours(0, 0, 0, 0);
    const diffTime = start.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  })();

  const isRefundEligible = daysUntilStart >= 4;
  const depositVal = contract?.depositAmount ?? contract?.depositFee ?? 500000;
  const refundAmount = isRefundEligible ? depositVal : Math.round(depositVal * 0.5);

  const handleSubmit = async () => {
    const finalBankName = bankName === 'Khác' ? customBankName.trim() : bankName;
    if (bankName === 'Khác' && !finalBankName) {
      setError('Vui lòng nhập tên ngân hàng của bạn.');
      return;
    }
    if (!accountNumber.trim()) {
      setError('Vui lòng nhập số tài khoản ngân hàng để nhận tiền cọc.');
      return;
    }
    if (!accountName.trim()) {
      setError('Vui lòng nhập tên chủ tài khoản thụ hưởng.');
      return;
    }
    setError('');
    try {
      await onConfirm({
        bankName: finalBankName,
        bankAccountNumber: accountNumber.trim(),
        bankAccountName: accountName.trim().toUpperCase()
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi hủy cọc.');
    }
  };

  if (typeof document === 'undefined') return null;

  if (isSuccess) {
    return createPortal(
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 text-center space-y-4 modal-animate-pop">
          {/* Icon success */}
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-3xl mx-auto flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-circle-check text-3xl"></i>
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              ĐÃ HỦY ĐẶT CỌC THÀNH CÔNG
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hợp đồng <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{contract.contractId || contract.reservationCode}</span> đã được hủy bỏ thành công.
            </p>
          </div>

          {/* KHUNG THÔNG BÁO: CHỜ MANAGER HOÀN CỌC TRONG 24-48H */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 text-left space-y-2.5">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs uppercase tracking-wide">
              <i className="fa-solid fa-clock-rotate-left text-sm"></i>
              <span>Chờ Quản lý hoàn tiền cọc</span>
            </div>

            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
              Yêu cầu hủy cọc của bạn đã được ghi nhận. <strong>Quản lý cơ sở</strong> sẽ kiểm tra và thực hiện thanh toán hoàn cọc về tài khoản của bạn trong vòng <strong>24 – 48 giờ tới</strong>.
            </p>

            <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/80 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Tiền cọc hoàn dự kiến:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {refundAmount.toLocaleString('vi-VN')} đ ({isRefundEligible ? 'Hoàn 100%' : 'Hoàn 50%'})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Ngân hàng nhận:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{accountNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase">{accountName}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-check"></i>
            <span>ĐÃ HIỂU &amp; ĐÓNG</span>
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden modal-animate-pop my-auto">
        {/* Header - Fixed */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center space-x-3 text-rose-600 dark:text-rose-400 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-base font-bold shrink-0">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase truncate">XÁC NHẬN HỦY ĐẶT CỌC</h3>
            <p className="text-[11px] text-slate-500">Vui lòng đọc kĩ chính sách hoàn tiền đặt cọc</p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">

        {/* THÔNG TIN HỢP ĐỒNG */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2 text-slate-700 dark:text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Hợp đồng:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{contract.contractId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Ô kho đặt cọc:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{contract.unitCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Cơ sở:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{contract.branchName}</span>
          </div>
        </div>

        {/* CHÍNH SÁCH HOÀN TIỀN (Bố cục cái cũ nhưng màu dịu, sạch) */}
        <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${isRefundEligible
            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
            : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
          }`}>
          <div className="flex items-start gap-2.5">
            <div className={`mt-0.5 size-5 shrink-0 flex items-center justify-center rounded-full text-[11px] ${isRefundEligible
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
              }`}>
              <i className={`fa-solid ${isRefundEligible ? 'fa-check' : 'fa-exclamation'}`}></i>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 dark:text-white text-xs">
                {isRefundEligible ? 'Đủ điều kiện hoàn 100% tiền cọc' : 'Hủy cận ngày: Hoàn 50% tiền cọc'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {daysUntilStart > 0 ? `Còn ${daysUntilStart} ngày đến ngày nhận kho` : 'Hôm nay là ngày nhận kho'}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {isRefundEligible
              ? `Do hủy trước ngày nhận kho từ 4 ngày trở lên, toàn bộ 100% tiền cọc sẽ được hoàn lại cho bạn.`
              : `Do hủy trước ngày nhận kho dưới 4 ngày, bạn sẽ bị khấu trừ 50% tiền cọc làm phí phạt, và được hoàn lại 50%.`}
          </div>
        </div>

        {/* FORM THÔNG TIN NGÂN HÀNG */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Thông tin tài khoản nhận tiền hoàn cọc
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Ngân hàng thụ hưởng:
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Vietcombank">Vietcombank (VCB)</option>
                <option value="MB Bank">MB Bank (Quân Đội)</option>
                <option value="Techcombank">Techcombank (TCB)</option>
                <option value="ACB">ACB (Á Châu)</option>
                <option value="VPBank">VPBank</option>
                <option value="TPBank">TPBank (Tiên Phong)</option>
                <option value="BIDV">BIDV</option>
                <option value="Agribank">Agribank</option>
                <option value="VietinBank">VietinBank</option>
                <option value="Khác">Ngân hàng khác</option>
              </select>

              {bankName === 'Khác' && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Nhập tên ngân hàng của bạn (VD: OCB, VIB, Sacombank...)"
                    value={customBankName}
                    onChange={(e) => {
                      setCustomBankName(e.target.value);
                      setError('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:border-blue-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Số tài khoản (STK): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: 1029384756"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Tên chủ tài khoản: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: NGUYEN VAN A"
                  value={accountName}
                  onChange={(e) => {
                    setAccountName(e.target.value.toUpperCase());
                    setError('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs uppercase focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
                <i className="fa-solid fa-circle-exclamation"></i> {error}
              </p>
            )}
          </div>
        </div>

        </div>

        {/* Footer - Fixed */}
        <div className="p-4 px-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end space-x-2.5 shrink-0">
          <button
            type="button"
            disabled={isCancelling}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Giữ lại
          </button>
          <button
            type="button"
            disabled={isCancelling}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition flex items-center space-x-2 cursor-pointer"
          >
            {isCancelling ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-ban"></i>}
            <span>{isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy cọc'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
