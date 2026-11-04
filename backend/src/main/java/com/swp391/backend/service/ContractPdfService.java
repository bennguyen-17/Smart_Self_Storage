package com.swp391.backend.service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.CustomerProfile;
import com.swp391.backend.entity.Facility;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.entity.UnitType;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.CustomerProfileRepository;
import com.swp391.backend.repository.FacilityRepository;
import com.swp391.backend.repository.FloorRepository;
import com.swp391.backend.repository.GatePinRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import com.swp391.backend.repository.UnitTypeRepository;

@Service
public class ContractPdfService {

    private static final Logger log = LoggerFactory.getLogger(ContractPdfService.class);

    private final ReservationRepository reservationRepository;
    private final AccountRepository accountRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final FloorRepository floorRepository;
    private final FacilityRepository facilityRepository;
    private final GatePinRepository gatePinRepository;
    private final PaymentRepository paymentRepository;

    public ContractPdfService(ReservationRepository reservationRepository,
            AccountRepository accountRepository,
            CustomerProfileRepository customerProfileRepository,
            StorageUnitRepository storageUnitRepository,
            UnitTypeRepository unitTypeRepository,
            FloorRepository floorRepository,
            FacilityRepository facilityRepository,
            GatePinRepository gatePinRepository,
            PaymentRepository paymentRepository) {
        this.reservationRepository = reservationRepository;
        this.accountRepository = accountRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.floorRepository = floorRepository;
        this.facilityRepository = facilityRepository;
        this.gatePinRepository = gatePinRepository;
        this.paymentRepository = paymentRepository;
    }

    private BaseFont getBaseFont(boolean bold, boolean italic) {
        String fontFile = "arial.ttf";
        if (bold && italic) {
            fontFile = "arialbi.ttf";
        } else if (bold) {
            fontFile = "arialbd.ttf";
        } else if (italic) {
            fontFile = "ariali.ttf";
        }

        File f = new File("C:/Windows/Fonts/" + fontFile);
        if (f.exists()) {
            try {
                return BaseFont.createFont(f.getAbsolutePath(), BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            } catch (Exception ignored) {
            }
        }

        String timesFile = bold ? "timesbd.ttf" : (italic ? "timesi.ttf" : "times.ttf");
        File tf = new File("C:/Windows/Fonts/" + timesFile);
        if (tf.exists()) {
            try {
                return BaseFont.createFont(tf.getAbsolutePath(), BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            } catch (Exception ignored) {
            }
        }

        String[] linuxPaths = {
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
        };
        for (String path : linuxPaths) {
            if (new File(path).exists()) {
                try {
                    return BaseFont.createFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                } catch (Exception ignored) {
                }
            }
        }

        try {
            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
        } catch (Exception e) {
            throw new RuntimeException("Không thể khởi tạo font chữ cho file PDF hợp đồng", e);
        }
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) {
            return "0 đ";
        }
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(new Locale("vi", "VN"));
        symbols.setGroupingSeparator('.');
        DecimalFormat df = new DecimalFormat("#,###", symbols);
        return df.format(amount) + " đ";
    }

    private String formatDate(LocalDate date) {
        if (date == null) {
            return "—";
        }
        return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    public byte[] generateAndSaveContractPdf(Contract contract) {
        return generateAndSaveContractPdf(contract, null, null, null);
    }

    public byte[] generateAndSaveContractPdf(Contract contract, Reservation reservation, StorageUnit unit, String rawPin) {
        if (contract == null) {
            throw new IllegalArgumentException("Hợp đồng không được để trống");
        }

        if (reservation == null && contract.getReservationId() != null) {
            reservation = reservationRepository.findById(contract.getReservationId()).orElse(null);
        }

        String finalContractCode = (reservation != null && reservation.getReservationCode() != null && !reservation.getReservationCode().isBlank())
                ? reservation.getReservationCode()
                : ("CTR-" + contract.getContractId());

        // Lấy thông tin khách hàng
        String custName = contract.getSignedFullName();
        String custPhone = contract.getSignedPhone();
        String custEmail = contract.getSignedEmail();
        String custCccd = contract.getSignedIdentityNumber();

        if (reservation != null) {
            Account acc = accountRepository.findAccountByAccountId(reservation.getAccountId()).orElse(null);
            if (acc != null) {
                if (custName == null || custName.isBlank()) {
                    custName = acc.getFullName();
                }
                if (custPhone == null || custPhone.isBlank()) {
                    custPhone = acc.getPhone();
                }
                if (custEmail == null || custEmail.isBlank()) {
                    custEmail = acc.getEmail();
                }
            }
            if (custCccd == null || custCccd.isBlank()) {
                custCccd = customerProfileRepository.findByAccountId(reservation.getAccountId())
                        .map(CustomerProfile::getIdentityNumber)
                        .orElse("—");
            }
        }

        custName = (custName != null && !custName.isBlank()) ? custName : "Khách hàng";
        custPhone = (custPhone != null && !custPhone.isBlank()) ? custPhone : "—";
        custEmail = (custEmail != null && !custEmail.isBlank()) ? custEmail : "—";
        custCccd = (custCccd != null && !custCccd.isBlank()) ? custCccd : "—";

        // Lấy thông tin ô kho & cơ sở
        String unitCode = (reservation != null && reservation.getUnitCode() != null) ? reservation.getUnitCode() : "—";
        if (unit == null && !"—".equals(unitCode)) {
            unit = storageUnitRepository.findById(unitCode).orElse(null);
        }

        String unitTypeName = "Size M - Kho thường";
        String unitDimensions = "1.5m x 2.0m x 2.0m";

        if (unit != null && unit.getUnitTypeId() != null) {
            UnitType ut = unitTypeRepository.findById(unit.getUnitTypeId()).orElse(null);
            if (ut != null) {
                String sizeLabel = ut.getTypeName() != null ? ut.getTypeName().replaceAll("\\s*\\(.*\\)", "").trim() : "Size M";
                boolean isClimate = ut.getStorageCondition() != null && ut.getStorageCondition().equalsIgnoreCase("CLIMATE_CONTROLLED");
                unitTypeName = sizeLabel + " - " + (isClimate ? "Kho mát" : "Kho thường");
                if (ut.getSize() != null && !ut.getSize().isBlank()) {
                    unitDimensions = ut.getSize();
                }
            }
        }

        String facilityBranch = "SmartStorage Chi nhánh";
        String facilityAddress = "Hệ thống kho lưu trữ tự quản";
        String facilityCity = "Cần Thơ";

        if (unit != null && unit.getFloorId() != null) {
            Floor fl = floorRepository.findById(unit.getFloorId()).orElse(null);
            if (fl != null && fl.getFacilityId() != null) {
                Facility fac = facilityRepository.findById(fl.getFacilityId()).orElse(null);
                if (fac != null) {
                    facilityBranch = fac.getFacilityName();
                    facilityAddress = fac.getAddress();
                    if (facilityAddress.contains("Hà Nội")) {
                        facilityCity = "Hà Nội";
                    } else if (facilityAddress.contains("Đà Nẵng")) {
                        facilityCity = "Đà Nẵng";
                    } else if (facilityAddress.contains("Cần Thơ")) {
                        facilityCity = "Cần Thơ";
                    } else if (facilityAddress.contains("Hồ Chí Minh") || facilityAddress.contains("TP.HCM")) {
                        facilityCity = "TP. Hồ Chí Minh";
                    }
                }
            }
        }

        // Chi phí & thời hạn
        LocalDate startDate = (reservation != null && reservation.getStartDate() != null) ? reservation.getStartDate() : LocalDate.now();
        LocalDate endDate = (reservation != null && reservation.getEndDate() != null) ? reservation.getEndDate() : startDate.plusDays(30);
        long rentalDays = ChronoUnit.DAYS.between(startDate, endDate);
        if (rentalDays <= 0) {
            rentalDays = 30;
        }

        BigDecimal rentalAmount = (reservation != null && reservation.getRentalAmount() != null) ? reservation.getRentalAmount() : BigDecimal.valueOf(1200000);
        BigDecimal depositAmount = (reservation != null && reservation.getDepositAmount() != null) ? reservation.getDepositAmount() : BigDecimal.valueOf(1000000);
        BigDecimal totalAmount = rentalAmount.add(depositAmount);

        // Ngày lập hợp đồng
        int signDay = startDate.getDayOfMonth();
        int signMonth = startDate.getMonthValue();
        int signYear = startDate.getYear();
        String signDateStr = String.format("%02d", signDay) + " tháng " + String.format("%02d", signMonth) + " năm " + signYear;

        String depositPaidTime = startDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + " 14:40:00";
        String txnCode = "TCB_" + (contract.getContractId() != null ? contract.getContractId() : "1018");

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 38, 38, 26, 28);
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            final String fContractCode = finalContractCode;
            BaseFont regularBf = getBaseFont(false, false);
            BaseFont boldBf = getBaseFont(true, false);

            // Footer chỉ hiển thị mã hợp đồng bên trái, số trang bên phải
            writer.setPageEvent(new PdfPageEventHelper() {
                @Override
                public void onEndPage(PdfWriter w, Document d) {
                    PdfContentByte cb = w.getDirectContent();
                    Font footerFont = new Font(regularBf, 8.5f, Font.NORMAL, new Color(100, 100, 100));

                    Phrase leftFooter = new Phrase("Mã hợp đồng: " + fContractCode, footerFont);
                    ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, leftFooter, 38, 16, 0);

                    Phrase rightFooter = new Phrase("Trang " + w.getPageNumber() + "/2", footerFont);
                    ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, rightFooter, PageSize.A4.getWidth() - 38, 16, 0);
                }
            });

            document.open();

            // Font chữ điều chỉnh độ đậm vừa phải
            Color primaryDark = new Color(30, 41, 59);      // Slate 800
            Color textBody = new Color(51, 65, 85);          // Slate 700

            Font nationalHeaderFont = new Font(boldBf, 10.5f, Font.BOLD, primaryDark);
            Font nationalMottoFont = new Font(regularBf, 9.5f, Font.NORMAL, textBody);
            Font dateHeaderFont = new Font(regularBf, 9f, Font.NORMAL, textBody);

            Font contractTitleFont = new Font(boldBf, 13.5f, Font.BOLD, primaryDark);
            Font contractCodeFont = new Font(regularBf, 9.5f, Font.NORMAL, textBody);

            Font sectionHeaderFont = new Font(boldBf, 9.5f, Font.BOLD, primaryDark);
            Font tableHeaderFont = new Font(boldBf, 8.8f, Font.BOLD, primaryDark);
            Font bodyFont = new Font(regularBf, 8.8f, Font.NORMAL, textBody);
            Font bodyBoldFont = new Font(boldBf, 8.8f, Font.BOLD, primaryDark);

            // ==========================================
            // TRANG 1 & TRANG 2 TỰ NHIÊN
            // ==========================================
            // Quốc hiệu & tiêu ngữ
            Paragraph nationalHeader = new Paragraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", nationalHeaderFont);
            nationalHeader.setAlignment(Element.ALIGN_CENTER);
            document.add(nationalHeader);

            Paragraph nationalMotto = new Paragraph("Độc lập – Tự do – Hạnh phúc", nationalMottoFont);
            nationalMotto.setAlignment(Element.ALIGN_CENTER);
            nationalMotto.setSpacingAfter(3f);
            document.add(nationalMotto);

            Paragraph cityDate = new Paragraph(facilityCity + ", ngày " + signDateStr, dateHeaderFont);
            cityDate.setAlignment(Element.ALIGN_CENTER);
            cityDate.setSpacingAfter(7f);
            document.add(cityDate);

            // Tiêu đề hợp đồng
            Paragraph mainTitle = new Paragraph("HỢP ĐỒNG THUÊ KHO LƯU TRỮ TỰ QUẢN", contractTitleFont);
            mainTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(mainTitle);

            Paragraph codeSub = new Paragraph("Số: " + finalContractCode, contractCodeFont);
            codeSub.setAlignment(Element.ALIGN_CENTER);
            codeSub.setSpacingAfter(8f);
            document.add(codeSub);

            // BÊN CHO THUÊ (BÊN A)
            Paragraph pA = new Paragraph("BÊN CHO THUÊ (BÊN A):", sectionHeaderFont);
            pA.setSpacingAfter(2f);
            document.add(pA);

            Paragraph pAContent = new Paragraph();
            pAContent.setFont(bodyFont);
            pAContent.setLeading(12.5f);
            pAContent.add("• Tên đơn vị: HỆ THỐNG SMART SELF STORAGE VIỆT NAM\n");
            pAContent.add("• Cơ sở phụ trách: " + facilityBranch + "\n");
            pAContent.add("• Địa chỉ cơ sở: " + facilityAddress + "\n");
            pAContent.add("• Email: support@smartstorage.vn\n");
            pAContent.setSpacingAfter(4f);
            document.add(pAContent);

            // BÊN THUÊ (BÊN B)
            Paragraph pB = new Paragraph("BÊN THUÊ (BÊN B):", sectionHeaderFont);
            pB.setSpacingAfter(2f);
            document.add(pB);

            Paragraph pBContent = new Paragraph();
            pBContent.setFont(bodyFont);
            pBContent.setLeading(12.5f);
            pBContent.add("• Họ và tên: " + custName + "\n");
            pBContent.add("• Số căn cước công dân: " + custCccd + "\n");
            pBContent.add("• Số điện thoại: " + custPhone + "\n");
            pBContent.add("• Email: " + custEmail + "\n");
            pBContent.add("• Mã hợp đồng: " + finalContractCode + "\n");
            pBContent.setSpacingAfter(4f);
            document.add(pBContent);

            Paragraph intro = new Paragraph("Hai bên cùng thỏa thuận và thống nhất ký kết các điều khoản dưới đây:", bodyFont);
            intro.setSpacingAfter(4f);
            document.add(intro);

            // ĐIỀU 1
            Paragraph d1Title = new Paragraph("ĐIỀU 1: ĐỐI TƯỢNG THỎA THUẬN VÀ THÔNG TIN Ô KHO", sectionHeaderFont);
            d1Title.setSpacingAfter(2f);
            document.add(d1Title);

            Paragraph d1Intro = new Paragraph("1.1. Bên A đồng ý cung cấp cho Bên B quyền sử dụng ô kho lưu trữ tự quản với các thông số cụ thể như sau:", bodyFont);
            d1Intro.setLeading(12.5f);
            d1Intro.setSpacingAfter(4f);
            document.add(d1Intro);

            // Bảng Điều 1: 4 hàng (Đã bỏ trang thiết bị đi kèm, sửa Loại kho)
            PdfPTable tableD1 = new PdfPTable(2);
            tableD1.setWidthPercentage(100);
            tableD1.setWidths(new float[]{28f, 72f});
            tableD1.setSpacingAfter(6f);

            addD1Row(tableD1, "Mã ô kho", unitCode, bodyBoldFont, bodyFont);
            addD1Row(tableD1, "Loại kho", unitTypeName, bodyBoldFont, bodyFont);
            addD1Row(tableD1, "Diện tích", unitDimensions, bodyBoldFont, bodyFont);
            addD1Row(tableD1, "Cơ sở chi nhánh", facilityBranch, bodyBoldFont, bodyFont);
            document.add(tableD1);

            // ĐIỀU 2
            Paragraph d2Title = new Paragraph("ĐIỀU 2: THỜI HẠN THUÊ VÀ QUYỀN TRUY CẬP KHO", sectionHeaderFont);
            d2Title.setSpacingAfter(2f);
            document.add(d2Title);

            Paragraph d2Content = new Paragraph();
            d2Content.setFont(bodyFont);
            d2Content.setLeading(12.5f);
            d2Content.add("2.1. Thời hạn thuê kho: " + rentalDays + " ngày, bắt đầu từ ngày " + formatDate(startDate) + " đến hết ngày " + formatDate(endDate) + ".\n");
            d2Content.add("2.2. Giữ chỗ: Ô kho được giữ cho Bên B cho đến hết ngày nhận kho đã được hẹn. Quá thời hạn này mà Bên B chưa nhận kho, việc thuê kho sẽ bị hủy và bên B sẽ mất toàn bộ tiền cọc.\n");
            d2Content.add("2.3. Quyền ra vào: Bên B được toàn quyền ra vào cơ sở và sử dụng ô kho 24/7 trong suốt thời hạn thuê kể từ khi hoàn tất thủ tục nhận kho.\n");
            d2Content.add("2.4. Mã mở cửa kiểm soát an ninh: Hệ thống tự động tạo mã pin cửa chính trên website, bên B có thể truy cập để xem  mã mở cửa.\n");
            d2Content.add("2.5. Gia hạn thuê kho: Bên B có quyền gia hạn thời hạn thuê trực tuyến trên hệ thống trước thời điểm hợp đồng hết hạn. Giá thuê khi gia hạn áp dụng theo đơn giá thuê hiện hành của ô kho kèm chính sách ưu đãi theo kỳ hạn nếu có. Mỗi lần gia hạn thành công được hệ thống ghi nhận bằng hóa đơn gia hạn điện tử và thời hạn mới được cập nhật tự động trong tài khoản của Bên B. Toàn bộ các quyền, nghĩa vụ và điều khoản khác của Hợp đồng này vẫn giữ nguyên hiệu lực.\n");
            d2Content.setSpacingAfter(6f);
            document.add(d2Content);

            // ĐIỀU 3
            Paragraph d3Title = new Paragraph("ĐIỀU 3: GIÁ THUÊ, TIỀN CỌC VÀ PHƯƠNG THỨC THANH TOÁN", sectionHeaderFont);
            d3Title.setSpacingAfter(2f);
            document.add(d3Title);

            Paragraph d3Intro = new Paragraph("3.1. Các khoản chi phí được thống nhất như sau:", bodyFont);
            d3Intro.setSpacingAfter(3f);
            document.add(d3Intro);

            // Bảng Điều 3: 3 cột (Bỏ cột Ghi chú & hoàn trả, bỏ chữ trực tuyến)
            PdfPTable tableD3 = new PdfPTable(3);
            tableD3.setWidthPercentage(100);
            tableD3.setWidths(new float[]{45f, 25f, 30f});
            tableD3.setSpacingAfter(5f);

            addTableHeaderCell(tableD3, "Khoản mục chi phí", tableHeaderFont);
            addTableHeaderCell(tableD3, "Số tiền", tableHeaderFont);
            addTableHeaderCell(tableD3, "Thời điểm thanh toán", tableHeaderFont);

            addTableBodyCell(tableD3, "1. Tiền thuê ô kho", bodyFont, Element.ALIGN_LEFT);
            addTableBodyCell(tableD3, formatVnd(rentalAmount), bodyFont, Element.ALIGN_RIGHT);
            addTableBodyCell(tableD3, "Khi nhận kho tại quầy", bodyFont, Element.ALIGN_LEFT);

            addTableBodyCell(tableD3, "2. Tiền cọc", bodyFont, Element.ALIGN_LEFT);
            addTableBodyCell(tableD3, formatVnd(depositAmount), bodyFont, Element.ALIGN_RIGHT);
            addTableBodyCell(tableD3, "Khi đặt giữ chỗ", bodyFont, Element.ALIGN_LEFT);

            // Hàng Tổng giá trị
            PdfPCell totalCellLabel = new PdfPCell(new Phrase("TỔNG GIÁ TRỊ", bodyBoldFont));
            totalCellLabel.setPadding(4.5f);
            totalCellLabel.setBorderColor(new Color(180, 190, 205));
            tableD3.addCell(totalCellLabel);

            PdfPCell totalCellValue = new PdfPCell(new Phrase(formatVnd(totalAmount), bodyBoldFont));
            totalCellValue.setPadding(4.5f);
            totalCellValue.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalCellValue.setBorderColor(new Color(180, 190, 205));
            tableD3.addCell(totalCellValue);

            PdfPCell totalCellDesc = new PdfPCell(new Phrase("Đã hoàn tất thanh toán", bodyFont));
            totalCellDesc.setPadding(4.5f);
            totalCellDesc.setBorderColor(new Color(180, 190, 205));
            tableD3.addCell(totalCellDesc);

            document.add(tableD3);

            // Các khoản 3.2, 3.3, 3.4, 3.5 (Loại bỏ toàn bộ chữ BR-...)
            Paragraph d3Sub = new Paragraph();
            d3Sub.setFont(bodyFont);
            d3Sub.setLeading(12.5f);
            d3Sub.add("3.2. Hoàn trả tiền cọc: Bên A hoàn lại 100% tiền cọc cho Bên B trong vòng 03 ngày làm việc kể từ ngày thanh lý hợp đồng và nghiệm thu ô kho không hư hại, sau khi khấu trừ (nếu có) phí quá hạn theo Điều 4 hoặc chi phí khắc phục thiệt hại có biên bản xác nhận.\n");
            d3Sub.add("3.3. Hủy giữ chỗ trước khi nhận kho: Khách hàng hủy trước ngày bắt đầu từ 04 ngày trở lên được hoàn 100% tiền cọc; hủy sát ngày (dưới 04 ngày) hoặc quá hạn nhận kho bị trừ 50% tiền cọc theo quy định hủy giữ chỗ của hệ thống.\n");
            d3Sub.add("3.4. Thanh toán tiền cọc: Bên B đã thanh toán tiền cọc lúc " + depositPaidTime + ", mã giao dịch: " + txnCode + ".\n");
            d3Sub.add("3.5. Tình trạng thanh toán, thời hạn thuê sau các lần gia hạn và việc bàn giao kho được hệ thống ghi nhận riêng theo thời gian thực và Bên B có thể tra cứu trong tài khoản cá nhân; các ghi nhận này không làm thay đổi nội dung văn bản này.\n");
            d3Sub.setSpacingAfter(6f);
            document.add(d3Sub);

            // ĐIỀU 4
            document.newPage();
            Paragraph d4Title = new Paragraph("ĐIỀU 4: QUY ĐỊNH PHẠT QUÁ HẠN VÀ XỬ LÝ TÀI SẢN TỒN ĐỌNG", sectionHeaderFont);
            d4Title.setSpacingAfter(2f);
            document.add(d4Title);

            Paragraph d4Content = new Paragraph();
            d4Content.setFont(bodyFont);
            d4Content.setLeading(12.5f);
            d4Content.add("4.1. Khi hết hạn thuê mà Bên B không gia hạn hoặc không làm thủ tục bàn giao trả kho, hệ thống sẽ tự động chuyển hợp đồng sang trạng thái Quá hạn.\n");
            d4Content.add("4.2. Phí phạt quá hạn: Áp dụng mức phí cố định 50.000 VNĐ / ngày trễ hạn. Bên B có trách nhiệm thanh toán đầy đủ phí phát sinh tại quầy trước khi nhận lại hàng hóa hoặc làm thủ tục trả kho.\n");
            d4Content.add("4.3. Cảnh báo quá hạn: Hệ thống tự động gửi thông báo nhắc nhở và cảnh báo thanh lý tài sản đến Email của Bên B vào các mốc ngày thứ 15, 25 và 30 kể từ ngày bắt đầu quá hạn.\n");
            d4Content.add("4.4. Tịch thu tiền cọc và thanh lý tài sản: Khi quá hạn vượt quá 30 ngày mà Bên B vẫn không thanh toán và không liên hệ nhận lại hàng hóa, Bên A có toàn quyền mở khóa ô kho, lập biên bản kiểm kê và tiến hành thanh lý toàn bộ tài sản tồn đọng bên trong để thu hồi mặt bằng. Bên B bị tịch thu 100% tiền cọc, không được hoàn cọc, không được cấn trừ chi phí và mất toàn bộ quyền sở hữu cũng như quyền khiếu nại đối với toàn bộ số tài sản đã thanh lý.\n");
            d4Content.setSpacingAfter(6f);
            document.add(d4Content);

            // ĐIỀU 5
            Paragraph d5Title = new Paragraph("ĐIỀU 5: CAM KẾT AN TOÀN PHÒNG CHÁY CHỮA CHÁY VÀ HÀNG HÓA", sectionHeaderFont);
            d5Title.setSpacingAfter(2f);
            document.add(d5Title);

            Paragraph d5Content = new Paragraph();
            d5Content.setFont(bodyFont);
            d5Content.setLeading(12.5f);
            d5Content.add("5.1. Bên B cam kết tuyệt đối không lưu trữ: Hóa chất độc hại, chất dễ cháy nổ, bình gas, xăng dầu, pháo hoa; Vũ khí, hàng cấm theo quy định của pháp luật; Động vật sống hoặc thực phẩm tươi sống dễ ôi thiu gây ô nhiễm.\n");
            d5Content.add("5.2. Bên B chịu hoàn toàn trách nhiệm trước pháp luật và bồi thường thiệt hại thực tế phát sinh nếu vi phạm các cam kết nêu trên.\n");
            d5Content.add("5.3. Bên A có trách nhiệm duy trì hệ thống an ninh, phòng cháy chữa cháy và vận hành cơ sở theo đúng tiêu chuẩn tại Điều 1; không tự ý mở ô kho của Bên B khi chưa có sự đồng ý của Bên B, trừ trường hợp khẩn cấp (sự cố cháy nổ, rò rỉ hiểm họa) hoặc theo yêu cầu bằng văn bản của cơ quan Nhà nước có thẩm quyền.\n");
            d5Content.setSpacingAfter(6f);
            document.add(d5Content);

            // ĐIỀU 6 (Đầy đủ 6.1 và 6.2, đã bỏ khung ký tên)
            Paragraph d6Title = new Paragraph("ĐIỀU 6: ĐIỀU KHOẢN CHUNG VÀ HIỆU LỰC", sectionHeaderFont);
            d6Title.setSpacingAfter(2f);
            document.add(d6Title);

            Paragraph d6Content = new Paragraph();
            d6Content.setFont(bodyFont);
            d6Content.setLeading(12.5f);
            d6Content.add("6.1. Hợp đồng này được xác lập bằng phương tiện điện tử theo quy định của Luật Giao dịch điện tử, có đầy đủ giá trị pháp lý tương đương văn bản ký kết truyền thống. Dữ liệu xác nhận điện tử của mỗi bên được lưu trên hệ thống và là căn cứ đối chiếu khi cần thiết.\n");
            d6Content.add("6.2. Mọi tranh chấp phát sinh (nếu có) trước hết được giải quyết thông qua thương lượng, hòa giải; trường hợp không thương lượng được sẽ đưa ra Tòa án có thẩm quyền để giải quyết.\n");
            document.add(d6Content);

            document.close();

            byte[] pdfBytes = baos.toByteArray();
            savePdfToDisk(finalContractCode + ".pdf", pdfBytes);

            return pdfBytes;
        } catch (Exception e) {
            log.error("Lỗi khi sinh file PDF hợp đồng: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể tạo file PDF hợp đồng: " + e.getMessage(), e);
        }
    }

    private void addD1Row(PdfPTable table, String label, String value, Font labelFont, Font valFont) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setPadding(4.5f);
        c1.setBorderColor(new Color(180, 190, 205));
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(value, valFont));
        c2.setPadding(4.5f);
        c2.setBorderColor(new Color(180, 190, 205));
        table.addCell(c2);
    }

    private void addTableHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(4.5f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBorderColor(new Color(180, 190, 205));
        table.addCell(cell);
    }

    private void addTableBodyCell(PdfPTable table, String text, Font font, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(4.5f);
        cell.setHorizontalAlignment(align);
        cell.setBorderColor(new Color(180, 190, 205));
        table.addCell(cell);
    }

    private void savePdfToDisk(String filename, byte[] bytes) {
        try {
            Path targetDir = Paths.get("uploads", "contracts");
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }
            Path filePath = targetDir.resolve(filename);
            Files.write(filePath, bytes);
            log.info("Đã lưu tự động file PDF hợp đồng vào: {}", filePath.toAbsolutePath());
        } catch (IOException e) {
            log.warn("Không thể lưu file PDF vào đĩa: {}", e.getMessage());
        }
    }
}
