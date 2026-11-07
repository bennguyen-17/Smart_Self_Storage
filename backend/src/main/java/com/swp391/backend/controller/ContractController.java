package com.swp391.backend.controller;

import com.swp391.backend.entity.*;
import com.swp391.backend.dto.CustomerCancelReservationRequest;
import com.swp391.backend.dto.CustomerCancelReservationResponse;
import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.GatePinVerificationRequest;
import com.swp391.backend.service.ImageStorageService;
import com.swp391.backend.repository.*;
import com.swp391.backend.service.JwtService;
import com.swp391.backend.service.StorageService;
import com.swp391.backend.service.CustomerReservationService;
import com.swp391.backend.service.GatePinService;
import com.swp391.backend.service.NoShowCronService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ContractController {

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final AccountRepository accountRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final FloorRepository floorRepository;
    private final FacilityRepository facilityRepository;
    private final StorageService storageService;
    private final UnitTypeRepository unitTypeRepository;
    private final GatePinRepository gatePinRepository;
    private final JwtService jwtService;
    private final PaymentRepository paymentRepository;
    private final ActivityLogRepository activityLogRepository;
    private final CustomerReservationService customerReservationService;
    private final GatePinService gatePinService;
    private static final Logger log = LoggerFactory.getLogger(ContractController.class);
    private final SupportTicketRepository supportTicketRepository;
    private final NoShowCronService noShowCronService;
    private final ImageStorageService imageStorageService;
    private final com.swp391.backend.service.EmailService emailService;
    private final com.swp391.backend.service.ContractPdfService contractPdfService;
    @Value("${app.upload.contract-dir:uploads/contracts}")
    private String contractUploadDir;

    public ContractController(ContractRepository contractRepository,
                              ReservationRepository reservationRepository,
                              StorageUnitRepository storageUnitRepository,
                              AccountRepository accountRepository,
                              CustomerProfileRepository customerProfileRepository,
                              FloorRepository floorRepository,
                              FacilityRepository facilityRepository,
                              StorageService storageService,
                              UnitTypeRepository unitTypeRepository,
                              GatePinRepository gatePinRepository,
                              JwtService jwtService,
                              PaymentRepository paymentRepository,
                              ActivityLogRepository activityLogRepository,
                              CustomerReservationService customerReservationService,
                              GatePinService gatePinService,
                              SupportTicketRepository supportTicketRepository,
                              NoShowCronService noShowCronService,
                              ImageStorageService imageStorageService,
                              com.swp391.backend.service.EmailService emailService,
                              com.swp391.backend.service.ContractPdfService contractPdfService) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.accountRepository = accountRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.floorRepository = floorRepository;
        this.facilityRepository = facilityRepository;
        this.storageService = storageService;
        this.unitTypeRepository = unitTypeRepository;
        this.gatePinRepository = gatePinRepository;
        this.jwtService = jwtService;
        this.paymentRepository = paymentRepository;
        this.activityLogRepository = activityLogRepository;
        this.customerReservationService = customerReservationService;
        this.gatePinService = gatePinService;
        this.supportTicketRepository = supportTicketRepository;
        this.noShowCronService = noShowCronService;
        this.imageStorageService = imageStorageService;
        this.emailService = emailService;
        this.contractPdfService = contractPdfService;
    }

    @GetMapping("/contracts/my-contracts")
    public ResponseEntity<List<Map<String, Object>>> getMyContracts(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @AuthenticationPrincipal Integer authAccountId) {

        Integer targetId = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Claims claims = jwtService.validateTokenAndGetClaims(token);
                Object userIdObj = claims.get("userId");
                if (userIdObj instanceof Number num) {
                    targetId = num.intValue();
                } else if (userIdObj != null) {
                    targetId = Integer.valueOf(userIdObj.toString());
                }
            } catch (io.jsonwebtoken.JwtException | IllegalArgumentException ignored) {}
        }
        if (targetId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        try {
            noShowCronService.processNoShowContracts();
        } catch (Exception e) {
            log.error("Lỗi khi quét hợp đồng No-Show: {}", e.getMessage());
        }

        Account customerAcc = accountRepository.findAccountByAccountId(targetId).orElse(null);
        CustomerProfile customerProf = customerProfileRepository.findByAccountId(targetId).orElse(null);
        String defaultCustName = (customerAcc != null && customerAcc.getFullName() != null) ? customerAcc.getFullName() : "";
        String defaultCustPhone = (customerAcc != null && customerAcc.getPhone() != null) ? customerAcc.getPhone() : "";
        String defaultCustEmail = (customerAcc != null && customerAcc.getEmail() != null) ? customerAcc.getEmail() : "";
        String defaultCustIdNum = (customerProf != null && customerProf.getIdentityNumber() != null) ? customerProf.getIdentityNumber() : "";

        List<Reservation> reservations = reservationRepository.findByAccountId(targetId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Reservation res : reservations) {
            Optional<Contract> contractOpt = contractRepository.findByReservationId(res.getReservationId());
            if (contractOpt.isEmpty()) continue;

            Contract c = contractOpt.get();
            if ("INITIATED".equalsIgnoreCase(c.getStatus())) {
                continue; // Bỏ qua đơn giữ chỗ chưa thanh toán cọc
            }
            Integer accId = res.getAccountId() != null ? res.getAccountId() : targetId;
            Account currentAcc = customerAcc;
            CustomerProfile currentProf = customerProf;
            if (accId != null && !accId.equals(targetId)) {
                currentAcc = accountRepository.findAccountByAccountId(accId).orElse(null);
                currentProf = customerProfileRepository.findByAccountId(accId).orElse(null);
            }
            String custName = (currentAcc != null && currentAcc.getFullName() != null) ? currentAcc.getFullName() : defaultCustName;
            String custPhone = (currentAcc != null && currentAcc.getPhone() != null) ? currentAcc.getPhone() : defaultCustPhone;
            String custEmail = (currentAcc != null && currentAcc.getEmail() != null) ? currentAcc.getEmail() : defaultCustEmail;
            String custIdNum = (currentProf != null && currentProf.getIdentityNumber() != null) ? currentProf.getIdentityNumber() : defaultCustIdNum;

            Optional<StorageUnit> unitOpt = storageUnitRepository.findById(res.getUnitCode());
            if (unitOpt.isEmpty()) continue;

            StorageUnit unit = unitOpt.get();
            Optional<Floor> floorOpt = floorRepository.findById(unit.getFloorId());
            String branchName = "";
            String branchCode = "";
            String branchAddress = "";
            String branchPhone = "";
            if (floorOpt.isPresent()) {
                Optional<Facility> facOpt = facilityRepository.findById(floorOpt.get().getFacilityId());
                if (facOpt.isPresent()) {
                    Facility fac = facOpt.get();
                    branchName = fac.getFacilityName();
                    branchCode = fac.getFacilityCode() != null ? fac.getFacilityCode() : storageService.mapFacilityToResponse(fac).getFacilityCode();
                    branchAddress = fac.getAddress() != null ? fac.getAddress() : "";
                    branchPhone = fac.getPhone() != null ? fac.getPhone() : "";
                }
            }

            List<Payment> payments = paymentRepository.findByContractId(c.getContractId());
            String txnCode = "";
            String paymentPaidAt = "";
            for (Payment p : payments) {
                if (p.getTransactionCode() != null && !p.getTransactionCode().isBlank()) {
                    txnCode = p.getTransactionCode();
                } else if (p.getGatewayTransactionId() != null && !p.getGatewayTransactionId().isBlank()) {
                    txnCode = p.getGatewayTransactionId();
                } else if (txnCode.isBlank() && p.getInvoiceNumber() != null && !p.getInvoiceNumber().isBlank()) {
                    txnCode = p.getInvoiceNumber();
                }
                if (p.getPaidAt() != null) {
                    paymentPaidAt = p.getPaidAt().toString();
                } else if (paymentPaidAt.isBlank() && p.getIssuedAt() != null) {
                    paymentPaidAt = p.getIssuedAt().toString();
                }
            }

            long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), res.getEndDate());
            if (daysLeft < 0) daysLeft = 0;

            String size = "M";
            String sizeLabel = "Size M";
            String storageCondition = "NORMAL";
            String dimensions = "1.5m x 2.0m x 2.0m";
            Optional<UnitType> typeOpt = unitTypeRepository.findById(unit.getUnitTypeId());
            if (typeOpt.isPresent()) {
                UnitType ut = typeOpt.get();
                size = ut.getSize() != null ? ut.getSize() : "M";
                sizeLabel = ut.getTypeName() != null ? ut.getTypeName() : ("Size " + size);
                storageCondition = ut.getStorageCondition() != null ? ut.getStorageCondition() : "NORMAL";
                dimensions = ut.getSize() != null ? ut.getSize() : dimensions;
            }

            String currentStatus = c.getStatus();
            String currentCancelReason = c.getCancelReason();
            LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
            if ("PENDING_CHECKIN".equalsIgnoreCase(currentStatus) && res.getStartDate() != null && res.getStartDate().isBefore(today)) {
                currentStatus = "CANCELLED";
                currentCancelReason = "NO_SHOW";
            }

            String statusLabel;
            if ("PENDING_CHECKIN".equalsIgnoreCase(currentStatus)) {
                statusLabel = "Chờ check-in";
            } else if ("ACTIVE".equalsIgnoreCase(currentStatus)) {
                statusLabel = "Đang hiệu lực";
            } else if ("INITIATED".equalsIgnoreCase(currentStatus)) {
                statusLabel = "Khởi tạo";
            } else if ("OVERDUE".equalsIgnoreCase(currentStatus)) {
                statusLabel = "Quá hạn";
            } else if ("TERMINATED".equalsIgnoreCase(currentStatus)) {
                statusLabel = "Đã thanh lý";
            } else if ("COMPLETED".equalsIgnoreCase(currentStatus)) {
                statusLabel = "Đã hoàn tất";
            } else if ("CANCELLED".equalsIgnoreCase(currentStatus)) {
                if ("NO_SHOW".equalsIgnoreCase(currentCancelReason) || (currentCancelReason != null && currentCancelReason.toUpperCase().contains("NO_SHOW"))) {
                    statusLabel = "Quá hạn nhận kho (No-Show)";
                } else {
                    statusLabel = "Đã hủy cọc";
                }
            } else if ("FORFEITED".equalsIgnoreCase(currentStatus)) {
                statusLabel = "Mất cọc";
            } else {
                statusLabel = currentStatus;
            }

            String resCode = res.getReservationCode();
            String displayContractId = (resCode != null && !resCode.isBlank())
                    ? resCode
                    : ("CTR-" + c.getContractId());

            Map<String, Object> map = new HashMap<>();
            map.put("contractId", displayContractId);
            map.put("rawContractId", c.getContractId());
            map.put("reservationCode", resCode != null ? resCode : displayContractId);
            map.put("bookingCode", resCode);
            map.put("unitCode", unit.getUnitCode());
            map.put("branchName", branchName);
            map.put("branchCode", branchCode);
            map.put("size", size);
            map.put("sizeLabel", sizeLabel);
            map.put("unitTypeName", sizeLabel);
            map.put("storageCondition", storageCondition);
            map.put("storageType", storageCondition);
            map.put("unitDimensions", dimensions);
            map.put("dimensions", dimensions);
            map.put("unitSize", dimensions);
            map.put("startDate", res.getStartDate() != null ? res.getStartDate().toString() : LocalDate.now().toString());
            map.put("expiryDate", res.getEndDate() != null ? res.getEndDate().toString() : LocalDate.now().plusMonths(1).toString());
            map.put("endDate", res.getEndDate() != null ? res.getEndDate().toString() : LocalDate.now().plusMonths(1).toString());
            BigDecimal rentAmount = res.getRentalAmount() != null ? res.getRentalAmount() : BigDecimal.ZERO;
            BigDecimal depAmount = res.getDepositAmount() != null ? res.getDepositAmount() : BigDecimal.ZERO;
            BigDecimal totAmount = rentAmount.add(depAmount);
            map.put("rentalFee", rentAmount);
            map.put("depositFee", depAmount);
            map.put("rentalAmount", rentAmount);
            map.put("depositAmount", depAmount);
            map.put("totalAmount", totAmount);
            map.put("customerName", custName);
            map.put("customerPhone", custPhone);
            map.put("customerEmail", custEmail);
            map.put("customerIdNumber", custIdNum);
            map.put("customerCccd", custIdNum);
            map.put("facilityAddress", branchAddress);
            map.put("branchAddress", branchAddress);
            map.put("branchPhone", branchPhone);
            map.put("transactionCode", txnCode);
            map.put("paidAt", paymentPaidAt);
            map.put("daysLeft", daysLeft);
            map.put("status", currentStatus);
            map.put("statusLabel", statusLabel);
            map.put("cancelReason", currentCancelReason);
            map.put("refundBankName", c.getRefundBankName());
            map.put("refundAccountNumber", c.getRefundAccountNumber());
            map.put("refundAccountName", c.getRefundAccountName());
            map.put("inspectionImages", imageStorageService.getCheckoutImageResponses(c.getContractId()));
            map.put("refundReceiptImages", payments.stream()
                    .filter(p -> p.getInvoiceNumber() != null && p.getInvoiceNumber().startsWith("REF-"))
                    .map(p -> imageStorageService.getRefundReceiptUrl(p.getPaymentId()))
                    .filter(Objects::nonNull)
                    .toList());

            Optional<SupportTicket> activeReturnTicket = supportTicketRepository.findByContractId(c.getContractId()).stream()
                    .filter(t -> "EARLY_TERMINATION".equalsIgnoreCase(t.getType())
                            && ("SUBMITTED".equalsIgnoreCase(t.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(t.getStatus()) || "OPEN".equalsIgnoreCase(t.getStatus()))
                            && (t.getDesiredDate() == null || !t.getDesiredDate().isBefore(today)))
                    .findFirst();

            boolean isReturnReq = activeReturnTicket.isPresent();
            if (!isReturnReq && "EARLY_TERMINATION".equalsIgnoreCase(currentCancelReason)) {
                currentCancelReason = null;
                c.setCancelReason(null);
                contractRepository.save(c);
            }
            map.put("cancelReason", currentCancelReason);
            map.put("returnRequested", isReturnReq);

            result.add(map);
        }

        result.sort((a, b) -> {
            int prioA = getContractStatusPriority((String) a.get("status"));
            int prioB = getContractStatusPriority((String) b.get("status"));
            if (prioA != prioB) {
                return Integer.compare(prioA, prioB);
            }
            Integer idA = (Integer) a.get("rawContractId");
            Integer idB = (Integer) b.get("rawContractId");
            if (idA != null && idB != null) {
                return idB.compareTo(idA);
            }
            return 0;
        });

        return ResponseEntity.ok(result);
    }

    /**
     * Khách hàng gửi yêu cầu trả kho trước hạn
     * Staff sẽ nhìn thấy nút [Xác nhận trả kho] sau khi khách gửi yêu cầu này.
     */
    @PostMapping("/contracts/{contractId}/request-checkout")
    public ResponseEntity<?> requestCheckout(
            @PathVariable Integer contractId,
            @RequestBody(required = false) Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @AuthenticationPrincipal Integer authAccountId) {
        Contract contract = contractRepository.findById(contractId)
                .orElse(null);
        if (contract == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy hợp đồng #" + contractId));
        }

        if (!"ACTIVE".equalsIgnoreCase(contract.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Chỉ hợp đồng ĐANG THUÊ (ACTIVE) mới có thể yêu cầu trả kho"));
        }
        Integer callerId = authAccountId;
        if (callerId == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.validateTokenAndGetClaims(authHeader.substring(7));
                Object uObj = claims.get("userId");
                if (uObj instanceof Number num) callerId = num.intValue();
                else if (uObj != null) callerId = Integer.valueOf(uObj.toString());
            } catch (Exception ignored) {}
        }
        Reservation ownerRes = reservationRepository.findById(contract.getReservationId()).orElse(null);
        if (callerId == null || ownerRes == null || !callerId.equals(ownerRes.getAccountId())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Bạn không có quyền yêu cầu trả kho cho hợp đồng của người khác!"));
        }

        List<SupportTicket> existingTickets = supportTicketRepository.findByContractId(contract.getContractId());
        for (SupportTicket existing : existingTickets) {
            if ("EARLY_TERMINATION".equalsIgnoreCase(existing.getType()) &&
                ("SUBMITTED".equalsIgnoreCase(existing.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(existing.getStatus()) || "ESCALATED".equalsIgnoreCase(existing.getStatus()))) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Hợp đồng này đang có yêu cầu trả kho sớm đang chờ xử lý (#" + existing.getTicketCode() + ")!"));
            }
        }

                String reason = body != null && body.get("reason") != null ? body.get("reason").toString() : "Khách hàng yêu cầu trả kho";
        contract.setCancelReason("EARLY_TERMINATION");
        contractRepository.save(contract);

        try {
            Reservation reservation = reservationRepository.findById(contract.getReservationId()).orElse(null);
            SupportTicket ticket = new SupportTicket();
            String yearMonth = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM"));
            long nextIndex = supportTicketRepository.count() + 1;
            String ticketCode = String.format("TCK-%s-%03d", yearMonth, nextIndex);
            while (supportTicketRepository.findByTicketCode(ticketCode).isPresent()) {
                nextIndex++;
                ticketCode = String.format("TCK-%s-%03d", yearMonth, nextIndex);
            }
            ticket.setTicketCode(ticketCode);
            ticket.setType("EARLY_TERMINATION");
            ticket.setStatus("SUBMITTED");
            Integer accId = (reservation != null && reservation.getAccountId() != null) ? reservation.getAccountId() : callerId;
            Integer custId = accId != null ? customerProfileRepository.findByAccountId(accId).map(CustomerProfile::getCustomerId).orElse(accId) : 1;
            if (reservation != null && reservation.getUnitCode() != null) {
                storageUnitRepository.findById(reservation.getUnitCode())
                        .flatMap(u -> floorRepository.findById(u.getFloorId()))
                        .map(Floor::getFacilityId)
                        .ifPresent(ticket::setFacilityId);
            }
            ticket.setCustomerId(custId);
            ticket.setContractId(contract.getContractId());
            ticket.setUnitCode(reservation != null ? reservation.getUnitCode() : null);
            ticket.setTitle("Yêu cầu trả kho - " + (reservation != null ? reservation.getUnitCode() : ""));
            ticket.setDescription(reason);
            ticket.setCreatedAt(LocalDateTime.now());
            supportTicketRepository.save(ticket);
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of("success", true, "message", "Đã gửi yêu cầu trả kho thành công! Nhân viên sẽ tiến hành nghiệm thu."));
    }

    @PostMapping("/contracts/{contractId}/cancel-deposit")
    public ResponseEntity<CustomerCancelReservationResponse> cancelDeposit(
            @PathVariable Integer contractId,
            @RequestBody(required = false) CustomerCancelReservationRequest body,
            @AuthenticationPrincipal Integer accountId) {
        return ResponseEntity.ok(customerReservationService.cancelDeposit(contractId, accountId, body));
    }

    /**
     * Sinh mã PIN mở cổng tự động 24/7
     * QUY TẮC NGHIỆP VỤ BẮT BUỘC:
     * - Chỉ cấp mã PIN nếu khách hàng có hợp đồng đang có HIỆU LỰC (ACTIVE) tại cơ sở đó.
     * - Nếu chỉ có hợp đồng CHỜ CHECK-IN hoặc ĐÃ HỦY CỌC, từ chối cấp mã PIN (hasAccess = false).
     * - Ghi nhận và đồng bộ mã PIN vào bảng gatepin trong MySQL.
     */
    @GetMapping("/gate-pins/live")
    public ResponseEntity<Map<String, Object>> getLiveGatePin(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String branchCode) {

        Integer targetId = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Claims claims = jwtService.validateTokenAndGetClaims(token);
                Object userIdObj = claims.get("userId");
                if (userIdObj instanceof Number num) {
                    targetId = num.intValue();
                } else if (userIdObj != null) {
                    targetId = Integer.valueOf(userIdObj.toString());
                }
            } catch (io.jsonwebtoken.JwtException | IllegalArgumentException ignored) {}
        }
        if (targetId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        String targetBranch = branchCode != null ? branchCode.trim().replace("-", "").toUpperCase() : "HN01";

        // Tìm tất cả đặt chỗ của tài khoản trong MySQL
        List<Reservation> reservations = reservationRepository.findByAccountId(targetId);
        Contract activeContract = null;
        StorageUnit activeUnit = null;

        for (Reservation res : reservations) {
            Optional<Contract> contractOpt = contractRepository.findByReservationId(res.getReservationId());
            if (contractOpt.isEmpty()) continue;
            Contract c = contractOpt.get();

            // QUY TẮC BẮT BUỘC: Hợp đồng PHẢI ở trạng thái ACTIVE (HIỆU LỰC)
            if (!"ACTIVE".equalsIgnoreCase(c.getStatus())) {
                continue;
            }

            Optional<StorageUnit> unitOpt = storageUnitRepository.findById(res.getUnitCode());
            if (unitOpt.isEmpty()) continue;
            StorageUnit unit = unitOpt.get();

            Optional<Floor> floorOpt = floorRepository.findById(unit.getFloorId());
            String cBranchCode = "HN01";
            if (floorOpt.isPresent()) {
                Optional<Facility> facOpt = facilityRepository.findById(floorOpt.get().getFacilityId());
                if (facOpt.isPresent()) {
                    cBranchCode = storageService.mapFacilityToResponse(facOpt.get()).getFacilityCode();
                }
            }

            // Kiểm tra khớp mã cơ sở
            String normTarget = targetBranch.replace("-", "").toUpperCase();
            String normBranch = cBranchCode.replace("-", "").toUpperCase();

            if (normTarget.equals(normBranch) || targetBranch.equalsIgnoreCase(cBranchCode)) {
                activeContract = c;
                activeUnit = unit;
                break;
            }
        }

        // Nếu cơ sở này KHÔNG CÓ hợp đồng nào ACTIVE -> TUYỆT ĐỐI KHÔNG CẤP MÃ PIN
        if (activeContract == null) {
            Map<String, Object> errorResp = new HashMap<>();
            errorResp.put("success", false);
            errorResp.put("hasAccess", false);
            errorResp.put("message", "Cơ sở " + targetBranch + " hiện không có hợp đồng nào đang có HIỆU LỰC (ACTIVE). Không thể cấp mã PIN ra vào 24/7!");
            errorResp.put("branchCode", targetBranch);
            return ResponseEntity.status(403).body(errorResp);
        }

        // Khi có hợp đồng ACTIVE: Sinh mã PIN 6 số an toàn và lưu/cập nhật vào bảng gatepin trong MySQL
        long sec = System.currentTimeMillis() / 15000;
        int seed = Math.abs((int) (sec ^ (targetBranch.hashCode() + activeContract.getContractId() * 31)));
        int p1 = (seed % 900) + 100;
        int p2 = ((seed / 900) % 900) + 100;
        String rawPin = String.format("%03d%03d", p1, p2);
        String formattedPin = p1 + " " + p2;
        int ttlSeconds = 15 - (int) ((System.currentTimeMillis() / 1000) % 15);

        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expires = now.plusSeconds(ttlSeconds);
            Optional<GatePin> existingOpt = gatePinRepository.findTopByContractIdAndStatusOrderByGeneratedAtDesc(activeContract.getContractId(), "ACTIVE");
            GatePin gatePin;
            if (existingOpt.isPresent()) {
                gatePin = existingOpt.get();
                gatePin.setPinCode(rawPin);
                gatePin.setGeneratedAt(now);
                gatePin.setExpiresAt(expires);
            } else {
                gatePin = new GatePin(activeContract.getContractId(), rawPin, "ACTIVE", now, expires);
            }
            gatePinRepository.save(gatePin);
        } catch (Exception e) {
            System.err.println("Lỗi lưu gatepin vào MySQL: " + e.getMessage());
        }

        Map<String, Object> data = new HashMap<>();
        data.put("success", true);
        data.put("hasAccess", true);
        data.put("pin", formattedPin);
        data.put("ttlSeconds", ttlSeconds);
        data.put("branchCode", targetBranch);
        data.put("contractId", "CTR-" + activeContract.getContractId());
        data.put("unitCode", activeUnit != null ? activeUnit.getUnitCode() : "");

        return ResponseEntity.ok(data);
    }

    @PostMapping("/gate-pins/verify")
    public ResponseEntity<ApiResponse> verifyGatePin(@RequestBody GatePinVerificationRequest request) {
        boolean valid = request != null && gatePinService.verifyPin(request.getPinCode());
        if (!valid) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "PIN không hợp lệ, đã hết hạn hoặc hợp đồng không còn hiệu lực."));
        }
        return ResponseEntity.ok(new ApiResponse(true, "PIN hợp lệ. Cho phép mở cửa."));
    }

    /**
     * Gia hạn hợp đồng thuê kho trực tuyến
     * - Chỉ áp dụng cho hợp đồng ACTIVE (HĐ quá hạn hoặc đã đóng bị từ chối)
     * - Cộng dồn ngày hết hạn nối tiếp ngày cũ
     * - Tạo hóa đơn EXT-... trạng thái PAID/SUCCESS
     * - Ghi ActivityLog kiểm toán
     */
    @PostMapping("/contracts/{contractId}/extend")
    public ResponseEntity<?> extendContract(
            @PathVariable String contractId,
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @AuthenticationPrincipal Integer authAccountId) {

        if (contractId == null || contractId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Mã hợp đồng không hợp lệ!"));
        }

        String rawInput = contractId.trim();
        Optional<Contract> contractOpt = Optional.empty();

        // 1. Thử parse ID số nguyên (ví dụ: 1, 2, 104)
        try {
            int numericId = Integer.parseInt(rawInput);
            contractOpt = contractRepository.findById(numericId);
        } catch (NumberFormatException ignored) {}

        // 2. Tìm theo reservationCode (ví dụ: CTR-HN01-171026-0042)
        if (contractOpt.isEmpty()) {
            Optional<Reservation> resByCode = reservationRepository.findByReservationCode(rawInput);
            if (resByCode.isPresent()) {
                contractOpt = contractRepository.findByReservationId(resByCode.get().getReservationId());
            }
        }

        // 3. Nếu có dạng CTR-[id số] (ví dụ: CTR-1)
        if (contractOpt.isEmpty() && rawInput.startsWith("CTR-")) {
            String suffix = rawInput.substring(4);
            try {
                int num = Integer.parseInt(suffix);
                contractOpt = contractRepository.findById(num);
            } catch (NumberFormatException ignored) {}
        }

        // 4. Tìm kiếm tương đối reservationCode chứa mã hoặc ID
        if (contractOpt.isEmpty()) {
            List<Reservation> allRes = reservationRepository.findAll();
            for (Reservation r : allRes) {
                if (r.getReservationCode() != null && (r.getReservationCode().equalsIgnoreCase(rawInput) || r.getReservationCode().endsWith(rawInput))) {
                    contractOpt = contractRepository.findByReservationId(r.getReservationId());
                    if (contractOpt.isPresent()) break;
                }
            }
        }

        if (contractOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Không tìm thấy hợp đồng: " + contractId));
        }

        Contract contract = contractOpt.get();

        // Chỉ cho phép gia hạn khi hợp đồng đang ACTIVE hoặc PENDING_CHECKIN
        if (!"ACTIVE".equalsIgnoreCase(contract.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Chỉ hợp đồng đang có HIỆU LỰC (ACTIVE) mới được phép gia hạn trực tuyến. Hợp đồng trạng thái " + contract.getStatus() + " vui lòng liên hệ nhân viên tại quầy!"
            ));
        }

        Optional<Reservation> resOpt = reservationRepository.findById(contract.getReservationId());
        if (resOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy thông tin đặt chỗ của hợp đồng!"));
        }

        Reservation res = resOpt.get();
        Integer callerId = authAccountId;
        if (callerId == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.validateTokenAndGetClaims(authHeader.substring(7));
                Object uObj = claims.get("userId");
                if (uObj instanceof Number num) callerId = num.intValue();
                else if (uObj != null) callerId = Integer.valueOf(uObj.toString());
            } catch (Exception ignored) {}
        }
        if (callerId == null || !callerId.equals(res.getAccountId())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Bạn không có quyền gia hạn hợp đồng của người khác!"));
        }

        // Đọc số ngày gia hạn từ payload (mặc định 30 ngày)
        int effectiveDays = 30;
        String packageLabel = "1 Tháng";
        BigDecimal finalTotal = BigDecimal.ZERO;

        if (payload != null) {
            if (payload.get("effectiveDays") instanceof Number num) {
                effectiveDays = num.intValue();
            } else if (payload.get("days") instanceof Number num) {
                effectiveDays = num.intValue();
            }
            if (payload.get("packageLabel") != null) {
                packageLabel = payload.get("packageLabel").toString();
            }
            if (payload.get("finalTotal") instanceof Number num) {
                finalTotal = BigDecimal.valueOf(num.doubleValue());
            } else if (payload.get("amount") instanceof Number num) {
                finalTotal = BigDecimal.valueOf(num.doubleValue());
            }
        }

        if (effectiveDays < 7) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Thời hạn gia hạn tối thiểu là 7 ngày!"));
        }
        boolean clientSentAmount = payload != null && (payload.containsKey("finalTotal") || payload.containsKey("amount"));
        if (clientSentAmount && finalTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Số tiền gia hạn phải lớn hơn 0!"));
        }
        BigDecimal serverCalcTotal = BigDecimal.ZERO;
        Optional<StorageUnit> unitForPriceOpt = storageUnitRepository.findById(res.getUnitCode());
        if (unitForPriceOpt.isPresent()) {
            String rType = (effectiveDays % 30 == 0) ? "MONTHLY" : "DAILY";
            int dur = (effectiveDays % 30 == 0) ? (effectiveDays / 30) : effectiveDays;
            com.swp391.backend.dto.CalculatePriceResponse calcResp = storageService.calculateRentalPrice(
                    new com.swp391.backend.dto.CalculatePriceRequest(unitForPriceOpt.get().getUnitTypeId(), rType, dur));
            if (calcResp != null && calcResp.getFinalRentalAmount() != null) {
                serverCalcTotal = calcResp.getFinalRentalAmount();
            }
        }
        BigDecimal contractMonthlyRate = res.getRentalAmount() != null && res.getRentalAmount().compareTo(BigDecimal.ZERO) > 0
                ? res.getRentalAmount() : serverCalcTotal;
        int discPct = (effectiveDays >= 360 && effectiveDays % 30 == 0) ? 15
                : (effectiveDays >= 180 && effectiveDays % 30 == 0) ? 10
                : (effectiveDays >= 90 && effectiveDays % 30 == 0) ? 5 : 0;
        BigDecimal contractRateTotal = contractMonthlyRate
                .multiply(BigDecimal.valueOf(effectiveDays))
                .divide(BigDecimal.valueOf(30), 2, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100 - discPct))
                .divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP);
        BigDecimal minAcceptable = serverCalcTotal.compareTo(BigDecimal.ZERO) > 0 && contractRateTotal.compareTo(BigDecimal.ZERO) > 0
                ? serverCalcTotal.min(contractRateTotal)
                : serverCalcTotal.max(contractRateTotal);
        if (clientSentAmount && minAcceptable.compareTo(BigDecimal.ZERO) > 0
                && finalTotal.add(BigDecimal.valueOf(1000)).compareTo(minAcceptable) < 0) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Số tiền gia hạn không hợp lệ so với biểu phí hệ thống!"));
        }
        if (!clientSentAmount || finalTotal.compareTo(BigDecimal.ZERO) <= 0) {
            finalTotal = serverCalcTotal.compareTo(BigDecimal.ZERO) > 0 ? serverCalcTotal : contractRateTotal;
        }

        // Cộng dồn ngày hết hạn mới nối tiếp ngày hết hạn cũ
        LocalDate currentExpiry = res.getEndDate() != null ? res.getEndDate() : LocalDate.now();
        if (currentExpiry.isBefore(LocalDate.now())) {
            currentExpiry = LocalDate.now();
        }
        LocalDate newExpiry = currentExpiry.plusDays(effectiveDays);
        res.setEndDate(newExpiry);
        reservationRepository.save(res);

        // Sinh hóa đơn EXT-[Mã hợp đồng] theo chuẩn DDMMYY
        String branchCode = "HN01";
        Optional<StorageUnit> unitOpt = storageUnitRepository.findById(res.getUnitCode());
        if (unitOpt.isPresent()) {
            Optional<Floor> flOpt = floorRepository.findById(unitOpt.get().getFloorId());
            if (flOpt.isPresent()) {
                Optional<Facility> facOpt = facilityRepository.findById(flOpt.get().getFacilityId());
                if (facOpt.isPresent()) {
                    branchCode = storageService.mapFacilityToResponse(facOpt.get()).getFacilityCode();
                }
            }
        }

        String dateStr = LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("ddMMyy"));
        String cleanFac = branchCode.replace("-", "").toUpperCase();
        String contractCode = (res.getReservationCode() != null && !res.getReservationCode().isBlank())
                ? res.getReservationCode()
                : String.format("CTR-%s-%s-%04d", cleanFac, dateStr, contract.getContractId());

        String invoiceNumber = "EXT-" + contractCode + "-" + String.format("%04d", new Random().nextInt(10000));
        if (payload != null && payload.get("invoiceNumber") != null && !payload.get("invoiceNumber").toString().isBlank()) {
            invoiceNumber = payload.get("invoiceNumber").toString().trim();
        }

        if (!invoiceNumber.toUpperCase().startsWith("EXT-")) {
            invoiceNumber = "EXT-" + contractCode + "-" + String.format("%04d", new Random().nextInt(10000));
        }
        Optional<Payment> existingPayOpt = paymentRepository.findByInvoiceNumber(invoiceNumber);
        Payment payment;
        if (existingPayOpt.isPresent()) {
            Payment existingPay = existingPayOpt.get();
            if (!contract.getContractId().equals(existingPay.getContractId())
                    || (existingPay.getInvoiceType() != null && !"MONTHLY_RENEWAL".equalsIgnoreCase(existingPay.getInvoiceType()))) {
                invoiceNumber = "EXT-" + contractCode + "-" + String.format("%04d", new Random().nextInt(10000));
                payment = new Payment();
            } else {
                payment = existingPay;
            }
        } else {
            payment = new Payment();
        }
        payment.setPaidAmount(finalTotal);
        payment.setRemainingAmount(BigDecimal.ZERO);
        payment.setContractId(contract.getContractId());
        payment.setInvoiceNumber(invoiceNumber);
        payment.setInvoiceType("MONTHLY_RENEWAL");
        payment.setAmount(finalTotal);
        payment.setIssuedAt(LocalDateTime.now());
        payment.setDueAt(LocalDateTime.now().plusDays(1));
        payment.setStatus("PAID");
        payment.setPaymentMethod("BANK_TRANSFER");
        payment.setPaymentStatus("SUCCESS");
        payment.setTransactionCode("TXN_EXT_" + System.currentTimeMillis());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Ghi nhật ký kiểm toán (ActivityLog)
        ActivityLog activityLog = new ActivityLog();
        activityLog.setAccountId(res.getAccountId());
        activityLog.setFacilityId(unitOpt.flatMap(u -> floorRepository.findById(u.getFloorId())).map(Floor::getFacilityId).orElse(null));
        activityLog.setAction("EXTEND_CONTRACT");
        activityLog.setDescription(String.format("Gia hạn thành công hợp đồng %s (ô %s) thêm %d ngày (%s). Hạn mới: %s. Hóa đơn: %s",
                contractCode, res.getUnitCode(), effectiveDays, packageLabel, newExpiry, invoiceNumber));
        activityLog.setCreatedAt(LocalDateTime.now());
        activityLogRepository.save(activityLog);

        // Gửi email xác nhận gia hạn hợp đồng trực tuyến thành công
        try {
            if (res.getAccountId() != null) {
                Account acc = accountRepository.findById(Long.valueOf(res.getAccountId())).orElse(null);
                if (acc != null) {
                    String customerName = (acc.getFullName() != null) ? acc.getFullName() : "Quý khách";
                    String facilityName = "Smart Self Storage";
                    Optional<StorageUnit> suOpt = storageUnitRepository.findById(res.getUnitCode());
                    if (suOpt.isPresent()) {
                        Optional<Floor> flOpt = floorRepository.findById(suOpt.get().getFloorId());
                        if (flOpt.isPresent()) {
                            Optional<Facility> facOpt = facilityRepository.findById(flOpt.get().getFacilityId());
                            if (facOpt.isPresent() && facOpt.get().getFacilityName() != null) {
                                facilityName = facOpt.get().getFacilityName();
                            }
                        }
                    }
                    emailService.sendRenewalSuccessEmail(
                            acc.getEmail(),
                            customerName,
                            contractCode,
                            res.getUnitCode(),
                            facilityName,
                            effectiveDays,
                            newExpiry,
                            invoiceNumber,
                            finalTotal
                    );
                }
            }
        } catch (Exception e) {
            log.error("Không thể gửi email xác nhận gia hạn hợp đồng {}: {}", contractCode, e.getMessage());
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "Gia hạn hợp đồng thành công! Hạn sử dụng mới đến ngày " + newExpiry);
        resp.put("contractId", contractCode);
        resp.put("rawContractId", contract.getContractId());
        resp.put("unitCode", res.getUnitCode());
        resp.put("newExpiryDate", newExpiry.toString());
        resp.put("effectiveDays", effectiveDays);
        resp.put("invoiceNumber", invoiceNumber);
        resp.put("amount", finalTotal);

        return ResponseEntity.ok(resp);
    }

    @GetMapping(value = "/contracts/{contractId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> getContractPdf(@PathVariable String contractId) {
        if (contractId == null || contractId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String rawInput = contractId.trim();
        Optional<Contract> contractOpt = Optional.empty();

        // 1. Numeric ID
        try {
            int numericId = Integer.parseInt(rawInput);
            contractOpt = contractRepository.findById(numericId);
        } catch (NumberFormatException ignored) {}

        // 2. Reservation code
        if (contractOpt.isEmpty()) {
            Optional<Reservation> resByCode = reservationRepository.findByReservationCode(rawInput);
            if (resByCode.isPresent()) {
                contractOpt = contractRepository.findByReservationId(resByCode.get().getReservationId());
            }
        }

        // 3. CTR-[num]
        if (contractOpt.isEmpty() && rawInput.startsWith("CTR-")) {
            String suffix = rawInput.substring(4);
            try {
                int num = Integer.parseInt(suffix);
                contractOpt = contractRepository.findById(num);
            } catch (NumberFormatException ignored) {}
        }

        // 4. Find match in reservations
        if (contractOpt.isEmpty()) {
            List<Reservation> allRes = reservationRepository.findAll();
            for (Reservation r : allRes) {
                if (r.getReservationCode() != null && (r.getReservationCode().equalsIgnoreCase(rawInput) || r.getReservationCode().endsWith(rawInput))) {
                    contractOpt = contractRepository.findByReservationId(r.getReservationId());
                    if (contractOpt.isPresent()) break;
                }
            }
        }

        String fileName = null;
        if (contractOpt.isPresent()) {
            Contract c = contractOpt.get();
            if (c.getContractPdfUrl() != null && !c.getContractPdfUrl().isBlank()) {
                fileName = Paths.get(c.getContractPdfUrl()).getFileName().toString();
            } else {
                Reservation r = reservationRepository.findById(c.getReservationId()).orElse(null);
                if (r != null && r.getReservationCode() != null) {
                    fileName = r.getReservationCode() + ".pdf";
                }
            }
        }

        if (fileName == null) {
            fileName = rawInput.endsWith(".pdf") ? rawInput : (rawInput + ".pdf");
        }

        Path pdfPath = Paths.get(contractUploadDir, fileName).toAbsolutePath().normalize();
        if (!Files.exists(pdfPath)) {
            pdfPath = Paths.get("uploads", "contracts", fileName).toAbsolutePath().normalize();
        }

        if (!Files.exists(pdfPath)) {
            if (contractOpt.isPresent()) {
                try {
                    byte[] generatedBytes = contractPdfService.generateAndSaveContractPdf(contractOpt.get());
                    if (generatedBytes != null && generatedBytes.length > 0) {
                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_PDF);
                        headers.setContentDisposition(org.springframework.http.ContentDisposition.inline().filename(fileName).build());
                        headers.setContentLength(generatedBytes.length);
                        return ResponseEntity.ok().headers(headers).body(generatedBytes);
                    }
                } catch (Exception ex) {
                    log.error("Lỗi khi tự động tạo file PDF hợp đồng {} theo yêu cầu: {}", fileName, ex.getMessage());
                }
            }
            log.warn("Không tìm thấy file PDF hợp đồng: {} (đường dẫn: {})", fileName, pdfPath);
            return ResponseEntity.notFound().build();
        }

        try {
            byte[] bytes = Files.readAllBytes(pdfPath);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(org.springframework.http.ContentDisposition.inline().filename(fileName).build());
            headers.setContentLength(bytes.length);
            return ResponseEntity.ok().headers(headers).body(bytes);
        } catch (IOException e) {
            log.error("Lỗi khi đọc file PDF hợp đồng {}: {}", fileName, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    private int getContractStatusPriority(String status) {
        if (status == null) return 99;
        return switch (status.toUpperCase()) {
            case "PENDING_CHECKIN" -> 0;
            case "ACTIVE" -> 1;
            case "OVERDUE" -> 2;
            case "CANCELLED", "TERMINATED", "COMPLETED", "FORFEITED" -> 3;
            default -> 3;
        };
    }
}
