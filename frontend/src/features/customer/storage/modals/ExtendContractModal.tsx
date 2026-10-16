import React, { useState } from 'react';
import {
  Boxes,
  RotateCw,
  Calendar,
  CreditCard,
  ArrowRight,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ExtendContractModalProps {
  unitContext: {
    name?: string;
    branch?: string;
    expiry?: string;
    daysLeft?: number;
    size?: string;
    unitCode?: string;
    rentalFee?: number;
  };
  onClose: () => void;
  onConfirmPayment: (data: any) => void;
}

export default function ExtendContractModal({
  unitContext,
  onClose,
  onConfirmPayment,
}: ExtendContractModalProps) {
  const {
    name = 'Kho: HN01-G-XL04',
    branch = 'Cầu Giấy',
    expiry = '',
    daysLeft = 30,
    size = 'XL',
    unitCode = 'HN01-G-XL04',
    rentalFee = 0,
  } = unitContext || {};

  const [selectedDays, setSelectedDays] = useState(30);
  const [discountRate, setDiscountRate] = useState(0);
  const [packageLabel, setPackageLabel] = useState('1 Tháng');
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState('14');

  const packages = [
    { days: 30, label: '1 Tháng', discountRate: 0, discountText: '' },
    { days: 60, label: '2 Tháng', discountRate: 0, discountText: '' },
    { days: 90, label: '3 Tháng', discountRate: 0.05, discountText: '-5%' },
    { days: 180, label: '6 Tháng', discountRate: 0.1, discountText: '-10%' },
    { days: 360, label: '12 Tháng', discountRate: 0.15, discountText: '-15%' },
  ];

  const handleSelectPackage = (days: number, label: string, discount: number) => {
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
    ? Math.max(7, parseInt(customDaysInput, 10) || 7)
    : selectedDays;

  // Giá tính theo tháng (30 ngày)
  const monthlyRate = rentalFee || 1440000;
  const rawTotal = (monthlyRate / 30) * effectiveDays;
  const discountAmount = rawTotal * (isCustomDays ? 0 : discountRate);
  const finalTotal = Math.round(rawTotal - discountAmount);

  // Parse ngày hiện tại hỗ trợ cả YYYY-MM-DD và DD/MM/YYYY
  const parseDate = (dStr: string): Date | null => {
    if (!dStr) return null;
    if (dStr.includes('-')) {
      const parts = dStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Định dạng ngày hiển thị DD/MM/YYYY
  const formatDateDisplay = (d: Date | null): string => {
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Ngày hết hạn hiện tại hiển thị đẹp
  const currentExpiryDate = parseDate(expiry);
  const formattedCurrentExpiry = currentExpiryDate ? formatDateDisplay(currentExpiryDate) : expiry;

  // Tính ngày hết hạn mới sau gia hạn
  const calculateNewExpiryDate = (): string => {
    const baseDate = currentExpiryDate || new Date();
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + effectiveDays);
    return formatDateDisplay(newDate);
  };

  const newExpiryFormatted = calculateNewExpiryDate();

  const handleConfirm = () => {
    onConfirmPayment({
      unitCode,
      size,
      packageLabel: isCustomDays ? `${effectiveDays} Ngày (Tùy chọn)` : packageLabel,
      effectiveDays,
      finalTotal,
      newExpiryDate: newExpiryFormatted,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden space-y-4 p-5 sm:p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 modal-animate-pop">
        
        {/* Header đồng bộ với Portal */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <RotateCw className="size-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-tight">
                GIA HẠN HỢP ĐỒNG THUÊ KHO
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thanh toán gia hạn trực tuyến để tự động tăng thời hạn kho
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Thẻ thông tin ô kho hiện tại */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Boxes className="size-4 text-blue-600 dark:text-cyan-400" />
              <span className="font-extrabold text-slate-900 dark:text-white text-sm font-mono">
                {unitCode || name}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                Size {size}
              </span>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-cyan-400">
              Cơ sở {branch}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 pt-0.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-slate-400" />
              <span>Hạn hiện tại:</span>
              <strong className="text-slate-900 dark:text-white font-mono">{formattedCurrentExpiry}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <Clock className="size-3" />
              <span>Còn {daysLeft} ngày</span>
            </span>
          </div>
        </div>

        {/* Chọn Gói Gia Hạn Thêm (Đồng bộ nút bấm với Bước 2 Đặt Cọc) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
              Chọn Gói Gia Hạn Thêm:
            </label>
            {isCustomDays && (
              <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-extrabold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                (Tối thiểu 7 ngày)
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {packages.map((pkg) => {
              const isSelected = !isCustomDays && selectedDays === pkg.days;
              return (
                <button
                  key={pkg.days}
                  type="button"
                  onClick={() => handleSelectPackage(pkg.days, pkg.label, pkg.discountRate)}
                  className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                  }`}
                >
                  <div>{pkg.label}</div>
                  {pkg.discountText && (
                    <span className="text-[10px] text-emerald-600 font-extrabold block">
                      {pkg.discountText}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleToggleCustom}
              className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                isCustomDays
                  ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
              }`}
            >
              <div>Tùy chọn</div>
            </button>
          </div>

          {isCustomDays && (
            <div className="mt-2 p-3 bg-blue-50/60 dark:bg-slate-800/60 rounded-xl border border-blue-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Số ngày gia hạn thêm (tối thiểu 7 ngày):
              </span>
              <input
                type="number"
                min="7"
                max="720"
                value={customDaysInput}
                onChange={(e) => setCustomDaysInput(e.target.value)}
                className="w-20 px-3 py-1 text-center font-black rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
            </div>
          )}
        </div>

        {/* Bảng tổng tính tiền (Đồng bộ 100% với khung giá lúc đặt cọc) */}
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Thời gian gia hạn thêm:</span>
            <strong className="text-slate-900 dark:text-white font-mono">
              {effectiveDays} Ngày ({isCustomDays ? 'Tùy chọn' : packageLabel})
            </strong>
          </div>

          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Hạn trả kho mới sau gia hạn:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              {newExpiryFormatted} (+{effectiveDays} ngày)
            </strong>
          </div>

          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Tiền gia hạn ({effectiveDays} ngày):</span>
            <strong className="text-slate-900 dark:text-white font-mono">
              {rawTotal.toLocaleString('vi-VN')} đ
            </strong>
          </div>

          {!isCustomDays && discountRate > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="size-3" />
                <span>Chiết khấu ưu đãi (-{Math.round(discountRate * 100)}%):</span>
              </span>
              <span className="font-mono">-{discountAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-800 text-sm">
            <span className="font-bold text-slate-900 dark:text-white">
              Tổng tiền thanh toán gia hạn:
            </span>
            <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
              {finalTotal.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
        </div>

        {/* Nút bấm chuyển sang thanh toán */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
        >
          <CreditCard className="size-4.5" />
          <span>Tiếp tục: Thanh toán gia hạn</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
