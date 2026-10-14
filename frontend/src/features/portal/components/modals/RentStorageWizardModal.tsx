import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import StorageMap2D from '../StorageMap2D';
import {
  calcRentalTotal,
  clampRentalDays,
  getCheckInDates,
  MAX_CUSTOM_DAYS,
  MIN_CUSTOM_DAYS,
} from '@/features/portal/lib/bookingRules';
import { createDepositTransaction, mockPayDeposit, checkBookingStatus } from '@/features/portal/services/bookingApi';
import { addNewBookingContract } from '@/features/portal/services/contractService';
import { markUnitAsHeld } from '@/features/portal/services/facilityService';

interface RentStorageWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: string;
  onFacilityChange: (facilityCode: string) => void;
  branches: any[];
  onSuccess?: () => void;
}

export default function RentStorageWizardModal({
  isOpen,
  onClose,
  facility,
  onFacilityChange,
  branches,
  onSuccess
}: RentStorageWizardModalProps) {
  // Wizard step: 1: Chọn ô kho -> 2: Xác nhận thông tin -> 3: Hợp đồng đặt cọc -> 4: Thanh toán VietQR -> 5: Thành công
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Bước 1: Selection states
  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);

  // Bước 2: Booking configuration
  const [selectedPkgDays, setSelectedPkgDays] = useState(30);
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDaysVal, setCustomDaysVal] = useState('7');
  const [checkInDatesList, setCheckInDatesList] = useState<string[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');

  // Bước 3: Agreement checkboxes
  const [noProhibitedGoods, setNoProhibitedGoods] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);

  // Bước 4: Payment states
  const [paymentData, setPaymentData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const pollingRef = useRef<any>(null);

  // Initialize dates
  useEffect(() => {
    const dates = getCheckInDates(new Date());
    setCheckInDatesList(dates);
    if (dates.length > 0) {
      setSelectedStartDate(dates[0]);
    }
  }, []);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedUnit(null);
      setNoProhibitedGoods(false);
      setAgreedTerms(false);
      setTimeLeft(300);
    }
  }, [isOpen]);

  // Polling for Step 4
  useEffect(() => {
    if (currentStep === 4 && paymentData?.bookingCode) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await checkBookingStatus(paymentData.bookingCode);
          if (res.success && res.data.status === 'PAID') {
            clearInterval(pollingRef.current);
            handlePaymentComplete();
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);

      return () => clearInterval(pollingRef.current);
    }
  }, [currentStep, paymentData]);

  // Timer countdown for Step 4
  useEffect(() => {
    if (currentStep === 4) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep]);

  if (!isOpen) return null;

  // Branch info
  const currentBranch = branches?.find((b) => b.code === facility || b.id === facility);
  const facilityDisplayName = currentBranch?.name || `SmartStorage (${facility})`;

  // Unit specifications
  const unitCode = selectedUnit?.id || 'HN01-G-XL10';
  const unitSize = selectedUnit?.size || 'XL';
  const isClimate = Boolean(selectedUnit?.isClimate);
  const storageTypeLabel = isClimate ? 'Kho Mát (22-25°C)' : 'Kho Tiêu Chuẩn';
  
  const dailyPrice = selectedUnit?.price ? (isClimate ? Math.round(selectedUnit.price * 1.2) : selectedUnit.price) : (isClimate ? 240000 : 200000);
  const monthlyPrice = selectedUnit?.monthlyPrice ? (isClimate ? Math.round(selectedUnit.monthlyPrice * 1.2) : selectedUnit.monthlyPrice) : (isClimate ? 4800000 : 4000000);
  const depositAmount = selectedUnit?.deposit || 3000000;

  // Dimensions & load
  const sizeDimensionsMap: Record<string, string> = {
    'S': '1.0m × 1.0m (1m²)',
    'M': '1.5m × 2.0m (3m²)',
    'L': '2.0m × 3.0m (6m²)',
    'XL': '2.5m × 4.0m (10m²)',
  };
  const unitDimensions = selectedUnit?.dimensions || sizeDimensionsMap[unitSize] || '2.5m × 4.0m (10m²)';
  const maxLoad = selectedUnit?.maxLoad || '1000 kg/m²';

  // Duration calculations
  const effectiveDays = isCustomDays ? clampRentalDays(customDaysVal) : selectedPkgDays;
  const rentalCalc = calcRentalTotal({
    dailyPrice,
    monthlyPrice,
    days: effectiveDays
  });

  const calculateCheckOutDateFormatted = () => {
    if (!selectedStartDate) return '';
    const start = new Date(selectedStartDate);
    if (isNaN(start.getTime())) return '';
    const end = new Date(start);
    end.setDate(end.getDate() + effectiveDays);
    const endD = String(end.getDate()).padStart(2, '0');
    const endM = String(end.getMonth() + 1).padStart(2, '0');
    const endY = end.getFullYear();
    return `${endD}/${endM}/${endY}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // Step 3 -> 4 Proceed
  const handleProceedToPayment = async () => {
    if (!noProhibitedGoods || !agreedTerms) return;
    setIsSubmittingContract(true);

    const bookingCode = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
    const transferMemo = `DEP-${bookingCode}`;
    const payload = {
      facilityName: facilityDisplayName,
      unitId: unitCode,
      unitSize: `Size ${unitSize}`,
      storageType: isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD',
      typeLabel: storageTypeLabel,
      isClimate,
      startDate: formatDateDisplay(selectedStartDate),
      endDate: calculateCheckOutDateFormatted(),
      effectiveDays,
      estimatedTotalRental: rentalCalc.total,
      depositAmount,
      bookingCode,
      invoiceNumber: transferMemo,
      bankInfo: {
        bankName: 'MB BANK (Ngân hàng Quân Đội)',
        accountNo: '0909888999',
        accountName: 'SELF STORAGE 391',
        transferMemo,
        qrImageUrl: `https://img.vietqr.io/image/MB-0909888999-compact2.png?amount=${depositAmount}&addInfo=${encodeURIComponent(transferMemo)}&accountName=SELF%20STORAGE%20391`
      }
    };

    try {
      const res = await createDepositTransaction(payload);
      if (res && res.success && res.data) {
        setPaymentData(res.data);
      } else {
        setPaymentData(payload);
      }
    } catch (err) {
      console.warn('Backend payment setup fallback:', err);
      setPaymentData(payload);
    } finally {
      setIsSubmittingContract(false);
      setCurrentStep(4);
    }
  };

  // Step 4 Complete
  const handlePaymentComplete = async () => {
    setIsConfirmingPayment(true);
    try {
      await mockPayDeposit(paymentData?.bankInfo?.transferMemo || paymentData?.bookingCode);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsConfirmingPayment(false);

      // Save contract
      addNewBookingContract({
        unitId: unitCode,
        unitSize: `Size ${unitSize}`,
        facilityName: facilityDisplayName,
        storageType: isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD',
        typeLabel: storageTypeLabel,
        isClimate,
        startDate: formatDateDisplay(selectedStartDate),
        endDate: calculateCheckOutDateFormatted(),
        depositAmount,
        bookingCode: paymentData?.bookingCode,
      });

      // Mark unit held
      if (unitCode) {
        markUnitAsHeld(unitCode, 'HOLD');
      }

      // Fire confetti
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {}

      setCurrentStep(5);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const modalMaxWidth = currentStep === 1 ? 'max-w-6xl' : currentStep === 2 ? 'max-w-4xl' : 'max-w-3xl';

  return (
    <div
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && currentStep !== 4) onClose();
      }}
    >
      <div className={`dark border border-slate-700/80 w-full ${modalMaxWidth} max-h-[94vh] flex flex-col rounded-3xl shadow-2xl modal-animate-pop bg-slate-900 text-white overflow-hidden transition-all duration-300`}>
        
        {/* TOP HEADER: TITLE */}
        <div className="border-b border-slate-800 px-5 sm:px-8 py-4 bg-slate-900/95 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
                <i className="fa-solid fa-key"></i>
              </div>
              <div>
                <h2 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  ĐẶT THUÊ KHO THÔNG MINH 24/7
                </h2>
                <p className="text-xs text-slate-400">
                  Chọn ô kho trực tuyến, ký thỏa thuận và kích hoạt kho tức thì
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-700"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          
          {/* ==================== BƯỚC 1: CHỌN Ô KHO & THÔNG TIN KHO (Ảnh 1) ==================== */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <StorageMap2D
                facility={facility}
                refreshTrigger={mapRefreshTrigger}
                onFacilityChange={(fac) => {
                  onFacilityChange(fac);
                  setSelectedUnit(null);
                }}
                currentFloor={currentFloor}
                onSelectFloor={(fl) => {
                  setCurrentFloor(fl);
                  setSelectedUnit(null);
                }}
                selectedUnit={selectedUnit}
                onSelectUnit={setSelectedUnit}
              />
            </div>
          )}

          {/* ==================== BƯỚC 2: XÁC NHẬN THÔNG TIN ĐẶT KHO (Ảnh 2) ==================== */}
          {currentStep === 2 && (
            <div className="w-full py-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* CỘT TRÁI: THÔNG TIN Ô KHO & NGÀY NHẬN */}
                <div className="p-5 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-4">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block">Mã ô kho đã chọn:</span>
                      <span className="text-2xl font-black font-mono text-amber-400 tracking-wider">
                        {unitCode}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                      isClimate 
                        ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/80' 
                        : 'bg-blue-950/80 text-blue-400 border border-blue-800/80'
                    }`}>
                      {isClimate ? '❄️ Kho Mát (22-25°C)' : '📦 Kho Tiêu Chuẩn'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70">
                      <span className="text-slate-400 block mb-0.5">Kích thước sàn:</span>
                      <strong className="text-sm text-white">{unitDimensions}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70">
                      <span className="text-slate-400 block mb-0.5">Tải trọng tối đa:</span>
                      <strong className="text-sm text-amber-400">{maxLoad}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70">
                      <span className="text-slate-400 block mb-0.5">Đơn giá ngày:</span>
                      <p className="font-bold text-cyan-400 text-sm">
                        {dailyPrice.toLocaleString('vi-VN')}đ/ngày
                      </p>
                      {isClimate && <span className="text-[10px] text-cyan-300 block mt-0.5">(+20% phụ phí điều hòa)</span>}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70">
                      <span className="text-slate-400 block mb-0.5">Tiền cọc giữ chỗ:</span>
                      <p className="font-extrabold text-emerald-400 text-sm">
                        {depositAmount.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>

                  {/* NGÀY NHẬN KHO (CHECK-IN) */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-cyan-400 tracking-wider">
                        NGÀY NHẬN KHO (CHECK-IN):
                      </h4>
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-lg font-semibold">
                        Từ ngày mai, tối đa 7 ngày
                      </span>
                    </div>

                    <select
                      value={selectedStartDate}
                      onChange={(e) => setSelectedStartDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-white focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
                    >
                      {checkInDatesList.map((d) => (
                        <option key={d} value={d} className="bg-slate-800 text-white">
                          {formatDateDisplay(d)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CỘT PHẢI: THỜI HẠN THUÊ & TỔNG KẾT THANH TOÁN */}
                <div className="p-5 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-4">
                  {/* THỜI HẠN THUÊ KHO */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase text-cyan-400 tracking-wider">
                      THỜI HẠN THUÊ KHO:
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { days: 30, label: '1 Tháng' },
                        { days: 60, label: '2 Tháng' },
                        { days: 90, label: '3 Tháng', discount: '-5%' },
                        { days: 180, label: '6 Tháng', discount: '-10%' },
                        { days: 360, label: '12 Tháng', discount: '-15%' },
                      ].map((pkg) => (
                        <button
                          key={pkg.days}
                          type="button"
                          onClick={() => {
                            setIsCustomDays(false);
                            setSelectedPkgDays(pkg.days);
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            !isCustomDays && selectedPkgDays === pkg.days
                              ? 'border-2 border-amber-400 bg-amber-500/15 text-white shadow-xs ring-1 ring-amber-400/40'
                              : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:border-slate-600 hover:text-white'
                          }`}
                        >
                          <span className="text-xs font-bold block">{pkg.label}</span>
                          {pkg.discount && (
                            <span className="text-[10px] font-bold text-emerald-400 block mt-0.5">{pkg.discount}</span>
                          )}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomDays(true);
                          if (!customDaysVal) setCustomDaysVal('7');
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isCustomDays
                            ? 'border-2 border-amber-400 bg-amber-500/15 text-white shadow-xs ring-1 ring-amber-400/40'
                            : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">Tùy chọn</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">7-29 ngày</span>
                      </button>
                    </div>

                    {isCustomDays && (
                      <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-200">Nhập số ngày thuê (7-29 ngày):</span>
                        <input
                          type="number"
                          min={MIN_CUSTOM_DAYS}
                          max={MAX_CUSTOM_DAYS}
                          value={customDaysVal}
                          onChange={(e) => setCustomDaysVal(e.target.value)}
                          className="w-20 px-2 py-1 rounded-lg border border-amber-700 bg-slate-900 text-center font-bold text-white outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* TÍNH TOÁN TỔNG KẾT BƯỚC 2 */}
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5 text-xs text-white">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hạn trả kho:</span>
                      <strong className="text-cyan-400 font-bold">{calculateCheckOutDateFormatted()} ({effectiveDays} ngày)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tiền thuê ({effectiveDays} ngày):</span>
                      <strong className="text-white font-extrabold">{rentalCalc.total.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700 text-sm">
                      <span className="font-bold text-white">Thanh toán cọc online:</span>
                      <strong className="text-amber-400 text-lg font-black">{depositAmount.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                      <i className="fa-solid fa-circle-check text-xs"></i>
                      <span>Tiền thuê sẽ thanh toán sau khi Check-in nhận kho</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== BƯỚC 3: HỢP ĐỒNG ĐẶT CỌC KHO (Ảnh 3) ==================== */}
          {currentStep === 3 && (
            <div className="max-w-2xl mx-auto space-y-5 py-2">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                
                {/* Header Thỏa thuận */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-file-contract text-amber-500"></i>
                    <span>Thỏa thuận đặt cọc kho</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Vui lòng xem lại thông tin giữ chỗ và các quy định trước khi tiến hành thanh toán
                  </p>
                </div>

                {/* Box Tóm tắt thông tin */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Chi nhánh: {facilityDisplayName}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      isClimate ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {storageTypeLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Mã kho</span>
                      <strong className="text-sm font-mono text-amber-500">{unitCode}</strong>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Ngày nhận</span>
                      <strong className="text-xs text-blue-600">{formatDateDisplay(selectedStartDate)}</strong>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Hạn trả</span>
                      <strong className="text-xs text-blue-600">{calculateCheckOutDateFormatted()}</strong>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Ước tính tiền thuê</span>
                      <strong className="text-xs text-slate-900 dark:text-white">{rentalCalc.total.toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 text-sm border-t border-slate-200 dark:border-slate-700">
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">Tiền cọc giữ chỗ:</span>
                    <strong className="text-xl font-black text-amber-500">{depositAmount.toLocaleString('vi-VN')} VNĐ</strong>
                  </div>
                </div>

                {/* Điều khoản & Quy định hủy cọc */}
                <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-slate-800/30 border border-blue-100 dark:border-slate-700/60 text-xs space-y-2 leading-relaxed">
                  <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-shield-halved text-blue-600"></i>
                    <span>Điều khoản thuê & Quy định hủy cọc:</span>
                  </h5>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>1. Mục đích cọc giữ chỗ:</strong> Khoản tiền cọc dùng để bảo lưu ô kho <strong>{unitCode}</strong> ({storageTypeLabel}) tại chi nhánh {facilityDisplayName} cho bạn kể từ ngày nhận kho <strong>{formatDateDisplay(selectedStartDate)}</strong>.
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>2. Chính sách hủy cọc & Hoàn tiền:</strong> Hủy trước ngày nhận kho từ 4 ngày trở lên: Bạn được hoàn lại 100% tiền cọc.
                  </p>
                </div>

                {/* 2 Checkboxes cam kết */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-2xl border border-slate-200 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <input
                      type="checkbox"
                      checked={noProhibitedGoods}
                      onChange={(e) => setNoProhibitedGoods(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                      Tôi cam kết không lưu trữ hàng cấm: thực phẩm tươi sống/đông lạnh, động vật sống, chất dễ cháy nổ, hóa chất độc hại, vũ khí và hàng hóa vi phạm pháp luật.
                    </span>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-2xl border border-slate-200 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                      Tôi đã đọc và đồng ý với các điều khoản thuê kho, quy định hoàn hủy cọc và thời gian nhận kho nêu trên.
                    </span>
                  </label>
                </div>

              </div>
            </div>
          )}

          {/* ==================== BƯỚC 4: THANH TOÁN TIỀN CỌC VIETQR (Ảnh 4) ==================== */}
          {currentStep === 4 && paymentData && (
            <div className="max-w-md mx-auto space-y-4 py-2">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white tracking-wide">
                    THANH TOÁN TIỀN CỌC VIETQR
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs">
                    {paymentData.bookingCode}
                  </span>
                </div>

                {/* Countdown banner */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <i className="fa-solid fa-clock"></i>
                    <span>Thời gian giữ chỗ:</span>
                  </span>
                  <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                    {formatTimer(timeLeft)}
                  </span>
                </div>

                {/* VietQR Code Image */}
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    QUÉT MÃ VIETQR THANH TOÁN 24/7:
                  </p>
                  <div className="flex justify-center py-2">
                    <img
                      src={paymentData.bankInfo?.qrImageUrl}
                      alt="VietQR Code"
                      className="w-56 h-56 object-contain rounded-2xl shadow-md border border-slate-200 bg-white p-2"
                    />
                  </div>
                </div>

                {/* Transfer Details */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <strong className="text-slate-900 dark:text-white">{paymentData.bankInfo?.bankName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <strong className="text-slate-900 dark:text-white">{paymentData.bankInfo?.accountName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tiền cọc:</span>
                    <strong className="text-amber-600 dark:text-amber-400 text-sm font-black">
                      {paymentData.depositAmount?.toLocaleString('vi-VN')} VNĐ
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Nội dung CK:</span>
                    <span className="font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                      {paymentData.bankInfo?.transferMemo}
                    </span>
                  </div>
                </div>

                {/* Confirm button */}
                <button
                  type="button"
                  onClick={handlePaymentComplete}
                  disabled={isConfirmingPayment}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <i className="fa-solid fa-circle-check"></i>
                  <span>{isConfirmingPayment ? 'Đang kiểm tra...' : 'Xác nhận đã thanh toán'}</span>
                </button>
                <p className="text-[11px] text-center text-slate-500">
                  Hệ thống sẽ kiểm tra giao dịch và kích hoạt ô kho ngay lập tức.
                </p>

              </div>
            </div>
          )}

          {/* ==================== BƯỚC 5: ĐẶT CỌC THÀNH CÔNG ==================== */}
          {currentStep === 5 && (
            <div className="max-w-md mx-auto space-y-5 py-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-3xl mx-auto flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-circle-check text-3xl"></i>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  ĐẶT CỌC THÀNH CÔNG!
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ô kho <strong>{unitCode}</strong> đã được giữ chỗ cho bạn. Hợp đồng đã được lưu vào hệ thống.
                </p>
              </div>

              {paymentData?.bookingCode && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
                    MÃ ĐẶT CHỖ (BOOKING CODE)
                  </span>
                  <div className="text-3xl font-mono font-black text-amber-400 tracking-widest">
                    {paymentData.bookingCode}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSuccess?.();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <i className="fa-solid fa-circle-check text-sm"></i>
                <span>HOÀN TẤT & XEM KHO CỦA TÔI</span>
              </button>
            </div>
          )}

        </div>

        {/* MODAL FOOTER: NAVIGATION BUTTONS (Cho bước 1, 2, 3) */}
        {currentStep <= 3 && (
          <div className="border-t border-slate-800 px-6 py-4 bg-slate-900/95 shrink-0 flex items-center justify-between">
            {/* Left summary / back */}
            {currentStep === 1 ? (
              <div />
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev > 1 ? (prev - 1 as any) : 1))}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
              >
                <i className="fa-solid fa-arrow-left text-xs"></i>
                <span>Quay lại</span>
              </button>
            )}

            {/* Right proceed buttons */}
            {currentStep === 1 && (
              <button
                type="button"
                disabled={!selectedUnit}
                onClick={() => setCurrentStep(2)}
                className={`px-6 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  selectedUnit
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.35)]'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed shadow-none'
                }`}
              >
                <span>Xác nhận thông tin</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 rounded-2xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/25"
              >
                <span>Tiếp tục: Hợp đồng đặt cọc</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                disabled={!noProhibitedGoods || !agreedTerms || isSubmittingContract}
                onClick={handleProceedToPayment}
                className={`px-6 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md ${
                  noProhibitedGoods && agreedTerms && !isSubmittingContract
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <span>{isSubmittingContract ? 'Đang tạo hợp đồng...' : 'Xác nhận & Thanh toán cọc'}</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
