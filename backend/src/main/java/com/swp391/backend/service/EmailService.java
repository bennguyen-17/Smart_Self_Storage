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

    // Helper: Tải template HTML từ thư mục templates/email/
    private String loadTemplate(String templateName) throws IOException {
        ClassPathResource resource = new ClassPathResource("templates/email/" + templateName);
        try (InputStream input = resource.getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
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

        String template = loadTemplate("check-in-completion.html");

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

        try {
            String template = loadTemplate("otp-verification.html");
            String html = template
                    .replace("{{subject}}", escapeHtml(subject))
                    .replace("{{displayName}}", escapeHtml(displayName))
                    .replace("{{purpose}}", escapeHtml(purpose))
                    .replace("{{otpCode}}", escapeHtml(otpCode));

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

        NumberFormat nf = NumberFormat.getInstance(Locale.of("vi", "VN"));
        String formattedDeposit = depositAmount != null ? nf.format(depositAmount) + " VNĐ" : "0 VNĐ";
        String formattedRental = rentalAmount != null ? nf.format(rentalAmount) + " VNĐ" : "0 VNĐ";

        String subject = "[Smart Self Storage] Xác nhận đặt cọc giữ chỗ thành công - Mã HĐ: " + displayCode;

        try {
            String template = loadTemplate("deposit-success.html");
            String html = template
                    .replace("{{subject}}", escapeHtml(subject))
                    .replace("{{displayName}}", escapeHtml(displayName))
                    .replace("{{displayCode}}", escapeHtml(displayCode))
                    .replace("{{displayUnit}}", escapeHtml(displayUnit))
                    .replace("{{displayFacility}}", escapeHtml(displayFacility))
                    .replace("{{formattedStart}}", escapeHtml(formattedStart))
                    .replace("{{formattedEnd}}", escapeHtml(formattedEnd))
                    .replace("{{formattedRental}}", escapeHtml(formattedRental))
                    .replace("{{formattedDeposit}}", escapeHtml(formattedDeposit));

            sendHtmlEmail(toEmail.trim(), subject, html);
            return true;
        } catch (Exception e) {
            log.error("Không thể gửi email xác nhận đặt cọc tới {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    // --- 6. Gửi email xác nhận hoàn tất hoàn trả tiền cọc (BR-35) ---
    public boolean sendRefundConfirmationEmail(String toEmail, String customerName, String contractCode, BigDecimal amount, String receiptUrl, String transactionCode) {
        if (toEmail == null || toEmail.isBlank()) return false;
        try {
            String safeName = (customerName != null && !customerName.isBlank()) ? customerName.trim() : "Quý khách";
            String safeCode = (contractCode != null && !contractCode.isBlank()) ? contractCode.trim() : "---";
            String safeAmount = (amount != null) ? NumberFormat.getInstance(Locale.of("vi", "VN")).format(amount) + " VNĐ" : "0 VNĐ";
            String safeTxn = (transactionCode != null && !transactionCode.isBlank()) ? transactionCode.trim() : "Đã chuyển khoản thành công";
            String safeReceipt = (receiptUrl != null && !receiptUrl.isBlank()) ? receiptUrl.trim() : null;

            String subject = "[Smart Self Storage] Xác nhận hoàn tất hoàn tiền cọc - HĐ: " + safeCode;

            String receiptHtml = "";
            if (safeReceipt != null) {
                receiptHtml = "<p style=\"margin: 16px 0 8px 0; font-weight: bold;\">Ảnh chứng từ / Biên lai chuyển khoản:</p>"
                        + "<p><a href=\"" + escapeHtml(safeReceipt) + "\" target=\"_blank\" style=\"display: inline-block; padding: 10px 18px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;\">Xem ảnh chứng từ chuyển khoản</a></p>";
            }

            String template = loadTemplate("refund-confirmation.html");
            String html = template
                    .replace("{{safeName}}", escapeHtml(safeName))
                    .replace("{{safeCode}}", escapeHtml(safeCode))
                    .replace("{{safeAmount}}", escapeHtml(safeAmount))
                    .replace("{{safeTxn}}", escapeHtml(safeTxn))
                    .replace("{{settlementDate}}", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .replace("{{receiptHtml}}", receiptHtml);

            sendHtmlEmail(toEmail.trim(), subject, html);
            return true;
        } catch (Exception e) {
            log.error("Không thể gửi email xác nhận hoàn cọc tới {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    // --- 7. Gửi email nhắc sắp hết hạn hợp đồng thuê kho trước 3 ngày (BR-27) ---
    public boolean sendExpiryReminderEmail(String toEmail, String customerName, String contractCode, String unitCode, String facilityName, String endDate, long daysLeft) {
        if (toEmail == null || toEmail.isBlank() || toEmail.endsWith("@smartstorage.vn")) {
            return false;
        }
        try {
            String safeName = (customerName != null && !customerName.isBlank()) ? customerName.trim() : "Quý khách";
            String safeCode = (contractCode != null && !contractCode.isBlank()) ? contractCode.trim() : "---";
            String safeUnit = (unitCode != null && !unitCode.isBlank()) ? unitCode.trim() : "---";
            String safeFacility = (facilityName != null && !facilityName.isBlank()) ? facilityName.trim() : "Hệ thống Smart Self Storage";
            String safeEnd = (endDate != null && !endDate.isBlank()) ? endDate.trim() : "Sắp tới";

            String subject = "[Smart Self Storage] Nhắc hạn thuê kho - Hợp đồng " + safeCode + " sắp hết hạn sau " + daysLeft + " ngày";

            String template = loadTemplate("expiry-reminder.html");
            String html = template
                    .replace("{{displayName}}", escapeHtml(safeName))
                    .replace("{{contractCode}}", escapeHtml(safeCode))
                    .replace("{{unitCode}}", escapeHtml(safeUnit))
                    .replace("{{facilityName}}", escapeHtml(safeFacility))
                    .replace("{{endDate}}", escapeHtml(safeEnd))
                    .replace("{{daysLeft}}", String.valueOf(daysLeft));

            sendHtmlEmail(toEmail.trim(), subject, html);
            return true;
        } catch (Exception e) {
            log.error("Không thể gửi email nhắc hạn tới {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    // --- 8. Gửi email cảnh báo quá hạn hợp đồng & nguy cơ thanh lý (BR-30, BR-32) ---
    public boolean sendOverdueWarningEmail(String toEmail, String customerName, String contractCode, String unitCode, String facilityName, long overdueDays, BigDecimal totalPenalty) {
        if (toEmail == null || toEmail.isBlank() || toEmail.endsWith("@smartstorage.vn")) {
            return false;
        }
        try {
            String safeName = (customerName != null && !customerName.isBlank()) ? customerName.trim() : "Quý khách";
            String safeCode = (contractCode != null && !contractCode.isBlank()) ? contractCode.trim() : "---";
            String safeUnit = (unitCode != null && !unitCode.isBlank()) ? unitCode.trim() : "---";
            String safeFacility = (facilityName != null && !facilityName.isBlank()) ? facilityName.trim() : "Hệ thống Smart Self Storage";
            String formattedPenalty = totalPenalty != null ? NumberFormat.getInstance(Locale.of("vi", "VN")).format(totalPenalty) + " VNĐ" : "50.000 VNĐ";

            String subject = "[Smart Self Storage - CẢNH BÁO] Hợp đồng " + safeCode + " quá hạn ngày thứ " + overdueDays;

            String template = loadTemplate("overdue-warning.html");
            String html = template
                    .replace("{{displayName}}", escapeHtml(safeName))
                    .replace("{{contractCode}}", escapeHtml(safeCode))
                    .replace("{{unitCode}}", escapeHtml(safeUnit))
                    .replace("{{facilityName}}", escapeHtml(safeFacility))
                    .replace("{{overdueDays}}", String.valueOf(overdueDays))
                    .replace("{{totalPenalty}}", escapeHtml(formattedPenalty));

            sendHtmlEmail(toEmail.trim(), subject, html);
            return true;
        } catch (Exception e) {
            log.error("Không thể gửi email cảnh báo quá hạn tới {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
}
