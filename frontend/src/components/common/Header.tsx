import { Link } from 'react-router-dom';
import BrandLogo from '@/components/common/BrandLogo';
import ThemeToggle from '@/components/common/ThemeToggle';

interface HeaderProps {
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onOpenProfileModal?: () => void;
  onGoHome?: () => void;
  isSticky?: boolean;
  centerContent?: React.ReactNode;
}

export default function Header({ isDarkMode, onToggleTheme, onOpenProfileModal, onGoHome, isSticky = false, centerContent }: HeaderProps) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let userName = 'Nguyễn Văn Khách';
  let userInitials = 'NK';
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u.fullName) {
        userName = u.fullName;
        const words = u.fullName.trim().split(' ');
        if (words.length >= 2) {
          userInitials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
        } else if (words.length === 1 && words[0].length >= 2) {
          userInitials = words[0].substring(0, 2).toUpperCase();
        }
      }
    } catch (e) {}
  }

  return (
    <header className={`w-full min-h-[56px] sm:min-h-[60px] bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 shrink-0 ${isSticky ? 'sticky top-0 z-40' : 'relative z-20'} transition-colors shadow-xs`}>
      {/* BRAND LOGO */}
      <div className="shrink-0">
        <BrandLogo onClick={onGoHome} />
      </div>

      {/* CENTER CONTENT (NAVBAR TABS) */}
      {centerContent && (
        <div className="flex-1 flex justify-center items-center px-1 sm:px-3 min-w-0">
          {centerContent}
        </div>
      )}

      {/* CONTROLS & USER PROFILE */}
      <div className="flex items-center space-x-2.5 shrink-0">
        <ThemeToggle />

        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>

        {!token ? (
          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition whitespace-nowrap"
            >
              <i className="fa-solid fa-right-to-bracket mr-1.5 text-xs text-blue-600"></i>
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs whitespace-nowrap"
            >
              <i className="fa-solid fa-user-plus mr-1.5 text-xs"></i>
              Đăng ký
            </Link>
          </div>
        ) : (
          <button
            onClick={onOpenProfileModal}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white text-slate-900 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition cursor-pointer shadow-xs group text-left"
            title="Nhấn để xem Hồ sơ & Đăng xuất"
            type="button"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              {userInitials}
            </div>
            <div className="text-left hidden md:flex items-center space-x-1">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">{userName}</span>
              <i className="fa-solid fa-chevron-down text-[9px] text-slate-400 group-hover:text-blue-600 transition-colors ml-0.5"></i>
            </div>
          </button>
        )}
      </div>
    </header>
  );
}