import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Warehouse,
  Calculator,
  FileSignature,
  CreditCard,
  CheckCircle2,
  Clock,
  RotateCcw,
  Check,
  ShieldAlert,
  Boxes,
  ShieldCheck,
  Lock,
  ExternalLink,
} from 'lucide-react';
import CustomerLayout from '@/components/layouts/CustomerLayout';
import StorageMap2D from './components/StorageMap2D';
import { getBranches, markUnitAsHeld } from './rentApi';
import { addNewBookingContract } from './rentApi';
import { createDepositTransaction, mockPayDeposit } from './rentApi';
import apiClient from '@/lib/apiClient';
import {
  calcRentalTotal,
  clampRentalDays,
  getCheckInDates,
  isSameDayCheckIn,
  isCounterOpenNow,
  COUNTER_CLOSE_HOUR,
} from './bookingRules';
import { addDays, formatDate } from '@/lib/format';

const RENT_STEPS = [
  { id: 1, title: '1. Chọn ô kho (2D)', shortTitle: '1. Chọn kho' },
  { id: 2, title: '2. Bảng giá & Hạn', shortTitle: '2. Bảng giá' },
  { id: 3, title: '3. Thỏa thuận cọc', shortTitle: '3. Thỏa thuận' },
  { id: 4, title: '4. Thanh toán VNPay', shortTitle: '4. Thanh toán' },
] as const;

export default function RentStoragePage() {
  const navigate = useNavigate();

  // TIẾN TRÌNH 4 BƯỚC: 1: Chọn ô kho -> 2: Bảng giá -> 3: Thỏa thuận cọc -> 4: Thanh toán VietQR
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Dữ liệu cơ sở & sơ đồ ô kho
  const [facility, setFacility] = useState<string>('');
  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);

  // Dữ liệu đặt cọc & gói thuê ở Bước 2
  const [selectedPkgDays, setSelectedPkgDays] = useState(30); // 30, 60, 90, 180, 360
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDaysVal, setCustomDaysVal] = useState('7');
  const [startDate, setStartDate] = useState(() => getCheckInDates(new Date())[0]);

  // Checkboxes ở Bước 3 (Thỏa thuận cọc)
  const [noProhibitedGoods, setNoProhibitedGoods] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Dữ liệu thanh toán VietQR & VNPay ở Bước 4
  const [bookingCode, setBookingCode] = useState('CTR-HN01-171026-0042');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5:00
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchBranches = async () => {
      try {
        const res = await getBranches();
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setBranches(res.data);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách cơ sở kho:', err);
      }
    };
    fetchBranches();
    return () => {
      isMounted = false;
    };
  }, []);

  // Đếm ngược 5 phút ở Bước 4
  useEffect(() => {
    if (step !== 4 || isPaymentCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, isPaymentCompleted]);

  // Tính số ngày và ngày kết thúc
  const effectiveDays = isCustomDays ? clampRentalDays(customDaysVal) : selectedPkgDays;
  const checkOutDateIso = startDate ? addDays(startDate, effectiveDays) : '';

  const calculateCheckOutDate = () => {
    return checkOutDateIso ? formatDate(checkOutDateIso) : '';
  };

  const rental = selectedUnit
    ? calcRentalTotal({
      dailyPrice: selectedUnit.price,
      monthlyPrice: selectedUnit.monthlyPrice || selectedUnit.price * 20,
      days: effectiveDays,
    })
    : { total: 0, discountRate: 0 };

  const currentBranch = branches.find((b) => b.code === facility || b.id === facility);
  const facilityDisplayName = currentBranch?.name || `SmartStorage (${facility})`;

  // Chuyển sang Bước 2
  const handleProceedToStep2 = () => {
    if (!selectedUnit) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Chuyển sang Bước 3
  const handleProceedToStep3 = () => {
    if (!selectedUnit) return;
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Chuyển sang Bước 4 (Tạo mã đơn cọc & VietQR/VNPay)
  const handleProceedToStep4 = async () => {
    if (!noProhibitedGoods || !agreedTerms) return;

    try {
      const res = await createDepositTransaction({
        unitId: selectedUnit.id,
        facilityName: facilityDisplayName,
        depositAmount: selectedUnit.deposit,
        startDate: startDate,
        endDate: checkOutDateIso,
        effectiveDays: effectiveDays,
      });

      if (!res?.success || !res?.data?.invoiceNumber) {
        alert(res?.message || 'Không thể tạo đơn đặt cọc cho ô kho này. Vui lòng chọn ô kho trống khác!');
        return;
      }

      setBookingCode(res.data.bookingCode);
      setInvoiceNumber(res.data.invoiceNumber);
      setTimeLeft(300);
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      console.warn('Backend createDepositTransaction:', e);
      alert('Lỗi tạo đơn đặt cọc: ' + (e?.message || 'Vui lòng thử lại'));
    }
  };

  // Hoàn tất xác nhận thanh toán ở Bước 4 (Chuyển khoản / Test)
  const handleConfirmPayment = async () => {
    setIsSubmittingPayment(true);
    const transferMemo = invoiceNumber || `DEP-${bookingCode}`;

    try {
      await mockPayDeposit(transferMemo);
    } catch (e) {
      console.warn('Backend mockPayDeposit:', e);
    }

    // 1. Lưu hợp đồng vào danh sách PENDING_CHECKIN
    const bookingPayload = {
      facilityName: facilityDisplayName,
      unitId: selectedUnit.id,
      unitSize: `Size ${selectedUnit.size}`,
      storageType: selectedUnit.isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD',
      typeLabel: selectedUnit.isClimate ? 'Kho Mát Điều Hòa (22-25°C)' : 'Kho Tiêu Chuẩn',
      isClimate: selectedUnit.isClimate,
      startDate: startDate,
      endDate: checkOutDateIso,
      effectiveDays,
      estimatedTotalRental: rental.total,
      depositAmount: selectedUnit.deposit,
      contractId: bookingCode,
      reservationCode: bookingCode,
      bookingCode: bookingCode,
    };
    addNewBookingContract(bookingPayload);

    // 2. Cập nhật ô kho sang HOLD
    markUnitAsHeld(selectedUnit.id, 'HOLD');

    setIsSubmittingPayment(false);
    setIsPaymentCompleted(true);
  };

  const [isRedirectingVNPay, setIsRedirectingVNPay] = useState(false);

  const handleOpenVNPay = async () => {
    setIsRedirectingVNPay(true);
    // Lưu trước hợp đồng để khi VNPay redirect về có sẵn thông tin chính xác
    const bookingPayload = {
      facilityName: facilityDisplayName,
      unitId: selectedUnit?.id,
      unitSize: `Size ${selectedUnit?.size}`,
      storageType: selectedUnit?.isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD',
      typeLabel: selectedUnit?.isClimate ? 'Kho Mát Điều Hòa (22-25°C)' : 'Kho Tiêu Chuẩn',
      isClimate: selectedUnit?.isClimate,
      startDate: startDate,
      endDate: checkOutDateIso,
      effectiveDays,
      estimatedTotalRental: rental.total,
      depositAmount: selectedUnit?.deposit || 500000,
      contractId: bookingCode,
      reservationCode: bookingCode,
      bookingCode: bookingCode,
    };
    addNewBookingContract(bookingPayload);
    if (selectedUnit?.id) {
      markUnitAsHeld(selectedUnit.id, 'HOLD');
    }

    try {
      const res: any = await apiClient.post('/payment/vnpay/create-payment-url', {
        invoiceNumber: invoiceNumber || `DEP-${bookingCode}`,
        amount: selectedUnit?.deposit || 500000,
        orderInfo: `Thanh toan tien coc kho ${selectedUnit?.id || bookingCode}`
      });
      const url = res.data?.paymentUrl || res.paymentUrl;
      if (url) {
        window.location.href = url;
      } else {
        alert('Không nhận được liên kết thanh toán từ cổng VNPay!');
      }
    } catch (err: any) {
      console.error('Lỗi khởi tạo thanh toán VNPay:', err);
      alert('Lỗi kết nối cổng thanh toán VNPay: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsRedirectingVNPay(false);
    }
  };

  const depositAmount = selectedUnit?.deposit || 3000000;

  return (
    <CustomerLayout activeNav="rent">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 flex flex-col">
        <div className="w-full max-w-4xl mx-auto mb-8">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-blue-100 dark:border-slate-800 shadow-sm rounded-3xl py-4 sm:py-5 px-4 sm:px-8">
            <div className="relative">
              <div className="absolute top-5 left-6 right-6 sm:left-10 sm:right-10 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 rounded-full z-0">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${((step - 1) / (RENT_STEPS.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Các điểm bước tròn 1 - 2 - 3 - 4 */}
              <div className="relative z-10 flex items-center justify-between">
                {RENT_STEPS.map((s) => {
                  const isPassed = step > s.id;
                  const isCurrent = step === s.id;
                  const canClick =
                    !isPaymentCompleted &&
                    ((s.id === 1) ||
                      (s.id === 2 && !!selectedUnit) ||
                      (s.id === 3 && !!selectedUnit && step >= 2));

                  return (
                    <div key={s.id} className="flex flex-col items-center">
                      <button
                        type="button"
                        disabled={!canClick && !isCurrent}
                        onClick={() => {
                          if (canClick) setStep(s.id as 1 | 2 | 3 | 4);
                        }}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-200 ${isPassed
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 cursor-pointer'
                            : isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/60 shadow-lg shadow-blue-500/35 scale-110'
                              : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-2 border-slate-300 dark:border-slate-700'
                          } ${canClick && !isCurrent ? 'cursor-pointer hover:scale-105' : !canClick && !isCurrent ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        {isPassed ? (
                          <Check className="size-4.5 stroke-[3]" />
                        ) : (
                          <span>{s.id}</span>
                        )}
                      </button>

                      <div className="mt-2 text-center">
                        <p
                          className={`text-[11px] sm:text-xs font-bold transition-colors ${isCurrent
                              ? 'text-blue-600 dark:text-blue-400 font-black'
                              : isPassed
                                ? 'text-slate-700 dark:text-slate-200 font-semibold'
                                : 'text-slate-400 dark:text-slate-500 font-medium'
                            }`}
                        >
                          <span className="hidden sm:inline">{s.title}</span>
                          <span className="sm:hidden">{s.shortTitle}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            NỘI DUNG TỪNG BƯỚC RIÊNG BIỆT
           ======================================================== */}
        <AnimatePresence mode="wait">
          {/* ========================================================
              BƯỚC 1: SƠ ĐỒ MẶT BẰNG 2D + NÚT TIẾP TỤC
             ======================================================== */}
          {step === 1 && (
            <motion.div
              key="step-1-storage-map"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full space-y-6 flex-1 flex flex-col"
            >
              <div className="w-full">
                <StorageMap2D
                  facility={facility}
                  refreshTrigger={mapRefreshTrigger}
                  onFacilityChange={(fac) => {
                    setFacility(fac);
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

              {/* Chỉ 1 nút Tiếp theo */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!selectedUnit}
                  onClick={handleProceedToStep2}
                  className={`px-8 py-3.5 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md ${selectedUnit
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                >
                  <span>Tiếp theo</span>
                  <ArrowRight className="size-4.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              BƯỚC 2: BẢNG GIÁ & CHỌN THỜI HẠN THUÊ KHO
             ======================================================== */}
          {step === 2 && selectedUnit && (
            <motion.div
              key="step-2-pricing-package"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-2xl mx-auto space-y-5"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="size-4" />
                  <span>Quay lại chọn ô kho khác</span>
                </button>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full">
                  Bước 2 / 4: Bảng giá & Hạn
                </span>
              </div>

              {/* Thẻ thông tin ô kho đã chọn */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center tracking-wider">
                    <Boxes className="size-4 text-blue-600 mr-2" />
                    THÔNG TIN ĐẶT THUÊ KHO
                  </h3>
                  <span className="text-lg font-mono font-black text-blue-600 dark:text-blue-400">
                    {selectedUnit.id}
                  </span>
                </div>

                {/* Chi tiết ô kho */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Loại kho</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedUnit.isClimate ? '❄️ Kho Mát (22-25°C)' : '📦 Kho Tiêu Chuẩn'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Kích thước sàn</span>
                    <strong className="text-slate-800 dark:text-slate-200">{selectedUnit.dim}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Tải trọng tối đa</span>
                    <strong className="text-slate-800 dark:text-slate-200">{selectedUnit.weightLimit}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Tiền cọc giữ chỗ</span>
                    <strong className="text-emerald-600 text-sm font-black">{selectedUnit.deposit.toLocaleString('vi-VN')}đ</strong>
                  </div>
                </div>

                {/* Chọn thời hạn thuê kho */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    Thời hạn thuê kho:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { days: 30, label: '1 Tháng', discount: '' },
                      { days: 60, label: '2 Tháng', discount: '' },
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
                        className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${!isCustomDays && selectedPkgDays === pkg.days
                            ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                          }`}
                      >
                        <div>{pkg.label}</div>
                        {pkg.discount && (
                          <span className="text-[10px] text-emerald-600 font-extrabold">{pkg.discount}</span>
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDays(true);
                        if (!customDaysVal) setCustomDaysVal('7');
                      }}
                      className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${isCustomDays
                          ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                        }`}
                    >
                      Tùy chọn
                    </button>
                  </div>

                  {isCustomDays && (
                    <div className="mt-2 p-3 bg-blue-50/60 dark:bg-slate-800/60 rounded-xl border border-blue-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-200">Số ngày thuê (7 – 29 ngày):</span>
                      <input
                        type="number"
                        min="7"
                        max="29"
                        value={customDaysVal}
                        onChange={(e) => setCustomDaysVal(e.target.value)}
                        className="w-20 px-3 py-1 text-center font-black rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </div>
                  )}
                </div>

                {/* Chọn ngày nhận kho */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                      Ngày nhận kho (Check-in):
                    </label>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      Hôm nay hoặc một trong 7 ngày tới 
                    </span>
                  </div>
                  <select
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer shadow-xs"
                  >
                    {getCheckInDates(new Date()).map((d) => {
                      const isToday = isSameDayCheckIn(d);
                      const formatted = d.split('-').reverse().join('/');
                      return (
                        <option key={d} value={d}>
                          {isToday ? `${formatted} (Nhận kho hôm nay)` : formatted}
                        </option>
                      );
                    })}
                  </select>

                  {/* Thông báo ca trực / Cảnh báo giờ làm việc nhân viên quầy 08:00 - 20:00 */}
                  {isSameDayCheckIn(startDate) ? (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                      <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">Lưu ý giờ làm việc tại quầy (08:00 – 20:00):</p>
                        <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                          Bạn đã chọn nhận kho <strong>Hôm nay</strong>. Nhân viên quầy làm việc đến <strong>20:00</strong>. Quý khách vui lòng đến cơ sở trước <strong>20:00 hôm nay</strong> để nhân viên đối soát CCCD, thu tiền thuê và bàn giao kho.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <Clock className="size-3.5 shrink-0 text-blue-500" />
                      <span>Nhân viên hỗ trợ check-in tại quầy từ <strong>08:00 đến 20:00</strong> trong ngày hẹn nhận kho.</span>
                    </div>
                  )}
                </div>

                {/* Bảng tổng tính tiền */}
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Hạn trả kho dự kiến:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{calculateCheckOutDate()} ({effectiveDays} ngày)</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Tiền thuê ({effectiveDays} ngày):</span>
                    <strong className="text-slate-900 dark:text-white">{rental.total.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-800 text-sm">
                    <span className="font-bold text-slate-900 dark:text-white">Tiền cọc giữ chỗ:</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {selectedUnit.deposit.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>

                {/* Nút sang Bước 3 */}
                <button
                  type="button"
                  onClick={handleProceedToStep3}
                  className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                >
                  <span>Tiếp tục: Xem Thỏa thuận cọc</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              BƯỚC 3: THỎA THUẬN ĐẶT CỌC KHO (ĐIỀU KHOẢN & 2 CHECKBOX)
             ======================================================== */}
          {step === 3 && selectedUnit && (
            <motion.div
              key="step-3-contract-agreement"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-2xl mx-auto space-y-5"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="size-4" />
                  <span>Quay lại Bảng giá</span>
                </button>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full">
                  Bước 3 / 4: Thỏa thuận cọc
                </span>
              </div>

              {/* Khung Thỏa thuận đặt cọc kho */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                    <FileSignature className="size-5 text-amber-500" />
                    <span>Thỏa thuận đặt cọc kho</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Vui lòng xem lại thông tin giữ chỗ và các quy định trước khi tiến hành thanh toán
                  </p>
                </div>

                {/* Thông tin tóm tắt ô kho */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-700/60">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Boxes className="size-4 text-amber-500" /> Thông tin ô kho
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">
                        Chi nhánh: <strong className="text-slate-900 dark:text-white">{facilityDisplayName}</strong>
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${selectedUnit.isClimate ? 'bg-cyan-100 dark:bg-blue-950/60 text-cyan-700 dark:text-blue-300 border border-cyan-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                        {selectedUnit.isClimate ? '❄️ Kho Mát (22-25°C)' : '📦 Kho Tiêu Chuẩn'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-medium whitespace-nowrap">Mã kho</span>
                      <span className="font-mono font-bold text-amber-500 text-sm whitespace-nowrap">{selectedUnit.id}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-medium whitespace-nowrap">Ước tính tiền thuê</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm whitespace-nowrap">{rental.total.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-medium whitespace-nowrap">Ngày nhận (Check-in)</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm whitespace-nowrap">{startDate.split('-').reverse().join('/')}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-medium whitespace-nowrap">Hạn trả (Check-out)</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm whitespace-nowrap">{calculateCheckOutDate()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Tiền cọc giữ chỗ:</span>
                    <span className="text-lg font-mono font-black text-amber-500">
                      {selectedUnit.deposit.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>

                {/* Hộp điều khoản thuê kho */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldAlert className="size-4 text-blue-500" /> Điều khoản thuê & Quy định hủy cọc:
                  </label>
                  <div className="h-44 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-300 text-xs overflow-y-auto space-y-3 leading-relaxed">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">1. Mục đích cọc giữ chỗ:</p>
                      <p>
                        Khoản tiền cọc dùng để bảo lưu ô kho <strong>{selectedUnit.id}</strong> tại chi nhánh {facilityDisplayName} cho bạn kể từ ngày nhận kho {startDate.split('-').reverse().join('/')}.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">2. Chính sách hủy cọc & Hoàn tiền:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Hủy trước ngày nhận kho từ 4 ngày trở lên: Bạn được hoàn lại 100% tiền cọc.</li>
                        <li>Hủy trước ngày nhận kho dưới 4 ngày: Bạn bị tính phí phạt 50% tiền cọc và nhận lại 50% còn lại.</li>
                        <li>Đến hết ngày hẹn nhận kho nếu bạn không đến check-in. Hệ thống sẽ tự động hủy đơn và tịch thu 100% tiền cọc.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 2 Checkbox cam kết bắt buộc */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={noProhibitedGoods}
                      onChange={(e) => setNoProhibitedGoods(e.target.checked)}
                      className="mt-0.5 size-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 leading-snug">
                      Tôi cam kết <strong>không lưu trữ hàng cấm</strong>: thực phẩm tươi sống/đông lạnh, động vật sống, chất dễ cháy nổ, hóa chất độc hại, vũ khí và hàng hóa vi phạm pháp luật.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 size-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 leading-snug">
                      Tôi đã đọc và đồng ý với các <strong>điều khoản thuê kho, quy định hoàn hủy cọc và thời gian nhận kho</strong> nêu trên.
                    </span>
                  </label>
                </div>

                {/* Nút sang Bước 4: Thanh toán VietQR */}
                <button
                  type="button"
                  disabled={!noProhibitedGoods || !agreedTerms}
                  onClick={handleProceedToStep4}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all flex items-center justify-center gap-2 shadow-md ${noProhibitedGoods && agreedTerms
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 hover:scale-[1.01] cursor-pointer'
                      : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                >
                  <span>Xác nhận & Sang thanh toán cọc</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              BƯỚC 4: THANH TOÁN TIỀN CỌC QUA CỔNG VNPAY
             ======================================================== */}
          {step === 4 && selectedUnit && (
            <motion.div
              key="step-4-vnpay-payment"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md mx-auto space-y-4"
            >
              {!isPaymentCompleted ? (
                <>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>Quay lại Thỏa thuận</span>
                    </button>
                    <span className="font-mono text-xs font-black px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
                      {bookingCode}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-7 space-y-5">
                    {/* Header */}
                    <div className="text-center pb-3 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold">
                        <span>Thanh toán trực tuyến bảo mật</span>
                      </div>
                      <h3 className="font-black text-base uppercase text-slate-900 dark:text-white tracking-tight">
                        CỔNG THANH TOÁN VNPAY
                      </h3>
                      <p className="text-xs text-slate-500">
                        Hệ thống kết nối trực tiếp đến cổng thanh toán VNPay Sandbox
                      </p>
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
                          {selectedUnit.id} ({selectedUnit.size || selectedUnit.typeName || 'Tiêu chuẩn'})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Cơ sở lưu trữ:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{facilityDisplayName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Thời gian giữ chỗ:</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-pulse">
                          <Clock className="size-3.5" />
                          <span>{Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                        </span>
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Số tiền cọc cần thanh toán:
                        </span>
                        <span className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">
                          {depositAmount.toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    </div>

                    {/* Nút Mở Cổng VNPay */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        disabled={isRedirectingVNPay}
                        onClick={handleOpenVNPay}
                        className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${isRedirectingVNPay
                            ? 'bg-blue-800 opacity-80 cursor-wait text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.01]'
                          }`}
                      >
                        {isRedirectingVNPay ? (
                          <>
                            <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Đang chuyển đến cổng VNPay...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="size-4.5" />
                            <span>MỞ CỔNG VNPAY ĐỂ THANH TOÁN</span>
                            <ExternalLink className="size-3.5 opacity-80" />
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                        Bạn được chuyển hướng an toàn đến Cổng VNPay để hoàn tất giao dịch.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* THÔNG BÁO HOÀN TẤT ĐẶT CỌC */
                <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="size-10" />
                  </div>

                  <div>
                    <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                      ĐẶT CỌC GIỮ CHỖ THÀNH CÔNG!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Ô kho <strong className="text-blue-600 dark:text-blue-400">{selectedUnit.id}</strong> đã được chuyển sang trạng thái <strong>CHỜ CHECK-IN</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-2 font-medium">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Mã Hợp Đồng:</span>
                      <strong className="font-mono text-amber-600 dark:text-amber-400 font-black text-sm">{bookingCode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ngày nhận kho (Check-in):</span>
                      <strong className="text-slate-900 dark:text-white">{formatDate(startDate)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ngày trả kho dự kiến (Check-out):</span>
                      <strong className="text-slate-900 dark:text-white">{calculateCheckOutDate()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tiền cọc đã thanh toán:</span>
                      <strong className="text-emerald-600 font-bold">{depositAmount.toLocaleString('vi-VN')} VNĐ</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 text-left flex items-start gap-2">
                    <i className="fa-solid fa-circle-info text-amber-600 mt-0.5 shrink-0"></i>
                    <span>Vui lòng lưu lại mã <strong className="font-mono font-black">{bookingCode}</strong> để đọc cho nhân viên lễ tân khi đến cơ sở làm thủ tục check-in.</span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/storage')}
                      className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Xem hợp đồng trong Kho của tôi</span>
                      <ArrowRight className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/portal')}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Về trang chủ Cổng Khách Hàng
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CustomerLayout>
  );
}
