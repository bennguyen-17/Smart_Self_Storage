import React, { useState, useEffect } from 'react';
import { getCurrentCustomerProfile } from '../services/customerService';

export default function CustomerProfileModal({ onClose, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getCurrentCustomerProfile();
        if (res.success) {
          setProfile(res.data);
        }
      } catch (err) {
        console.error('Lỗi tải hồ sơ khách hàng:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card-box max-w-md w-full rounded-3xl border shadow-2xl overflow-hidden space-y-4 p-5 sm:p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 modal-animate-pop">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow">
              <i className="fa-solid fa-id-card"></i>
            </div>
            <h3 className="font-extrabold text-sm text-title">HỒ SƠ KHÁCH HÀNG</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <i className="fa-solid fa-spinner animate-spin text-lg mb-2 block text-blue-500"></i>
            Đang tải thông tin khách hàng...
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-4 rounded-2xl text-white flex items-center space-x-4 border border-slate-800 shadow-inner">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-400 text-white font-black text-xl flex items-center justify-center shadow-lg border-2 border-blue-300 shrink-0">
                {profile?.avatarText || profile?.fullName?.charAt(0) || 'KH'}
              </div>
              <div>
                <h2 className="font-black text-base text-white">{profile?.fullName || 'Khách Hàng'}</h2>
                <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full inline-block mt-0.5">
                  <i className="fa-solid fa-shield-check mr-1"></i> {profile?.verificationBadge || 'ĐÃ XÁC THỰC CCCD TẠI QUẦY STAFF'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="inner-box p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-muted uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">
                  Thông tin Cá nhân & Liên hệ
                </div>
                <div className="grid grid-cols-2 gap-2 text-title">
                  <div>
                    <span className="text-muted block text-[10px]">Họ và Tên:</span>
                    <span className="font-bold">{profile?.fullName}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Mã CCCD:</span>
                    <span className="font-bold font-mono text-xs">{profile?.identityNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Số Điện Thoại:</span>
                    <span className="font-bold">{profile?.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Email:</span>
                    <span className="font-bold text-[11px] truncate">{profile?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="pt-2 flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i> Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
