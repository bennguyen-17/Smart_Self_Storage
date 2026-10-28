import { useState } from "react"
import { toast } from "sonner"
import {
  ShieldAlert,
  Key,
  AlertTriangle,
  Clock,
  Lock,
  Bell,
  Gavel,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Biohazard,
  Crosshair,
  PackageX,
  Sparkles,
} from "lucide-react"

export default function BomPoliciesPage() {
  const [pinDuration, setPinDuration] = useState(15)
  const [depositMonths, setDepositMonths] = useState("1")
  const [autoLockOffHours, setAutoLockOffHours] = useState(true)

  const handleSaveSettings = () => {
    toast.success("Đã đồng bộ thông số vận hành và quy chuẩn an ninh toàn chuỗi kho thành công!")
  }

  return (
    <div className="space-y-6">
      {/* Khung Chính: Quy Chuẩn Vận Hành & An Ninh Hệ Thống */}
      <div className="bg-white/90 dark:bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-7 transition-colors">
        {/* Header điều phối */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <ShieldAlert className="size-5" />
              </span>
              <h3 className="font-bold text-base uppercase text-slate-900 dark:text-white tracking-wide">
                QUY CHUẨN AN NINH &amp; TIÊU CHUẨN VẬN HÀNH TOÀN CHUỖI
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Quy trình 4 cấp bậc chế tài quá hạn tự động, thông số an ninh cổng IoT và quy định PCCC áp dụng toàn hệ thống
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-blue-500/20 shrink-0 flex items-center gap-2"
          >
            <CheckCircle2 className="size-4" />
            <span>Lưu Thông Số</span>
          </button>
        </div>

        {/* 1. TRỌNG TÂM: QUY TRÌNH 4 CẤP BẬC CƯỠNG CHẾ QUÁ HẠN HỢP ĐỒNG (BR-18 / BR-21) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-2">
                <Clock className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span>1. Quy Trình 4 Cấp Bậc Xử Lý Nợ &amp; Chế Tài Quá Hạn Hợp Đồng</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Chu kỳ kích hoạt chế tài tự động dựa trên hợp đồng thuê quá hạn thanh toán (Căn cứ BR-18 &amp; BR-21)
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 self-start sm:self-auto">
              ● Tự Động Kích Hoạt Theo Hệ Thống
            </span>
          </div>

          {/* Stepper Grid 4 Cấp Bậc - ĐỒNG NHẤT 100% PHONG CÁCH TỐI GIẢN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cấp 1 */}
            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs dark:shadow-lg flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold font-mono text-slate-400 dark:text-slate-500">01</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    3 Ngày Đầu
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <span className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Bell className="size-4" />
                  </span>
                  <span>Cấp 1 • Ân Hạn</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Gửi thông báo Push Notification &amp; SMS nhắc hạn thanh toán.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="size-3 shrink-0" />
                <span>Không tính phí phạt trễ hạn</span>
              </div>
            </div>

            {/* Cấp 2 */}
            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs dark:shadow-lg flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold font-mono text-slate-400 dark:text-slate-500">02</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    Sau 7 Ngày
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <span className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Lock className="size-4" />
                  </span>
                  <span>Cấp 2 • Khóa Mã PIN</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Vô hiệu hóa quyền ra vào cổng tự động (BR-18).
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Phạt quá hạn 5% giá trị HĐ/tháng</span>
              </div>
            </div>

            {/* Cấp 3 */}
            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs dark:shadow-lg flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold font-mono text-slate-400 dark:text-slate-500">03</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    Sau 15 Ngày
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <span className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <ShieldAlert className="size-4" />
                  </span>
                  <span>Cấp 3 • Niêm Phong</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Quản lý chi nhánh dán tem niêm phong vật lý. Tạm giữ toàn bộ tài sản tại ô kho.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Dừng cung cấp điện &amp; tiện ích</span>
              </div>
            </div>

            {/* Cấp 4 */}
            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs dark:shadow-lg flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold font-mono text-slate-400 dark:text-slate-500">04</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    Sau 30 Ngày
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <span className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Gavel className="size-4" />
                  </span>
                  <span>Cấp 4 • Thanh Lý</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Đơn phương chấm dứt hợp đồng (BR-21), lập biên bản thanh lý và xử lý đấu giá tài sản.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Khấu trừ toàn bộ tiền cọc</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. HAI KHỐI CẤU HÌNH SONG SONG */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-3">
          {/* Khối Trái: An Ninh Cổng Tự Động & Mã PIN */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs dark:shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Key className="size-4" />
                </span>
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200">
                    Cấu Hình An Ninh Cổng IoT &amp; Mã PIN
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Hệ thống kiểm soát ra vào 24/7 và mã PIN động
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                ● Đang Hoạt Động
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Cài đặt 1: Thời lượng hiệu lực mã PIN */}
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">Thời lượng hiệu lực mã PIN mở cửa</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Chu kỳ làm mới mã PIN động tránh lộ lọt</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={pinDuration}
                    onChange={(e) => setPinDuration(Number(e.target.value))}
                    className="w-16 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-center font-bold font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600"
                  />
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-xs">Giây</span>
                </div>
              </div>

              {/* Cài đặt 2: Tiền cọc tối thiểu */}
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">Mức tiền cọc chuẩn mặc định</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Áp dụng khi tạo hợp đồng thuê mới</div>
                </div>
                <select
                  value={depositMonths}
                  onChange={(e) => setDepositMonths(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 font-bold text-slate-900 dark:text-white text-xs outline-none"
                >
                  <option value="1">1 Tháng Tiền Thuê</option>
                  <option value="2">2 Tháng Tiền Thuê</option>
                </select>
              </div>

              {/* Cài đặt 3: Tự động khóa ngoài giờ */}
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">Cảnh báo xâm nhập ngoài giờ</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tự động báo động về trung tâm an ninh sau 23:00</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoLockOffHours(!autoLockOffHours)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                    autoLockOffHours
                      ? "bg-slate-800 dark:bg-slate-800 text-white border-slate-700 shadow-xs"
                      : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800"
                  }`}
                >
                  {autoLockOffHours ? "Kích Hoạt" : "Tạm Tắt"}
                </button>
              </div>
            </div>
          </div>

          {/* Khối Phải: Danh Mục Cấm Lưu Trữ (Tiêu chuẩn PCCC) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs dark:shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <AlertTriangle className="size-4" />
                </span>
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200">
                    Danh Mục Hàng Hóa Tuyệt Đối Cấm Lưu Trữ
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tuân thủ nghiêm ngặt quy định an toàn PCCC toàn quốc
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                PCCC Bắt Buộc
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed shadow-xs dark:shadow-none">
              Khách hàng vi phạm lưu trữ danh mục dưới đây sẽ bị lập tức hủy hợp đồng, vô hiệu hóa mã PIN và trình báo cơ quan chức năng:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-xs dark:shadow-none">
                <Flame className="size-4 text-amber-500 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Chất nổ, xăng dầu, bình gas khí đốt</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-xs dark:shadow-none">
                <Biohazard className="size-4 text-emerald-500 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Hóa chất độc hại, phóng xạ</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-xs dark:shadow-none">
                <Crosshair className="size-4 text-rose-500 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Vũ khí, vật liệu nổ, hàng cấm/lậu</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-xs dark:shadow-none">
                <PackageX className="size-4 text-blue-500 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Động vật sống &amp; hàng phân hủy mùi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
