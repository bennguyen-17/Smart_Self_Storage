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
  Inbox,
  ShieldCheck,
  Building2,
  FileCheck,
  ChevronDown
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
  const currentHour = new Date().getHours();
  const isOutsideWorkingHours = currentHour < 8 || currentHour >= 20;

  // Danh sách ticket của khách
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});

  const toggleTicket = (key: string) => {
    setExpandedTickets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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

  const formatTicketDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${minutes} • ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Chờ tiếp nhận</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 border border-blue-500/30 dark:bg-cyan-500/15 dark:text-cyan-300">
            <span className="size-1.5 rounded-full bg-blue-500 dark:bg-cyan-400 animate-spin"></span>
            <span>Đang xử lý</span>
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Đã hoàn tất</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
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
                TRUNG TÂM HỖ TRỢ KỸ THUẬT
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Tiếp nhận và xử lý yêu cầu hỗ trợ từ khách hàng
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NỘI DUNG TAB 1: FORM GỬI YÊU CẦU MỚI */}
      {activeSubTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* CỘT TRÁI: FORM GỬI YÊU CẦU HỖ TRỢ */}
          <div className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-950/85 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-cyan-500/30 p-6 sm:p-7 shadow-md shadow-slate-300/40 dark:shadow-xl">
            {/* Header đồng bộ với cột phải */}
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400">
                <MessageSquare className="size-5" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wide">
                  GỬI YÊU CẦU TIẾP NHẬN XỬ LÝ
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Điền thông tin chi tiết sự cố để nhân viên tiếp nhận và xử lý kịp thời
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between pt-4 space-y-4">
              <div className="space-y-4 flex-1 flex flex-col">
                {submittedSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-800 dark:text-emerald-300 space-y-3 flex items-start space-x-3">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="font-bold text-sm">Gửi ticket hỗ trợ thành công!</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-200/80">
                          Nhân viên đã tiếp nhận và sẽ có mặt xử lý trong vòng 15 phút.
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
                      Nếu hợp đồng của bạn đang chờ check-in nhận kho hoặc cần tư vấn, vui lòng gặp nhân viên tại sảnh cơ sở trong khung giờ trực <strong className="text-blue-600 dark:text-cyan-300">(08:00 - 20:00)</strong> hoặc kiểm tra thông tin hợp đồng tại mục Kho của tôi.
                    </p>
                  </div>
                )}

                {/* THÔNG BÁO KHUNG GIỜ LÀM VIỆC CỦA NHÂN VIÊN */}
                {isOutsideWorkingHours && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-700 dark:text-amber-300">
                      <Clock className="size-4 shrink-0 text-amber-500" />
                      <span>LƯU Ý KHUNG GIỜ TRỰC CỦA NHÂN VIÊN (08:00 - 20:00)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Hiện đã ngoài khung giờ trực của nhân viên tại cơ sở. Yêu cầu của bạn sẽ được tiếp nhận và xử lý ưu tiên ngay khi ca trực bắt đầu lúc 08:00 sáng mai. Tòa nhà kho vẫn mở cửa tự động 24/7 bằng mã PIN cá nhân.
                    </p>
                  </div>
                )}

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

                {/* Nội dung mô tả - Tự động giãn đều chiều cao theo thẻ */}
                <div className="space-y-1.5 flex-1 flex flex-col min-h-[130px]">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Mô tả chi tiết sự cố:
                  </label>
                  <textarea
                    disabled={!hasActiveContracts}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      !hasActiveContracts
                        ? "Chức năng gửi ticket bị khóa do tài khoản chưa có hợp đồng ACTIVE..."
                        : "Ví dụ: Cửa cuốn ô kho A-102 kẹt không mở được, hoặc quên mã bảo mật, cần mở khóa từ xa..."
                    }
                    className={`w-full flex-1 min-h-[120px] p-3.5 rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none ${
                      !hasActiveContracts ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900/50' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Nút gửi ở cuối */}
              <div className="pt-2">
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
              </div>
            </form>
          </div>

          {/* CỘT PHẢI: QUY TRÌNH HỖ TRỢ & TIÊU CHUẨN DỊCH VỤ */}
          <div className="lg:col-span-5 h-full flex flex-col justify-between bg-white dark:bg-slate-950/75 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-cyan-500/20 p-6 sm:p-7 shadow-md shadow-slate-300/40 dark:shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wide">
                    QUY TRÌNH HỖ TRỢ & TIÊU CHUẨN DỊCH VỤ
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Quy chuẩn tiếp nhận và giải quyết sự cố tại các cơ sở
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* 1. KHUNG GIỜ LÀM VIỆC CỦA NHÂN VIÊN */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-blue-700 dark:text-cyan-300 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <Clock className="size-3.5 text-blue-600 dark:text-cyan-400" />
                      <span>Giờ trực nhân viên tại cơ sở</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                      Hàng ngày
                    </span>
                  </div>
                  <p className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-wide">
                    08:00 – 20:00
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Nhân viên trực ca có mặt trực tiếp tại sảnh đón để xử lý sự cố. Tòa nhà kho mở cửa tự động 24/7 bằng mã PIN cá nhân cho khách có hợp đồng hiệu lực.
                  </p>
                </div>

                {/* 2. CAM KẾT PHẢN HỒI SỰ CỐ SLA 15 PHÚT */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Cam kết phản hồi sự cố (SLA)</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      Khẩn cấp
                    </span>
                  </div>
                  <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    Tối đa 15 phút
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Nhân viên trực ca tiếp nhận và có mặt xử lý thực tế tại ô kho trong vòng 15 phút (trong khung giờ 08:00 - 20:00). Nếu quá 15 phút, hệ thống tự động cảnh báo lên Quản lý cơ sở.
                  </p>
                </div>

                {/* 3. XÁC THỰC DANH TÍNH MỞ KHÓA */}
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-cyan-950/20 border border-blue-200 dark:border-cyan-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-blue-700 dark:text-cyan-300 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <KeyRound className="size-3.5 text-blue-600 dark:text-cyan-400" />
                      <span>Xác thực khi hỗ trợ mở khóa</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-cyan-300 border border-blue-500/30">
                      Bảo mật
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Xuất trình CCCD hoặc ứng dụng VNeID
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Khi cần nhân viên hỗ trợ mở khóa ô kho (do quên chìa cơ), khách hàng bắt buộc xuất trình CCCD gốc hoặc VNeID trùng khớp số định danh trên Hợp đồng để đối chiếu trước khi hỗ trợ.
                  </p>
                </div>
              </div>
            </div>

            {/* HƯỚNG DẪN TRẢ KHO TRƯỚC HẠN */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <HelpCircle className="size-3.5 text-blue-500 dark:text-cyan-400" />
                <span>Yêu cầu trả kho trước hạn?</span>
              </p>
              <p className="leading-relaxed">
                Bạn có thể gửi yêu cầu trả kho trước hạn 24/7 bất kỳ lúc nào, hệ thống sẽ xác thực bảo mật bằng mã OTP gửi về số điện thoại hoặc email đã ký hợp đồng.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NỘI DUNG TAB 2: DANH SÁCH YÊU CẦU ĐÃ GỬI (TIẾN ĐỘ XỬ LÝ) */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          {/* Banner Tiêu Đề của Danh sách yêu cầu - Đồng bộ phong cách với trang Gửi hỗ trợ */}
          <div className="bg-white dark:bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-cyan-500/30 p-5 sm:p-6 shadow-md shadow-slate-300/40 dark:shadow-[0_0_25px_rgba(34,211,238,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-cyan-300 border border-blue-400/30 shadow-xs dark:shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <ClipboardList className="size-6 text-blue-600 dark:text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    DANH SÁCH YÊU CẦU CỦA TÔI
                  </h2>
                  {myTickets.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-cyan-500/20 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/30">
                      {myTickets.length} yêu cầu
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Theo dõi tiến độ tiếp nhận và kết quả giải quyết sự cố từ nhân viên trực ca
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={loadingTickets}
              onClick={fetchTickets}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
            >
              <RefreshCw className={`size-4 ${loadingTickets ? 'animate-spin text-blue-600 dark:text-cyan-400' : ''}`} />
              <span>Cập nhật trạng thái</span>
            </button>
          </div>

          {/* BỘ LỌC TRẠNG THÁI NHANH */}
          {myTickets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'ALL', label: 'Tất cả', count: myTickets.length },
                { key: 'SUBMITTED', label: 'Chờ tiếp nhận', count: myTickets.filter(t => t.status === 'SUBMITTED').length },
                { key: 'IN_PROGRESS', label: 'Đang xử lý', count: myTickets.filter(t => t.status === 'IN_PROGRESS').length },
                { key: 'RESOLVED', label: 'Đã hoàn tất', count: myTickets.filter(t => t.status === 'RESOLVED').length },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTicketStatusFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    ticketStatusFilter === tab.key
                      ? 'bg-blue-600 text-white shadow-xs dark:bg-cyan-500 dark:text-slate-950 font-black'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    ticketStatusFilter === tab.key
                      ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

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
              {myTickets
                .filter(t => ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter)
                .map((ticket) => {
                  const meta = getTypeMeta(ticket.type);
                  const IconComponent = meta.icon;
                  const ticketKey = String(ticket.id || ticket.ticketCode);
                  const isExpanded = !!expandedTickets[ticketKey];

                  return (
                    <div
                      key={ticketKey}
                      className={`rounded-2xl bg-white dark:bg-slate-900/90 border transition-all ${
                        isExpanded
                          ? 'border-blue-300 dark:border-cyan-500/40 shadow-xs'
                          : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                      }`}
                    >
                      {/* Hàng Header có thể click để đóng/mở */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleTicket(ticketKey)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleTicket(ticketKey);
                          }
                        }}
                        className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        {/* Cụm thông tin chính bên trái: Thuận mắt, không rối */}
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${meta.bg} ${meta.color} shrink-0`}>
                            <IconComponent className="size-4.5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {meta.label}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-cyan-400">
                                #{ticket.ticketCode}
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span>{ticket.unitCode ? `Ô kho ${ticket.unitCode}` : 'Cổng cơ sở'}</span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className="flex items-center gap-1 text-[11px]">
                                <Clock className="size-3 text-slate-400" />
                                <span>{formatTicketDate(ticket.createdAt)}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Cụm trạng thái + Chevron bên phải */}
                        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                          {getStatusBadge(ticket.status)}
                          <div
                            className={`p-1.5 rounded-lg text-slate-400 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-blue-600 dark:text-cyan-400' : ''
                            }`}
                          >
                            <ChevronDown className="size-4" />
                          </div>
                        </div>
                      </div>

                      {/* Chi tiết yêu cầu & Phản hồi khi mở rộng */}
                      {isExpanded && (
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                          {/* Nội dung yêu cầu của bạn */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800/70">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                              Nội dung yêu cầu của bạn:
                            </span>
                            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                              {ticket.description || 'Không có mô tả chi tiết'}
                            </p>
                          </div>

                          {/* Phản hồi & Kết quả xử lý từ nhân viên */}
                          {ticket.status === 'SUBMITTED' && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                              <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 animate-pulse" />
                              <div className="space-y-0.5">
                                <p className="font-bold text-amber-900 dark:text-amber-200">Đang chờ nhân viên ca trực tiếp nhận</p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                  Nhân viên trực ca sẽ liên hệ hoặc có mặt xử lý trong vòng <strong>15 phút</strong> (trong khung giờ 08:00 - 20:00).
                                </p>
                              </div>
                            </div>
                          )}

                          {ticket.status === 'IN_PROGRESS' && (
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-cyan-300 flex items-start gap-2.5">
                              <RefreshCw className="size-4 shrink-0 text-blue-600 dark:text-cyan-400 mt-0.5 animate-spin" />
                              <div className="space-y-0.5">
                                <p className="font-bold text-blue-900 dark:text-cyan-200">Nhân viên đang tiến hành xử lý</p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                  Nhân viên trực ca đã tiếp nhận và đang trực tiếp có mặt tại ô kho để hỗ trợ giải quyết sự cố.
                                </p>
                              </div>
                            </div>
                          )}

                          {ticket.status === 'RESOLVED' && (
                            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                                  <span>Ghi chú xử lý từ nhân viên</span>
                                </div>
                                {ticket.resolvedAt && (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                    Hoàn tất lúc: {formatTicketDate(ticket.resolvedAt)}
                                  </span>
                                )}
                              </div>
                              {ticket.resolutionNote && (
                                <p className="text-xs text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/70 p-3 rounded-lg border border-emerald-500/20 leading-relaxed font-medium">
                                  {ticket.resolutionNote}
                                </p>
                              )}
                            </div>
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
