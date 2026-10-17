import { useNavigate } from "react-router-dom"
import {
  Warehouse,
  SlidersHorizontal,
  ShieldAlert,
  FileSpreadsheet,
  ArrowUpRight,
} from "lucide-react"
import { motion, type Variants } from "motion/react"
import { useBomContext } from "@/features/bom/context/BomContext"
import BomKpiCards from "@/features/bom/components/BomKpiCards"

const MODULE_CARDS = [
  {
    path: "/bom/facilities",
    label: "Giám Sát & Cơ Sở",
    badge: "Mặt Bằng & Lấp Đầy",
    shortDesc: "Theo dõi tỷ lệ lấp đầy, sức chứa và cấu hình các chi nhánh kho toàn hệ thống",
    icon: Warehouse,
  },
  {
    path: "/bom/pricing",
    label: "Khung Giá & Phụ Phí",
    badge: "Biểu Giá Thuê",
    shortDesc: "Biểu giá thuê chuẩn các kích cỡ ngăn kho & danh mục phụ phí dịch vụ toàn chuỗi",
    icon: SlidersHorizontal,
  },
  {
    path: "/bom/policies",
    label: "Thông Số Vận Hành",
    badge: "An Ninh & Chế Tài",
    shortDesc: "Quy chuẩn an ninh mã PIN mở cửa & quy trình chế tài xử lý nợ quá hạn",
    icon: ShieldAlert,
  },
  {
    path: "/bom/reports",
    label: "Báo Cáo Doanh Thu",
    badge: "Kiểm Toán Dòng Tiền",
    shortDesc: "Tổng hợp dòng tiền thực thu, đối soát tài chính & kết xuất báo cáo kiểm toán",
    icon: FileSpreadsheet,
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

export default function BomDashboardPage() {
  const navigate = useNavigate()
  const { chainOverview, facilities } = useBomContext()

  return (
    <div className="space-y-10">
      {/* Tiêu đề trang Hub */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-wider uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
          QUẢN LÝ VẬN HÀNH TOÀN HỆ THỐNG
        </h1>
        <p className="text-sky-300 font-semibold text-base sm:text-lg max-w-2xl mx-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          Trung tâm điều hành cấp cao & giám sát cụm cơ sở kho thông minh 24/7
        </p>
      </div>

      {/* 4 Thẻ KPI trên Hub */}
      <div className="max-w-5xl mx-auto">
        <BomKpiCards />
      </div>

      {/* 4 cụm chức năng - Liên kết trực tiếp layoutId với thanh navbar bên trái */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 w-full max-w-6xl mx-auto">
        {MODULE_CARDS.map((item) => {
          const Icon = item.icon
          return (
            <motion.button
              key={item.path}
              layoutId={`bom-module-card-${item.path}`}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 28,
                mass: 0.85,
              }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className="group p-6 rounded-3xl min-h-[230px] flex flex-col justify-between items-start text-left cursor-pointer border-2 border-sky-400/80 hover:border-sky-300 bg-slate-950/80 hover:bg-slate-900/90 shadow-[0_0_25px_rgba(56,189,248,0.2)] hover:shadow-[0_0_35px_rgba(56,189,248,0.45)] backdrop-blur-md relative overflow-hidden transition-colors"
            >
              {/* Lớp nền gradient ánh sáng nhẹ khi hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex items-center justify-between w-full relative z-10">
                <motion.div
                  layoutId={`bom-module-icon-${item.path}`}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="p-3.5 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors shadow-md"
                >
                  <Icon className="size-7" />
                </motion.div>
                <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300">
                  {item.badge}
                </span>
              </div>

              <div className="mt-4 space-y-2 w-full relative z-10">
                <div className="flex items-center justify-between">
                  <motion.span
                    layoutId={`bom-module-title-${item.path}`}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className="text-lg font-black text-white group-hover:text-sky-300 tracking-tight transition-colors"
                  >
                    {item.label}
                  </motion.span>
                  <ArrowUpRight className="size-5 text-slate-400 group-hover:text-sky-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
                  {item.shortDesc}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
