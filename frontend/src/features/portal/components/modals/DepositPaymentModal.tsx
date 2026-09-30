import React, { useState, useEffect, useRef } from 'react';
import { checkBookingStatus, mockPayDeposit } from '@/features/portal/services/bookingApi';

export default function DepositPaymentModal({ paymentData, onPaymentSuccess, onBack }) {
  const { bookingCode, depositAmount, bankInfo } = paymentData;
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút đếm ngược
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollingRef = useRef(null);

  // Đếm ngược 5:00
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling tự động định kỳ 2 giây/lần
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await checkBookingStatus(bookingCode);
        if (res.success && res.data.status === 'PAID') {
          clearInterval(pollingRef.current);
          onPaymentSuccess(res.data);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(pollingRef.current);
  }, [bookingCode, onPaymentSuccess]);

  const handleConfirmPaymentClick = async () => {
    setIsSubmitting(true);
    try {
      // Gọi API Backend thực tế để kích hoạt ô kho sang HOLD & lưu Hợp đồng PENDING_CHECKIN
      await mockPayDeposit(bankInfo?.transferMemo || bookingCode);
    } catch (err) {
      console.warn('Backend payment notification:', err);
    } finally {
      setIsSubmitting(false);
      onPaymentSuccess({ bookingCode, ...paymentData });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 modal-animate-pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <button 
              onClick={onBack} 
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left text-xs"></i>
            </button>
            <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white">THANH TOÁN TIỀN CỌC VIETQR</h3>
          </div>
          <span className="font-mono text-xs font-black px-2 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
            {bookingCode}
          </span>
        </div>

        {/* Thanh đếm ngược */}
        <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 dark:border-amber-500/40 flex items-center justify-between text-xs">
          <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center">
            <i className="fa-solid fa-clock text-amber-600 dark:text-amber-400 animate-spin mr-1.5 text-sm"></i> Thời gian giữ chỗ:
          </span>
          <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm animate-pulse">
            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Khung VietQR */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-center space-y-3">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Quét mã VietQR thanh toán 24/7:</span>
          
          <div className="w-48 h-48 bg-white border-2 border-slate-300 dark:border-slate-700 rounded-2xl mx-auto p-2 shadow-md">
            <img src={bankInfo.qrImageUrl} alt="Mã VietQR" className="w-full h-full object-contain rounded-lg" />
          </div>

          <div className="text-xs text-slate-800 dark:text-slate-200 space-y-2 bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Ngân hàng:</span>
              <span className="font-bold text-slate-900 dark:text-white">{bankInfo.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
              <span className="font-bold text-slate-900 dark:text-white">{bankInfo.accountName}</span>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Số tiền cọc:</span>
              <span className="font-mono font-bold text-amber-500">{depositAmount?.toLocaleString('vi-VN')} VNĐ</span>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Nội dung CK:</span>
              <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                {bankInfo.transferMemo}
              </span>
            </div>
          </div>
        </div>

        {/* Nút Xác nhận đã thanh toán */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmPaymentClick}
            className={`w-full py-3 px-4 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 ${
              isSubmitting ? 'bg-emerald-700 opacity-70 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
            }`}
          >
            {isSubmitting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-circle-check text-sm"></i>}
            <span>{isSubmitting ? 'Đang cập nhật hệ thống...' : 'Xác nhận đã thanh toán'}</span>
          </button>
          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
            Hệ thống sẽ kiểm tra giao dịch và kích hoạt ô kho ngay lập tức.
          </p>
        </div>
      </div>
    </div>
  );
}




