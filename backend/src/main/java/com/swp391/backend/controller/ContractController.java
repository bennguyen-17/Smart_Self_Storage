package com.swp391.backend.controller;

import com.swp391.backend.entity.*;
import com.swp391.backend.dto.CustomerCancelReservationRequest;
import com.swp391.backend.dto.CustomerCancelReservationResponse;
import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.GatePinVerificationRequest;
import com.swp391.backend.repository.*;
import com.swp391.backend.service.JwtService;
import com.swp391.backend.service.StorageService;
import com.swp391.backend.service.CustomerReservationService;
import com.swp391.backend.service.GatePinService;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final SupportTicketRepository supportTicketRepository;

    public ContractController(ContractRepository contractRepository,
                              ReservationRepository reservationRepository,
                              StorageUnitRepository storageUnitRepository,
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
                              SupportTicketRepository supportTicketRepository) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
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
    }

    @GetMapping("/contracts/my-contracts")
    public ResponseEntity<List<Map<String, Object>>> getMyContracts(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Integer targetId = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Claims claims = jwtService.validateTokenAndGetClaims(token);
                Object userIdObj = claims.get("userId");
                if (userIdObj instanceof Number) {
                    targetId = ((Number) userIdObj).intValue();
                } else if (userIdObj != null) {
                    targetId = Integer.parseInt(userIdObj.toString());
                }
            } catch (Exception ignored) {}
        }
        if (targetId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        List<Reservation> reservations = reservationRepository.findByAccountId(targetId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Reservation res : reservations) {
            Optional<Contract> contractOpt = contractRepository.findByReservationId(res.getReservationId());
            if (contractOpt.isEmpty()) continue;

            Contract c = contractOpt.get();
            if ("INITIATED".equalsIgnoreCase(c.getStatus())) {
                continue; // Bỏ qua đơn giữ chỗ chưa thanh toán cọc
            }
            Optional<StorageUnit> unitOpt = storageUnitRepository.findById(res.getUnitCode());
            if (unitOpt.isEmpty()) continue;

            StorageUnit unit = unitOpt.get();
            Optional<Floor> floorOpt = floorRepository.findById(unit.getFloorId());
            String branchName = "Cầu Giấy, Hà Nội";
            String branchCode = "HN01";
            if (floorOpt.isPresent()) {
                Optional<Facility> facOpt = facilityRepository.findById(floorOpt.get().getFacilityId());
                if (facOpt.isPresent()) {
                    branchName = facOpt.get().getFacilityName();
                    branchCode = storageService.mapFacilityToResponse(facOpt.get()).getFacilityCode();
                }
            }

            long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), res.getEndDate());
            if (daysLeft < 0) daysLeft = 0;

            String size = "M";
            String sizeLabel = "Size M";
            Optional<UnitType> typeOpt = unitTypeRepository.findById(unit.getUnitTypeId());
            if (typeOpt.isPresent()) {
                UnitType ut = typeOpt.get();
                size = ut.getSize() != null ? ut.getSize() : "M";
                sizeLabel = ut.getTypeName() != null ? ut.getTypeName() : ("Size " + size);
            }

            String statusLabel;
            if ("PENDING_CHECKIN".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "CHỜ CHECK-IN";
            } else if ("ACTIVE".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "HIỆU LỰC";
            } else if ("INITIATED".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "KHỞI TẠO";
            } else if ("OVERDUE".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "QUÁ HẠN";
            } else if ("TERMINATED".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "ĐÃ THANH LÝ";
            } else if ("COMPLETED".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "ĐÃ HOÀN TẤT";
            } else if ("CANCELLED".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "ĐÃ HỦY CỌC";
            } else if ("FORFEITED".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "MẤT CỌC";
            } else {
                statusLabel = c.getStatus();
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
            map.put("daysLeft", daysLeft);
            map.put("status", c.getStatus());
            map.put("statusLabel", statusLabel);
            map.put("cancelReason", c.getCancelReason());
            map.put("refundBankName", c.getRefundBankName());
            map.put("refundAccountNumber", c.getRefundAccountNumber());
            map.put("refundAccountName", c.getRefundAccountName());

            boolean isReturnReq = "EARLY_TERMINATION".equalsIgnoreCase(c.getCancelReason())
                    || supportTicketRepository.findByContractId(c.getContractId()).stream()
                            .anyMatch(t -> "EARLY_TERMINATION".equalsIgnoreCase(t.getType()) && !"RESOLVED".equalsIgnoreCase(t.getStatus()));
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
            @RequestBody(required = false) Map<String, Object> body) {
        Contract contract = contractRepository.findById(contractId)
                .orElse(null);
        if (contract == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy hợp đồng #" + contractId));
        }

        if (!"ACTIVE".equalsIgnoreCase(contract.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Chỉ hợp đồng ĐANG THUÊ (ACTIVE) mới có thể yêu cầu trả kho"));
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
            ticket.setCustomerId(reservation != null ? reservation.getAccountId() : 1);
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
     * US-06: Sinh mã PIN mở cổng IoT 24/7
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
                if (userIdObj instanceof Number) {
                    targetId = ((Number) userIdObj).intValue();
                } else if (userIdObj != null) {
                    targetId = Integer.parseInt(userIdObj.toString());
                }
            } catch (Exception ignored) {}
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
        data.put("unitCode", activeUnit.getUnitCode());

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
     * US-21: Gia hạn hợp đồng online
     * - Chỉ áp dụng cho hợp đồng ACTIVE (HĐ quá hạn hoặc đã đóng bị từ chối)
     * - Cộng dồn ngày hết hạn nối tiếp ngày cũ
     * - Tạo hóa đơn EXT-... trạng thái PAID/SUCCESS
     * - Ghi ActivityLog kiểm toán
     */
    @PostMapping("/contracts/{contractId}/extend")
    public ResponseEntity<?> extendContract(
            @PathVariable String contractId,
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

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
        if (!"ACTIVE".equalsIgnoreCase(contract.getStatus()) && !"PENDING_CHECKIN".equalsIgnoreCase(contract.getStatus())) {
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

        // Đọc số ngày gia hạn từ payload (mặc định 30 ngày)
        int effectiveDays = 30;
        String packageLabel = "1 Tháng";
        BigDecimal finalTotal = BigDecimal.ZERO;

        if (payload != null) {
            if (payload.get("effectiveDays") instanceof Number) {
                effectiveDays = ((Number) payload.get("effectiveDays")).intValue();
            } else if (payload.get("days") instanceof Number) {
                effectiveDays = ((Number) payload.get("days")).intValue();
            }
            if (payload.get("packageLabel") != null) {
                packageLabel = payload.get("packageLabel").toString();
            }
            if (payload.get("finalTotal") instanceof Number) {
                finalTotal = BigDecimal.valueOf(((Number) payload.get("finalTotal")).doubleValue());
            } else if (payload.get("amount") instanceof Number) {
                finalTotal = BigDecimal.valueOf(((Number) payload.get("amount")).doubleValue());
            }
        }

        if (effectiveDays < 7) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Thời hạn gia hạn tối thiểu là 7 ngày!"));
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

        Payment payment = paymentRepository.findByInvoiceNumber(invoiceNumber).orElseGet(Payment::new);
        payment.setContractId(contract.getContractId());
        payment.setInvoiceNumber(invoiceNumber);
        payment.setInvoiceType("MONTHLY_RENEWAL");
        payment.setAmount(finalTotal);
        payment.setIssuedAt(LocalDateTime.now());
        payment.setDueAt(LocalDateTime.now().plusDays(1));
        payment.setStatus("PAID");
        payment.setPaymentMethod("VNPAY");
        payment.setPaymentStatus("SUCCESS");
        payment.setTransactionCode("TXN_EXT_" + System.currentTimeMillis());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Ghi nhật ký kiểm toán (ActivityLog)
        ActivityLog log = new ActivityLog();
        log.setAccountId(res.getAccountId());
        log.setAction("EXTEND_CONTRACT");
        log.setDescription(String.format("Gia hạn thành công hợp đồng %s (ô %s) thêm %d ngày (%s). Hạn mới: %s. Hóa đơn: %s",
                contractCode, res.getUnitCode(), effectiveDays, packageLabel, newExpiry, invoiceNumber));
        log.setCreatedAt(LocalDateTime.now());
        activityLogRepository.save(log);

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

    private int getContractStatusPriority(String status) {
        if (status == null) return 99;
        switch (status.toUpperCase()) {
            case "PENDING_CHECKIN":
                return 0;
            case "ACTIVE":
                return 1;
            case "OVERDUE":
                return 2;
            case "CANCELLED":
            case "TERMINATED":
            case "COMPLETED":
            case "FORFEITED":
            default:
                return 3;
        }
    }
}
