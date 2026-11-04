import { useState } from "react"
import {
  FileTextIcon,
  PhoneCallIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "cn"

export type PolicyTab = "terms" | "privacy"

interface PolicyDialogProps {
  tab: PolicyTab | null
  onClose: () => void
}

interface SectionItem {
  heading: string
  detail: string
}

const POLICY_DATA: Record<
  PolicyTab,
  {
    title: string
    badge: string
    sections: SectionItem[]
  }
> = {
  terms: {
    title: "Điều khoản dịch vụ",
    badge: "Quy chế thuê kho tự quản",
    sections: [
      {
        heading: "1. Quyền ra vào và sử dụng ô kho 24/7",
        detail:
          "Khách hàng được toàn quyền ra vào cơ sở và sử dụng ô kho tự quản 24/7 bằng mã PIN bảo mật cá nhân được cấp tự động sau khi hoàn tất thủ tục nhận kho (Check-in). Khách hàng có trách nhiệm tự bảo quản khóa buồng kho và mã PIN cá nhân, không chia sẻ cho người không có thẩm quyền.",
      },
      {
        heading: "2. Danh mục hàng hóa nghiêm cấm lưu trữ",
        detail:
          "Bên thuê cam kết tuyệt đối không lưu trữ: Hóa chất độc hại, chất dễ cháy nổ, bình gas, xăng dầu, pháo hoa; vũ khí, vật liệu nổ, hàng cấm theo quy định của pháp luật; động vật sống hoặc thực phẩm tươi sống dễ ôi thiu gây ô nhiễm. Khách hàng chịu hoàn toàn trách nhiệm trước pháp luật và bồi thường thiệt hại thực tế phát sinh nếu vi phạm.",
      },
      {
        heading: "3. Chính sách tiền cọc và hoàn trả tiền cọc",
        detail:
          "Tiền cọc tương đương 01 tháng tiền thuê (hoặc theo quy định từng cỡ ô kho) được thanh toán khi đặt giữ chỗ nhằm đảm bảo thực hiện hợp đồng. Bên cho thuê hoàn lại 100% tiền cọc cho khách hàng qua chuyển khoản ngân hàng trong vòng 24–48 giờ làm việc sau khi kết thúc hợp đồng và nghiệm thu ô kho không hư hại, không nợ phí phát sinh.",
      },
      {
        heading: "4. Gia hạn thuê kho trực tuyến & Phí quá hạn",
        detail:
          "Khách hàng có quyền chủ động gia hạn thời gian thuê trực tuyến trên hệ thống trước thời điểm hợp đồng hết hạn. Trường hợp hết hạn mà không gia hạn hoặc không làm thủ tục trả kho, hệ thống áp dụng mức phí quá hạn cố định 50.000 VNĐ / ngày trễ hạn. Nếu quá hạn vượt quá 30 ngày mà không liên hệ xử lý, đơn vị có quyền mở niêm phong, thanh lý tài sản tồn đọng và tịch thu tiền cọc theo quy định tại Điều 4 của Hợp đồng thuê kho.",
      },
      {
        heading: "5. Thủ tục trả kho và nghiệm thu bàn giao",
        detail:
          "Khách hàng có thể trả kho đúng hạn hoặc hẹn ngày trả kho sớm trên hệ thống. Nhân viên cơ sở sẽ phối hợp kiểm tra hiện trạng ô kho, lập biên bản nghiệm thu bàn giao trước khi hoàn tất thủ tục thanh lý hợp đồng và tất toán cọc.",
      },
    ],
  },
  privacy: {
    title: "Chính sách bảo mật kho",
    badge: "An ninh & Quyền riêng tư",
    sections: [
      {
        heading: "1. Giám sát an ninh và Camera AI 24/7",
        detail:
          "Toàn bộ khuôn viên, sảnh chính, cửa ra vào và các dãy hành lang cơ sở được trang bị hệ thống camera an ninh AI hoạt động liên tục 24/7 cùng cảm biến nhiệt độ, độ ẩm và báo cháy tự động. Chúng tôi cam kết tuyệt đối không lắp đặt camera hoặc thiết bị ghi hình bên trong buồng kho riêng nhằm bảo đảm trọn vẹn quyền riêng tư cho khách hàng.",
      },
      {
        heading: "2. Kiểm soát an ninh bằng mã PIN cá nhân",
        detail:
          "Mỗi khách hàng được cấp một mã PIN cá nhân độc lập để mở cửa chính ra vào cơ sở. Hệ thống tự động ghi nhận nhật ký ra vào (Gate Logs) theo thời gian thực nhằm mục đích bảo vệ an ninh chung và tra soát khi có sự cố. Mã PIN tự động vô hiệu hóa ngay khi hợp đồng kết thúc hoặc thanh lý.",
      },
      {
        heading: "3. Bảo vệ dữ liệu cá nhân & Hợp đồng điện tử",
        detail:
          "Mọi thông tin định danh cá nhân (Họ tên, CCCD, Số điện thoại, Email, Thông tin tài khoản ngân hàng thụ hưởng) và hợp đồng điện tử được lưu trữ an toàn trên máy chủ đám mây, tuân thủ nghiêm ngặt quy định bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP. Dữ liệu chỉ được sử dụng cho mục đích vận hành hợp đồng, gửi thông báo hạn thuê và xử lý giao dịch hoàn tiền.",
      },
      {
        heading: "4. Cam kết bảo đảm quyền sở hữu tài sản",
        detail:
          "Đơn vị quản lý cam kết không tự ý mở khóa hoặc can thiệp vào ô kho của khách hàng dưới bất kỳ hình thức nào, ngoại trừ trường hợp khẩn cấp liên quan đến an toàn cháy nổ, sự cố rò rỉ đe dọa an toàn chung hoặc khi có yêu cầu bằng văn bản từ cơ quan Nhà nước có thẩm quyền theo quy định của pháp luật.",
      },
    ],
  },
}

function PolicyDialog({ tab, onClose }: PolicyDialogProps) {
  const [activeTab, setActiveTab] = useState<PolicyTab>("terms")

  // Đồng bộ tab khi dialog mở lên từ bên ngoài
  const currentTab = tab ?? activeTab
  const content = POLICY_DATA[currentTab]

  return (
    <Dialog
      open={tab !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-hidden p-0 sm:max-w-2xl rounded-2xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Header với Tabs chuyển đổi trực tiếp */}
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20">
              {currentTab === "terms" ? (
                <FileTextIcon className="size-5" />
              ) : (
                <ShieldCheckIcon className="size-5" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {content.title}
              </DialogTitle>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                {content.badge}
              </p>
              <DialogDescription className="sr-only">
                {content.title} - {content.badge}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Nội dung danh sách điều khoản cuộn mượt */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 divide-y divide-slate-100 dark:divide-slate-800/80">
          {content.sections.map((sec, idx) => (
            <div key={sec.heading} className={cn("space-y-1.5", idx > 0 && "pt-3.5")}>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0"></span>
                <span>{sec.heading}</span>
              </h4>
              <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 pl-3.5">
                {sec.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Footer với Hotline & Nút Đóng */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <PhoneCallIcon className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Tổng đài hỗ trợ 24/7:{" "}
              <a
                href="tel:19008899"
                className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
              >
                1900 8899
              </a>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 shadow-2xs"
          >
            Đã hiểu &amp; Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PolicyDialog
