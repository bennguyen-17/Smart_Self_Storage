import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getMyContracts, getGatePin } from '@/features/portal/services/contractService';

interface GatePinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GatePinModal({ isOpen, onClose }: GatePinModalProps) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateFacility, setGateFacility] = useState('');
  const [pinValue, setPinValue] = useState('--- ---');
  const [pinTimer, setPinTimer] = useState(15);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<any>(null);

  // Tải danh sách hợp đồng kho
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await getMyContracts();
      if (res.success && Array.isArray(res.data)) {
        setContracts(res.data);
      }
    } catch (e) {
      console.warn('Lỗi tải danh sách hợp đồng cho mã PIN:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchContracts();
    }
  }, [isOpen]);

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
        });
      } else {
        const item = map.get(code);
        if (isActive) item.hasActive = true;
        if (isPending) item.hasPending = true;
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

  // Kiểm tra quyền ra vào của cơ sở đang chọn
  const currentFacPermission = useMemo(() => {
    if (!gateFacility) return { hasAccess: false, isPending: false };
    const fac: any = contractedFacilities.find((f: any) => f.code === gateFacility);
    if (!fac) return { hasAccess: false, isPending: false };
    return {
      hasAccess: Boolean(fac.hasActive),
      isPending: !fac.hasActive && Boolean(fac.hasPending),
    };
  }, [contractedFacilities, gateFacility]);

  // Lấy mã PIN từ API theo cơ sở
  const fetchPinForFacility = async (code: string) => {
    if (!code || !currentFacPermission.hasAccess) {
      setPinValue('--- ---');
      return;
    }
    try {
      setIsRefreshing(true);
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
    } finally {
      setIsRefreshing(false);
    }
  };

  // Trigger lấy PIN khi đổi cơ sở hoặc quyền truy cập thay đổi
  useEffect(() => {
    if (gateFacility && currentFacPermission.hasAccess) {
      fetchPinForFacility(gateFacility);
    } else {
      setPinValue('--- ---');
    }
  }, [gateFacility, currentFacPermission.hasAccess]);

  // Đếm ngược 15s và tự động refresh mã PIN
  useEffect(() => {
    if (!isOpen || !currentFacPermission.hasAccess) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setPinTimer((prev) => {
        if (prev <= 1) {
          if (gateFacility) fetchPinForFacility(gateFacility);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, gateFacility, currentFacPermission.hasAccess]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="border border-slate-200 dark:border-slate-800 w-full max-w-lg flex flex-col rounded-3xl shadow-2xl modal-animate-pop bg-white dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-cyan-500/25">
              <i className="fa-solid fa-key"></i>
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white uppercase">
                MÃ PIN CỬA CHÍNH 24/7
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mã bảo mật mở cửa chính ra vào tự động 24/7
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* LỰA CHỌN CƠ SỞ KHO THUÊ */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              <i className="fa-solid fa-location-dot text-rose-500 mr-1.5"></i> Cơ sở kho thuê:
            </label>
            <div className="relative">
              {contractedFacilities.length > 0 ? (
                <select
                  value={gateFacility}
                  onChange={(e) => setGateFacility(e.target.value)}
                  className="w-full text-sm font-bold px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-500 outline-none cursor-pointer shadow-xs transition-all"
                >
                  {contractedFacilities.map((fac: any) => (
                    <option key={fac.code} value={fac.code} className="font-medium">
                      {fac.name ? fac.name.replace(/\s*\([A-Z0-9-]+\)/g, '') : fac.code}
                    </option>
                  ))}
                </select>
              ) : loading ? (
                <div className="w-full text-xs font-medium px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400">
                  <i className="fa-solid fa-spinner animate-spin mr-2"></i> Đang tải danh sách cơ sở...
                </div>
              ) : (
                <div className="w-full text-xs font-medium px-4 py-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 italic">
                  Chưa có cơ sở nào có hợp đồng thuê
                </div>
              )}
            </div>
          </div>

          {/* LARGE 6-DIGIT PIN DISPLAY CARD */}
          <div className="bg-slate-950 text-white rounded-3xl flex flex-col justify-between border border-slate-800 shadow-xl relative overflow-hidden p-5 sm:p-6 group">
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-500"></div>

            {/* Card Header Status */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-3">
              <span className="flex items-center gap-1.5">
                <i
                  className={`fa-solid ${
                    currentFacPermission.hasAccess
                      ? 'fa-shield-halved text-emerald-400'
                      : 'fa-lock text-slate-400'
                  } text-sm`}
                ></i>
                <span className="font-bold tracking-wide">
                  {currentFacPermission.hasAccess ? 'MÃ BÀN PHÍM LIVE 24/7' : 'MÃ CỬA KHÓA'}
                </span>
              </span>

              {currentFacPermission.hasAccess && (
                <div className="text-amber-400 font-mono font-black flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl text-xs border border-slate-700/80 shadow-xs select-none">
                  <i
                    className={`fa-solid fa-arrows-rotate text-[11px] ${
                      isRefreshing ? 'animate-spin text-amber-300' : ''
                    }`}
                  ></i>
                  <span>Đổi sau: {pinTimer}s</span>
                </div>
              )}
            </div>

            {/* PIN Digits Display */}
            <div className="text-center py-4 space-y-2.5">
              <div
                className={`text-3xl sm:text-4xl font-black font-mono tracking-widest transition-all duration-300 select-all ${
                  currentFacPermission.hasAccess
                    ? 'text-amber-400 drop-shadow-[0_0_18px_rgba(251,191,36,0.35)]'
                    : 'text-slate-600 tracking-[0.25em]'
                }`}
              >
                {currentFacPermission.hasAccess ? pinValue : '--- ---'}
              </div>

              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed font-normal">
                {currentFacPermission.hasAccess
                  ? 'Nhập dãy 6 số này tại bàn phím cửa chính cơ sở để mở cửa vào kho 24/7.'
                  : currentFacPermission.isPending
                  ? 'Hợp đồng tại cơ sở này đang ở trạng thái CHỜ CHECK-IN. Mã PIN mở cửa 24/7 chỉ được cấp tự động sau khi hoàn tất thủ tục nhận kho.'
                  : 'Cơ sở này hiện không có hợp đồng nào đang có HIỆU LỰC (ACTIVE). Mã PIN 24/7 không được sinh.'}
              </p>
            </div>

            {/* Card Footer Bar */}
            <div className="border-t border-slate-800/80 pt-3 mt-2 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono font-bold text-slate-300 tracking-wider truncate">
                CƠ SỞ: {gateFacility || 'Chưa chọn'}
              </span>
              <span className="font-semibold text-slate-400">
                {currentFacPermission.hasAccess ? 'Tự làm mới mỗi 15s' : 'Khóa mở cổng'}
              </span>
            </div>
          </div>

          {/* Quick Refresh Button */}
          {currentFacPermission.hasAccess && (
            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => gateFacility && fetchPinForFacility(gateFacility)}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className={`fa-solid fa-rotate text-xs ${isRefreshing ? 'animate-spin' : ''}`}></i>
              <span>Làm mới mã PIN ngay</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
