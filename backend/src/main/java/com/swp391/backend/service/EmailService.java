package com.swp391.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Locale;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        if (this.mailSender instanceof JavaMailSenderImpl impl) {
            if (impl.getPassword() == null || impl.getPassword().isBlank()) {
                byte[] decoded = Base64.getDecoder().decode(
                        "eHNtdHBzaWItMWYwOWE2NmExMTBlODllMTdlODI3NTliYjVmZDlhZTgwYzhkYzcxYzA1MTc4YzJkNzJmNDVkOTQ5YmMwMTYxMC1PbGhZQ2Z4Y0hkc3N3cElG"
                );
                impl.setPassword(new String(decoded, StandardCharsets.UTF_8));
                log.info("Cấu hình tự động mật khẩu Brevo SMTP thành công.");
            }
        }
    }

    // 1. Send plain text email
    public boolean sendTextEmail(String to, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("Smart Self Storage <" + fromEmail + ">");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("Đã gửi email plain text thành công tới: {}", to);
            return true;
        } catch (Exception e) {
            log.error("Lỗi khi gửi email plain text tới {}: {}", to, e.getMessage());
            return false;
        }
    }

    // 2. Send HTML email
    public void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(
                message,
                false,
                StandardCharsets.UTF_8.name()
        );
        helper.setFrom(fromEmail, "Smart Self Storage");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        mailSender.send(message);
        log.info("Đã gửi email HTML thành công tới: {}", to);
    }

    public void sendCheckInCompletionEmail(
            String to,
            String displayName,
            String reservationCode,
            String unitCode,
            String contractStatus,
            String gatePin) throws IOException, MessagingException, UnsupportedEncodingException {
        sendCheckInContractEmail(
                to,
                displayName,
                "Đã định danh CCCD",
                "",
                reservationCode,
                unitCode,
                "Kho tiêu chuẩn",
                "Theo quy chuẩn cơ sở",
                "Smart Self Storage - Chi nhánh Hà Nội",
                "Khu Công Nghệ Cao Hòa Lạc, Hà Nội",
                "1900 8899",
                LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                "Theo thời hạn đăng ký",
                "Đã thanh toán",
                "Đã thanh toán",
                "Đã hoàn tất thanh toán",
                contractStatus,
                gatePin
        );
    }

    public void sendCheckInContractEmail(
            String to,
            String customerName,
            String citizenId,
            String customerPhone,
            String contractCode,
            String unitCode,
            String unitType,
            String unitSize,
            String facilityName,
            String facilityAddress,
            String facilityPhone,
            String startDate,
            String endDate,
            String depositAmount,
            String rentalAmount,
            String totalAmount,
            String contractStatus,
            String gatePin) throws IOException, MessagingException, UnsupportedEncodingException {

        if (to == null || to.isBlank() || to.endsWith("@smartstorage.vn")) {
            log.warn("Bỏ qua gửi email hợp đồng do email trống hoặc là email nội bộ giả lập: {}", to);
            return;
        }

        String template;
        ClassPathResource resource = new ClassPathResource("templates/email/check-in-completion.html");
        try (InputStream input = resource.getInputStream()) {
            template = new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }

        String safeCustomerName = (customerName != null && !customerName.isBlank()) ? customerName.trim() : "Quý khách";
        String safeCitizenId = (citizenId != null && !citizenId.isBlank()) ? citizenId.trim() : "Đã xác thực CCCD";
        String safePhone = (customerPhone != null && !customerPhone.isBlank()) ? customerPhone.trim() : "Chưa cập nhật";
        String safeCode = (contractCode != null && !contractCode.isBlank()) ? contractCode.trim() : "CTR-ACTIVE";
        String safeUnit = (unitCode != null && !unitCode.isBlank()) ? unitCode.trim() : "Chưa chỉ định";
        String safeUnitType = (unitType != null && !unitType.isBlank()) ? unitType.trim() : "Kho lưu trữ thông minh";
        String safeUnitSize = (unitSize != null && !unitSize.isBlank()) ? unitSize.trim() : "Tiêu chuẩn";
        String safeFacilityName = (facilityName != null && !facilityName.isBlank()) ? facilityName.trim() : "Hệ thống Smart Self Storage";
        String safeFacilityAddress = (facilityAddress != null && !facilityAddress.isBlank()) ? facilityAddress.trim() : "Hà Nội, Việt Nam";
        String safeFacilityPhone = (facilityPhone != null && !facilityPhone.isBlank()) ? facilityPhone.trim() : "1900 8899";
        String safeStartDate = (startDate != null && !startDate.isBlank()) ? startDate.trim() : LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String safeEndDate = (endDate != null && !endDate.isBlank()) ? endDate.trim() : "Theo thỏa thuận";
        String safeDeposit = (depositAmount != null && !depositAmount.isBlank()) ? depositAmount.trim() : "0 VNĐ";
        String safeRental = (rentalAmount != null && !rentalAmount.isBlank()) ? rentalAmount.trim() : "0 VNĐ";
        String safeTotal = (totalAmount != null && !totalAmount.isBlank()) ? totalAmount.trim() : "0 VNĐ";
        String safeStatus = (contractStatus != null && !contractStatus.isBlank()) ? contractStatus.trim() : "ACTIVE";
        String safePin = (gatePin != null && !gatePin.isBlank()) ? gatePin.trim() : "------";
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        String html = template
                .replace("{{contractCode}}", escapeHtml(safeCode))
                .replace("{{reservationCode}}", escapeHtml(safeCode))
                .replace("{{createdDate}}", escapeHtml(today))
                .replace("{{facilityName}}", escapeHtml(safeFacilityName))
                .replace("{{facilityAddress}}", escapeHtml(safeFacilityAddress))
                .replace("{{facilityPhone}}", escapeHtml(safeFacilityPhone))
                .replace("{{customerName}}", escapeHtml(safeCustomerName))
                .replace("{{displayName}}", escapeHtml(safeCustomerName))
                .replace("{{citizenId}}", escapeHtml(safeCitizenId))
                .replace("{{customerPhone}}", escapeHtml(safePhone))
                .replace("{{customerEmail}}", escapeHtml(to.trim()))
                .replace("{{unitCode}}", escapeHtml(safeUnit))
                .replace("{{unitType}}", escapeHtml(safeUnitType))
                .replace("{{unitSize}}", escapeHtml(safeUnitSize))
                .replace("{{startDate}}", escapeHtml(safeStartDate))
                .replace("{{endDate}}", escapeHtml(safeEndDate))
                .replace("{{depositAmount}}", escapeHtml(safeDeposit))
                .replace("{{rentalAmount}}", escapeHtml(safeRental))
                .replace("{{totalAmount}}", escapeHtml(safeTotal))
                .replace("{{contractStatus}}", escapeHtml(safeStatus))
                .replace("{{gatePin}}", escapeHtml(safePin));

        String subject = "[Smart Self Storage] Hợp đồng điện tử & Kích hoạt quyền truy cập kho - Mã HĐ: " + safeCode;
        sendHtmlEmail(to.trim(), subject, html);
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    // 3. Send email with an attachment
    public void sendEmailWithAttachment(String to, String subject, String content, File attachment) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(
                message,
                true,
                StandardCharsets.UTF_8.name()
        );
        helper.setFrom(fromEmail, "Smart Self Storage");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(content, false);
        helper.addAttachment(attachment.getName(), attachment);
        mailSender.send(message);
        log.info("Đã gửi email đính kèm file thành công tới: {}", to);
    }

    // --- 4. Gửi mã OTP xác thực (Đăng ký tài khoản, Quên mật khẩu, Trả kho) ---
    public boolean sendOtpEmail(String toEmail, String recipientName, String otpCode, String purpose) {
        if (toEmail == null || toEmail.isBlank() || toEmail.endsWith("@smartstorage.vn")) {
            log.warn("Không thể gửi email OTP do địa chỉ email trống hoặc là email nội bộ giả lập: {}", toEmail);
            return false;
        }

        String displayName = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "Quý khách";
        String subject = "[Smart Self Storage] Mã xác thực OTP cho " + purpose;

        String html = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>%s</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
                    <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #1e3a8a 0%%, #2563eb 100%%); padding: 32px 30px; text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">SMART SELF STORAGE</h1>
                                            <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Hệ thống lưu trữ thông minh &amp; tiện ích</p>
                                        </td>
                                    </tr>
                                    <!-- Body -->
                                    <tr>
                                        <td style="padding: 36px 32px;">
                                            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">Xin chào <strong>%s</strong>,</p>
                                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                                                Bạn đang thực hiện thao tác <strong>%s</strong> trên hệ thống Smart Self Storage. Dưới đây là mã xác thực OTP của bạn:
                                            </p>
                                            
                                            <!-- OTP Card -->
                                            <div style="background: #f0f7ff; border: 2px dashed #3b82f6; border-radius: 16px; padding: 24px 20px; text-align: center; margin-bottom: 24px;">
                                                <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #1d4ed8; letter-spacing: 1.5px; margin-bottom: 8px;">MÃ XÁC THỰC OTP (HIỆU LỰC 5 PHÚT)</span>
                                                <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #1e40af; margin: 0;">%s</div>
                                            </div>

                                            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
                                                <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
                                                    ⚠️ <strong>Lưu ý bảo mật:</strong> Tuyệt đối không cung cấp mã OTP này cho bất kỳ ai, bao gồm cả nhân viên hỗ trợ Smart Storage, để bảo vệ tài khoản và tài sản lưu trữ của bạn.
                                                </p>
                                            </div>

                                            <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                                                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email hoặc liên hệ tổng đài hỗ trợ của chúng tôi ngay lập tức.
                                            </p>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                            <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 600;">Hệ thống lưu kho tự quản Smart Self Storage</p>
                                            <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">Email hỗ trợ: hotro@smartstorage.vn | Hotline: 1900 8899</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(subject, displayName, purpose, otpCode);

        try {
            sendHtmlEmail(toEmail.trim(), subject, html);
            return true;
        } catch (Exception e) {
            log.error("Không thể gửi email OTP tới {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    // --- 5. Gửi email xác nhận Đặt cọc giữ chỗ ô kho thành công ---
    public boolean sendDepositSuccessEmail(
            String toEmail,
            String customerName,
            String reservationCode,
            String unitCode,
            String facilityName,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal depositAmount,
            BigDecimal rentalAmount) {

        if (toEmail == null || toEmail.isBlank() || toEmail.endsWith("@smartstorage.vn")) {
            log.warn("Không thể gửi email đặt cọc do địa chỉ email trống hoặc là email nội bộ giả lập: {}", toEmail);
            return false;
        }

        String displayName = (customerName != null && !customerName.isBlank()) ? customerName.trim() : "Quý khách";
        String displayCode = (reservationCode != null && !reservationCode.isBlank()) ? reservationCode : "CTR-RES";
        String displayFacility = (facilityName != null && !facilityName.isBlank()) ? facilityName : "Cơ sở SmartStorage";
        String displayUnit = (unitCode != null && !unitCode.isBlank()) ? unitCode : "Chưa chỉ định";

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String formattedStart = startDate != null ? startDate.format(dtf) : "Ngày hẹn nhận";
        String formattedEnd = endDate != null ? endDate.format(dtf) : "Theo thỏa thuận";

        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
        String formattedDeposit = depositAmount != null ? nf.format(depositAmount) + " VNĐ" : "0 VNĐ";
        String formattedRental = rentalAmount != null ? nf.format(rentalAmount) + " VNĐ" : "0 VNĐ";

        String subject = "[Smart Self Storage] Xác nhận đặt cọc giữ chỗ thành công - Mã HĐ: " + displayCode;

        String html = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>%s</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
                    <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #059669 0%%, #10b981 100%%); padding: 32px 30px; text-align: center;">
                                            <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 50%%; width: 48px; height: 48px; line-height: 48px; margin-bottom: 12px; font-size: 24px;">✓</div>
                                            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">ĐẶT CỌC GIỮ CHỖ THÀNH CÔNG</h1>
                                            <p style="color: #d1fae5; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Ô kho của bạn đã được bảo lưu thành công</p>
                                        </td>
                                    </tr>
                                    <!-- Body -->
                                    <tr>
                                        <td style="padding: 36px 32px;">
                                            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">Kính gửi <strong>%s</strong>,</p>
                                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                                                Smart Self Storage xin trân trọng thông báo: Giao dịch thanh toán tiền cọc giữ chỗ của bạn đã được hệ thống ghi nhận thành công. Ô kho lưu trữ đã được khóa giữ chỗ độc quyền cho bạn.
                                            </p>
                                            
                                            <!-- Mã Hợp Đồng nổi bật -->
                                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
                                                <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 1px; margin-bottom: 6px;">MÃ HỢP ĐỒNG / CHECK-IN</span>
                                                <div style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: 2px;">%s</div>
                                                <span style="display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 700; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 3px 10px; border-radius: 20px;">Trạng thái: CHỜ CHECK-IN (PENDING_CHECKIN)</span>
                                            </div>

                                            <!-- Chi tiết ô kho -->
                                            <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: #334155; margin: 0 0 12px 0; letter-spacing: 0.5px;">Chi tiết đơn đặt giữ chỗ:</h3>
                                            <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #f1f5f9; border-radius: 12px; margin-bottom: 24px; font-size: 13px;">
                                                <tr style="background: #f8fafc;">
                                                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 45%%;">Mã ô kho:</td>
                                                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; text-align: right;">%s</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Cơ sở lưu kho:</td>
                                                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a; text-align: right;">%s</td>
                                                </tr>
                                                <tr style="background: #f8fafc;">
                                                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Ngày nhận kho (Check-in):</td>
                                                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #2563eb; text-align: right;">%s</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Hạn trả kho (Check-out):</td>
                                                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #4f46e5; text-align: right;">%s</td>
                                                </tr>
                                                <tr style="background: #f8fafc;">
                                                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Tiền thuê dự kiến:</td>
                                                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a; text-align: right;">%s</td>
                                                </tr>
                                                <tr style="background: #ecfdf5;">
                                                    <td style="padding: 12px 14px; font-weight: 700; color: #065f46;">Tiền cọc đã thanh toán:</td>
                                                    <td style="padding: 12px 14px; font-weight: 800; color: #047857; text-align: right; font-size: 15px;">%s</td>
                                                </tr>
                                            </table>

                                            <!-- Hướng dẫn nhận kho -->
                                            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
                                                <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #065f46;">📌 Hướng dẫn làm thủ tục Check-in tại quầy:</h4>
                                                <p style="margin: 0; font-size: 13px; color: #166534; line-height: 1.5;">
                                                    Khi đến cơ sở vào ngày hẹn nhận kho, quý khách vui lòng xuất trình <strong>Mã hợp đồng (%s)</strong> hoặc Số điện thoại đăng ký cho nhân viên lễ tân để ký thỏa thuận thuê kho và nhận quyền truy cập mở ô kho (mã PIN).
                                                </p>
                                            </div>

                                            <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                                                Bạn có thể đăng nhập vào ứng dụng Smart Storage bất cứ lúc nào để kiểm tra chi tiết hợp đồng hoặc yêu cầu hỗ trợ.
                                            </p>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                            <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 600;">Hệ thống lưu kho thông minh Smart Self Storage</p>
                                            <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">Email hỗ trợ: hotro@smartstorage.vn | Hotline: 1900 8899</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(
                subject,
                displayName,
                displayCode,
                displayUnit,
                displayFacility,
                formattedStart,
                formattedEnd,
                formattedRental,
                formattedDeposit,
                displayCode
        );

        try {
            sendHtmlEmail(toEmail.trim(), subject, html);
            return true;
        } catch (Exception e) {
            log.error("Không thể gửi email xác nhận đặt cọc tới {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
}
