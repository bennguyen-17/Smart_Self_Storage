package com.swp391.backend.service;

import com.swp391.backend.dto.*;
import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.Random;

@Service
public class DepositService {

    private final StorageService storageService;
    private final ReservationRepository reservationRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;
    private final ActivityLogRepository activityLogRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final FacilityRepository facilityRepository;
    private final AccountRepository accountRepository;
    private final EmailService emailService;

    public DepositService(StorageService storageService,
                          ReservationRepository reservationRepository,
                          ContractRepository contractRepository,
                          PaymentRepository paymentRepository,
                          ActivityLogRepository activityLogRepository,
                          StorageUnitRepository storageUnitRepository,
                          FloorRepository floorRepository,
                          FacilityRepository facilityRepository,
                          AccountRepository accountRepository,
                          EmailService emailService) {
        this.storageService = storageService;
        this.reservationRepository = reservationRepository;
        this.contractRepository = contractRepository;
        this.paymentRepository = paymentRepository;
        this.activityLogRepository = activityLogRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.facilityRepository = facilityRepository;
        this.accountRepository = accountRepository;
        this.emailService = emailService;
    }

    // --- 1. Tạo đơn Đặt cọc 100% Online & Thỏa thuận Clickwrap ---
    @Transactional
    public DepositInitiateResponse initiateDeposit(DepositInitiateRequest request) {
        // Kiểm tra Clickwrap bắt buộc
        if (request.getAgreedClickwrap() == null || !request.getAgreedClickwrap()) {
            return DepositInitiateResponse.error("Bạn bắt buộc phải tích chọn đồng ý với Điều khoản Hợp đồng thuê kho (Clickwrap) theo quy định!");
        }

        if (request.getUnitCode() == null || request.getAccountId() == null) {
            return DepositInitiateResponse.error("Thông tin mã ô kho hoặc mã tài khoản không được để trống!");
        }

        Optional<StorageUnit> unitOpt = storageUnitRepository.findById(request.getUnitCode());
        if (unitOpt.isEmpty()) {
            return DepositInitiateResponse.error("Không tìm thấy ô kho yêu cầu!");
        }

        StorageUnit unit = unitOpt.get();
        if (!"AVAILABLE".equalsIgnoreCase(unit.getStatus())) {
            return DepositInitiateResponse.error("Ô kho này hiện không ở trạng thái trống (có thể đã được người khác giữ chỗ hoặc đang bảo trì)!");
        }

        // Tính toán tiền thuê & tiền cọc chuẩn BR: <30 ngày là DAILY, >=30 ngày là MONTHLY
        long days = 30;
        if (request.getStartDate() != null && request.getEndDate() != null) {
            days = Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()));
        }
        String rentalType = (days < 30) ? "DAILY" : "MONTHLY";
        int duration = (int) (days < 30 ? days : Math.max(1, Math.round((double) days / 30.0)));

        CalculatePriceRequest priceReq = new CalculatePriceRequest(
                unit.getUnitTypeId(),
                rentalType,
                duration
        );
        CalculatePriceResponse priceRes = storageService.calculateRentalPrice(priceReq);
        if (!priceRes.isSuccess()) {
            return DepositInitiateResponse.error(priceRes.getMessage());
        }

        // Lấy thông tin cơ sở chuẩn BR-07 (HN01, HN02, HCM01, ...)
        String facilityCode = "HN01";
        Optional<Floor> floorOpt = floorRepository.findById(unit.getFloorId());
        if (floorOpt.isPresent()) {
            Optional<Facility> facOpt = facilityRepository.findById(floorOpt.get().getFacilityId());
            if (facOpt.isPresent() && facOpt.get().getFacilityCode() != null && !facOpt.get().getFacilityCode().isBlank()) {
                facilityCode = facOpt.get().getFacilityCode().replace("-", "").toUpperCase();
            }
        }

        // Lấy 4 số cuối SĐT khách hàng theo chuẩn BR-15
        String phoneSuffix = "8899";
        Optional<Account> accOpt = accountRepository.findAccountByAccountId(request.getAccountId());
        if (accOpt.isPresent() && accOpt.get().getPhone() != null && accOpt.get().getPhone().length() >= 4) {
            String fullPhone = accOpt.get().getPhone().trim();
            phoneSuffix = fullPhone.substring(fullPhone.length() - 4);
        }

        // Khóa tạm ô kho sang HOLD
        unit.setStatus("HOLD");
        storageUnitRepository.save(unit);

        // Tạo bản ghi Đặt chỗ (Reservation)
        Reservation reservation = new Reservation();
        reservation.setAccountId(request.getAccountId());
        reservation.setUnitCode(unit.getUnitCode());
        reservation.setStartDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now());
        reservation.setEndDate(request.getEndDate() != null ? request.getEndDate() : LocalDate.now().plusMonths(1));
        reservation.setRentalType(request.getRentalType() != null ? request.getRentalType() : "MONTHLY");
        reservation.setRentalAmount(priceRes.getFinalRentalAmount());
        reservation.setDepositAmount(priceRes.getDepositAmount());
        reservation.setStatus("PENDING");
        reservation.setHoldExpiresAt(LocalDateTime.now().plusMinutes(15)); // Giữ chỗ 15 phút để thanh toán

        // Sinh Mã Hợp Đồng theo quy tắc thống nhất: CTR-[Mã Cơ Sở]-[DDMMYY]-[4 số ngẫu nhiên]
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("ddMMyy"));
        String contractCode;
        do {
            String randomSuffix = String.format("%04d", new Random().nextInt(10000));
            contractCode = "CTR-" + facilityCode + "-" + dateStr + "-" + randomSuffix;
        } while (reservationRepository.existsByReservationCode(contractCode));
        reservation.setReservationCode(contractCode);
        reservation = reservationRepository.save(reservation);

        // Tạo Hợp đồng dự thảo với trạng thái PENDING_CHECKIN
        Contract contract = new Contract();
        contract.setReservationId(reservation.getReservationId());
        contract.setPdfUrl("/contracts/" + contractCode + ".pdf");
        contract.setStatus("PENDING_CHECKIN");
        contract = contractRepository.save(contract);

        // Tạo Hóa đơn tiền cọc (Payment): DEP-[Mã Hợp Đồng]
        String invoiceNumber = "DEP-" + contractCode;

        Payment payment = new Payment();
        payment.setContractId(contract.getContractId());
        payment.setInvoiceNumber(invoiceNumber);
        BigDecimal depositAmount = priceRes.getDepositAmount();
        BigDecimal initialRentalAmount = priceRes.getFinalRentalAmount();
        BigDecimal totalAmount = depositAmount.add(initialRentalAmount);
        payment.setInvoiceType("DEP");
        payment.setAmount(totalAmount);
        payment.setPaidAmount(BigDecimal.ZERO);
        payment.setRemainingAmount(totalAmount);
        payment.setDueAt(LocalDateTime.now().plusMinutes(15));
        payment.setStatus("PENDING");
        payment.setPaymentMethod("VIETQR");
        payment.setPaymentStatus("PENDING");
        payment = paymentRepository.save(payment);

        // Lưu vết Clickwrap Audit Log
        ActivityLog log = new ActivityLog();
        log.setAccountId(request.getAccountId());
        log.setAction("CLICKWRAP_E_CONTRACT_SIGNED");
        log.setDescription("Khách hàng đã xác nhận Clickwrap thỏa thuận Hợp đồng điện tử cho đơn cọc " + invoiceNumber);
        log.setIpAddress(request.getIpAddress() != null ? request.getIpAddress() : "127.0.0.1");
        activityLogRepository.save(log);

        // Sinh link VietQR chuẩn
        String bankCode = "MB";
        String accountNumber = "0900000001";
        String accountHolder = "SMART SELF STORAGE CORP";
        String transferContent = invoiceNumber;
        String encodedHolder = URLEncoder.encode(accountHolder, StandardCharsets.UTF_8);
        String encodedContent = URLEncoder.encode(transferContent, StandardCharsets.UTF_8);
        String vietQrUrl = String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                bankCode, accountNumber, priceRes.getDepositAmount().toPlainString(), encodedContent, encodedHolder);

        // Trả kết quả DTO
        DepositInitiateResponse response = new DepositInitiateResponse();
        response.setSuccess(true);
        response.setMessage("Tạo đơn đặt cọc thành công! Vui lòng quét mã VietQR để hoàn tất giữ chỗ.");
        response.setReservationId(reservation.getReservationId());
        response.setReservationCode(contractCode);
        response.setContractId(contract.getContractId());
        response.setContractDraftUrl(contract.getPdfUrl());
        response.setPaymentId(payment.getPaymentId());
        response.setInvoiceNumber(invoiceNumber);
        response.setDepositAmount(priceRes.getDepositAmount());
        response.setRentalAmount(priceRes.getFinalRentalAmount());
        response.setVietQrUrl(vietQrUrl);
        response.setBankAccount(accountNumber);
        response.setBankName("Ngân hàng TMCP Quân Đội (MBBank)");
        response.setAccountHolder(accountHolder);
        response.setTransferContent(transferContent);

        return response;
    }

    // --- 2. Webhook / Xác nhận thanh toán Cọc thành công ---
    @Transactional
    public ApiResponse confirmDepositPayment(DepositWebhookRequest request) {
        if (request.getInvoiceNumber() == null || request.getInvoiceNumber().trim().isEmpty()) {
            return new ApiResponse(false, "Mã hóa đơn thanh toán không hợp lệ!");
        }

        Optional<Payment> paymentOpt = paymentRepository.findByInvoiceNumber(request.getInvoiceNumber());
        if (paymentOpt.isEmpty()) {
            return new ApiResponse(false, "Không tìm thấy hóa đơn có mã " + request.getInvoiceNumber());
        }

        Payment payment = paymentOpt.get();
        if ("SUCCESS".equalsIgnoreCase(payment.getPaymentStatus())
                && ("PARTIALLY_PAID".equalsIgnoreCase(payment.getStatus())
                || "PAID".equalsIgnoreCase(payment.getStatus()))) {
            return new ApiResponse(true, "Hóa đơn này đã được xác nhận thanh toán trước đó!");
        }

        Optional<Contract> contractOpt = contractRepository.findById(payment.getContractId());
        if (contractOpt.isEmpty()) {
            return new ApiResponse(false, "Không tìm thấy hợp đồng liên quan đến hóa đơn.");
        }
        Contract contract = contractOpt.get();
        Optional<Reservation> resOpt = reservationRepository.findById(contract.getReservationId());
        if (resOpt.isEmpty()) {
            return new ApiResponse(false, "Không tìm thấy reservation liên quan đến hợp đồng.");
        }
        Reservation res = resOpt.get();

        BigDecimal depositAmount = res.getDepositAmount();
        BigDecimal initialRentalAmount = res.getRentalAmount();
        BigDecimal totalAmount = depositAmount.add(initialRentalAmount);

        Optional<StorageUnit> unitOpt = storageUnitRepository.findById(res.getUnitCode());
        if (unitOpt.isEmpty() || !"HOLD".equalsIgnoreCase(unitOpt.get().getStatus())) {
            return new ApiResponse(false, "Ô kho không ở trạng thái HOLD để xác nhận reservation.");
        }
        StorageUnit unit = unitOpt.get();

        // Cập nhật Payment
        payment.setAmount(totalAmount);
        payment.setPaidAmount(depositAmount);
        payment.setRemainingAmount(initialRentalAmount);
        payment.setStatus("PARTIALLY_PAID");
        payment.setPaymentStatus("SUCCESS");
        payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "VIETQR");
        payment.setTransactionCode(request.getTransactionCode() != null ? request.getTransactionCode() : "TXN_" + System.currentTimeMillis());
        payment.setGatewayTransactionId(request.getGatewayTransactionId());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Cập nhật Contract sang PENDING_CHECKIN (Chờ nhận kho tại cơ sở)
        contract.setStatus("PENDING_CHECKIN"); // Khách đã cọc online, chờ nhận kho
        contract.setActivatedAt(LocalDateTime.now());
        contractRepository.save(contract);

        // Cập nhật Reservation sang CONFIRMED
        res.setStatus("CONFIRMED");
        reservationRepository.save(res);

        // Ô kho chuyển từ HOLD sang RESERVED sau khi cọc online thành công.
        unit.setStatus("RESERVED");
        storageUnitRepository.save(unit);

        return new ApiResponse(true, "Xác nhận nộp cọc thành công! Hợp đồng ở trạng thái PENDING_CHECKIN và ô kho đã được bảo lưu giữ chỗ.");
    }

    // --- 3. Kiểm tra trạng thái thanh toán Cọc ---
    public ApiResponse checkDepositStatus(String invoiceNumber) {
        if (invoiceNumber == null || invoiceNumber.trim().isEmpty()) {
            return new ApiResponse(false, "Mã hóa đơn không được để trống!");
        }
        Optional<Payment> paymentOpt = paymentRepository.findByInvoiceNumber(invoiceNumber.trim());
        if (paymentOpt.isEmpty()) {
            return new ApiResponse(false, "PENDING");
        }
        Payment p = paymentOpt.get();
        boolean isPaid = "PAID".equalsIgnoreCase(p.getStatus())
                || ("PARTIALLY_PAID".equalsIgnoreCase(p.getStatus())
                && "SUCCESS".equalsIgnoreCase(p.getPaymentStatus()));
        return new ApiResponse(true, isPaid ? "PAID" : "PENDING");
    }

    // --- 4. Webhook / Xác nhận thanh toán Gia hạn Hợp đồng (EXT-) ---
    @Transactional
    public ApiResponse confirmExtensionPayment(DepositWebhookRequest request) {
        if (request.getInvoiceNumber() == null || request.getInvoiceNumber().trim().isEmpty()) {
            return new ApiResponse(false, "Mã hóa đơn gia hạn không hợp lệ!");
        }

        String invoiceNumber = request.getInvoiceNumber().trim();
        // Lấy mã hợp đồng từ invoiceNumber (ví dụ: EXT-CTR-HN01-171026-0042-8821 -> CTR-HN01-171026-0042)
        String contractCode = invoiceNumber.startsWith("EXT-") ? invoiceNumber.substring(4) : invoiceNumber;
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(CTR-[A-Z0-9]+-\\d{6}-\\d{4})").matcher(invoiceNumber);
        if (m.find()) {
            contractCode = m.group(1);
        } else if (contractCode.contains("-")) {
            int lastDash = contractCode.lastIndexOf("-");
            String potential = contractCode.substring(0, lastDash);
            if (reservationRepository.existsByReservationCode(potential)) {
                contractCode = potential;
            }
        }

        Optional<Payment> paymentOpt = paymentRepository.findByInvoiceNumber(invoiceNumber);
        Payment payment;
        Contract contract = null;
        Reservation res = null;

        if (paymentOpt.isPresent()) {
            payment = paymentOpt.get();
            contract = contractRepository.findById(payment.getContractId()).orElse(null);
            if (contract != null) {
                res = reservationRepository.findById(contract.getReservationId()).orElse(null);
            }
        } else {
            // Tìm contract theo mã hợp đồng
            Optional<Reservation> resOpt = reservationRepository.findByReservationCode(contractCode);
            if (resOpt.isPresent()) {
                res = resOpt.get();
                contract = contractRepository.findByReservationId(res.getReservationId()).orElse(null);
            }
            if (contract == null && contractCode.startsWith("CTR-")) {
                try {
                    int cId = Integer.parseInt(contractCode.substring(4));
                    contract = contractRepository.findById(cId).orElse(null);
                    if (contract != null) {
                        res = reservationRepository.findById(contract.getReservationId()).orElse(null);
                    }
                } catch (Exception ignored) {}
            }

            // Fallback: Tìm kiếm trong tất cả reservation
            if (contract == null) {
                for (Reservation r : reservationRepository.findAll()) {
                    if (r.getReservationCode() != null && !r.getReservationCode().isBlank()) {
                        if (contractCode.equalsIgnoreCase(r.getReservationCode()) 
                                || invoiceNumber.contains(r.getReservationCode()) 
                                || r.getReservationCode().contains(contractCode)) {
                            res = r;
                            contract = contractRepository.findByReservationId(r.getReservationId()).orElse(null);
                            if (contract != null) break;
                        }
                    }
                }
            }

            if (contract == null || res == null) {
                return new ApiResponse(false, "Không tìm thấy hợp đồng ứng với mã gia hạn: " + invoiceNumber);
            }

            payment = new Payment();
            payment.setContractId(contract.getContractId());
            payment.setInvoiceNumber(invoiceNumber);
            payment.setInvoiceType("MONTHLY_RENEWAL");
            BigDecimal rentAmount = res.getRentalAmount() != null ? res.getRentalAmount() : BigDecimal.valueOf(1440000);
            payment.setAmount(rentAmount);
            payment.setIssuedAt(LocalDateTime.now());
            payment.setDueAt(LocalDateTime.now().plusDays(1));
        }

        if ("PAID".equalsIgnoreCase(payment.getStatus()) && "SUCCESS".equalsIgnoreCase(payment.getPaymentStatus())) {
            return new ApiResponse(true, "Hóa đơn gia hạn này đã được ghi nhận thanh toán trước đó!");
        }

        // Cộng dồn thời hạn thuê (30 ngày)
        int days = 30;
        LocalDate currentEnd = res.getEndDate() != null ? res.getEndDate() : LocalDate.now();
        if (currentEnd.isBefore(LocalDate.now())) {
            currentEnd = LocalDate.now();
        }
        LocalDate newEnd = currentEnd.plusDays(days);
        res.setEndDate(newEnd);
        reservationRepository.save(res);

        // Đảm bảo Contract duy trì trạng thái ACTIVE
        if (!"ACTIVE".equalsIgnoreCase(contract.getStatus())) {
            contract.setStatus("ACTIVE");
            contractRepository.save(contract);
        }

        // Cập nhật Payment sang PAID & SUCCESS
        payment.setStatus("PAID");
        payment.setPaymentStatus("SUCCESS");
        payment.setPaidAmount(payment.getAmount());
        payment.setRemainingAmount(BigDecimal.ZERO);
        payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "VNPAY");
        payment.setTransactionCode(request.getTransactionCode() != null ? request.getTransactionCode() : "TXN_EXT_" + System.currentTimeMillis());
        payment.setGatewayTransactionId(request.getGatewayTransactionId());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Ghi nhật ký kiểm toán (ActivityLog)
        ActivityLog log = new ActivityLog();
        log.setAccountId(res.getAccountId());
        log.setAction("EXTEND_CONTRACT_VNPAY");
        log.setDescription(String.format("Gia hạn thành công hợp đồng %s thêm %d ngày qua VNPay. Hạn mới: %s. Hóa đơn: %s",
                contractCode, days, newEnd, invoiceNumber));
        log.setCreatedAt(LocalDateTime.now());
        log.setIpAddress("127.0.0.1");
        activityLogRepository.save(log);

        return new ApiResponse(true, "Gia hạn hợp đồng thuê kho thành công qua cổng thanh toán VNPay! Hạn sử dụng mới đến ngày " + newEnd);
    }
}
