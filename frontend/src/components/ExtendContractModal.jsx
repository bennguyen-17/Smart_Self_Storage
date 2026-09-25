import React, { useState } from 'react';

const unitDailyRates = {
  'S': 30000,
  'M': 60000,
  'L': 120000,
  'XL': 200000
};

export default function ExtendContractModal({ unitContext, onClose, onConfirmPayment }) {
  const { name, branch, expiry, daysLeft, size, unitCode } = unitContext || {
    name: 'Kho 1: HN01-G-XL04',
    branch: 'Cầu Giấy',
    expiry: '10/10/2026',
    daysLeft: 30,
    size: 'XL',
    unitCode: 'HN01-G-XL04'
  };

  const [selectedDays, setSelectedDays] = useState(30);
  const [discountRate, setDiscountRate] = useState(0);
  const [packageLabel, setPackageLabel] = useState('1 Tháng');
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState('');

  const handleSelectPackage = (days, label, discount) => {
    setIsCustomDays(false);
    setSelectedDays(days);
    setPackageLabel(label);
    setDiscountRate(discount);
  };

  const handleToggleCustom = () => {
    setIsCustomDays(true);
    if (!customDaysInput) setCustomDaysInput('14');
  };

  const effectiveDays = isCustomDays
    ? parseInt(customDaysInput) >= 7
      ? parseInt(customDaysInput)
      : 7
    : selectedDays;

  const dailyRate = unitDailyRates[size] || 200000;
  const rawTotal = dailyRate * effectiveDays;
  const discountAmount = rawTotal * (isCustomDays ? 0 : discountRate);
  const finalTotal = Math.round(rawTotal - discountAmount);

  // Calculate new expiry date
  const calculateNewExpiryDate = () => {
    if (!expiry) return '';
    const parts = expiry.split('/');
    if (parts.length === 3) {
      const currExpiry = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const newExpiry = new Date(currExpiry);
      newExpiry.setDate(newExpiry.getDate() + effectiveDays);
      const d = String(newExpiry.getDate()).padStart(2, '0');
      const m = String(newExpiry.getMonth() + 1).padStart(2, '0');
      const y = newExpiry.getFullYear();
      return `${d}/${m}/${y}`;
    }
    return '';
  };

  const handleConfirm = () => {
    onConfirmPayment({
      unitCode,
      size,
      packageLabel: isCustomDays ? `${effectiveDays} Ngày (Tùy chọn)` : packageLabel,
      effectiveDays,
      finalTotal
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card-box max-w-md w-full rounded-3xl border shadow-2xl overflow-hidden space-y-4 p-5 sm:p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 modal-animate-pop">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow">
              <i className="fa-solid fa-arrows-rotate"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-title uppercase">GIA HẠN HỢP ĐỒNG THUÊ KHO</h3>
              <p className="text-[10px] text-muted">Thanh toán gia hạn trực tuyến để tự động tăng hạn kho</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="inner-box p-3.5 rounded-2xl border space-y-1.5 bg-blue-500/5 border-blue-500/20 text-xs">
          <div className="flex justify-between font-bold text-title">
            <span>{name}</span>
            <span className="text-blue-600 font-extrabold">Cơ sở {branch}</span>
          </div>
          <div className="text-[11px] text-muted flex justify-between">
            <span>Hạn hiện tại: <b>{expiry}</b></span>
            <span className="text-slate-600 dark:text-slate-300 font-bold">Còn {daysLeft} ngày</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-title">Chọn Gói Gia Hạn Thêm:</label>
            {isCustomDays && (
              <span className="text-[10px] text-amber-600 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                (Tối thiểu 7 ngày)
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectPackage(30, '1 Tháng', 0)}
              className={`rental-pkg-btn text-xs py-2.5 rounded-xl text-center font-bold transition cursor-pointer border ${
                !isCustomDays && selectedDays === 30
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'inner-box border-slate-200 dark:border-slate-800 text-title hover:border-amber-400'
              }`}
            >
              <div>1 Tháng</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPackage(60, '2 Tháng', 0)}
              className={`rental-pkg-btn text-xs py-2.5 rounded-xl text-center font-bold transition cursor-pointer border ${
                !isCustomDays && selectedDays === 60
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'inner-box border-slate-200 dark:border-slate-800 text-title hover:border-amber-400'
              }`}
            >
              <div>2 Tháng</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPackage(90, '3 Tháng', 0.05)}
              className={`rental-pkg-btn text-xs py-2.5 rounded-xl text-center font-bold transition cursor-pointer border ${
                !isCustomDays && selectedDays === 90
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'inner-box border-slate-200 dark:border-slate-800 text-title hover:border-amber-400'
              }`}
            >
              <div>3 Tháng</div>
              <div className="text-[9px] text-emerald-600 font-extrabold">-5%</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPackage(180, '6 Tháng', 0.1)}
              className={`rental-pkg-btn text-xs py-2.5 rounded-xl text-center font-bold transition cursor-pointer border ${
                !isCustomDays && selectedDays === 180
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'inner-box border-slate-200 dark:border-slate-800 text-title hover:border-amber-400'
              }`}
            >
              <div>6 Tháng</div>
              <div className="text-[9px] text-emerald-600 font-extrabold">-10%</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPackage(360, '12 Tháng', 0.15)}
              className={`rental-pkg-btn text-xs py-2.5 rounded-xl text-center font-bold transition cursor-pointer border ${
                !isCustomDays && selectedDays === 360
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'inner-box border-slate-200 dark:border-slate-800 text-title hover:border-amber-400'
              }`}
            >
              <div>12 Tháng</div>
              <div className="text-[9px] text-emerald-600 font-extrabold">-15%</div>
            </button>

            <button
              type="button"
              onClick={handleToggleCustom}
              className={`rental-pkg-btn text-xs py-2.5 rounded-xl text-center font-bold transition cursor-pointer border ${
                isCustomDays
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'inner-box border-slate-200 dark:border-slate-800 text-title hover:border-amber-400'
              }`}
            >
              <div>Tùy chọn</div>
            </button>
          </div>

          {isCustomDays && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="7"
                  value={customDaysInput}
                  onChange={(e) => setCustomDaysInput(e.target.value)}
                  placeholder="Nhập số ngày (vd: 14, 45...)"
                  className="w-full border font-bold text-xs px-3 py-2 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none inner-box text-title border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <span className="text-xs text-muted font-bold whitespace-nowrap">ngày</span>
              </div>
            </div>
          )}
        </div>

        <div className="inner-box p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-muted">
            <span>Thời gian gia hạn thêm:</span>
            <span className="font-bold text-title">{effectiveDays} Ngày ({isCustomDays ? 'Tùy chọn' : packageLabel})</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Số tiền gia hạn:</span>
            <span className="font-bold text-blue-600 text-sm">
              {finalTotal.toLocaleString('vi-VN')} VNĐ
              {!isCustomDays && discountRate > 0 && (
                <span className="text-[10px] text-emerald-600 font-bold ml-1">(-{Math.round(discountRate * 100)}%)</span>
              )}
            </span>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-1.5 flex justify-between font-bold text-title text-xs">
            <span>Hạn trả kho mới sau gia hạn:</span>
            <span className="text-emerald-600 font-extrabold">{calculateNewExpiryDate()}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-3.5 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <i className="fa-solid fa-circle-check text-sm"></i>
          <span>XÁC NHẬN THANH TOÁN GIA HẠN (VIETQR)</span>
        </button>
      </div>
    </div>
  );
}
