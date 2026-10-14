import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '@/lib/apiClient';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      // Chuyển toàn bộ searchParams thành plain object
      const paramsObj: Record<string, string> = {};
      searchParams.forEach((val, key) => {
        paramsObj[key] = val;
      });

      const responseCode = paramsObj.vnp_ResponseCode || paramsObj.responseCode;
      const invoiceNumber = paramsObj.vnp_TxnRef || paramsObj.invoiceNumber;
      const amount = paramsObj.vnp_Amount ? (Number(paramsObj.vnp_Amount) / 100).toLocaleString('vi-VN') : null;
      const bankCode = paramsObj.vnp_BankCode || 'NCB';
      const txnNo = paramsObj.vnp_TransactionNo;

      setDetails({ invoiceNumber, amount, bankCode, txnNo, responseCode });

      // Nếu có chữ ký vnp_SecureHash thì gọi Backend xác thực
      if (paramsObj.vnp_SecureHash) {
        try {
          const res: any = await apiClient.post('/payment/vnpay/verify', paramsObj);
          if (res && (res.success || res.data?.success)) {
            setSuccess(true);
            setMessage(res.message || 'Xác nhận nộp cọc thành công! Hợp đồng đã sẵn sàng để check-in.');
          } else {
            setSuccess(false);
            setMessage(res.message || 'Thanh toán không hợp lệ hoặc đã bị hủy.');
          }
        } catch (err: any) {
          console.error('Lỗi xác thực VNPay:', err);
          if (responseCode === '00') {
            setSuccess(true);
            setMessage('Thanh toán VNPay thành công!');
          } else {
            setSuccess(false);
            setMessage('Giao dịch không thành công hoặc người dùng đã hủy giao dịch.');
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Trường hợp backend redirect về kèm param success
        const isSuccessParam = paramsObj.success === 'true' || responseCode === '00';
        setSuccess(isSuccessParam);
        setMessage(paramsObj.message || (isSuccessParam ? 'Đặt cọc thành công qua cổng VNPay!' : 'Giao dịch chưa hoàn tất.'));
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-center">
        {loading ? (
          <div className="py-12 space-y-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Đang xác thực kết quả thanh toán từ VNPay...
            </p>
          </div>
        ) : success ? (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner border border-emerald-500/20 animate-bounce">
              <i className="fa-solid fa-circle-check"></i>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                ĐẶT CỌC THÀNH CÔNG!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Giao dịch của bạn đã được Cổng thanh toán VNPay xác nhận và lưu vào hệ thống.
              </p>
            </div>

            {/* Chi tiết đơn */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-left space-y-2.5">
              {details?.invoiceNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Mã hóa đơn cọc:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{details.invoiceNumber}</span>
                </div>
              )}
              {details?.amount && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Số tiền cọc:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{details.amount} VNĐ</span>
                </div>
              )}
              {details?.bankCode && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Ngân hàng thanh toán:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{details.bankCode}</span>
                </div>
              )}
              {details?.txnNo && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Mã GD VNPay:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">#{details.txnNo}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Trạng thái hợp đồng:</span>
                <span className="font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  CHỜ CHECK-IN (Tại quầy)
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/my-storage')}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                <i className="fa-solid fa-file-contract mr-1.5"></i>
                Xem Hợp Đồng Của Tôi
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Trang Chủ
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner border border-rose-500/20">
              <i className="fa-solid fa-circle-xmark"></i>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                THANH TOÁN CHƯA HOÀN TẤT
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {message || 'Giao dịch qua VNPay đã bị hủy hoặc xảy ra sự cố.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/rent')}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                <i className="fa-solid fa-arrow-rotate-left mr-1.5"></i>
                Thử Lại
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Trang Chủ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
