package com.swp391.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;
    @Value("${app.backend.base-url:http://localhost:8080}")
    private String backendBaseUrl;

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

    // ==========================================
    // 1. TIỆN ÍCH CƠ BẢN (HELPERS & SEND UTILS)
    // ==========================================

    private String loadTemplate(String templateName) throws IOException {
        ClassPathResource resource = new ClassPathResource("templates/email/" + templateName);
        try (InputStream input = resource.getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
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

    public void sendHtmlEmailWithAttachment(String to, String subject, String htmlContent, String attachmentFilename, byte[] attachmentBytes) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(
                message,
                true,
                StandardCharsets.UTF_8.name()
        );
        helper.setFrom(fromEmail, "Smart Self Storage");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        if (attachmentBytes != null && attachmentBytes.length > 0) {
            helper.addAttachment(attachmentFilename, new ByteArrayResource(attachmentBytes));
        }
        mailSender.send(message);
        log.info("Đã gửi email HTML có đính kèm file ({}) thành công tới: {}", attachmentFilename, to);
    }

    // ==========================================
    // 2. CÁC EMAIL NGHIỆP VỤ HỆ THỐNG
    // ==========================================

    // --- 1. Gửi mã OTP xác thực (Đăng ký tài khoản, Quên mật khẩu, Trả kho) ---
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

    // --- 2. Gửi email xác nhận đặt cọc thành công ---
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

        String subject = "[Smart Self Storage] Xác nhận đặt cọc giữ chỗ thành công - Hợp đồng: " + displayCode;

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

    // --- 3. Gửi email xác nhận nhận kho thành công ---
    public boolean sendCheckInCompletionEmail(
            String toEmail,
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
            String gatePin) {

        if (toEmail == null || toEmail.isBlank() || toEmail.endsWith("@smartstorage.vn")) {
            log.warn("Không thể gửi email nhận kho do địa chỉ email không chính xác: {}", toEmail);
            return false;
        }

        try {
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

            String subject = "[Smart Self Storage] Xác nhận nhận kho thành công - Mã HĐ: " + safeCode;

            String template = loadTemplate("check-in-completion.html");
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
                    .replace("{{customerEmail}}", escapeHtml(toEmail.trim()))
                    .replace("{{unitCode}}", escapeHtml(safeUnit))
                    .replace("{{unitType}}", escapeHtml(safeUnitType))
                    .replace("{{unitSize}}", escapeHtml(safeUnitSize))
                    .replace("{{startDate}}", escapeHtml(safeStartDate))
                    .replace("{{formattedStart}}", escapeHtml(safeStartDate))
                    .replace("{{endDate}}", escapeHtml(safeEndDate))
                    .replace("{{formattedEnd}}", escapeHtml(safeEndDate))
                    .replace("{{depositAmount}}", escapeHtml(safeDeposit))
                    .replace("{{rentalAmount}}", escapeHtml(safeRental))
                    .replace("{{totalAmount}}", escapeHtml(safeTotal))
                    .replace("{{contractStatus}}", escapeHtml(safeStatus))
                    .replace("{{gatePin}}", escapeHtml(safePin));

            byte[] pdfBytes = null;
            try {
                java.nio.file.Path pdfPath = java.nio.file.Paths.get("uploads", "contracts", safeCode + ".pdf");
                if (!java.nio.file.Files.exists(pdfPath)) {
                    pdfPath = java.nio.file.Paths.get("backend", "uploads", "contracts", safeCode + ".pdf");
                }
                if (java.nio.file.Files.exists(pdfPath)) {
                    pdfBytes = java.nio.file.Files.readAllBytes(pdfPath);
                }
            } catch (Exception ex) {
                log.warn("Không tìm thấy hoặc không thể đọc file PDF hợp đồng chuẩn {}: {}", safeCode, ex.getMessage());
            }

            if (pdfBytes != null && pdfBytes.length > 0) {
                sendHtmlEmailWithAttachment(toEmail.trim(), subject, html, safeCode + ".pdf", pdfBytes);
            } else {
                sendHtmlEmail(toEmail.trim(), subject, html);
            }
            return true;
        } catch (Exception e) {
            log.error("Không thể gửi email xác nhận check-in tới {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    // --- 4. Gửi email nhắc sắp hết hạn hợp đồng thuê kho trước 3 ngày ---
    public boolean sendExpiryReminderEmail(String toEmail, String customerName, String contractCode, String unitCode, String facilityName, LocalDate expiryDate, long daysLeft) {
        if (toEmail == null || toEmail.isBlank() || toEmail.endsWith("@smartstorage.vn")) {
            return false;
        }
        try {
            String safeName = (customerName != null && !customerName.isBlank()) ? customerName.trim() : "Quý khách";
            String safeCode = (contractCode != null && !contractCode.isBlank()) ? contractCode.trim() : "---";
            String safeUnit = (unitCode != null && !unitCode.isBlank()) ? unitCode.trim() : "---";
            String safeFacility = (facilityName != null && !facilityName.isBlank()) ? facilityName.trim() : "Hệ thống Smart Self Storage";
            String expDateStr = expiryDate != null ? expiryDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "---";

            String subject = "[Smart Self Storage] Nhắc hạn thuê kho - Hợp đồng " + safeCode + " sắp hết hạn sau " + daysLeft + " ngày";

            String template = loadTemplate("expiry-reminder.html");
            String html = template
                    .replace("{{displayName}}", escapeHtml(safeName))
                    .replace("{{contractCode}}", escapeHtml(safeCode))
                    .replace("{{unitCode}}", escapeHtml(safeUnit))
                    .replace("{{facilityName}}", escapeHtml(safeFacility))
                    .replace("{{expiryDate}}", escapeHtml(expDateStr))
                    .replace("{{endDate}}", escapeHtml(expDateStr))
                    .replace("{{daysLeft}}", String.valueOf(daysLeft));

            sendHtmlEmail(toEmail.trim(), subject, html);
            return true;
        } catch (Exception e) {
            log.error("Không thể gửi email nhắc hạn thuê kho tới {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    // --- 5. Gửi email xác nhận gia hạn hợp đồng thành công ---
    public boolean sendRenewalSuccessEmail(String toEmail, String customerName, String contractCode, String unitCode,
                                          String facilityName, int effectiveDays, LocalDate newExpiryDate,
                                          String invoiceNumber, BigDecimal amount) {
        if (toEmail == null || toEmail.isBlank() || toEmail.endsWith("@smartstorage.vn")) {
            return false;
        }
        try {
            String safeName = (customerName != null && !customerName.isBlank()) ? customerName.trim() : "Quý khách";
            String safeCode = (contractCode != null && !contractCode.isBlank()) ? contractCode.trim() : "---";
            String safeUnit = (unitCode != null && !unitCode.isBlank()) ? unitCode.trim() : "---";
            String safeFacility = (facilityName != null && !facilityName.isBlank()) ? facilityName.trim() : "Hệ thống Smart Self Storage";
            String newExpStr = newExpiryDate != null ? newExpiryDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "---";
            String safeInv = (invoiceNumber != null && !invoiceNumber.isBlank()) ? invoiceNumber.trim() : "---";
            String formattedAmount = amount != null ? NumberFormat.getInstance(Locale.of("vi", "VN")).format(amount) : "0";

            String subject = "[Smart Self Storage] Gia hạn thành công hợp đồng " + safeCode;

            String template = loadTemplate("renewal-success.html");
            String html = template
                    .replace("{{customerName}}", escapeHtml(safeName))
                    .replace("{{displayName}}", escapeHtml(safeName))
                    .replace("{{contractCode}}", escapeHtml(safeCode))
                    .replace("{{unitCode}}", escapeHtml(safeUnit))
                    .replace("{{facilityName}}", escapeHtml(safeFacility))
                    .replace("{{effectiveDays}}", String.valueOf(effectiveDays))
                    .replace("{{newExpiryDate}}", escapeHtml(newExpStr))
                    .replace("{{invoiceNumber}}", escapeHtml(safeInv))
                    .replace("{{amount}}", escapeHtml(formattedAmount));

            sendHtmlEmail(toEmail.trim(), subject, html);
            return true;
        } catch (Exception e) {
            log.error("Không thể gửi email gia hạn thành công tới {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    // --- 6. Gửi email cảnh báo quá hạn hợp đồng ---
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

            String subject = "[Smart Self Storage] Cảnh báo hợp đồng " + safeCode + " quá hạn ngày thứ " + overdueDays;

            String template = loadTemplate("overdue-warning.html");
            String html = template
                    .replace("{{displayName}}", escapeHtml(safeName))
                    .replace("{{customerName}}", escapeHtml(safeName))
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

    // --- 7. Gửi email xác nhận hoàn tất hoàn trả tiền cọc (BR-35) ---
    public boolean sendRefundConfirmationEmail(String toEmail, String customerName, String contractCode, BigDecimal amount, String receiptUrl, String transactionCode) {
        return sendRefundConfirmationEmail(toEmail, customerName, contractCode, amount, receiptUrl, transactionCode, null, null);
    }

    public boolean sendRefundConfirmationEmail(
            String toEmail, String customerName, String contractCode, BigDecimal amount,
            String receiptUrl, String transactionCode, byte[] receiptImageBytes, String receiptContentType
    ) {
        if (toEmail == null || toEmail.isBlank() || toEmail.endsWith("@smartstorage.vn")) return false;
        try {
            String safeName = (customerName != null && !customerName.isBlank()) ? customerName.trim() : "Quý khách";
            String safeCode = (contractCode != null && !contractCode.isBlank()) ? contractCode.trim() : "---";
            String safeAmount = (amount != null) ? NumberFormat.getInstance(Locale.of("vi", "VN")).format(amount) + " VNĐ" : "0 VNĐ";
            String safeTxn = (transactionCode != null && !transactionCode.isBlank()) ? transactionCode.trim() : "Chuyển khoản liên ngân hàng";
            String safeReceipt = (receiptUrl != null && !receiptUrl.isBlank()) ? receiptUrl.trim() : null;
            if (safeReceipt != null && safeReceipt.startsWith("/")) {
                String base = (backendBaseUrl != null && !backendBaseUrl.isBlank()) ? backendBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
                safeReceipt = base + safeReceipt;
            }
            String settlementDate = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

            String subject = "[Smart Self Storage] Xác nhận hoàn tất hoàn tiền cọc - Mã HĐ: " + safeCode;

            String receiptHtml = "";
            boolean hasInlineImage = (receiptImageBytes != null && receiptImageBytes.length > 0);

            if (hasInlineImage) {
                receiptHtml = "<div style=\"margin: 20px 0; padding: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;\">"
                        + "<p style=\"margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;\">Biên lai chuyển khoản hoàn tiền</p>"
                        + "<img src=\"cid:refundReceiptImage\" style=\"max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.06);\" alt=\"Biên lai hoàn tiền\" />"
                        + "</div>";
            } else if (safeReceipt != null) {
                receiptHtml = "<div style=\"text-align: center; margin: 18px 0;\">"
                        + "<a href=\"" + escapeHtml(safeReceipt) + "\" target=\"_blank\" style=\"display: inline-block; padding: 10px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px;\">"
                        + "Xem ảnh minh chứng"
                        + "</a></div>";
            }

            String template = loadTemplate("refund-confirmation.html");
            String html = template
                    .replace("{{displayName}}", escapeHtml(safeName))
                    .replace("{{customerName}}", escapeHtml(safeName))
                    .replace("{{contractCode}}", escapeHtml(safeCode))
                    .replace("{{refundAmount}}", escapeHtml(safeAmount))
                    .replace("{{transactionCode}}", escapeHtml(safeTxn))
                    .replace("{{settlementDate}}", escapeHtml(settlementDate))
                    .replace("{{receiptSection}}", receiptHtml);

            if (hasInlineImage) {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
                helper.setFrom(fromEmail, "Smart Self Storage");
                helper.setTo(toEmail.trim());
                helper.setSubject(subject);
                helper.setText(html, true);
                helper.addInline("refundReceiptImage", new org.springframework.core.io.ByteArrayResource(receiptImageBytes), receiptContentType != null ? receiptContentType : "image/png");
                mailSender.send(message);
                log.info("Đã gửi email xác nhận hoàn cọc kèm ảnh biên lai trực tiếp tới: {}", toEmail);
            } else {
                sendHtmlEmail(toEmail.trim(), subject, html);
            }
            return true;
        } catch (Exception e) {
            log.error("Không thể gửi email xác nhận hoàn cọc tới {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    // --- 8. Gửi email cảnh báo đăng nhập bất thường & khóa tài khoản 15 phút (BR-03) ---
    public boolean sendSecurityAlertEmail(String toEmail, String customerName, String ipAddress, LocalDateTime lockUntil) {
        if (toEmail == null || toEmail.isBlank() || toEmail.endsWith("@smartstorage.vn")) {
            return false;
        }
        try {
            String safeName = (customerName != null && !customerName.isBlank()) ? customerName.trim() : "Quý khách";
            String safeIp = (ipAddress != null && !ipAddress.isBlank()) ? ipAddress.trim() : "Không xác định";
            String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"));
            String unlockStr = lockUntil != null
                    ? lockUntil.format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"))
                    : LocalDateTime.now().plusMinutes(15).format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"));

            String subject = "[Smart Self Storage] Cảnh báo đăng nhập bất thường vào tài khoản";

            String template = loadTemplate("security-alert.html");
            String html = template
                    .replace("{{displayName}}", escapeHtml(safeName))
                    .replace("{{customerName}}", escapeHtml(safeName))
                    .replace("{{time}}", escapeHtml(timeStr))
                    .replace("{{ipAddress}}", escapeHtml(safeIp))
                    .replace("{{unlockTime}}", escapeHtml(unlockStr));

            sendHtmlEmail(toEmail.trim(), subject, html);
            return true;
        } catch (Exception e) {
            log.error("Không thể gửi email cảnh báo bảo mật tới {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
}
