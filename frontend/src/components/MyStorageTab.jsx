import React, { useState, useEffect } from 'react';
import { getMyContracts, getGatePin } from '../services/contractService';

export default function MyStorageTab({ onOpenExtendModal }) {
  const [gateFacility, setGateFacility] = useState('HN-01');
  const [pinValue, setPinValue] = useState('--- ---');
  const [pinTimer, setPinTimer] = useState(15);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tải danh sách hợp đồng kho của khách hàng từ API Swagger
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const res = await getMyContracts();
        if (res.success) {
          setContracts(res.data);
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách hợp đồng kho:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  // Lấy mã PIN từ API theo cơ sở
  const fetchPinForFacility = async (code) => {
    try {
      const res = await getGatePin(code);
      if (res.success && res.data?.pin) {
        setPinValue(res.data.pin);
        setPinTimer(res.data.ttlSeconds || 15);
      }
    } catch (err) {
      console.error('Lỗi lấy mã PIN mở cổng:', err);
    }
  };

  // Đổi cơ sở mở cổng
  const handleFacilityChange = (code) => {
    setGateFacility(code);
    fetchPinForFacility(code);
  };

  // Khởi tạo mã PIN ban đầu
  useEffect(() => {
    fetchPinForFacility(gateFacility);
  }, []);

  // Đếm ngược 15s tự động lấy mã PIN mới
  useEffect(() => {
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
  }, [gateFacility]);

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* LEFT COLUMN: GATE PIN PASS */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="card-box rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base font-semibold border border-blue-100 dark:border-blue-800 shrink-0">
                  <i className="fa-solid fa-key"></i>
                </span>
                <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">MÃ PIN RA VÀO 24/7</h2>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0 animate-pulse"></span>Cho phép
              </span>
            </div>

            {/* FACILITY SELECTOR */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span><i className="fa-solid fa-location-dot text-rose-500 mr-1"></i> Chọn cơ sở mở cổng:</span>
              </label>
              <div className="relative">
                <select
                  value={gateFacility}
                  onChange={(e) => handleFacilityChange(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition truncate"
                >
                  <option value="HN-01">📍 Cầu Giấy (HN-01) • 391 Cầu Giấy</option>
                  <option value="HN-02">📍 Thanh Xuân (HN-02) • 120 Khuất Duy Tiến</option>
                </select>
              </div>
            </div>

            {/* LARGE 6-DIGIT PIN DISPLAY BOX */}
            <div className="bg-slate-900 text-white rounded-2xl flex flex-col justify-between border border-slate-800 shadow-md relative overflow-hidden p-6">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-2.5">
                <span className="flex items-center gap-1.5"><i className="fa-solid fa-shield-check text-emerald-400 text-xs"></i> MÃ BÀN PHÍM</span>
                <div className="text-amber-400 font-mono font-bold flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md text-[10px] border border-slate-700 select-none">
                  <i className="fa-solid fa-arrows-rotate text-[9px] animate-spin"></i> <span>{pinTimer}s</span>
                </div>
              </div>
              <div className="text-center py-6">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-400 select-all">{pinValue}</div>
                <p className="text-[10px] text-slate-300 mt-2 font-normal">Nhập 6 số tại bàn phím cửa</p>
              </div>
              <div className="border-t border-slate-800/80 pt-2.5 mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono font-semibold text-slate-300 tracking-wide text-[9px] truncate">
                  CƠ SỞ: {gateFacility}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MANAGED STORAGE UNITS TABLE */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="card-box rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Header Bar */}
            <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 py-5">
              <div className="flex items-center space-x-2.5">
                <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-semibold border border-blue-100 dark:border-blue-800 shrink-0">
                  <i className="fa-solid fa-boxes-stacked"></i>
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                    Danh Sách Ô Kho Quản Lý
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Tra cứu hạn trả kho, cơ chế khóa và thao tác gia hạn nhanh</p>
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto w-full">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <i className="fa-solid fa-spinner animate-spin text-lg mb-2 block text-blue-500"></i>
                  Đang tải danh sách hợp đồng kho...
                </div>
              ) : contracts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Chưa có hợp đồng thuê kho nào.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse min-w-full">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5 whitespace-nowrap text-center">Mã Hợp Đồng</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-center">Mã Ô Kho</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-center">Cơ Sở</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-center">Kích Cỡ</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-center">Ngày Trả Kho</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-center">Trạng Thái</th>
                      <th className="py-3.5 px-5 text-center whitespace-nowrap">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {contracts.map((item) => (
                      <tr key={item.contractId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="py-6 px-5 whitespace-nowrap align-middle text-center">
                          <span className="inline-flex items-center justify-center text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {item.contractId}
                          </span>
                        </td>
                        <td className="py-6 px-4 whitespace-nowrap align-middle text-center">
                          <span className="font-black text-slate-900 dark:text-slate-100 text-sm font-mono tracking-tight">{item.unitCode}</span>
                        </td>
                        <td className="py-6 px-4 whitespace-nowrap align-middle text-center">
                          <div className="flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300 gap-1.5">
                            <i className="fa-solid fa-location-dot text-rose-500 text-xs"></i>
                            <span>{item.branchName}</span>
                          </div>
                        </td>
                        <td className="py-6 px-4 whitespace-nowrap align-middle text-center">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{item.sizeLabel || `Size ${item.size}`}</span>
                        </td>
                        <td className="py-6 px-4 whitespace-nowrap align-middle text-center">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{item.expiryDate}</div>
                        </td>
                        <td className="py-6 px-4 whitespace-nowrap align-middle text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/50'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {item.statusLabel || item.status}
                          </span>
                        </td>
                        <td className="py-6 px-5 text-center whitespace-nowrap align-middle">
                          <div className="inline-flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenExtendModal({
                                name: `Kho: ${item.unitCode}`,
                                branch: item.branchName,
                                expiry: item.expiryDate,
                                daysLeft: item.daysLeft || 30,
                                size: item.size,
                                unitCode: item.unitCode
                              })}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
                            >
                              <i className="fa-solid fa-arrows-rotate text-[10px]"></i> Gia Hạn
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
