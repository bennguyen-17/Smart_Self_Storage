import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submitSupportTicket, getMySupportTickets } from '../supportApi';
import { getMyContracts } from '@/features/customer/storage/storageApi';
import {
  Headset,
  PhoneCall,
  ShieldAlert,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  ArrowRight,
  ClipboardList,
  CheckCircle,
  Wrench,
  HelpCircle,
  Inbox
} from 'lucide-react';

export default function SupportForm() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const isHistoryTab = tabParam === 'tickets' || tabParam === 'history';
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history'>(isHistoryTab ? 'history' : 'create');
  const [ticketType, setTicketType] = useState('UNLOCK');
  const [unitSelect, setUnitSelect] = useState('GATE');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myUnits, setMyUnits] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Danh sách ticket của khách
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await getMySupportTickets();
      if (res.success && Array.isArray(res.data)) {
        setMyTickets(res.data);
        window.dispatchEvent(new CustomEvent('ticket-updated'));
      }
    } catch (e) {
      console.warn('Lỗi tải danh sách ticket của tôi:', e);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (tabParam === 'tickets' || tabParam === 'history') {
      setActiveSubTab('history');
      fetchTickets();
    } else if (tabParam === 'create') {
      setActiveSubTab('create');
    }
  }, [tabParam]);

  const switchSubTab = (tab: 'create' | 'history') => {
    setActiveSubTab(tab);
    setSearchParams({ tab: tab === 'history' ? 'tickets' : 'create' });
    if (tab === 'history') {
      fetchTickets();
    }
  };

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoadingContracts(true);
        const res = await getMyContracts();
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (Array.isArray(list)) {
          // CHỈ LẤY CÁC Ô KHO CÓ HỢP ĐỒNG ĐÃ ĐƯỢC ACTIVE
          const activeUnits = list.filter((c: any) => c.status === 'ACTIVE');
          setMyUnits(activeUnits);
          if (activeUnits.length > 0) {
            setUnitSelect(activeUnits[0].unitCode);
          } else {
            setUnitSelect('');
          }
        }
      } catch (e) {
        console.warn('Lỗi tải hợp đồng cho ticket hỗ trợ:', e);
      } finally {
        setLoadingContracts(false);
      }
    };

    fetchContracts();
    fetchTickets();
  }, []);

  const hasActiveContracts = myUnits.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasActiveContracts) {
      alert("Chỉ những tài khoản có hợp đồng đang có hiệu lực (ACTIVE) mới có thể gửi yêu cầu hỗ trợ kỹ thuật!");
      return;
    }
    if (!unitSelect) {
      alert("Vui lòng chọn ô kho có hợp đồng đang có hiệu lực (ACTIVE)!");
      return;
    }
    if (!description.trim()) {
      alert("Vui lòng nhập mô tả chi tiết yêu cầu hỗ trợ!");
      return;
    }
    try {
      setSubmitting(true);
      const res = await submitSupportTicket({
        type: ticketType,
        unitCode: unitSelect,
        description
      });
      if (res.success) {
        setSubmittedSuccess(true);
        setDescription('');
        fetchTickets();
      }
    } catch (err: any) {
      console.error('Lỗi gửi yêu cầu hỗ trợ:', err);
      const msg = err.response?.data?.message || err.message || "Lỗi khi gửi yêu cầu hỗ trợ. Vui lòng thử lại!";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'UNLOCK':
        return { label: 'Mở khóa khẩn cấp', icon: KeyRound, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
      case 'MAINTENANCE':
        return { label: 'Bảo trì / Sửa chữa', icon: Wrench, color: 'text-blue-600 dark:text-cyan-400', bg: 'bg-blue-500/10 border-blue-500/20' };
      case 'INCIDENT':
        return { label: 'Báo sự cố an ninh', icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };
      case 'EARLY_TERMINATION':
        return { label: 'Trả kho trước hạn', icon: Clock, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' };
      default:
        return { label: 'Thắc mắc / Khác', icon: HelpCircle, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Chờ tiếp nhận</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
            <span className="size-1.5 rounded-full bg-blue-500 animate-spin"></span>
            <span>Đang xử lý</span>
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle className="size-3 text-emerald-600 dark:text-emerald-400" />
            <span>Đã hoàn tất</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Banner Tiêu Đề - Chỉ hiển thị bên trang Gửi yêu cầu mới */}
      {activeSubTab === 'create' && (
        <div className="bg-white dark:bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-cyan-500/30 p-5 sm:p-6 shadow-md shadow-slate-300/40 dark:shadow-[0_0_25px_rgba(34,211,238,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-400/30 shadow-xs dark:shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Headset className="size-6 text-amber-500 dark:text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                TRUNG TÂM HỖ TRỢ KỸ THUẬT & KHẨN CẤP 24/7
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Tiếp nhận và xử lý yêu cầu mở khóa từ xa, bảo trì sự cố ô kho, an ninh 24/7.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl">
            <span className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
            <span>Trực ban 24/7 đang hoạt động</span>
          </div>
        </div>
      )}

      {/* NỘI DUNG TAB 1: FORM GỬI YÊU CẦU MỚI */}
      {activeSubTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: FORM GỬI YÊU CẦU HỖ TRỢ */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-950/85 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-cyan-500/30 p-6 sm:p-8 shadow-md shadow-slate-300/40 dark:shadow-xl space-y-6">
            <h3 className="font-black text-base text-slate-900 dark:text-white uppercase flex items-center space-x-2">
              <MessageSquare className="size-5 text-blue-600 dark:text-cyan-400" />
              <span>GỬI YÊU CẦU TIẾP NHẬN XỬ LÝ</span>
            </h3>

            {submittedSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-800 dark:text-emerald-300 space-y-3 flex items-start space-x-3">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-bold text-sm">Gửi ticket hỗ trợ thành công!</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-200/80">
                      Nhân viên trực ca (Staff) đã tiếp nhận và sẽ liên hệ hỗ trợ bạn qua điện thoại hoặc xử lý trực tiếp tại trạm trong vòng 5-15 phút.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => switchSubTab('history')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Xem tiến độ xử lý ticket</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmittedSuccess(false)}
                      className="text-xs font-bold underline hover:text-blue-600 dark:hover:text-white cursor-pointer"
                    >
                      Tạo thêm yêu cầu khác
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CẢNH BÁO KHI TÀI KHOẢN CHƯA CÓ HỢP ĐỒNG ACTIVE */}
            {!loadingContracts && !hasActiveContracts && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-2">
                <div className="flex items-center space-x-2.5 font-bold text-amber-700 dark:text-amber-200 text-sm">
                  <AlertTriangle className="size-5 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span>YÊU CẦU HỢP ĐỒNG ĐANG HOẠT ĐỘNG (ACTIVE)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tài khoản của bạn hiện chưa có hợp đồng thuê kho nào ở trạng thái <strong className="text-emerald-600 dark:text-emerald-400">ACTIVE</strong> (đang có hiệu lực). Chức năng gửi ticket hỗ trợ kỹ thuật và mở khóa khẩn cấp chỉ áp dụng cho khách hàng đang có hợp đồng hoạt động tại cơ sở.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  Nếu hợp đồng của bạn đang chờ check-in nhận kho hoặc cần tư vấn, vui lòng liên hệ hotline trực ban 24/7: <strong className="text-blue-600 dark:text-cyan-300">1900 8888 68</strong>.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Loại sự cố */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Loại sự cố / Yêu cầu:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'UNLOCK', label: 'Mở khóa khẩn cấp', icon: ShieldAlert },
                    { id: 'MAINTENANCE', label: 'Bảo trì / Sửa chữa', icon: Clock },
                    { id: 'INCIDENT', label: 'Báo sự cố an ninh', icon: AlertCircle },
                    { id: 'OTHER', label: 'Thắc mắc / Khác', icon: MessageSquare },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={!hasActiveContracts}
                      onClick={() => setTicketType(cat.id)}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all text-left ${
                        !hasActiveContracts
                          ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                          : ticketType === cat.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/50 dark:shadow-cyan-500/20 font-black cursor-pointer'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/80 dark:text-slate-300 dark:border-slate-800 dark:hover:border-cyan-500/40 dark:hover:text-white cursor-pointer'
                      }`}
                    >
                      <cat.icon className="size-4 shrink-0" />
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn Ô kho liên quan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Vị trí / Ô kho liên quan:
                </label>
                <select
                  disabled={!hasActiveContracts}
                  value={unitSelect}
                  onChange={(e) => setUnitSelect(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold text-xs sm:text-sm focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none ${
                    !hasActiveContracts ? 'opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-500' : 'cursor-pointer'
                  }`}
                >
                  {!hasActiveContracts ? (
                    <option value="">Không có ô kho nào có hợp đồng ACTIVE</option>
                  ) : (
                    myUnits.map((u: any) => (
                      <option key={u.contractId || u.unitCode} value={u.unitCode}>
                        Ô Kho {u.unitCode} — {u.branchName ? u.branchName.replace(/\s*\([A-Z0-9-]+\)/g, '') : u.branchCode} (HĐ HIỆU LỰC)
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Nội dung mô tả */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Mô tả chi tiết sự cố:
                </label>
                <textarea
                  disabled={!hasActiveContracts}
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    !hasActiveContracts
                      ? "Chức năng gửi ticket bị khóa do tài khoản chưa có hợp đồng ACTIVE..."
                      : "Ví dụ: Cửa cuốn ô kho A-102 kẹt không mở được, hoặc quên mã bảo mật, cần mở khóa từ xa..."
                  }
                  className={`w-full p-3.5 rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none ${
                    !hasActiveContracts ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900/50' : ''
                  }`}
                />
              </div>

              {/* Nút gửi */}
              <button
                type="submit"
                disabled={!hasActiveContracts || submitting}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
                  hasActiveContracts
                    ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-md shadow-blue-500/20 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 dark:font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed opacity-75'
                } disabled:opacity-50`}
              >
                <Send className="size-4" />
                <span>
                  {submitting
                    ? 'Đang gửi yêu cầu...'
                    : !hasActiveContracts
                    ? 'Chỉ tài khoản có hợp đồng ACTIVE mới được gửi ticket'
                    : 'Gửi yêu cầu hỗ trợ ngay'}
                </span>
              </button>
            </form>
          </div>

          {/* CỘT PHẢI: THÔNG TIN LIÊN HỆ TRỰC BAN 24/7 */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-950/75 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-cyan-500/20 p-6 sm:p-7 shadow-md shadow-slate-300/40 dark:shadow-xl space-y-6">
            <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white flex items-center space-x-2">
              <PhoneCall className="size-4.5 text-amber-500" />
              <span>KÊNH LIÊN HỆ KHẨN CẤP TRỰC TIẾP</span>
            </h3>

            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-cyan-950/30 border border-blue-200 dark:border-cyan-500/30 space-y-1">
                <p className="text-xs text-blue-700 dark:text-cyan-300 uppercase font-black tracking-wider">Hotline Khẩn Cấp 24/7</p>
                <p className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-wide">1900 8888 68</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Hỗ trợ kỹ thuật chốt cửa, điện nước & an ninh toàn chi nhánh</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">Zalo Hỗ TrỢ Khách Hàng</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">SmartStorage Support Official</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Nhắn tin gửi hình ảnh sự cố trực tiếp để xử lý nhanh</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20 text-xs space-y-2">
              <p className="font-bold flex items-center space-x-1.5 text-amber-800 dark:text-amber-300">
                <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Thời gian phản hồi cam kết</span>
              </p>
              <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-700 dark:text-slate-300">
                <li>Sự cố mở khóa khẩn cấp: <strong className="text-slate-900 dark:text-white font-bold">Dưới 10 phút</strong></li>
                <li>Bảo trì đèn/điều hòa: <strong className="text-slate-900 dark:text-white font-bold">Trong vòng 2 giờ</strong></li>
                <li>Tư vấn hợp đồng & cọc: <strong className="text-slate-900 dark:text-white font-bold">Giờ hành chính (8h - 20h)</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* NỘI DUNG TAB 2: DANH SÁCH YÊU CẦU ĐÃ GỬI (TIẾN ĐỘ XỬ LÝ) */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <ClipboardList className="size-5 text-blue-600 dark:text-cyan-400" />
                <span>DANH SÁCH YÊU CẦU CỦA TÔI ({myTickets.length})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Theo dõi tiến độ tiếp nhận và kết quả giải quyết sự cố từ nhân viên trực ca
              </p>
            </div>
            <button
              type="button"
              disabled={loadingTickets}
              onClick={fetchTickets}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition cursor-pointer self-start sm:self-auto shrink-0"
            >
              <RefreshCw className={`size-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
              <span>Cập nhật trạng thái</span>
            </button>
          </div>

          {loadingTickets ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="size-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Đang tải danh sách yêu cầu hỗ trợ của bạn...
              </p>
            </div>
          ) : myTickets.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <Inbox className="size-12 text-slate-400 mx-auto stroke-[1.5]" />
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                Bạn chưa gửi yêu cầu hỗ trợ nào
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Khi bạn gặp sự cố mở khóa, bảo trì kho hay cần hỗ trợ kỹ thuật, các yêu cầu đã gửi sẽ hiển thị tiến độ tại đây.
              </p>
              <button
                type="button"
                onClick={() => switchSubTab('create')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <Send className="size-3.5" />
                <span>Gửi yêu cầu hỗ trợ ngay</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myTickets.map((ticket) => {
                const meta = getTypeMeta(ticket.type);
                const IconComponent = meta.icon;

                return (
                  <div
                    key={ticket.id || ticket.ticketCode}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    {/* Header Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${meta.bg} ${meta.color}`}>
                          <IconComponent className="size-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-blue-600 dark:text-cyan-400">
                              #{ticket.ticketCode}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {meta.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {ticket.unitCode ? `Ô kho: ${ticket.unitCode}` : 'Cổng / Ra vào cơ sở'}
                            {ticket.createdAt && (
                              <>
                                {' • '}
                                <span>Gửi lúc: {new Date(ticket.createdAt).toLocaleString('vi-VN')}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>

                    {/* Nội dung khách hàng mô tả */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Nội dung yêu cầu của bạn:
                      </p>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs italic text-slate-700 dark:text-slate-300">
                        "{ticket.description || 'Không có mô tả chi tiết'}"
                      </div>
                    </div>

                    {/* Tiến độ & Kết quả xử lý từ nhân viên */}
                    {ticket.status === 'SUBMITTED' && (
                      <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5 font-medium">
                        <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
                        <span>
                          Yêu cầu đang chờ nhân viên ca trực tiếp nhận. Cam kết xử lý hoặc liên hệ lại trong vòng <strong>15 phút</strong>.
                        </span>
                      </div>
                    )}

                    {ticket.status === 'IN_PROGRESS' && (
                      <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2.5 font-medium">
                        <Clock className="size-4 shrink-0 text-blue-600 dark:text-cyan-400 animate-spin" />
                        <span>
                          Nhân viên trực ban đã tiếp nhận và đang tiến hành xử lý yêu cầu tại cơ sở.
                        </span>
                      </div>
                    )}

                    {ticket.status === 'RESOLVED' && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/70 space-y-1.5 text-xs">
                        <p className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Đã xử lý &amp; Đóng ticket hoàn tất</span>
                        </p>
                        {ticket.resolutionNote && (
                          <div className="pl-5 text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-900 dark:text-white">Ghi chú từ nhân viên: </span>
                            <span>"{ticket.resolutionNote}"</span>
                          </div>
                        )}
                        {ticket.resolvedAt && (
                          <p className="pl-5 text-[10px] text-slate-500 dark:text-slate-400">
                            Thời gian hoàn tất: {new Date(ticket.resolvedAt).toLocaleString('vi-VN')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
