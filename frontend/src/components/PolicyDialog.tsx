import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type PolicyTab = "terms" | "privacy"

interface PolicyDialogProps {
  tab: PolicyTab | null
  onClose: () => void
}

const CONTENT: Record<PolicyTab, { title: string; intro: string; points: string[] }> = {
  terms: {
    title: "Điều khoản dịch vụ",
    intro:
      "Bằng việc thuê kho tại Smart Storage, khách hàng đồng ý với các điều khoản dưới đây.",
    points: [
      "Khách hàng chịu trách nhiệm về tính hợp pháp của toàn bộ hàng hóa lưu trữ trong kho.",
      "Không lưu trữ chất cháy nổ, hàng cấm, động vật sống và hàng hóa vi phạm pháp luật.",
      "Tiền cọc được hoàn trả sau khi khách hàng trả kho và kho được kiểm tra không hư hại.",
      "Hợp đồng quá hạn thanh toán sẽ bị tạm khóa mã PIN ra vào cho đến khi hoàn tất nghĩa vụ.",
    ],
  },
  privacy: {
    title: "Chính sách bảo mật kho",
    intro:
      "Smart Storage cam kết bảo vệ dữ liệu cá nhân và tài sản của khách hàng.",
    points: [
      "Thông tin cá nhân chỉ dùng cho mục đích quản lý hợp đồng, thanh toán và hỗ trợ khách hàng.",
      "Camera an ninh hoạt động 24/7 tại khu vực hành lang và cổng ra vào, không ghi hình bên trong kho riêng.",
      "Chỉ nhân viên được phân quyền mới truy cập được dữ liệu hợp đồng của khách hàng.",
      "Khách hàng có quyền yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân của mình.",
    ],
  },
}

function PolicyDialog({ tab, onClose }: PolicyDialogProps) {
  const content = CONTENT[tab ?? "terms"]

  return (
    <Dialog
      open={tab !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.intro}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm text-muted-foreground">
          {content.points.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <p className="border-t pt-3 text-xs text-muted-foreground">
          Nội dung chi tiết đang được hoàn thiện. Mọi thắc mắc xin liên hệ hotline
          1900 391 391.
        </p>
      </DialogContent>
    </Dialog>
  )
}

export default PolicyDialog
