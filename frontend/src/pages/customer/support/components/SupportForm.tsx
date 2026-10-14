import React, { useState, useEffect } from 'react';
import { submitSupportTicket } from '../supportApi';
import { getMyContracts } from '@/pages/customer/storage/storageApi';
import { Headset, PhoneCall, ShieldAlert, Send, CheckCircle2, Clock, MessageSquare, AlertCircle, AlertTriangle } from 'lucide-react';

export default function SupportForm() {
  const [ticketType, setTicketType] = useState('UNLOCK');
  const [unitSelect, setUnitSelect] = useState('GATE');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myUnits, setMyUnits] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

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
      }
    } catch (err) {
      console.error('Lỗi gửi yêu cầu hỗ trợ:', err);
      alert("Lỗi khi gửi yêu cầu hỗ trợ. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Banner Tiêu Đề */}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: FORM GỬI YÊU CẦU HỖ TRỢ */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-950/85 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-cyan-500/30 p-6 sm:p-8 shadow-md shadow-slate-300/40 dark:shadow-xl space-y-6">
          <h3 className="font-black text-base text-slate-900 dark:text-white uppercase flex items-center space-x-2">
            <MessageSquare className="size-5 text-blue-600 dark:text-cyan-400" />
            <span>GỬI YÊU CẦU TIẾP NHẬN XỬ LÝ</span>
          </h3>

          {submittedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-800 dark:text-emerald-300 space-y-2 flex items-start space-x-3">
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Gửi ticket hỗ trợ thành công!</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-200/80">
                  Nhân viên trực ca (Staff) đã tiếp nhận và sẽ liên hệ hỗ trợ bạn qua điện thoại hoặc xử lý trực tiếp tại trạm trong vòng 5-15 phút.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedSuccess(false)}
                  className="mt-2 text-xs font-bold underline hover:text-blue-600 dark:hover:text-white cursor-pointer"
                >
                  Tạo thêm yêu cầu khác
                </button>
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
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">Zalo Hỗ Trợ Khách Hàng</p>
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
    </div>
  );
}
