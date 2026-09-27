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

    public DepositService(StorageService storageService,
                          ReservationRepository reservationRepository,
                          ContractRepository contractRepository,
                          PaymentRepository paymentRepository,
                          ActivityLogRepository activityLogRepository,
                          StorageUnitRepository storageUnitRepository,
                          FloorRepository floorRepository,
                          FacilityRepository facilityRepository,
                          AccountRepository accountRepository) {
        this.storageService = storageService;
        this.reservationRepository = reservationRepository;
        this.contractRepository = contractRepository;
        this.paymentRepository = paymentRepository;
        this.activityLogRepository = activityLogRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.facilityRepository = facilityRepository;
        this.accountRepository = accountRepository;
    }

    // --- 1. Tạo đơn Đặt cọc 100% Online & Thỏa thuận Clickwrap (BR-15, BR-16, BR-18, BR-37) ---
    @Transactional
    public DepositInitiateResponse initiateDeposit(DepositInitiateRequest request) {
        // Kiểm tra Clickwrap bắt buộc (BR-18)
        if (request.getAgreedClickwrap() == null || !request.getAgreedClickwrap()) {
            return DepositInitiateResponse.error("Bạn bắt buộc phải tích chọn đồng ý với Điều khoản Hợp đồng thuê kho (Clickwrap) theo quy định!");
        }

        if (request.getUnitId() == null || request.getAccountId() == null) {
            return DepositInitiateResponse.error("Thông tin mã ô kho hoặc mã tài khoản không được để trống!");
        }

        Optional<StorageUnit> unitOpt = storageUnitRepository.findById(request.getUnitId());
        if (unitOpt.isEmpty()) {
            return DepositInitiateResponse.error("Không tìm thấy ô kho yêu cầu!");
        }

        StorageUnit unit = unitOpt.get();
        if (!"AVAILABLE".equalsIgnoreCase(unit.getStatus())) {
            return DepositInitiateResponse.error("Ô kho này hiện không ở trạng thái trống (có thể đã được người khác giữ chỗ hoặc đang bảo trì)!");
        }

        // Tính toán tiền thuê & tiền cọc
        int duration = 1;
        if (request.getStartDate() != null && request.getEndDate() != null) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());
            duration = (int) Math.max(days, 1);
        }

        CalculatePriceRequest priceReq = new CalculatePriceRequest(
                unit.getUnitTypeId(),
                request.getRentalType() != null ? request.getRentalType() : "MONTHLY",
                duration
        );
        CalculatePriceResponse priceRes = storageService.calculateRentalPrice(priceReq);
        if (!priceRes.isSuccess()) {
            return DepositInitiateResponse.error(priceRes.getMessage());
        }

        // Lấy thông tin cơ sở để sinh mã
        String facilityCode = "FAC";
        Optional<Floor> floorOpt = floorRepository.findById(unit.getFloorId());
        if (floorOpt.isPresent()) {
            Optional<Facility> facOpt = facilityRepository.findById(floorOpt.get().getFacilityId());
            if (facOpt.isPresent()) {
                facilityCode = "F" + facOpt.get().getFacilityId();
            }
        }

        // Khóa tạm ô kho sang HOLD
        unit.setStatus("HOLD");
        storageUnitRepository.save(unit);

        // Tạo bản ghi Đặt chỗ (Reservation)
        Reservation reservation = new Reservation();
        reservation.setAccountId(request.getAccountId());
        reservation.setUnitId(unit.getUnitId());
        reservation.setStartDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now());
        reservation.setEndDate(request.getEndDate() != null ? request.getEndDate() : LocalDate.now().plusMonths(1));
        reservation.setRentalType(request.getRentalType() != null ? request.getRentalType() : "MONTHLY");
        reservation.setRentalAmount(priceRes.getFinalRentalAmount());
        reservation.setDepositAmount(priceRes.getDepositAmount());
        reservation.setStatus("PENDING");
        reservation.setHoldExpiresAt(LocalDateTime.now().plusMinutes(15)); // Giữ chỗ 15 phút để thanh toán
        reservation = reservationRepository.save(reservation);

        // Sinh mã Reservation Code theo BR-15: [Mã Cơ Sở]-[4 số cuối]-[4 ký tự random]
        String randomSuffix = String.format("%04X", new Random().nextInt(0xFFFF));
        String resCode = "RES-" + facilityCode + "-" + String.format("%04d", request.getAccountId() % 10000) + "-" + randomSuffix;

        // Tạo Hợp đồng dự thảo (Draft Contract - BR-18)
        Contract contract = new Contract();
        contract.setReservationId(reservation.getReservationId());
        contract.setPdfUrl("/contracts/DRAFT-" + resCode + ".pdf");
        contract.setStatus("PENDING_CHECKIN");
        contract = contractRepository.save(contract);

        // Tạo Hóa đơn tiền cọc (Payment - BR-37): DEP-[Facility]-[YYYYMMDD]-[4 số random]
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String invoiceNumber = "DEP-" + facilityCode + "-" + dateStr + "-" + String.format("%04d", new Random().nextInt(10000));

        Payment payment = new Payment();
        payment.setContractId(contract.getContractId());
        payment.setInvoiceNumber(invoiceNumber);
        payment.setInvoiceType("INITIAL_RENTAL");
        payment.setAmount(priceRes.getDepositAmount());
        payment.setDueAt(LocalDateTime.now().plusMinutes(15));
        payment.setStatus("PENDING");
        payment.setPaymentMethod("VIETQR");
        payment.setPaymentStatus("PENDING");
        payment = paymentRepository.save(payment);

        // Lưu vết Clickwrap Audit Log (BR-18)
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
        response.setReservationCode(resCode);
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

    // --- 2. Webhook / Xác nhận thanh toán Cọc thành công (BR-16 & BR-37) ---
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
        if ("PAID".equalsIgnoreCase(payment.getStatus())) {
            return new ApiResponse(true, "Hóa đơn này đã được xác nhận thanh toán trước đó!");
        }

        // Cập nhật Payment
        payment.setStatus("PAID");
        payment.setPaymentStatus("SUCCESS");
        payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "VIETQR");
        payment.setTransactionCode(request.getTransactionCode() != null ? request.getTransactionCode() : "TXN_" + System.currentTimeMillis());
        payment.setGatewayTransactionId(request.getGatewayTransactionId());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Cập nhật Contract
        Optional<Contract> contractOpt = contractRepository.findById(payment.getContractId());
        if (contractOpt.isPresent()) {
            Contract contract = contractOpt.get();
            contract.setStatus("ACTIVE");
            contract.setActivatedAt(LocalDateTime.now());
            contractRepository.save(contract);

            // Cập nhật Reservation
            Optional<Reservation> resOpt = reservationRepository.findById(contract.getReservationId());
            if (resOpt.isPresent()) {
                Reservation res = resOpt.get();
                res.setStatus("CONFIRMED");
                reservationRepository.save(res);

                // Cập nhật StorageUnit sang RENTED
                Optional<StorageUnit> unitOpt = storageUnitRepository.findById(res.getUnitId());
                if (unitOpt.isPresent()) {
                    StorageUnit unit = unitOpt.get();
                    unit.setStatus("RENTED");
                    storageUnitRepository.save(unit);
                }
            }
        }

        return new ApiResponse(true, "Xác nhận nộp cọc thành công! Hợp đồng đã được kích hoạt và ô kho đã được bảo lưu.");
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
        boolean isPaid = "PAID".equalsIgnoreCase(p.getStatus());
        return new ApiResponse(true, isPaid ? "PAID" : "PENDING");
    }
}
