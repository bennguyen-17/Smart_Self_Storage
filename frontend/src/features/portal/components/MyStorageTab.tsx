import React, { useState, useEffect, useMemo } from 'react';
import { getMyContracts, getGatePin, cancelDepositContract } from '@/features/portal/services/contractService';
import ContractDetailModal from '@/features/portal/components/modals/ContractDetailModal';
import { formatDate } from '@/lib/format';
import { canExtendOnline } from '@/features/portal/lib/contractRules';

export default function MyStorageTab({ onOpenExtendModal }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gateFacility, setGateFacility] = useState('');
  const [pinValue, setPinValue] = useState('--- ---');
  const [pinTimer, setPinTimer] = useState(15);
  
  // Modal Hủy Cọc & Xem hợp đồng
  const [cancelModalContract, setCancelModalContract] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [viewContract, setViewContract] = useState(null);

  // Tải danh sách hợp đồng kho của khách hàng
  const fetchContracts = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await getMyContracts();
      if (res.success && Array.isArray(res.data)) {
        // Lọc bỏ triệt để các mã mock fix cứng như #HD-2
        const validList = res.data.filter((c: any) => c.contractId !== '#HD-2' && c.rawContractId !== 2).sort((a: any, b: any) => (b.rawContractId || 0) - (a.rawContractId || 0));
        setContracts(validList);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách hợp đồng kho:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    // Dọn dẹp cache nếu từng lưu #HD-2
    try {
      const raw = localStorage.getItem('smart_storage_contracts');
      if (raw && (raw.includes('#HD-2') || raw.includes('"rawContractId":2'))) {
        const parsed = JSON.parse(raw);
        const filtered = parsed.filter((c: any) => c.contractId !== '#HD-2' && c.rawContractId !== 2);
        localStorage.setItem('smart_storage_contracts', JSON.stringify(filtered));
      }
    } catch (e) {}

    fetchContracts(true);

    const handleUpdate = () => {
      fetchContracts(false);
    };
    window.addEventListener('storage_contracts_updated', handleUpdate);

    return () => {
      window.removeEventListener('storage_contracts_updated', handleUpdate);
    };
  }, []);

  // Lọc danh sách các cơ sở mà khách hàng thực sự có hợp đồng
  const contractedFacilities = useMemo(() => {
    const map = new Map();
    contracts.forEach((c: any) => {
      const code = c.branchCode || 'HN-01';
      const isActive = c.status === 'ACTIVE';
      const isPending = c.status === 'PENDING_CHECKIN';

      if (!map.has(code)) {
        map.set(code, {
          code,
          name: c.branchName || `Cơ sở ${code}`,
          hasActive: isActive,
          hasPending: isPending,
          activeCount: isActive ? 1 : 0,
          pendingCount: isPending ? 1 : 0
        });
      } else {
        const item = map.get(code);
        if (isActive) {
          item.hasActive = true;
          item.activeCount = (item.activeCount || 0) + 1;
        }
        if (isPending) {
          item.hasPending = true;
          item.pendingCount = (item.pendingCount || 0) + 1;
        }
      }
    });
    return Array.from(map.values()).filter((f: any) => f.hasActive || f.hasPending);
  }, [contracts]);

  // Tự động ưu tiên chọn cơ sở có hợp đồng HIỆU LỰC (ACTIVE)
  useEffect(() => {
    if (contractedFacilities.length > 0) {
      const activeFac = contractedFacilities.find((f: any) => f.hasActive);
      if (activeFac) {
        const cur = contractedFacilities.find((f: any) => f.code === gateFacility);
        if (!cur || !cur.hasActive) {
          setGateFacility(activeFac.code);
        }
      } else if (!gateFacility || !contractedFacilities.some((f: any) => f.code === gateFacility)) {
        setGateFacility(contractedFacilities[0].code);
      }
    } else {
      setGateFacility('');
    }
  }, [contractedFacilities, gateFacility]);

  // Kiểm tra quyền ra vào của cơ sở đang chọn (BẮT BUỘC có hợp đồng ACTIVE)
  const currentFacPermission = useMemo(() => {
    if (!gateFacility) return { hasAccess: false, isPending: false };
    const fac: any = contractedFacilities.find((f: any) => f.code === gateFacility);
    if (!fac) return { hasAccess: false, isPending: false };
    return {
      hasAccess: Boolean(fac.hasActive),
      isPending: !fac.hasActive && Boolean(fac.hasPending)
    };
  }, [contractedFacilities, gateFacility]);

  // Lấy mã PIN từ API theo cơ sở (Chỉ gọi khi cơ sở có hợp đồng ACTIVE)
  const fetchPinForFacility = async (code: string) => {
    if (!code || !currentFacPermission.hasAccess) {
      setPinValue('--- ---');
      return;
    }
    try {
      const res = await getGatePin(code);
      if (res.success && res.data?.hasAccess !== false && res.data?.pin) {
        setPinValue(res.data.pin);
        setPinTimer(res.data.ttlSeconds || 15);
      } else {
        setPinValue('--- ---');
      }
    } catch (err) {
      console.warn('Lỗi lấy mã PIN mở cổng:', err);
      setPinValue('--- ---');
    }
  };

  // Đổi cơ sở mở cổng
  const handleFacilityChange = (code: string) => {
    setGateFacility(code);
  };

  // Khi cơ sở hoặc quyền thay đổi, cập nhật PIN
  useEffect(() => {
    if (currentFacPermission.hasAccess && gateFacility) {
      fetchPinForFacility(gateFacility);
    } else {
      setPinValue('--- ---');
    }
  }, [gateFacility, currentFacPermission.hasAccess]);

  // Đếm ngược 15s tự động lấy mã PIN mới nếu ĐƯỢC PHÉP
  useEffect(() => {
    if (!currentFacPermission.hasAccess || !gateFacility) return;

    const interval = setInterval(() => {
      setPinTimer((prev) => {
        if (prev <= 1) {
          fetchPinForFacility(gateFacility);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gateFacility, currentFacPermission.hasAccess]);

  // Xử lý Hủy cọc
  const handleConfirmCancelDeposit = async () => {
    if (!cancelModalContract) return;
    setIsCancelling(true);
    try {
      await cancelDepositContract(cancelModalContract);
      setCancelModalContract(null);
      await fetchContracts();
    } catch (err) {
      console.error('Lỗi khi hủy cọc:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start w-full">
        {/* LEFT COLUMN: GATE PIN PASS (Chỉ cấp PIN cho cơ sở có hợp đồng) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="card-box rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 sm:p-6 space-y-4 sm:space-y-5">
            {/* Header */}
            <div className="flex flex-col items-start xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center space-x-2.5 sm:space-x-3 w-full">
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base sm:text-lg font-bold border border-blue-100 dark:border-blue-800 shrink-0 shadow-xs">
                  <i className="fa-solid fa-key"></i>
                </span>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">MÃ PIN CỬA CHÍNH 24/7</h2>
              </div>
            </div>

            {/* FACILITY SELECTOR */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center justify-between">
                <span><i className="fa-solid fa-location-dot text-rose-500 mr-1.5"></i> Cơ sở kho thuê:</span>
              </label>
              <div className="relative">
                {contractedFacilities.length > 0 ? (
                  <select
                    value={gateFacility}
                    onChange={(e) => handleFacilityChange(e.target.value)}
                    className="w-full text-sm font-bold px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 dark:focus:border-blue-500 outline-none cursor-pointer shadow-sm transition-all"
                  >
                    {contractedFacilities.map((fac: any) => (
                      <option key={fac.code} value={fac.code} className="font-medium">
                        {fac.name ? fac.name.replace(/\s*\([A-Z0-9-]+\)/g, '') : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full text-xs sm:text-sm font-medium px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 italic">
                    Chưa có cơ sở nào có hợp đồng
                  </div>
                )}
              </div>
            </div>

            {/* LARGE 6-DIGIT PIN DISPLAY BOX */}
            <div className="bg-slate-950 text-white rounded-2xl flex flex-col justify-between border border-slate-800 shadow-md relative overflow-hidden p-3.5 sm:p-4 group">
              <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
              
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <i className={`fa-solid ${currentFacPermission.hasAccess ? 'fa-shield-halved text-emerald-400' : 'fa-lock text-slate-400'} text-xs`}></i>
                  {currentFacPermission.hasAccess ? 'MÃ BÀN PHÍM LIVE 24/7' : 'MÃ CỬA KHÓA'}
                </span>
                {currentFacPermission.hasAccess && (
                  <div className="text-amber-400 font-mono font-black flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded-lg text-xs border border-slate-700/80 shadow-xs select-none">
                    <i className="fa-solid fa-arrows-rotate text-[10px] animate-spin"></i> <span>{pinTimer}s</span>
                  </div>
                )}
              </div>

              <div className="text-center py-2.5 sm:py-3.5 space-y-1.5">
                <div className={`text-2xl sm:text-3xl font-black font-mono tracking-widest transition-all duration-300 ${
                  currentFacPermission.hasAccess ? 'text-amber-400 select-all drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'text-slate-600 tracking-[0.25em]'
                }`}>
                  {currentFacPermission.hasAccess ? pinValue : '--- ---'}
                </div>
                <p className="text-[11px] text-slate-300 max-w-xs mx-auto leading-relaxed font-normal">
                  {currentFacPermission.hasAccess
                    ? 'Nhập 6 số tại bàn phím cửa chính cơ sở để mở cửa vào kho 24/7.'
                    : currentFacPermission.isPending
                    ? 'Hợp đồng tại cơ sở này đang ở trạng thái CHỜ CHECK-IN. Mã PIN mở cửa 24/7 chỉ được cấp tự động sau khi hoàn tất thủ tục nhận kho.'
                    : 'Cơ sở này hiện không có hợp đồng nào đang có HIỆU LỰC (ACTIVE). Mã PIN 24/7 không được sinh.'}
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-2 mt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono font-bold text-slate-300 tracking-wider truncate">
                  CƠ SỞ: {gateFacility || 'Chưa chọn'}
                </span>
                <span className="font-semibold text-slate-400">
                  {currentFacPermission.hasAccess ? 'Đổi mỗi 15s' : 'Khóa mở cổng'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MANAGED STORAGE UNITS TABLE */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="card-box rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {/* Header Bar */}
            <div className="p-5 sm:px-7 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center space-x-3">
                <span className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base font-bold border border-blue-100 dark:border-blue-800 shrink-0 shadow-xs">
                  <i className="fa-solid fa-boxes-stacked"></i>
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Danh Sách Ô Kho Quản Lý
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Theo dõi trạng thái hợp đồng, thủ tục check-in nhận kho và gia hạn</p>
                </div>
              </div>
            </div>

            {/* Table or Responsive Cards Content */}
            <div className="w-full">
              {loading ? (
                <div className="py-16 text-center text-sm font-semibold text-slate-400">
                  <i className="fa-solid fa-spinner animate-spin text-2xl mb-3 block text-blue-500"></i>
                  Đang tải danh sách hợp đồng kho...
                </div>
              ) : contracts.length === 0 ? (
                <div className="py-16 text-center text-sm font-semibold text-slate-400">
                  Chưa có hợp đồng thuê kho nào.
                </div>
              ) : (
                <>
                  {/* 1. RESPONSIVE CARD VIEW (Màn hình nhỏ & vừa, KHÔNG CẦN CUỘN NGANG) */}
                  <div className="xl:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {contracts.map((item) => {
                      const isPending = item.status === 'PENDING_CHECKIN';
                      const isActive = item.status === 'ACTIVE';
                      const isCanceled = item.status === 'CANCELED';

                      return (
                        <div key={item.contractId} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Top Row: Mã hợp đồng, Mã ô kho, Trạng thái */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setViewContract(item)}
                                title="Xem chi tiết hợp đồng"
                                className="text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-xs hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors cursor-pointer inline-flex items-center"
                              >
                                <i className="fa-solid fa-file-contract mr-1.5"></i>
                                {item.contractId}
                              </button>
                              <span className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base font-mono">
                                {item.unitCode}
                              </span>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border shadow-xs ${
                              isActive
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                                : isPending
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}>
                              <span className={`w-2 h-2 rounded-full mr-1.5 ${
                                isActive ? 'bg-emerald-500' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                              }`}></span>
                              {isPending ? 'CHỜ CHECK-IN' : (item.statusLabel || item.status)}
                            </span>
                          </div>

                          {/* Middle Grid: Cơ sở, Kích cỡ, Ngày trả kho */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                            <div className="col-span-2 sm:col-span-1">
                              <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Cơ Sở</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5 truncate" title={item.branchName}>
                                <i className="fa-solid fa-location-dot text-rose-500 text-[11px] shrink-0"></i>
                                <span className="truncate">{item.branchName ? item.branchName.replace(/\s*\([A-Z0-9-]+\)/g, '') : ''}</span>
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Ngày nhận kho</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                                {formatDate(item.startDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Ngày trả kho</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                                {formatDate(item.expiryDate)}
                              </span>
                            </div>
                          </div>

                          {/* Bottom: Nút Hành Động */}
                          <div className="flex items-center justify-end pt-1 gap-1.5">
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => setCancelModalContract(item)}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
                                title="Hủy đặt cọc ô kho"
                              >
                                <i className="fa-solid fa-ban text-xs"></i> Hủy cọc
                              </button>
                            )}

                            {/* US-12 / BR-29: chỉ HĐ ACTIVE mới được gia hạn online */}
                            {canExtendOnline(item.status) && (
                              <button
                                type="button"
                                onClick={() => onOpenExtendModal({
                                  name: `Kho: ${item.unitCode}`,
                                  branch: item.branchName,
                                  expiry: item.expiryDate,
                                  daysLeft: item.daysLeft || 30,
                                  size: item.size,
                                          unitCode: item.unitCode,
                                          rentalFee: item.rentalFee
                                })}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
                              >
                                <i className="fa-solid fa-arrows-rotate text-xs"></i> Gia Hạn
                              </button>
                            )}

                            {isCanceled && (
                              <span className="text-xs text-slate-400 italic">Đã hủy cọc</span>
                            )}

                            {/* US-12 / BR-29: HĐ OVERDUE không gia hạn online, phải ra quầy nộp phạt (US-20) */}
                            {item.status === 'OVERDUE' && (
                              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                <i className="fa-solid fa-store text-xs"></i> Quá hạn: vui lòng gia hạn tại quầy
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. DESKTOP OPTIMIZED TABLE VIEW (Màn hình lớn XL+, canh lề gọn không bị tràn ngang) */}
                  <div className="hidden xl:block overflow-x-auto w-full">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          <th className="py-2 px-2 text-center whitespace-nowrap">Mã Hợp Đồng</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Mã Ô Kho</th>
                          <th className="py-2 px-2 text-center">Cơ Sở</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Ngày Nhận Kho</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Ngày Trả Kho</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Trạng Thái</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Hành Động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {contracts.map((item) => {
                          const isPending = item.status === 'PENDING_CHECKIN';
                          const isActive = item.status === 'ACTIVE';
                          const isCanceled = item.status === 'CANCELED';

                          return (
                            <tr key={item.contractId} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors group">
                              <td className="py-2.5 px-2 whitespace-nowrap align-middle text-center">
                                <button
                                  type="button"
                                  onClick={() => setViewContract(item)}
                                  title="Xem chi tiết hợp đồng"
                                  className="inline-flex items-center justify-center text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-xs hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                                >
                                  <i className="fa-solid fa-file-contract mr-1"></i>
                                  {item.contractId}
                                </button>
                              </td>
                              <td className="py-2.5 px-2 whitespace-nowrap align-middle text-center">
                                <span className="font-black text-slate-900 dark:text-slate-100 text-xs font-mono tracking-tight">{item.unitCode}</span>
                              </td>
                              <td className="py-2.5 px-2 align-middle text-center">
                                <div className="flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-300 gap-1 max-w-[170px] mx-auto truncate" title={item.branchName}>
                                  <i className="fa-solid fa-location-dot text-rose-500 text-[10px] shrink-0"></i>
                                  <span className="truncate">{item.branchName ? item.branchName.replace(/\s*\([A-Z0-9-]+\)/g, '') : ''}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 whitespace-nowrap align-middle text-center">
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">{formatDate(item.startDate)}</span>
                              </td>
                              <td className="py-2.5 px-2 whitespace-nowrap align-middle text-center">
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{formatDate(item.expiryDate)}</div>
                              </td>
                              <td className="py-2.5 px-2 whitespace-nowrap align-middle text-center">
                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black border shadow-xs ${
                                  isActive
                                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                                    : isPending
                                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                                    isActive ? 'bg-emerald-500' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                                  }`}></span>
                                  {isPending ? 'CHỜ CHECK-IN' : (item.statusLabel || item.status)}
                                </span>
                              </td>

                              {/* CỘT HÀNH ĐỘNG */}
                              <td className="py-3.5 px-3 text-center whitespace-nowrap align-middle">
                                <div className="inline-flex items-center justify-center gap-1.5">
                                  {isPending && (
                                    <button
                                      type="button"
                                      onClick={() => setCancelModalContract(item)}
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1 shadow-xs whitespace-nowrap active:scale-95"
                                      title="Hủy đặt cọc ô kho"
                                    >
                                      <i className="fa-solid fa-ban text-[11px]"></i> Hủy cọc
                                    </button>
                                  )}

                                  {/* US-12 / BR-29: chỉ HĐ ACTIVE mới được gia hạn online */}
                                  {canExtendOnline(item.status) && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenExtendModal({
                                        name: `Kho: ${item.unitCode}`,
                                        branch: item.branchName,
                                        expiry: item.expiryDate,
                                        daysLeft: item.daysLeft || 30,
                                        size: item.size,
                                          unitCode: item.unitCode,
                                          rentalFee: item.rentalFee
                                      })}
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-700 transition cursor-pointer flex items-center justify-center gap-1 shadow-xs whitespace-nowrap active:scale-95"
                                    >
                                      <i className="fa-solid fa-arrows-rotate text-[11px]"></i> Gia Hạn
                                    </button>
                                  )}

                                  {isCanceled && (
                                    <span className="text-xs text-slate-400 italic">Đã hủy cọc</span>
                                  )}

                                  {/* US-12 / BR-29: HĐ OVERDUE không gia hạn online, phải ra quầy nộp phạt (US-20) */}
                                  {item.status === 'OVERDUE' && (
                                    <span
                                      className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1"
                                      title="Hợp đồng quá hạn không gia hạn online được. Vui lòng đến quầy để nộp phạt và gia hạn."
                                    >
                                      <i className="fa-solid fa-store text-[11px]"></i> Gia hạn tại quầy
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL XÁC NHẬN HỦY CỌC (BR-17) */}
      {cancelModalContract && (
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
                <span className="font-mono font-bold text-slate-900 dark:text-white">{cancelModalContract.contractId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ô kho đặt cọc:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{cancelModalContract.unitCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Cơ sở:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{cancelModalContract.branchName}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 space-y-2">
              <span className="font-bold flex items-center gap-1.5 text-xs">
                <i className="fa-solid fa-file-invoice"></i> Chính sách hủy cọc & Quy trình hoàn tiền Back-office:
              </span>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong className="font-semibold">Hủy trước ngày nhận kho từ 7 ngày trở lên:</strong> Bạn được hoàn lại 100% tiền cọc.</li>
                <li><strong className="font-semibold">Hủy trước ngày nhận kho dưới 7 ngày:</strong> Bạn sẽ bị tính phí hủy 50% tiền cọc và nhận lại 50% còn lại.</li>
              </ul>
              <div className="pt-2 mt-2 border-t border-amber-200/60 dark:border-amber-800/60">
                <p className="flex gap-1.5">
                  <i className="fa-solid fa-triangle-exclamation mt-0.5 text-[10px]"></i>
                  <span>Lưu ý: Hệ thống sẽ tự động lập Yêu cầu hoàn cọc (Hóa đơn REF ở trạng thái PENDING). Kế toán / Back-office sẽ chuyển khoản hoàn tiền trong vòng <strong>24 - 48 giờ làm việc</strong>, đính kèm biên lai xác nhận và gửi email thông báo cho bạn (theo BR-35).</span>
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancelModalContract(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Giữ lại
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancelDeposit}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                {isCancelling ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-ban"></i>}
                <span>{isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy cọc'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {viewContract && (
        <ContractDetailModal 
          contract={viewContract} 
          onClose={() => setViewContract(null)} 
        />
      )}
    </div>
  );
}
