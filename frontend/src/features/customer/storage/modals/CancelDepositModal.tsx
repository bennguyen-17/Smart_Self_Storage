import React, { useState, useEffect } from 'react';

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
    } catch (e) {}
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
        bankName,
        bankAccountNumber: accountNumber.trim(),
        bankAccountName: accountName.trim().toUpperCase()
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi hủy cọc.');
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
              <span>Chờ Quản lý (Manager) hoàn tiền cọc</span>
            </div>
            
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
              Yêu cầu hủy cọc của bạn đã được ghi nhận. <strong>Quản lý cơ sở (Manager)</strong> sẽ kiểm tra và thực hiện thanh toán hoàn cọc về tài khoản của bạn trong vòng <strong>24 – 48 giờ tới</strong>.
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
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 modal-animate-pop">
        <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-lg font-bold">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase">XÁC NHẬN HỦY ĐẶT CỌC</h3>
            <p className="text-[11px] text-slate-500">Chính sách hoàn tiền đặt cọc</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2 text-slate-700 dark:text-slate-300">
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

        {/* BẢNG ĐIỀU KIỆN & CHÍNH SÁCH HOÀN TIỀN (BR-17) */}
        <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
          isRefundEligible
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
        }`}>
          <div className="flex items-center justify-between font-bold text-xs">
            <span className="flex items-center gap-1.5">
              <i className={`fa-solid ${isRefundEligible ? 'fa-circle-check text-emerald-600 dark:text-emerald-400' : 'fa-circle-exclamation text-amber-600 dark:text-amber-400'}`}></i>
              {isRefundEligible ? 'Đủ điều kiện hoàn 100% tiền cọc' : 'Hủy cận ngày: Hoàn 50% tiền cọc'}
            </span>
            <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-current font-bold">
              Còn {daysUntilStart > 0 ? `${daysUntilStart} ngày` : 'trong ngày'} đến ngày nhận kho
            </span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {isRefundEligible
              ? `Chính sách hoàn cọc: Do bạn hủy trước ngày nhận kho từ 4 ngày trở lên, toàn bộ 100% số tiền cọc (${(contract.depositFee || 500000).toLocaleString('vi-VN')} đ) sẽ được bộ phận Kế toán chuyển khoản hoàn lại cho bạn trong 24 - 48 giờ làm việc.`
              : `Chính sách hoàn cọc: Do hủy trước ngày nhận kho dưới 4 ngày, bạn sẽ bị khấu trừ 50% tiền cọc (${((contract.depositFee || 500000) * 0.5).toLocaleString('vi-VN')} đ) làm chi phí giữ chỗ, và được hoàn lại 50% tiền cọc (${((contract.depositFee || 500000) * 0.5).toLocaleString('vi-VN')} đ) về tài khoản ngân hàng.`}
          </p>
        </div>

        {/* FORM THÔNG TIN NGÂN HÀNG */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-building-columns text-blue-600 dark:text-blue-400"></i>
              <span>Thông tin tài khoản nhận tiền hoàn cọc</span>
            </div>
            <span className="text-[10.5px] font-mono font-bold text-blue-600 dark:text-blue-400">
              {isRefundEligible ? 'Hoàn 100%' : 'Hoàn 50%'}
            </span>
          </div>
          
          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
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
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs uppercase focus:border-blue-500 focus:outline-none"
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

        <div className="pt-2 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            disabled={isCancelling}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Giữ lại
          </button>
          <button
            type="button"
            disabled={isCancelling}
            onClick={handleSubmit}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition flex items-center space-x-2 cursor-pointer"
          >
            {isCancelling ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-ban"></i>}
            <span>{isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy cọc'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
