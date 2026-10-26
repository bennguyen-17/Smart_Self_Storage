import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, CheckCheck, CircleAlert, Info, ShieldCheck, ShieldX } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import {
  getCustomerNotifications,
  type CustomerNotification,
} from '@/features/customer/api/customerService';

const SEEN_STORAGE_KEY = 'customer_notification_seen_ids';

function readSeenIds(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function saveSeenIds(ids: string[]) {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(ids.slice(-200)));
  } catch {
    // Bỏ qua khi trình duyệt chặn localStorage.
  }
}

function relativeTime(timestamp: string | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const diff = Date.now() - date.getTime();
  if (diff < 0) return formatDateTime(timestamp);
  if (diff < 60_000) return 'Vừa xong';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} ngày trước`;
  return formatDateTime(timestamp);
}

function notificationStyle(type: string) {
  switch ((type || '').toUpperCase()) {
    case 'WARNING':
      return { icon: CircleAlert, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' };
    case 'SUCCESS':
      return { icon: ShieldCheck, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' };
    case 'REMINDER':
      return { icon: Bell, tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400' };
    case 'LOCKED':
      return { icon: ShieldX, tone: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' };
    default:
      return { icon: Info, tone: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400' };
  }
}

interface NotificationBellProps {
  /** Mở modal hồ sơ khi khách bấm vào một thông báo bảo mật. */
  onOpenProfile?: () => void;
}

export default function NotificationBell({ onOpenProfile }: NotificationBellProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [seenIds, setSeenIds] = useState<string[]>(() => readSeenIds());
  const [unreadDotIds, setUnreadDotIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getCustomerNotifications();
      setNotifications(list);
      return list;
    } catch {
      setError('Không thể tải thông báo. Vui lòng thử lại.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getCustomerNotifications()
      .then((list) => {
        if (active) setNotifications(list);
      })
      .catch(() => {
        if (active) setError('Không thể tải thông báo. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const markSeen = (list: CustomerNotification[]) => {
    const unseen = list.filter((item) => !seenIds.includes(item.id)).map((item) => item.id);
    setUnreadDotIds(unseen);
    if (unseen.length === 0) return;

    const merged = Array.from(new Set([...seenIds, ...unseen]));
    setSeenIds(merged);
    saveSeenIds(merged);
  };

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    const list = await loadNotifications();
    if (!list) return;
    markSeen(list);
  };

  const handleMarkAllRead = () => {
    const allIds = notifications.map((item) => item.id);
    const merged = Array.from(new Set([...seenIds, ...allIds]));
    setSeenIds(merged);
    saveSeenIds(merged);
    setUnreadDotIds([]);
  };

  const handleNotificationClick = (notification: CustomerNotification) => {
    setOpen(false);
    if (onOpenProfile) {
      onOpenProfile();
      return;
    }
    if (notification.link && !notification.link.startsWith('/profile')) {
      navigate(notification.link);
      return;
    }
    navigate('/portal');
  };

  const unreadCount = notifications.filter((item) => !seenIds.includes(item.id)).length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Thông báo bảo mật tài khoản"
        aria-expanded={open}
        className="relative w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer flex items-center justify-center"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[320px] sm:w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                Thông báo &amp; bảo mật
              </span>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={notifications.length === 0}
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <CheckCheck className="size-3.5" />
              Đã đọc tất cả
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading && notifications.length === 0 && (
              <div className="py-8 text-center text-[11px] text-slate-400">Đang tải thông báo...</div>
            )}

            {!loading && error && (
              <div className="px-3.5 py-6 text-center">
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadNotifications()}
                  className="mt-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                <BellOff className="size-6 mx-auto mb-1.5" />
                <p className="text-[11px]">Chưa có thông báo bảo mật nào.</p>
              </div>
            )}

            {notifications.map((notification) => {
              const { icon: Icon, tone } = notificationStyle(notification.type);
              const isUnread = unreadDotIds.includes(notification.id);

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full text-left px-3.5 py-3 flex gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                >
                  <span className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
                    <Icon className="size-3.5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[12px] font-extrabold text-slate-900 dark:text-white leading-snug">
                        {notification.title}
                      </span>
                      {isUnread && <span className="mt-1 size-1.5 rounded-full bg-blue-600 shrink-0" />}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      {notification.message}
                    </span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {relativeTime(notification.timestamp)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="px-3.5 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
              Chỉ hiển thị lịch sử đăng nhập và cảnh báo an toàn tài khoản.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
