import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getMyContracts, getGatePin } from '@/features/portal/services/contractService';
import { KeyRound, ShieldCheck, ShieldAlert, RotateCw, MapPin, Clock, DoorOpen, AlertTriangle } from 'lucide-react';

export default function GatePinTab() {
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
    fetchContracts();
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
    if (!currentFacPermission.hasAccess) {
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
  }, [gateFacility, currentFacPermission.hasAccess]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Banner Tiêu Đề */}
      <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl border border-cyan-500/30 p-5 sm:p-6 shadow-[0_0_25px_rgba(34,211,238,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
            <KeyRound className="size-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
              MÃ PIN MỞ CỬA CHÍNH 24/7
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Mã bảo mật điện tử tự động cấp quyền vào cơ sở kho lưu trữ của bạn bất kỳ lúc nào.
            </p>
          </div>
        </div>

        {/* Lựa chọn cơ sở */}
        <div className="w-full sm:w-auto min-w-[220px]">
          {contractedFacilities.length > 0 ? (
            <div className="relative">
              <MapPin className="size-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={gateFacility}
                onChange={(e) => setGateFacility(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-cyan-500/30 bg-slate-900/90 text-white font-bold text-xs sm:text-sm focus:border-cyan-400 focus:outline-none cursor-pointer"
              >
                {contractedFacilities.map((fac: any) => (
                  <option key={fac.code} value={fac.code}>
                    {fac.name ? fac.name.replace(/\s*\([A-Z0-9-]+\)/g, '') : fac.code}
                  </option>
                ))}
              </select>
            </div>
          ) : loading ? (
            <div className="text-xs text-slate-400 font-medium px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
              Đang tải cơ sở...
            </div>
          ) : (
            <div className="text-xs text-amber-400 font-medium px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              Chưa có hợp đồng kho
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: THẺ HIỂN THỊ MÃ PIN LIVE 24/7 (CYBER NEON CARD) */}
        <div className="lg:col-span-7 bg-slate-950/85 backdrop-blur-md rounded-3xl border-2 border-cyan-400/50 p-6 sm:p-8 shadow-[0_0_35px_rgba(34,211,238,0.2)] relative overflow-hidden space-y-6">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentFacPermission.hasAccess ? (
                <span className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs">
                  <ShieldCheck className="size-4" />
                  <span>CỬA ĐƯỢC CẤP PHÉP LIVE 24/7</span>
                </span>
              ) : currentFacPermission.isPending ? (
                <span className="flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs">
                  <AlertTriangle className="size-4" />
                  <span>CHỜ CHECK-IN NHẬN KHO</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-bold text-xs">
                  <ShieldAlert className="size-4" />
                  <span>CHƯA CÓ QUYỀN MỞ CỬA</span>
                </span>
              )}
            </div>

            {currentFacPermission.hasAccess && (
              <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                <Clock className="size-3.5 text-cyan-400" />
                <span>Đổi sau: {pinTimer}s</span>
              </div>
            )}
          </div>

          {/* Dãy Số PIN 6 Chữ Số Lớn */}
          <div className="py-6 sm:py-8 text-center space-y-3 bg-slate-900/60 rounded-2xl border border-cyan-500/20 shadow-inner">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              MÃ BÀN PHÍM CỬA CHÍNH (6 CHỮ SỐ)
            </p>
            <div className={`text-4xl sm:text-6xl font-black font-mono tracking-[0.25em] select-all transition-all duration-300 ${
              currentFacPermission.hasAccess
                ? 'text-cyan-300 drop-shadow-[0_0_25px_rgba(34,211,238,0.7)]'
                : 'text-slate-600'
            }`}>
              {currentFacPermission.hasAccess ? pinValue : '--- ---'}
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto px-4">
              {currentFacPermission.hasAccess
                ? 'Nhập trực tiếp dãy 6 số này tại bàn phím số gắn trước cổng chính để mở cửa.'
                : currentFacPermission.isPending
                ? 'Hợp đồng tại cơ sở này đang chờ check-in nhận kho. Mã PIN sẽ tự động kích hoạt sau khi nhân viên duyệt check-in.'
                : 'Bạn không có hợp đồng kho nào đang hoạt động tại cơ sở này.'}
            </p>
          </div>

          {/* Nút Làm Mới Mã PIN */}
          {currentFacPermission.hasAccess && (
            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => gateFacility && fetchPinForFacility(gateFacility)}
              className="w-full py-3.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 hover:border-cyan-300 text-cyan-200 hover:text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.2)]"
            >
              <RotateCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Làm mới mã PIN ngay lập tức</span>
            </button>
          )}

          <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono font-bold text-cyan-300">
              CƠ SỞ: {gateFacility || 'Chưa chọn'}
            </span>
            <span>Tự động mã hóa động mỗi 15s</span>
          </div>
        </div>

        {/* CỘT PHẢI: HƯỚNG DẪN MỞ CỬA & QUY TRÌNH AN NINH */}
        <div className="lg:col-span-5 bg-slate-950/75 backdrop-blur-md rounded-3xl border border-cyan-500/20 p-6 sm:p-7 shadow-xl space-y-6">
          <h3 className="font-black text-sm uppercase text-white flex items-center space-x-2">
            <DoorOpen className="size-4.5 text-cyan-400" />
            <span>HƯỚNG DẪN MỞ CỬA BẰNG MÃ PIN</span>
          </h3>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300">
            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="size-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-black flex items-center justify-center shrink-0 text-xs border border-cyan-400/30">
                1
              </span>
              <div>
                <p className="font-bold text-white">Tiếp cận bàn phím cửa chính</p>
                <p className="text-slate-400 text-xs mt-0.5">Chạm vào màn hình keypad để đánh thức bàn phím cảm ứng sáng đèn.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="size-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-black flex items-center justify-center shrink-0 text-xs border border-cyan-400/30">
                2
              </span>
              <div>
                <p className="font-bold text-white">Nhập chính xác 6 chữ số</p>
                <p className="text-slate-400 text-xs mt-0.5">Nhập mã PIN đang hiển thị ở cột bên trái trước khi bộ đếm 15s reset.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="size-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-black flex items-center justify-center shrink-0 text-xs border border-cyan-400/30">
                3
              </span>
              <div>
                <p className="font-bold text-white">Nhấn phím # để mở khóa</p>
                <p className="text-slate-400 text-xs mt-0.5">Chốt từ sẽ nhả và đèn xanh sáng lên trong 10 giây để bạn đẩy cửa vào.</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 space-y-1">
            <p className="font-bold flex items-center space-x-1.5 text-amber-300">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Lưu ý bảo mật an ninh</span>
            </p>
            <p className="leading-relaxed">
              Tuyệt đối không chia sẻ mã PIN cho người lạ. Hệ thống camera AI nhận diện khuôn mặt giám sát liên tục 24/7 để bảo đảm an toàn cho tài sản của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
