import React from 'react';

export default function Header({ isDarkMode, onToggleTheme, onOpenProfileModal }) {
  return (
    <header className="w-full h-18 sm:h-20 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 px-6 sm:px-10 flex items-center justify-between shrink-0 sticky top-0 z-40 transition-colors shadow-xs">
      {/* BRAND LOGO */}
      <div className="flex items-center space-x-3.5 shrink-0">
        <div className="bg-blue-600 text-white p-2.5 rounded-2xl font-bold text-xl shadow-md shadow-blue-500/20 flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 shrink-0">
          <i className="fa-solid fa-warehouse"></i>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight tracking-tight">Smart Storage</span>
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-extrabold text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
              CỔNG KHÁCH HÀNG
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Hệ thống cho thuê kho tự quản thông minh 24/7</div>
        </div>
      </div>

      {/* CONTROLS & USER PROFILE */}
      <div className="flex items-center space-x-3 shrink-0">
        <button
          onClick={onToggleTheme}
          className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition whitespace-nowrap cursor-pointer shadow-xs"
          type="button"
        >
          <i className={`fa-solid ${isDarkMode ? 'fa-moon text-amber-400' : 'fa-sun text-amber-500'}`}></i>
          <span className="whitespace-nowrap text-xs">{isDarkMode ? 'Giao diện Tối' : 'Giao diện Sáng'}</span>
        </button>

        <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>

        <button
          onClick={onOpenProfileModal}
          className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white text-slate-900 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition cursor-pointer shadow-xs group text-left"
          title="Nhấn để xem Hồ sơ & Đăng xuất"
          type="button"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            NV
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight flex items-center space-x-1">
              <span>Nguyễn Văn Khách</span>
              <i className="fa-solid fa-chevron-down text-[9px] text-slate-400 group-hover:text-blue-600 transition-colors ml-0.5"></i>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Khách Hàng eKYC ✓</div>
          </div>
        </button>
      </div>
    </header>
  );
}