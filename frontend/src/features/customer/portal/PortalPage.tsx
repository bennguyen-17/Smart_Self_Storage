import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Warehouse, Boxes, KeyRound, Headset } from 'lucide-react';
import CustomerLayout from '@/components/layouts/CustomerLayout';
import { getCurrentCustomerProfile } from '@/lib/customerService';

interface CustNavItem {
  id: string;
  label: string;
  subtitle: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  isFeatured?: boolean;
  theme: {
    cardBg: string;
    border: string;
    shadow: string;
    iconBg: string;
    textHover: string;
    badge: string;
    labelColor?: string;
  };
}

const CUSTOMER_NAV_ITEMS: CustNavItem[] = [
  {
    id: 'rent',
    label: 'Thuê kho',
    subtitle: 'Tìm & đặt ô kho 2D',
    path: '/rent',
    icon: Warehouse,
    theme: {
      cardBg: 'bg-white/90 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-800/90',
      border: 'border border-blue-100 hover:border-blue-400/70 dark:border-slate-800 dark:hover:border-cyan-500/60 hover:ring-2 hover:ring-blue-400/15 dark:hover:ring-cyan-500/15',
      shadow: 'shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/15 dark:shadow-[0_10px_25px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_15px_30px_rgba(6,182,212,0.15)]',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-md shadow-blue-600/25',
      labelColor: 'text-slate-900 dark:text-white',
      textHover: 'group-hover:text-blue-600 dark:group-hover:text-cyan-400',
      badge: 'bg-blue-500/10 text-blue-700 border border-blue-200/70 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
    },
  },
  {
    id: 'my-storage',
    label: 'Kho của tôi',
    subtitle: 'Quản lý hợp đồng & đồ',
    path: '/storage',
    icon: Boxes,
    theme: {
      cardBg: 'bg-white/90 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-800/90',
      border: 'border border-blue-100 hover:border-blue-400/70 dark:border-slate-800 dark:hover:border-cyan-500/60 hover:ring-2 hover:ring-blue-400/15 dark:hover:ring-cyan-500/15',
      shadow: 'shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/15 dark:shadow-[0_10px_25px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_15px_30px_rgba(6,182,212,0.15)]',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-md shadow-blue-600/25',
      labelColor: 'text-slate-900 dark:text-white',
      textHover: 'group-hover:text-blue-600 dark:group-hover:text-cyan-400',
      badge: 'bg-blue-500/10 text-blue-700 border border-blue-200/70 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
    },
  },
  {
    id: 'gate-pin',
    label: 'Mã PIN mở cửa',
    subtitle: 'Mở cửa tự động 24/7',
    path: '/pin',
    icon: KeyRound,
    theme: {
      cardBg: 'bg-white/90 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-800/90',
      border: 'border border-blue-100 hover:border-blue-400/70 dark:border-slate-800 dark:hover:border-cyan-500/60 hover:ring-2 hover:ring-blue-400/15 dark:hover:ring-cyan-500/15',
      shadow: 'shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/15 dark:shadow-[0_10px_25px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_15px_30px_rgba(6,182,212,0.15)]',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-md shadow-blue-600/25',
      labelColor: 'text-slate-900 dark:text-white',
      textHover: 'group-hover:text-blue-600 dark:group-hover:text-cyan-400',
      badge: 'bg-blue-500/10 text-blue-700 border border-blue-200/70 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
    },
  },
  {
    id: 'support',
    label: 'Gửi hỗ trợ',
    subtitle: 'Gửi ticket & giải đáp',
    path: '/support',
    icon: Headset,
    theme: {
      cardBg: 'bg-white/90 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-800/90',
      border: 'border border-blue-100 hover:border-blue-400/70 dark:border-slate-800 dark:hover:border-cyan-500/60 hover:ring-2 hover:ring-blue-400/15 dark:hover:ring-cyan-500/15',
      shadow: 'shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/15 dark:shadow-[0_10px_25px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_15px_30px_rgba(6,182,212,0.15)]',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-md shadow-blue-600/25',
      labelColor: 'text-slate-900 dark:text-white',
      textHover: 'group-hover:text-blue-600 dark:group-hover:text-cyan-400',
      badge: 'bg-blue-500/10 text-blue-700 border border-blue-200/70 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
    },
  },
];

interface CustomerPortalProps {
  initialTab?: 'home' | 'grid' | 'access';
}

export default function CustomerPortal({ initialTab = 'home' }: CustomerPortalProps = {}) {
  const navigate = useNavigate();
  const [customerProfile, setCustomerProfile] = useState<any>(null);

  // Điều hướng nếu được gọi với initialTab từ route cũ
  useEffect(() => {
    if (initialTab === 'grid') {
      navigate('/rent', { replace: true });
    } else if (initialTab === 'access') {
      navigate('/storage', { replace: true });
    }
  }, [initialTab, navigate]);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await getCurrentCustomerProfile();
        if (isMounted && res.success && res.data) {
          setCustomerProfile(res.data);
        }
      } catch (err) {
        console.error('Lỗi tải thông tin khách hàng:', err);
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const parsedUser = storedUser ? (() => { try { return JSON.parse(storedUser); } catch (e) { return null; } })() : null;
  const customerName = customerProfile?.fullName || parsedUser?.fullName || 'Khách Hàng';

  return (
    <CustomerLayout activeNav="home">
      {/* 1. KHU VỰC HERO DASHBOARD (TIÊU ĐỀ + CHÀO HỎI) */}
      <motion.div
        key="hero-dashboard-headline"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center pt-10 sm:pt-14 pb-2 text-center"
      >
        <div className="relative flex flex-col items-center select-none w-full max-w-5xl">
          {/* Ambient glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-3xl h-40 bg-gradient-to-r from-blue-500/20 via-cyan-400/25 to-indigo-500/20 blur-3xl rounded-full pointer-events-none -z-10" />

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase text-center leading-[1.15]">
            <span className="text-slate-900 dark:text-white drop-shadow-xs">
              HỆ THỐNG KHO TỰ QUẢN
            </span>
            <br />
            <span className="text-slate-900 dark:text-white drop-shadow-xs">
              THÔNG MINH{' '}
            </span>
            <span className="text-blue-600 dark:text-cyan-400 drop-shadow-[0_4px_16px_rgba(37,99,235,0.35)] dark:drop-shadow-[0_4px_20px_rgba(6,182,212,0.6)]">
              24/7
            </span>
          </h1>
        </div>

        {/* Customer Greeting */}
        <div className="flex items-center justify-center mt-6 sm:mt-8">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 sm:px-7 sm:py-3 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-blue-200/90 dark:border-cyan-400/70 shadow-lg shadow-blue-500/10 text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-slate-700 dark:text-cyan-400 font-medium text-base sm:text-lg tracking-wide">
              Xin chào <span className="font-black">{customerName} !</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. HÀNG 4 NÚT ĐIỀU HƯỚNG TỚI 4 TRANG RIÊNG BIỆT */}
      <motion.div
        key="home-action-cards"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex justify-center"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8 w-full items-stretch">
          {CUSTOMER_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const theme = item.theme;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className={`group relative transition-all duration-300 cursor-pointer flex items-center p-6 sm:p-7 rounded-3xl backdrop-blur-xl border tracking-wide hover:-translate-y-1.5 hover:scale-[1.02] text-center flex-col justify-between min-h-[190px] sm:min-h-[210px] ${theme.cardBg} ${theme.border} ${theme.shadow}`}
              >
                <span className={`shrink-0 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl group-hover:scale-105 transition-transform ${theme.iconBg}`}>
                  <Icon className="size-7 sm:size-8" />
                </span>

                <div className="flex flex-col items-center mt-5 w-full">
                  <span className={`font-black text-xl sm:text-2xl lg:text-3xl transition-colors whitespace-nowrap ${theme.labelColor || 'text-slate-900 dark:text-white'} ${theme.textHover}`}>
                    {item.label}
                  </span>

                  <span className={`mt-2.5 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full transition-transform group-hover:scale-105 ${theme.badge}`}>
                    {item.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </CustomerLayout>
  );
}
