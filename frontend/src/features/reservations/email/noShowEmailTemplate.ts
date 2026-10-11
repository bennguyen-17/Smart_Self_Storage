// Mẫu email HTML gửi khách khi đơn bị hủy do No-Show (BR-17).
// Viết theo chuẩn email: bố cục bảng, CSS inline, không dùng JS, rộng tối đa 600px.
// Backend có thể dùng lại cấu trúc này khi gửi email thật.

import { formatDate, formatDateTime, formatVnd } from "@/lib/format"

import { DEPOSIT_POLICY_PATH } from "../constants"
import type { Reservation } from "../types"

export interface EmailContent {
  subject: string
  html: string
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

/** Escape mọi dữ liệu động trước khi chèn vào HTML */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

export function getDepositPolicyUrl(): string {
  const siteUrl =
    import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    window.location.origin
  return `${siteUrl}${DEPOSIT_POLICY_PATH}`
}

function summaryRow(label: string, value: string, highlight = false): string {
  const valueStyle = highlight
    ? "color:#be123c;font-weight:700;"
    : "color:#0f172a;font-weight:600;"
  return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;text-align:right;${valueStyle}">${escapeHtml(value)}</td>
    </tr>`
}

export function buildNoShowEmail(
  reservation: Reservation,
  policyUrl: string = getDepositPolicyUrl()
): EmailContent {
  const r = reservation
  const subject = `[Smart Self Storage] Hủy đặt chỗ ${r.reservationCode} do quá hạn nhận kho`
  const checkinDate = formatDate(r.checkinDate)

  const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background-color:#1e3a8a;padding:20px 24px;color:#ffffff;font-size:18px;font-weight:700;">
            Smart Self Storage
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 8px;display:inline-block;padding:4px 10px;border-radius:999px;background-color:#f1f5f9;border:1px solid #fda4af;color:#be123c;font-size:12px;font-weight:700;">
              HỦY CỌC (QUÁ HẠN CHECK-IN)
            </p>
            <h1 style="margin:12px 0 16px;font-size:20px;line-height:28px;color:#0f172a;">Thông báo hủy đặt chỗ</h1>
            <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#334155;">Kính gửi <strong>${escapeHtml(r.customerName)}</strong>,</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#334155;">
              Đơn đặt chỗ <strong>${escapeHtml(r.reservationCode)}</strong> tại <strong>${escapeHtml(r.facilityName)}</strong>
              đã bị hệ thống tự động hủy do Quý khách không đến nhận kho trong ngày hẹn
              <strong>${escapeHtml(checkinDate)}</strong> (khung giờ 08:00 – 20:00).
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;border-collapse:separate;margin:0 0 16px;">
              ${summaryRow("Mã đặt chỗ", r.reservationCode)}
              ${summaryRow("Cơ sở", `${r.facilityName} (${r.facilityCode})`)}
              ${summaryRow("Ô kho", r.unitCode)}
              ${summaryRow("Ngày hẹn nhận kho", checkinDate)}
              ${summaryRow("Tiền cọc đã nộp", formatVnd(r.depositAmount))}
              ${summaryRow("Tiền cọc bị tịch thu", formatVnd(r.forfeitedAmount ?? r.depositAmount), true)}
              ${summaryRow("Thời điểm hủy", formatDateTime(r.canceledAt))}
            </table>
            <p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#334155;"><strong>Lý do:</strong></p>
            <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#334155;">
              Theo Chính sách đặt cọc giữ chỗ, nếu đến 00:00 ngày kế tiếp ngày hẹn mà khách hàng chưa check-in
              và không thông báo gia hạn, đơn đặt chỗ sẽ bị hủy, tiền cọc bị tịch thu 100% và ô kho được giải phóng cho khách hàng khác.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
              <tr>
                <td style="border-radius:8px;background-color:#2563eb;">
                  <a href="${escapeHtml(policyUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 18px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
                    Xem Điều khoản chính sách đặt cọc
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;">
              Nếu cần hỗ trợ, Quý khách vui lòng liên hệ quầy lễ tân của cơ sở trong giờ làm việc 08:00 – 20:00.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:18px;">
            Đây là email tự động từ hệ thống Smart Self Storage, vui lòng không trả lời email này.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  return { subject, html }
}
