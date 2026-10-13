import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ShieldAlert, Key, AlertTriangle, Clock, ArrowLeft } from "lucide-react"

export default function BomPoliciesPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Breadcrumb quay về trang chủ BOM */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={() => navigate("/bom")}
          className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại Tổng Quan Điều Hành</span>
        </button>
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-lg">
          Module: Thông Số Vận Hành
        </span>
      </div>

      {/* Khung Quy Chuẩn An Ninh & Chế Tài Xử Lý Nợ Quá Hạn */}
      <div className="bg-slate-950/75 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-sky-500/20 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="font-black text-sm uppercase flex items-center space-x-2 text-white">
              <ShieldAlert className="size-4.5 text-sky-400" />
              <span>QUY CHUẨN AN NINH &amp; CHẾ TÀI XỬ LÝ NỢ QUÁ HẠN</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Thông số cấu hình bảo mật mã PIN và quy trình 4 cấp bậc cưỡng chế tự động toàn hệ thống
            </p>
          </div>
          <button
            onClick={() => toast.success("Đã đồng bộ thông số vận hành toàn chuỗi kho thành công!")}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.3)] shrink-0"
          >
            Lưu Thay Đổi
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Thẻ 1: Quy Chuẩn An Ninh Mã PIN */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                  <Key className="size-4" />
                </span>
                <span className="font-extrabold text-xs uppercase text-slate-200">
                  An Ninh &amp; Cổng Tự Động (IoT)
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Đang Bật
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <div className="font-bold text-white">Thời lượng hiệu lực mã PIN mở cửa</div>
                  <div className="text-[11px] text-slate-400">Chu kỳ làm mới mã PIN động tránh lộ lọt</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    defaultValue={15}
                    className="w-16 p-2 rounded-lg border border-slate-700 bg-slate-900 text-center font-bold text-sky-400 text-xs outline-none"
                  />
                  <span className="font-bold text-slate-400 text-xs">Giây</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <div className="font-bold text-white">Tiền cọc mặc định khi ký hợp đồng</div>
                  <div className="text-[11px] text-slate-400">Khấu trừ khi hư hại hoặc vi phạm hợp đồng</div>
                </div>
                <select className="p-2 rounded-lg border border-slate-700 bg-slate-900 font-bold text-white text-xs outline-none">
                  <option>1 Tháng Tiền Thuê</option>
                  <option>2 Tháng Tiền Thuê</option>
                </select>
              </div>
            </div>
          </div>

          {/* Thẻ 2: Danh Mục Hàng Hóa Cấm Lưu Trữ */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                  <AlertTriangle className="size-4" />
                </span>
                <span className="font-extrabold text-xs uppercase text-slate-200">
                  Hàng Hóa Tuyệt Đối Cấm Lưu Trữ
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                PCCC Chuỗi
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Khách hàng vi phạm lưu trữ danh mục dưới đây sẽ bị lập tức hủy hợp đồng và trình báo cơ quan chức năng:
              </p>
              <div className="flex flex-wrap gap-2">
                {["Chất nổ, xăng dầu, gas", "Chất độc hại hóa chất", "Động vật sống", "Hàng lậu, vũ khí", "Hàng dễ phân hủy sinh mùi"].map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-950/50 text-rose-300 border border-rose-800/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Khung 3: 4 Mốc Xử Lý Chế Tài Quá Hạn */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs uppercase text-slate-200 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Clock className="size-4" />
              </span>
              <span>Quy Trình 4 Cấp Bậc Cưỡng Chế Quá Hạn Hợp Đồng (BR-18 / BR-21)</span>
            </h4>
            <span className="text-[10px] font-bold text-slate-400">
              Tự động kích hoạt theo chu kỳ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-sky-400">Cấp 1 • Ân Hạn</div>
              <div className="font-black text-white text-sm">3 Ngày Đầu</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Gửi thông báo Push Notification &amp; SMS nhắc hạn thanh toán. Không tính phí phạt.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-amber-400">Cấp 2 • Khóa Mã PIN</div>
              <div className="font-black text-amber-300 text-sm">Sau 7 Ngày</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Vô hiệu hóa quyền ra vào cổng tự động (BR-18). Áp dụng phí phạt trễ hạn 5%/tháng.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-orange-500/30 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-orange-400">Cấp 3 • Niêm Phong</div>
              <div className="font-black text-orange-300 text-sm">Sau 15 Ngày</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Quản lý cơ sở dán tem niêm phong vật lý. Tạm giữ toàn bộ tài sản tại ô kho.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/30 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-rose-400">Cấp 4 • Thanh Lý</div>
              <div className="font-black text-rose-300 text-sm">Sau 30 Ngày</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Chấm dứt hợp đồng (BR-21), lập biên bản thanh lý và xử lý tài sản theo hợp đồng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
