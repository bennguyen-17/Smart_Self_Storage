import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyContracts } from '@/features/customer/storage/storageApi';
import { getGatePin } from '../pinApi';
import { KeyRound, ShieldCheck, ShieldAlert, MapPin, Clock, DoorOpen, AlertTriangle, ArrowRight, Warehouse } from 'lucide-react';

export default function PinDisplay() {
  const navigate = useNavigate();
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

  // CHỈ LẤY CÁC CƠ SỞ MÀ KHÁCH HÀNG CÓ HỢP ĐỒNG ĐANG HIỆU LỰC (ACTIVE)
  const contractedFacilities = useMemo(() => {
    const map = new Map();
    contracts.forEach((c: any) => {
      // BẮT BUỘC hợp đồng phải ACTIVE mới có quyền chọn mã PIN ở cơ sở đó
      if (c.status !== 'ACTIVE') return;

      const code = (c.branchCode || 'HN01').replace('-', '').toUpperCase();
      if (!map.has(code)) {
        map.set(code, {
          code,
          name: c.branchName || `Cơ sở ${code}`,
          hasActive: true,
        });
      }
    });

    return Array.from(map.values());
  }, [contracts]);

  // Số hợp đồng đang chờ check-in
  const pendingContracts = useMemo(() => {
    return contracts.filter((c: any) => c.status === 'PENDING_CHECKIN');
  }, [contracts]);

  // Tự động chọn cơ sở đầu tiên có hợp đồng ACTIVE
  useEffect(() => {
    if (contractedFacilities.length > 0) {
      if (!gateFacility || !contractedFacilities.some((f: any) => f.code === gateFacility)) {
        setGateFacility(contractedFacilities[0].code);
      }
    } else {
      setGateFacility('');
    }
  }, [contractedFacilities, gateFacility]);

  // Kiểm tra quyền ra vào của cơ sở đang chọn
  const currentFacPermission = useMemo(() => {
    if (!gateFacility) return { hasAccess: false };
    const fac: any = contractedFacilities.find((f: any) => f.code === gateFacility);
    return {
      hasAccess: Boolean(fac?.hasActive),
    };
  }, [contractedFacilities, gateFacility]);

  // Lấy mã PIN từ API theo cơ sở (Chỉ gọi khi cơ sở có hợp đồng ACTIVE)
  const fetchPinForFacility = async (code: string) => {
    if (!code || !currentFacPermission.hasAccess) {
      setPinValue('--- ---');
      return;
    }
    try {
      setIsRefreshing(true);
      const res: any = await getGatePin(code);
      const pin = res?.pin || res?.data?.pin;
      const ttl = res?.ttlSeconds || res?.data?.ttlSeconds || 15;
      const hasAccess = (res?.hasAccess ?? res?.data?.hasAccess) === true;

      if (hasAccess && pin) {
        setPinValue(pin);
        setPinTimer(ttl);
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
      <div className="bg-white dark:bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-cyan-500/30 p-5 sm:p-6 shadow-sm dark:shadow-[0_0_25px_rgba(34,211,238,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-cyan-500/20 dark:text-cyan-300 border border-blue-200 dark:border-cyan-400/30 shadow-xs dark:shadow-[0_0_15px_rgba(34,211,238,0.25)]">
            <KeyRound className="size-6 text-blue-600 dark:text-cyan-300" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              MÃ PIN MỞ CỬA CHÍNH 24/7
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Mã bảo mật dùng để ra vào cửa chính của cơ sở kho bạn thuê
            </p>
          </div>
        </div>

        {/* Lựa chọn cơ sở */}
        <div className="w-full sm:w-auto min-w-[220px]">
          {contractedFacilities.length > 0 ? (
            <div className="relative">
              <MapPin className="size-4 text-blue-600 dark:text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={gateFacility}
                onChange={(e) => setGateFacility(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold text-xs sm:text-sm focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none cursor-pointer"
              >
                {contractedFacilities.map((fac: any) => (
                  <option key={fac.code} value={fac.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {fac.name ? fac.name.replace(/\s*\([A-Z0-9-]+\)/g, '') : fac.code}
                  </option>
                ))}
              </select>
            </div>
          ) : loading ? (
            <div className="text-xs text-slate-500 font-medium px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              Đang tải cơ sở...
            </div>
          ) : (
            <div className="text-xs text-amber-700 dark:text-amber-300 font-bold px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
              <span>{pendingContracts.length > 0 ? 'Chờ check-in nhận kho' : 'Chưa có hợp đồng'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: THẺ HIỂN THỊ MÃ PIN LIVE 24/7 (CYBER NEON CARD) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-950/85 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-cyan-400/50 p-6 sm:p-8 shadow-sm dark:shadow-[0_0_35px_rgba(34,211,238,0.2)] relative overflow-hidden space-y-6">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Status */}
          <div className="flex items-center justify-between">
            {currentFacPermission.hasAccess && (
              <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-300 text-xs font-mono font-bold">
                <Clock className="size-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Đổi sau: {pinTimer}s</span>
              </div>
            )}
          </div>

          {/* Dãy Số PIN 6 Chữ Số Lớn */}
          <div className="py-6 sm:py-8 text-center space-y-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-cyan-500/20 shadow-inner">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
              MÃ BÀN PHÍM CỬA CHÍNH (6 CHỮ SỐ)
            </p>
            <div className={`text-4xl sm:text-6xl font-black font-mono tracking-[0.25em] select-all transition-all duration-300 ${currentFacPermission.hasAccess
                ? 'text-blue-600 dark:text-cyan-300 dark:drop-shadow-[0_0_25px_rgba(34,211,238,0.7)]'
                : 'text-slate-300 dark:text-slate-600'
              }`}>
              {currentFacPermission.hasAccess ? pinValue : '--- ---'}
            </div>

            {currentFacPermission.hasAccess ? (
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto px-4">
                Nhập trực tiếp dãy 6 số này tại bàn phím số gắn trước cổng chính để mở cửa.
              </p>
            ) : pendingContracts.length > 0 ? (
              <div className="space-y-3 px-4 max-w-md mx-auto">
                <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 rounded-xl leading-relaxed">
                  Bạn có <strong>{pendingContracts.length} hợp đồng</strong> đang ở trạng thái <strong>Chờ check-in nhận kho</strong>. Mã PIN mở cửa chính 24/7 sẽ tự động kích hoạt ngay sau khi nhân viên tại cơ sở duyệt check-in cho bạn.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/storage')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  <Warehouse className="size-4" />
                  <span>Xem hợp đồng tại Kho của tôi</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 px-4 max-w-md mx-auto">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tài khoản của bạn hiện chưa có hợp đồng kho nào đang hoạt động.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/rent')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  <span>Thuê ô kho ngay</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-bold text-blue-600 dark:text-cyan-300">
              CƠ SỞ: {gateFacility || 'Chưa chọn'}
            </span>
            <span>Tự động mã hóa động mỗi 15s</span>
          </div>
        </div>

        {/* CỘT PHẢI: HƯỚNG DẪN MỞ CỬA & QUY TRÌNH AN NINH */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-950/75 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-cyan-500/20 p-6 sm:p-7 shadow-sm dark:shadow-xl space-y-6">
          <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white flex items-center space-x-2">
            <DoorOpen className="size-4.5 text-blue-600 dark:text-cyan-400" />
            <span>HƯỚNG DẪN MỞ CỬA BẰNG MÃ PIN</span>
          </h3>

          <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="size-6 rounded-lg bg-blue-50 text-blue-600 dark:bg-cyan-500/20 dark:text-cyan-300 font-black flex items-center justify-center shrink-0 text-xs border border-blue-200 dark:border-cyan-400/30">
                1
              </span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Tiếp cận bàn phím cửa chính</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Chạm vào màn hình keypad để đánh thức bàn phím cảm ứng sáng đèn.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="size-6 rounded-lg bg-blue-50 text-blue-600 dark:bg-cyan-500/20 dark:text-cyan-300 font-black flex items-center justify-center shrink-0 text-xs border border-blue-200 dark:border-cyan-400/30">
                2
              </span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Nhập chính xác 6 chữ số</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Nhập mã PIN đang hiển thị ở cột bên trái trước khi bộ đếm 15s reset.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="size-6 rounded-lg bg-blue-50 text-blue-600 dark:bg-cyan-500/20 dark:text-cyan-300 font-black flex items-center justify-center shrink-0 text-xs border border-blue-200 dark:border-cyan-400/30">
                3
              </span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Nhấn phím # để mở khóa</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Chốt từ sẽ nhả và đèn xanh sáng lên trong 10 giây để bạn đẩy cửa vào.</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20 text-xs space-y-1">
            <p className="font-bold flex items-center space-x-1.5 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Lưu ý bảo mật an ninh</span>
            </p>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="">Tuyệt đối không chia sẻ mã PIN cho người lạ. </div>
              <div className="">Nếu có bất kì mất mát nào xảy ra, bạn phải chịu hoàn toàn trách nhiệm</div>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
