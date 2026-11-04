package com.swp391.backend.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class ContractPdfService {

    private static final Logger log = LoggerFactory.getLogger(ContractPdfService.class);

    @Value("${app.contract.upload-dir:uploads/contracts}")
    private String contractUploadDir;

    private BaseFont getBaseFont(boolean bold) {
        String[] fontPaths = {
                bold ? "C:/Windows/Fonts/timesbd.ttf" : "C:/Windows/Fonts/times.ttf",
                bold ? "C:/Windows/Fonts/arialbd.ttf" : "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/tahoma.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
        };
        for (String fp : fontPaths) {
            File f = new File(fp);
            if (f.exists()) {
                try {
                    return BaseFont.createFont(fp, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                } catch (Exception ignored) {}
            }
        }
        try {
            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        } catch (Exception e) {
            throw new RuntimeException("Cannot load font for PDF generation", e);
        }
    }

    public byte[] generateAndSaveContractPdf(
            String contractCode,
            String customerName,
            String citizenId,
            String customerPhone,
            String customerEmail,
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
            String gatePin
    ) {
        String safeCode = (contractCode != null && !contractCode.isBlank()) ? contractCode.trim() : "CTR-" + System.currentTimeMillis();
        String safeCustomer = (customerName != null && !customerName.isBlank()) ? customerName.trim() : "Quý khách";
        String safeCitizenId = (citizenId != null && !citizenId.isBlank()) ? citizenId.trim() : "Đã xác thực CCCD";
        String safePhone = (customerPhone != null && !customerPhone.isBlank()) ? customerPhone.trim() : "Chưa cập nhật";
        String safeEmail = (customerEmail != null && !customerEmail.isBlank()) ? customerEmail.trim() : "Chưa cập nhật";
        String safeUnit = (unitCode != null && !unitCode.isBlank()) ? unitCode.trim() : "Chưa chỉ định";
        String safeUnitType = (unitType != null && !unitType.isBlank()) ? unitType.trim() : "Kho lưu trữ thông minh";
        String safeUnitSize = (unitSize != null && !unitSize.isBlank()) ? unitSize.trim() : "Tiêu chuẩn";
        String safeFacility = (facilityName != null && !facilityName.isBlank()) ? facilityName.trim() : "Hệ thống Smart Self Storage";
        String safeAddress = (facilityAddress != null && !facilityAddress.isBlank()) ? facilityAddress.trim() : "Hà Nội, Việt Nam";
        String safeFacilityPhone = (facilityPhone != null && !facilityPhone.isBlank()) ? facilityPhone.trim() : "1900 8899";
        String safeStart = (startDate != null && !startDate.isBlank()) ? startDate.trim() : LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String safeEnd = (endDate != null && !endDate.isBlank()) ? endDate.trim() : "Theo thỏa thuận";
        String safeDeposit = (depositAmount != null && !depositAmount.isBlank()) ? depositAmount.trim() : "0 VNĐ";
        String safeRental = (rentalAmount != null && !rentalAmount.isBlank()) ? rentalAmount.trim() : "0 VNĐ";
        String safeTotal = (totalAmount != null && !totalAmount.isBlank()) ? totalAmount.trim() : "0 VNĐ";
        String safePin = (gatePin != null && !gatePin.isBlank()) ? gatePin.trim() : "------";
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            BaseFont bfRegular = getBaseFont(false);
            BaseFont bfBold = getBaseFont(true);

            Font fontNationalHeader = new Font(bfBold, 11, Font.BOLD, Color.BLACK);
            Font fontTitle = new Font(bfBold, 15, Font.BOLD, new Color(15, 23, 42));
            Font fontSubTitle = new Font(bfBold, 10, Font.BOLD, new Color(37, 99, 235));
            Font fontBadge = new Font(bfBold, 9, Font.BOLD, new Color(5, 150, 105));
            Font fontSectionHeader = new Font(bfBold, 10, Font.BOLD, new Color(30, 58, 138));
            Font fontBody = new Font(bfRegular, 9, Font.NORMAL, new Color(30, 41, 59));
            Font fontBodyBold = new Font(bfBold, 9, Font.BOLD, new Color(15, 23, 42));
            Font fontSmall = new Font(bfRegular, 8, Font.NORMAL, new Color(100, 116, 139));

            // 1. Quốc hiệu tiêu ngữ
            Paragraph nationalHeader = new Paragraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n---o0o---", fontNationalHeader);
            nationalHeader.setAlignment(Element.ALIGN_CENTER);
            document.add(nationalHeader);

            document.add(new Paragraph(" ", fontSmall));

            // 2. Tiêu đề Hợp đồng
            Paragraph title = new Paragraph("HỢP ĐỒNG THUÊ KHO TỰ QUẢN THÔNG MINH", fontTitle);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph codePara = new Paragraph("Mã số hợp đồng: " + safeCode + " | Ký hiệu: HĐ-SSS", fontSubTitle);
            codePara.setAlignment(Element.ALIGN_CENTER);
            document.add(codePara);

            Paragraph statusPara = new Paragraph("TRẠNG THÁI: ĐÃ KÍCH HOẠT (ACTIVE) - CÓ HIỆU LỰC THI HÀNH", fontBadge);
            statusPara.setAlignment(Element.ALIGN_CENTER);
            document.add(statusPara);

            Paragraph datePara = new Paragraph("Ngày xác lập & bàn giao: " + today + " | Địa điểm: " + safeFacility, fontSmall);
            datePara.setAlignment(Element.ALIGN_CENTER);
            document.add(datePara);

            document.add(new Paragraph(" ", fontSmall));

            // 3. Thông tin hai bên (Bảng 2 cột)
            PdfPTable partiesTable = new PdfPTable(2);
            partiesTable.setWidthPercentage(100);
            partiesTable.setSpacingBefore(5f);
            partiesTable.setSpacingAfter(10f);

            // Cột Bên A
            PdfPCell cellA = new PdfPCell();
            cellA.setPadding(8f);
            cellA.setBackgroundColor(new Color(248, 250, 252));
            cellA.setBorderColor(new Color(226, 232, 240));
            cellA.addElement(new Paragraph("BÊN CHO THUÊ (BÊN A)", fontSectionHeader));
            cellA.addElement(new Paragraph("CÔNG TY CỔ PHẦN SMART SELF STORAGE", fontBodyBold));
            cellA.addElement(new Paragraph("Cơ sở: " + safeFacility, fontBody));
            cellA.addElement(new Paragraph("Địa chỉ: " + safeAddress, fontBody));
            cellA.addElement(new Paragraph("Hotline: " + safeFacilityPhone + " | Email: hotro@smartstorage.vn", fontBody));
            cellA.addElement(new Paragraph("Đại diện: Ban Giám Đốc Hệ Thống Smart Storage", fontBody));
            partiesTable.addCell(cellA);

            // Cột Bên B
            PdfPCell cellB = new PdfPCell();
            cellB.setPadding(8f);
            cellB.setBackgroundColor(new Color(248, 250, 252));
            cellB.setBorderColor(new Color(226, 232, 240));
            cellB.addElement(new Paragraph("BÊN THUÊ (BÊN B)", fontSectionHeader));
            cellB.addElement(new Paragraph("Họ và tên: " + safeCustomer, fontBodyBold));
            cellB.addElement(new Paragraph("Số CCCD/Định danh: " + safeCitizenId, fontBody));
            cellB.addElement(new Paragraph("Số điện thoại: " + safePhone, fontBody));
            cellB.addElement(new Paragraph("Email: " + safeEmail, fontBody));
            cellB.addElement(new Paragraph("Định danh: Đã đối soát CCCD & OTP điện tử", fontBody));
            partiesTable.addCell(cellB);

            document.add(partiesTable);

            // 4. Điều 1: Thông tin ô kho
            Paragraph d1Header = new Paragraph("ĐIỀU 1: THÔNG TIN Ô KHO VÀ THỜI HẠN THUÊ", fontSectionHeader);
            document.add(d1Header);

            PdfPTable d1Table = new PdfPTable(new float[]{35f, 65f});
            d1Table.setWidthPercentage(100);
            d1Table.setSpacingBefore(4f);
            d1Table.setSpacingAfter(8f);

            addTableRow(d1Table, "Cơ sở lưu trữ:", safeFacility, fontBody, fontBodyBold);
            addTableRow(d1Table, "Mã ô kho bàn giao:", safeUnit, fontBody, fontBodyBold);
            addTableRow(d1Table, "Quy cách / Kích thước:", safeUnitType + " (" + safeUnitSize + ")", fontBody, fontBody);
            addTableRow(d1Table, "Ngày bắt đầu (Check-in):", safeStart, fontBody, fontBodyBold);
            addTableRow(d1Table, "Hạn kết thúc thuê (Check-out):", safeEnd, fontBody, fontBodyBold);
            addTableRow(d1Table, "Quyền ra vào kho:", "24/7 qua mã PIN IoT (Mã ban đầu: " + safePin + ")", fontBody, fontBodyBold);

            document.add(d1Table);

            // 5. Điều 2: Phí dịch vụ và thanh toán
            Paragraph d2Header = new Paragraph("ĐIỀU 2: PHÍ DỊCH VỤ VÀ THANH TOÁN", fontSectionHeader);
            document.add(d2Header);

            PdfPTable d2Table = new PdfPTable(new float[]{45f, 55f});
            d2Table.setWidthPercentage(100);
            d2Table.setSpacingBefore(4f);
            d2Table.setSpacingAfter(8f);

            addTableRow(d2Table, "Tiền cọc đảm bảo hợp đồng (Deposit):", safeDeposit + " (Đã thanh toán)", fontBody, fontBodyBold);
            addTableRow(d2Table, "Tiền thuê kho theo kỳ hạn:", safeRental + " (Đã thanh toán)", fontBody, fontBodyBold);
            addTableRow(d2Table, "Tổng giá trị thanh toán:", safeTotal, fontBodyBold, fontBodyBold);
            addTableRow(d2Table, "Chính sách hoàn cọc (BR-35):", "Hoàn trả 100% tiền cọc sau khi check-out và nghiệm thu kho đạt chuẩn.", fontSmall, fontSmall);

            document.add(d2Table);

            // 6. Điều 3 & Điều 4: Quy định an toàn và Quá hạn
            Paragraph d3Header = new Paragraph("ĐIỀU 3: QUY ĐỊNH AN TOÀN VÀ HÀNG HÓA LƯU TRỮ (BR-20, BR-22)", fontSectionHeader);
            document.add(d3Header);
            Paragraph d3Content = new Paragraph(
                    "Bên B có toàn quyền sử dụng ô kho tự quản 24/7 và có trách nhiệm bảo mật mã PIN mở cổng. Tuyệt đối không lưu trữ: Hóa chất độc hại, chất cháy nổ, xăng dầu, bình gas, vũ khí, ma túy, động vật sống hoặc hàng quốc cấm. Bên B chịu hoàn toàn trách nhiệm trước pháp luật nếu vi phạm.",
                    fontBody
            );
            d3Content.setSpacingBefore(2f);
            d3Content.setSpacingAfter(6f);
            document.add(d3Content);

            Paragraph d4Header = new Paragraph("ĐIỀU 4: GIA HẠN VÀ XỬ LÝ QUÁ HẠN HỢP ĐỒNG (BR-27, BR-30, BR-32)", fontSectionHeader);
            document.add(d4Header);
            Paragraph d4Content = new Paragraph(
                    "1. Bên B có quyền chủ động gia hạn hợp đồng trực tuyến trên hệ thống Website trước khi hết hạn.\n" +
                    "2. Nếu hợp đồng hết hạn mà chưa gia hạn hoặc chưa trả kho, hệ thống áp dụng phí phạt quá hạn 50.000 VNĐ/ngày.\n" +
                    "3. Nếu quá hạn liên tục đến Ngày thứ 30 (Day 30), hợp đồng sẽ chuyển trạng thái FORFEITED: Tiền cọc bị tịch thu và Smart Storage có quyền mở kho thanh lý tài sản để thu hồi chi phí theo quy chế BR-32.",
                    fontBody
            );
            d4Content.setSpacingBefore(2f);
            d4Content.setSpacingAfter(12f);
            document.add(d4Content);

            // 7. Chữ ký hai bên
            PdfPTable signTable = new PdfPTable(2);
            signTable.setWidthPercentage(100);
            signTable.setSpacingBefore(8f);

            PdfPCell signA = new PdfPCell();
            signA.setBorder(Rectangle.NO_BORDER);
            signA.setHorizontalAlignment(Element.ALIGN_CENTER);
            Paragraph pA = new Paragraph("ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)\n(Ký số điện tử)\n\n\n\nGIÁM ĐỐC SMART SELF STORAGE\n[ĐÃ XÁC THỰC SỐ]", fontBodyBold);
            pA.setAlignment(Element.ALIGN_CENTER);
            signA.addElement(pA);
            signTable.addCell(signA);

            PdfPCell signB = new PdfPCell();
            signB.setBorder(Rectangle.NO_BORDER);
            signB.setHorizontalAlignment(Element.ALIGN_CENTER);
            Paragraph pB = new Paragraph("ĐẠI DIỆN BÊN THUÊ (BÊN B)\n(Ký xác thực điện tử)\n\n\n\n" + safeCustomer.toUpperCase() + "\n[ĐÃ XÁC THỰC CCCD & OTP]", fontBodyBold);
            pB.setAlignment(Element.ALIGN_CENTER);
            signB.addElement(pB);
            signTable.addCell(signB);

            document.add(signTable);

            document.close();

            byte[] pdfBytes = baos.toByteArray();

            // Lưu file PDF vào đĩa để ContractController có thể tải về khi khách bấm "Xem hợp đồng PDF"
            savePdfToDisk(safeCode, pdfBytes);

            log.info("Đã sinh và lưu file PDF hợp đồng {} thành công (kích thước: {} bytes)", safeCode, pdfBytes.length);
            return pdfBytes;

        } catch (Exception e) {
            log.error("Lỗi khi sinh file PDF hợp đồng {}: {}", safeCode, e.getMessage(), e);
            return new byte[0];
        }
    }

    private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setPadding(5f);
        c1.setBackgroundColor(new Color(248, 250, 252));
        c1.setBorderColor(new Color(226, 232, 240));

        PdfPCell c2 = new PdfPCell(new Phrase(value, valueFont));
        c2.setPadding(5f);
        c2.setBackgroundColor(Color.WHITE);
        c2.setBorderColor(new Color(226, 232, 240));

        table.addCell(c1);
        table.addCell(c2);
    }

    private void savePdfToDisk(String contractCode, byte[] pdfBytes) {
        try {
            String fileName = contractCode.endsWith(".pdf") ? contractCode : (contractCode + ".pdf");
            Path targetDir = Paths.get(contractUploadDir).toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }
            Path filePath = targetDir.resolve(fileName);
            Files.write(filePath, pdfBytes);

            // Cũng lưu bản phụ vào uploads/contracts nếu uploadDir trỏ nơi khác
            Path fallbackDir = Paths.get("uploads", "contracts").toAbsolutePath().normalize();
            if (!fallbackDir.equals(targetDir)) {
                if (!Files.exists(fallbackDir)) {
                    Files.createDirectories(fallbackDir);
                }
                Files.write(fallbackDir.resolve(fileName), pdfBytes);
            }
            log.info("Đã lưu file PDF hợp đồng vào: {}", filePath);
        } catch (IOException e) {
            log.warn("Không thể lưu file PDF vào đĩa: {}", e.getMessage());
        }
    }
}
