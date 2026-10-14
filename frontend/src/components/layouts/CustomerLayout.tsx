import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Warehouse, Boxes, KeyRound, Headset, Home, ClipboardList } from 'lucide-react';
import Header from '@/components/common/Header';
import SiteFooter from '@/components/common/SiteFooter';
import CustomerProfileModal from '@/features/portal/components/modals/CustomerProfileModal';
import { useTheme } from '@/components/common/theme-provider';
import { getMySupportTickets } from '@/features/portal/services/supportService';

export type CustomerNavTab = 'home' | 'rent' | 'my-storage' | 'gate-pin' | 'support' | 'tickets';

interface CustomerLayoutProps {
  children: React.ReactNode;
  activeNav?: CustomerNavTab;
}

const NAV_ITEMS = [
  { id: 'rent', label: 'Thuê kho', path: '/rent', icon: Warehouse },
  { id: 'my-storage', label: 'Kho của tôi', path: '/my-storage', icon: Boxes },
  { id: 'gate-pin', label: 'Mã PIN mở cửa', path: '/gate-pin', icon: KeyRound },
  { id: 'support', label: 'Gửi hỗ trợ', path: '/support?tab=create', icon: Headset },
  { id: 'tickets', label: 'Yêu Cầu Của Tôi', path: '/support?tab=tickets', icon: ClipboardList, hasBadge: true },
] as const;

export default function CustomerLayout({ children, activeNav = 'home' }: CustomerLayoutProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [ticketCount, setTicketCount] = useState<number>(0);

  useEffect(() => {
    // Đảm bảo chế độ sáng hiển thị nền xanh nhạt theo yêu cầu
    if (theme !== 'light') {
      setTheme('light');
    }
  }, []);

  // Lấy số lượng ticket của khách hàng để hiển thị badge trên Header
  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        const res = await getMySupportTickets();
        if (isMounted && res.success && Array.isArray(res.data)) {
          setTicketCount(res.data.length);
        }
      } catch (e) {
        // ignore
      }
    };

    fetchCount();

    const handleTicketUpdated = () => {
      fetchCount();
    };

    window.addEventListener('ticket-updated', handleTicketUpdated);
    window.addEventListener('focus', fetchCount);

    return () => {
      isMounted = false;
      window.removeEventListener('ticket-updated', handleTicketUpdated);
      window.removeEventListener('focus', fetchCount);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi Cổng Khách Hàng SmartStorage?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setShowProfileModal(false);
      window.location.href = '/login';
    }
  };

  return (
    <div className={`relative min-h-screen flex flex-col transition-colors ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-[#eef5fc] text-slate-900'}`}>
      {/* Nền xanh nhạt ambient background */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 transition-colors ${
          isDarkMode
            ? 'bg-gradient-to-b from-slate-950 via-[#0a1628] to-slate-950'
            : 'bg-gradient-to-b from-[#eaf4fe] via-[#f1f7ff] to-[#e4effb]'
        }`}
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-gradient-to-b from-sky-200/50 via-blue-100/30 to-transparent blur-3xl pointer-events-none rounded-full" />
      </div>

      {/* Header với thanh chuyển Tab tích hợp */}
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onGoHome={() => navigate('/portal')}
        isSticky={true}
        centerContent={
          <AnimatePresence>
            <motion.div
              key="header-nav-pill"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs backdrop-blur-md overflow-x-auto no-scrollbar max-w-full"
            >
              {/* Nút Về Trang Chủ */}
              <button
                type="button"
                onClick={() => navigate('/portal')}
                title="Về Trang Chủ"
                className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer shrink-0 ${
                  activeNav === 'home'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 dark:bg-cyan-500 dark:text-slate-950 font-bold'
                    : 'text-slate-500 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <Home className="size-4 sm:size-4.5" />
              </button>

              {/* Các Nút điều hướng các màn hình */}
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 dark:bg-cyan-500 dark:text-slate-950 dark:shadow-cyan-400/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/70'
                    }`}
                  >
                    <Icon
                      className={`size-4 shrink-0 ${
                        isActive ? 'text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                    {item.hasBadge && ticketCount > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-950'
                            : 'bg-blue-100 text-blue-700 dark:bg-cyan-950/80 dark:text-cyan-300'
                        }`}
                      >
                        {ticketCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        }
      />

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col w-full">
        {children}
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <SiteFooter />
      </div>

      {/* Modal Profile Khách Hàng */}
      {showProfileModal && (
        <CustomerProfileModal
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
