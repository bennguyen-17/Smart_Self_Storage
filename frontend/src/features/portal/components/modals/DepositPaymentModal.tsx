import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';

export default function DepositPaymentModal({ paymentData, onBack }: { paymentData: any; onPaymentSuccess?: any; onBack: () => void }) {
  const { bookingCode, depositAmount, bankInfo, unitId, facilityName } = paymentData;
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleVNPayPayment = async () => {
    setIsRedirecting(true);
    try {
      const res: any = await apiClient.post('/payment/vnpay/create-payment-url', {
        invoiceNumber: bankInfo?.transferMemo || bookingCode,
        amount: depositAmount || 500000,
        orderInfo: `Thanh toan tien coc giu cho kho ${unitId || bookingCode}`
      });
      const url = res.data?.paymentUrl || res.paymentUrl;
      if (url) {
        window.location.href = url;
      } else {
        alert('Không nhận được liên kết thanh toán từ máy chủ VNPay!');
      }
    } catch (err: any) {
      console.error('Lỗi khởi tạo thanh toán VNPay:', err);
      alert('Lỗi kết nối cổng thanh toán VNPay: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 modal-animate-pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <button 
              onClick={onBack} 
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left text-xs"></i>
            </button>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white">
                CỔNG THANH TOÁN VNPAY
              </h3>
            </div>
          </div>
          <span className="font-mono text-xs font-black px-2 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
            {bookingCode}
          </span>
        </div>

        {/* Chi tiết đơn đặt cọc */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Mã giao dịch:</span>
            <span className="font-mono font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              DEP-{bookingCode}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Ô kho giữ chỗ:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {unitId}
            </span>
          </div>
          {facilityName && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Cơ sở lưu trữ:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{facilityName}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Số tiền cọc cần thanh toán:
            </span>
            <span className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">
              {depositAmount?.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
        </div>

        {/* Huy hiệu bảo mật */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <i className="fa-solid fa-lock text-emerald-500"></i>
            <span>Mã hóa SSL 256-bit</span>
          </span>
          <span>•</span>
          <span>Chữ ký số SHA-512</span>
        </div>

        {/* Nút thanh toán duy nhất */}
        <div className="pt-1 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            type="button"
            disabled={isRedirecting}
            onClick={handleVNPayPayment}
            className={`w-full py-3.5 px-4 font-black text-xs uppercase rounded-2xl shadow-xl transition flex items-center justify-center space-x-2 ${
              isRedirecting
                ? 'bg-blue-800 opacity-80 cursor-wait text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer active:scale-95'
            }`}
          >
            {isRedirecting ? (
              <i className="fa-solid fa-spinner animate-spin text-sm"></i>
            ) : (
              <i className="fa-solid fa-credit-card text-sm"></i>
            )}
            <span>
              {isRedirecting ? 'Đang chuyển đến cổng VNPay...' : 'MỞ CỔNG VNPAY ĐỂ THANH TOÁN'}
            </span>
          </button>

          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
            Bạn sẽ được chuyển hướng an toàn đến Cổng VNPay để hoàn tất giao dịch.
          </p>
        </div>
      </div>
    </div>
  );
}
