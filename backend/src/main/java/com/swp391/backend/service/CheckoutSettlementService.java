package com.swp391.backend.service;

import com.swp391.backend.dto.checkout.CheckoutConfirmRequest;
import com.swp391.backend.dto.checkout.CheckoutConfirmResponse;
import com.swp391.backend.dto.checkout.CheckoutPreviewResponse;
import com.swp391.backend.dto.checkout.RefundListItemResponse;
import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class CheckoutSettlementService {

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final FacilityRepository facilityRepository;
    private final PaymentRepository paymentRepository;
    private final GatePinRepository gatePinRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final ActivityLogRepository activityLogRepository;
    private final StorageService storageService;
    private final AccountRepository accountRepository;
    private final StaffShiftService staffShiftService;
    private final StaffTaskService staffTaskService;
    private final EmailService emailService;
    private final CustomerProfileRepository customerProfileRepository;

    public CheckoutSettlementService(ContractRepository contractRepository,
                                   ReservationRepository reservationRepository,
                                   StorageUnitRepository storageUnitRepository,
                                   FloorRepository floorRepository,
                                   FacilityRepository facilityRepository,
                                   PaymentRepository paymentRepository,
                                   GatePinRepository gatePinRepository,
                                   SupportTicketRepository supportTicketRepository,
                                   ActivityLogRepository activityLogRepository,
                                   StorageService storageService,
                                   AccountRepository accountRepository,
                                   StaffShiftService staffShiftService,
                                   StaffTaskService staffTaskService,
                                   EmailService emailService,
                                   CustomerProfileRepository customerProfileRepository) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.facilityRepository = facilityRepository;
        this.paymentRepository = paymentRepository;
        this.gatePinRepository = gatePinRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.activityLogRepository = activityLogRepository;
        this.storageService = storageService;
        this.accountRepository = accountRepository;
        this.staffShiftService = staffShiftService;
        this.staffTaskService = staffTaskService;
        this.emailService = emailService;
        this.customerProfileRepository = customerProfileRepository;
    }

    /**
     * US-28 & US-29: Tính toán dự thảo quyết toán trả kho & hoàn cọc
     */
    public CheckoutPreviewResponse calculateCheckoutPreview(Integer contractId, Integer staffAccountId) {
        staffShiftService.requireOnDutyFacility(staffAccountId);
        Optional<Contract> contractOpt = contractRepository.findById(contractId);
        if (contractOpt.isEmpty()) {
            contractOpt = contractRepository.findByReservationId(contractId);
        }
        if (contractOpt.isEmpty()) {
            return CheckoutPreviewResponse.error("Không tìm thấy hợp đồng #" + contractId);
        }

        Contract contract = contractOpt.get();
        // Cho phép trả kho khi hợp đồng ACTIVE hoặc OVERDUE
        if (!"ACTIVE".equalsIgnoreCase(contract.getStatus()) && !"OVERDUE".equalsIgnoreCase(contract.getStatus())) {
            return CheckoutPreviewResponse.error("Hợp đồng #" + contractId + " đang ở trạng thái " + contract.getStatus() + ", không thể thực hiện thủ tục trả kho!");
        }

        Optional<Reservation> resOpt = reservationRepository.findById(contract.getReservationId());
        if (resOpt.isEmpty()) {
            return CheckoutPreviewResponse.error("Không tìm thấy thông tin đặt chỗ của hợp đồng #" + contractId);
        }

        Reservation res = resOpt.get();
        LocalDate startDate = res.getStartDate() != null ? res.getStartDate() : LocalDate.now();
        LocalDate originalEndDate = res.getEndDate() != null ? res.getEndDate() : startDate.plusDays(30);
        LocalDate returnDate = LocalDate.now();

        long totalDays = ChronoUnit.DAYS.between(startDate, originalEndDate);
        if (totalDays <= 0) totalDays = 1;

        long daysUsed = ChronoUnit.DAYS.between(startDate, returnDate);
        if (daysUsed < 0) daysUsed = 0;

        long daysRemaining = ChronoUnit.DAYS.between(returnDate, originalEndDate);
        if (daysRemaining < 0) daysRemaining = 0;

        BigDecimal rentalPaid = res.getRentalAmount() != null ? res.getRentalAmount() : BigDecimal.ZERO;
        BigDecimal depositAmount = res.getDepositAmount() != null ? res.getDepositAmount() : BigDecimal.ZERO;

        // Tiền thuê chưa dùng = Tiền thuê đã trả ÷ Tổng số ngày × Số ngày còn lại
        BigDecimal unusedRental = BigDecimal.ZERO;
        BigDecimal unusedRentalRefund = BigDecimal.ZERO;
        if (daysRemaining > 0 && totalDays > 0) {
            BigDecimal dailyRate = rentalPaid.divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP);
            unusedRental = dailyRate.multiply(BigDecimal.valueOf(daysRemaining));
            // Hoàn 50% tiền thuê chưa dùng (50% còn lại là phí vi phạm hợp đồng trả sớm)
            // Thong nhat nhom: Khong hoan lai tien thue chua dung khi tra kho som
            unusedRentalRefund = BigDecimal.ZERO;
        }

        // Quét các khoản phạt còn nợ (UNPAID) của hợp đồng này
        List<Payment> payments = paymentRepository.findByContractId(contractId);
        BigDecimal unpaidPenalties = BigDecimal.ZERO;
        for (Payment p : payments) {
            if ("OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType()) && ("PENDING".equalsIgnoreCase(p.getStatus()) || "OVERDUE".equalsIgnoreCase(p.getStatus()))) {
                unpaidPenalties = unpaidPenalties.add(p.getAmount());
            }
        }

        BigDecimal damageAndCleaningFee = BigDecimal.ZERO; // Mặc định preview là 0, Staff sẽ nhập khi xác nhận

        // Tổng khấu trừ theo thứ tự: Phạt UNPAID + Phí hư hại/vệ sinh
        BigDecimal totalDeductions = unpaidPenalties.add(damageAndCleaningFee);
        // Tổng tiền có: (Tiền thuê chưa dùng × 50%) + Tiền cọc gốc
        BigDecimal totalCredits = unusedRentalRefund.add(depositAmount);
        // Số tiền quyết toán cuối cùng = Tổng tiền có - Tổng khấu trừ
        BigDecimal netAmount = totalCredits.subtract(totalDeductions);

        boolean isRefund = netAmount.compareTo(BigDecimal.ZERO) >= 0;

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

        CheckoutPreviewResponse resp = new CheckoutPreviewResponse();
        String resCode = res.getReservationCode();
        String displayCode = (resCode != null && !resCode.isBlank()) ? resCode : ("CTR-" + contract.getContractId());
        resp.setContractId(contract.getContractId());
        resp.setContractCode(displayCode);
        resp.setUnitCode(res.getUnitCode());
        resp.setBranchCode(branchCode);
        resp.setContractStatus(contract.getStatus());

        resp.setStartDate(startDate);
        resp.setOriginalEndDate(originalEndDate);
        resp.setReturnDate(returnDate);
        resp.setTotalRentalDays(totalDays);
        resp.setDaysUsed(daysUsed);
        resp.setDaysRemaining(daysRemaining);

        resp.setRentalAmountPaid(rentalPaid);
        resp.setUnusedRentalAmount(unusedRental);
        resp.setUnusedRentalRefundAmount(unusedRentalRefund);
        resp.setDepositAmount(depositAmount);
        resp.setUnpaidPenalties(unpaidPenalties);
        resp.setDamageAndCleaningFee(damageAndCleaningFee);

        resp.setTotalDeductions(totalDeductions);
        resp.setNetSettlementAmount(netAmount.abs());
        resp.setRefund(isRefund);
        resp.setSettlementAction(isRefund ? "REFUND_PENDING" : "COMPENSATION_REQUIRED");

        return resp;
    }

    /**
     * US-28 & US-29: Xác nhận nhận bàn giao trả kho & chốt quyết toán
     */
    @Transactional
    public CheckoutConfirmResponse confirmCheckout(Integer contractId, CheckoutConfirmRequest request, Integer staffAccountId) {
        Integer staffFacilityId = staffShiftService.requireOnDutyFacility(staffAccountId);
        if (request == null || !request.isConfirmInspection()) {
            return CheckoutConfirmResponse.error("Bắt buộc phải tích xác nhận biên bản kiểm tra thực tế theo quy định trước khi hoàn tất!");
        }

        Optional<Contract> contractOpt = contractRepository.findById(contractId);
        if (contractOpt.isEmpty()) {
            contractOpt = contractRepository.findByReservationId(contractId);
        }
        if (contractOpt.isEmpty()) {
            return CheckoutConfirmResponse.error("Không tìm thấy hợp đồng #" + contractId);
        }

        Contract contract = contractOpt.get();
        if (!"ACTIVE".equalsIgnoreCase(contract.getStatus()) && !"OVERDUE".equalsIgnoreCase(contract.getStatus())) {
            return CheckoutConfirmResponse.error("Hợp đồng #" + contractId + " không ở trạng thái ACTIVE hoặc OVERDUE, không thể nhận bàn giao!");
        }

        Optional<Reservation> resOpt = reservationRepository.findById(contract.getReservationId());
        if (resOpt.isEmpty()) {
            return CheckoutConfirmResponse.error("Không tìm thấy thông tin đặt chỗ của hợp đồng!");
        }

        Reservation res = resOpt.get();

        // 1. Kiểm tra thẩm quyền cơ sở của Staff nếu có
        Optional<StorageUnit> unitOpt = storageUnitRepository.findById(res.getUnitCode());
        if (unitOpt.isEmpty()) {
            return CheckoutConfirmResponse.error("Không tìm thấy ô kho " + res.getUnitCode());
        }
        StorageUnit unit = unitOpt.get();
        Optional<Floor> floorOpt = floorRepository.findById(unit.getFloorId());
        Integer unitFacilityId = floorOpt.map(Floor::getFacilityId).orElse(1);

        if (staffFacilityId != null && !staffFacilityId.equals(unitFacilityId)) {
            return CheckoutConfirmResponse.error("Bạn không có quyền tiếp nhận trả kho của cơ sở khác!");
        }

        // 2. Tính toán tài chính quyết toán
        LocalDate startDate = res.getStartDate() != null ? res.getStartDate() : LocalDate.now();
        LocalDate originalEndDate = res.getEndDate() != null ? res.getEndDate() : startDate.plusDays(30);
        LocalDate returnDate = LocalDate.now();

        long totalDays = ChronoUnit.DAYS.between(startDate, originalEndDate);
        if (totalDays <= 0) totalDays = 1;
        long daysRemaining = ChronoUnit.DAYS.between(returnDate, originalEndDate);
        if (daysRemaining < 0) daysRemaining = 0;

        BigDecimal depositAmount = res.getDepositAmount() != null ? res.getDepositAmount() : BigDecimal.ZERO;

        // Thong nhat nhom: Khong hoan lai tien thue chua dung khi tra kho som
        BigDecimal unusedRentalRefund = BigDecimal.ZERO;

        // Lấy phạt quá hạn chưa nộp (UNPAID)
        List<Payment> payments = paymentRepository.findByContractId(contractId);
        BigDecimal unpaidPenalties = BigDecimal.ZERO;
        for (Payment p : payments) {
            if ("OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType()) && ("PENDING".equalsIgnoreCase(p.getStatus()) || "OVERDUE".equalsIgnoreCase(p.getStatus()))) {
                unpaidPenalties = unpaidPenalties.add(p.getAmount());
            }
        }

        BigDecimal damageFee = request.getDamageFee();
        BigDecimal cleaningFee = request.getCleaningFee();
        BigDecimal totalDeductions = unpaidPenalties.add(damageFee).add(cleaningFee);
        BigDecimal totalCredits = unusedRentalRefund.add(depositAmount);
        BigDecimal netAmount = totalCredits.subtract(totalDeductions);

        String branchCode = "HN01";
        Optional<Facility> facOpt = facilityRepository.findById(unitFacilityId);
        if (facOpt.isPresent()) {
            branchCode = storageService.mapFacilityToResponse(facOpt.get()).getFacilityCode();
        }
        String dateStr = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("ddMMyy"));
        int randomSuffix = (int) (1000 + (Math.random() * 9000));
        String cleanBranch = branchCode.replace("-", "").toUpperCase();

        // Nếu tiền cọc + hoàn < tổng khấu trừ -> Bị âm tiền (Khách phải nộp thêm truy thu CMP)
        if (netAmount.compareTo(BigDecimal.ZERO) < 0) {
            BigDecimal compensationDue = netAmount.abs();
            String cmpInvoice = String.format("CMP-%s-%s-%04d", cleanBranch, dateStr, randomSuffix);

            Payment cmpPayment = new Payment();
            cmpPayment.setContractId(contract.getContractId());
            cmpPayment.setInvoiceNumber(cmpInvoice);
            cmpPayment.setInvoiceType("INSPECTION_DAMAGE");
            cmpPayment.setAmount(compensationDue);
            cmpPayment.setIssuedAt(LocalDateTime.now());
            cmpPayment.setDueAt(LocalDateTime.now().plusDays(1));
            cmpPayment.setStatus("PENDING");
            cmpPayment.setPaymentStatus("PENDING");
            cmpPayment.setPaymentMethod(request.getRefundPaymentMethod());
            paymentRepository.save(cmpPayment);

            // "chỉ khi CMP = PAID mới cho chuyển TERMINATED"
            CheckoutConfirmResponse resp = new CheckoutConfirmResponse();
            resp.setSuccess(false);
            resp.setMessage(String.format("Khách hàng còn thiếu khoản truy thu hư hại/vệ sinh %s VNĐ (Hóa đơn %s). Khách cần thanh toán hóa đơn này trước khi chuyển hợp đồng sang TERMINATED theo quy định!",
                    compensationDue, cmpInvoice));
            resp.setContractId(contract.getContractId());
            resp.setContractStatus(contract.getStatus());
            resp.setUnitCode(unit.getUnitCode());
            resp.setUnitStatus(unit.getStatus());
            resp.setInvoiceNumber(cmpInvoice);
            resp.setInvoiceType("COMPENSATION");
            resp.setSettlementAmount(compensationDue);
            resp.setRefund(false);

            return resp;
        }

        // Tiền cọc đủ bù -> Không có tiền hoàn và không nợ thì chuyển thẳng COMPLETED
        if (netAmount.compareTo(BigDecimal.ZERO) > 0) {
            contract.setStatus("TERMINATED");
        } else {
            contract.setStatus("COMPLETED");
        }
        if (daysRemaining > 0) {
            contract.setCancelReason("EARLY_TERMINATION");
        }
        contract.setTerminatedAt(LocalDateTime.now());
        contractRepository.save(contract);

        // Ô kho chuyển ngay sang MAINTENANCE để Staff dọn dẹp
        unit.setStatus("MAINTENANCE");
        storageUnitRepository.save(unit);

        // Vô hiệu hóa toàn bộ mã PIN của khách tại cơ sở này ngay lập tức
        List<GatePin> pins = gatePinRepository.findByContractId(contract.getContractId());
        for (GatePin p : pins) {
            p.setStatus("EXPIRED");
            gatePinRepository.save(p);
        }

        // Sinh lệnh hoàn tiền REF trạng thái PENDING (chờ giải ngân trong 24-48h)
        String refInvoice = null;
        if (netAmount.compareTo(BigDecimal.ZERO) > 0) {
            refInvoice = String.format("REF-%s-%s-%04d", cleanBranch, dateStr, randomSuffix);
            Payment refPayment = new Payment();
            refPayment.setContractId(contract.getContractId());
            refPayment.setInvoiceNumber(refInvoice);
            refPayment.setInvoiceType("REF");
            refPayment.setAmount(netAmount);
            refPayment.setIssuedAt(LocalDateTime.now());
            refPayment.setDueAt(LocalDateTime.now().plusDays(2)); // 24-48h làm việc
            refPayment.setStatus("PENDING");
            refPayment.setPaymentStatus("PENDING");
            refPayment.setPaymentMethod(request.getRefundPaymentMethod());
            paymentRepository.save(refPayment);
        }

        // Đóng ticket EARLY_TERMINATION liên quan sang RESOLVED nếu có
        boolean ticketResolved = false;
        if (request.getTicketId() != null) {
            Optional<SupportTicket> ticketOpt = supportTicketRepository.findById(request.getTicketId().longValue());
            if (ticketOpt.isPresent()) {
                SupportTicket t = ticketOpt.get();
                t.setStatus("RESOLVED");
                t.setResolvedAt(LocalDateTime.now());
                t.setResolutionNote("Nhân viên đã hoàn tất nghiệm thu và nhận bàn giao ô kho lúc " + LocalDateTime.now());
                if (staffAccountId != null) {
                    t.setAssignedStaffId(staffAccountId);
                }
                supportTicketRepository.save(t);
                ticketResolved = true;
            }
        }
        try {
            Set<Long> processedTicketIds = new HashSet<>();
            if (request.getTicketId() != null) {
                supportTicketRepository.findById(request.getTicketId().longValue()).ifPresent(t -> {
                    t.setStatus("RESOLVED");
                    t.setResolvedAt(LocalDateTime.now());
                    t.setResolutionNote("Nhân viên đã hoàn tất nghiệm thu và nhận bàn giao ô kho lúc " + LocalDateTime.now());
                    if (staffAccountId != null) {
                        t.setAssignedStaffId(staffAccountId);
                    }
                    supportTicketRepository.save(t);
                    processedTicketIds.add(t.getId());
                });
            }
            List<SupportTicket> openTickets = supportTicketRepository.findByContractId(contract.getContractId());
            for (SupportTicket t : openTickets) {
                if (!processedTicketIds.contains(t.getId()) && "EARLY_TERMINATION".equalsIgnoreCase(t.getType()) && !"RESOLVED".equalsIgnoreCase(t.getStatus())) {
                    t.setStatus("RESOLVED");
                    t.setResolvedAt(LocalDateTime.now());
                    t.setResolutionNote("Nhân viên đã hoàn tất nghiệm thu và nhận bàn giao ô kho lúc " + LocalDateTime.now());
                    if (staffAccountId != null) {
                        t.setAssignedStaffId(staffAccountId);
                    }
                    supportTicketRepository.save(t);
                    processedTicketIds.add(t.getId());
                }
            }
            if (res.getUnitCode() != null) {
                List<SupportTicket> unitTickets = supportTicketRepository.findByUnitCode(res.getUnitCode());
                for (SupportTicket t : unitTickets) {
                    if (!processedTicketIds.contains(t.getId()) && "EARLY_TERMINATION".equalsIgnoreCase(t.getType()) && !"RESOLVED".equalsIgnoreCase(t.getStatus())) {
                        t.setStatus("RESOLVED");
                        t.setResolvedAt(LocalDateTime.now());
                        t.setResolutionNote("Nhân viên đã hoàn tất nghiệm thu và nhận bàn giao ô kho lúc " + LocalDateTime.now());
                        if (staffAccountId != null) {
                            t.setAssignedStaffId(staffAccountId);
                        }
                        supportTicketRepository.save(t);
                        processedTicketIds.add(t.getId());
                    }
                }
            }
        } catch (Exception ignored) {}

        // Ghi nhật ký kiểm toán
        if (activityLogRepository != null) {
            ActivityLog act = new ActivityLog();
            act.setAccountId(staffAccountId != null ? staffAccountId : res.getAccountId());
            act.setFacilityId(floorRepository.findById(unit.getFloorId()).map(Floor::getFacilityId).orElse(null));
            act.setAction("CONFIRM_CHECKOUT_TERMINATED");
            act.setDescription(String.format("Xác nhận bàn giao trả kho #%d (ô %s). HĐ -> TERMINATED, ô -> MAINTENANCE, PIN vô hiệu hóa. Quyết toán: %s (Hóa đơn hoàn: %s).",
                    contract.getContractId(), unit.getUnitCode(), netAmount, refInvoice != null ? refInvoice : "0 VNĐ"));
            act.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(act);
        }

        if (staffAccountId != null) {
            staffTaskService.completeCheckoutTaskForCurrentStaff(contract.getContractId(), staffAccountId);
        }

        CheckoutConfirmResponse resp = new CheckoutConfirmResponse();
        resp.setSuccess(true);
        resp.setMessage(String.format("Nhận bàn giao thành công! Hợp đồng đã chuyển TERMINATED, ô kho chuyển MAINTENANCE, mã PIN bị vô hiệu. Lệnh hoàn cọc: %s.",
                refInvoice != null ? refInvoice + " (" + netAmount + " VNĐ)" : "0 VNĐ"));
        resp.setContractId(contract.getContractId());
        resp.setContractStatus("TERMINATED");
        resp.setUnitCode(unit.getUnitCode());
        resp.setUnitStatus("MAINTENANCE");
        resp.setGatePinDisabled(true);
        resp.setInvoiceNumber(refInvoice);
        resp.setInvoiceType("REFUND");
        resp.setSettlementAmount(netAmount);
        resp.setRefund(true);
        resp.setTicketResolved(ticketResolved);

        return resp;
    }

    /**
     * US-29: Xác nhận đã hoàn tiền (Staff / Manager chuyển REF từ PENDING -> PAID/REFUNDED)
     */
    @Transactional
    public boolean confirmRefundExecution(Integer paymentId, Integer staffAccountId, String receiptUrl) {
        return confirmRefundExecution(paymentId, staffAccountId, receiptUrl, null, null);
    }

    @Transactional
    public boolean confirmRefundExecution(Integer paymentId, Integer staffAccountId, String receiptUrl, String transactionRef) {
        return confirmRefundExecution(paymentId, staffAccountId, receiptUrl, transactionRef, null);
    }

    @Transactional
    public boolean confirmRefundExecution(Integer paymentId, Integer staffAccountId, String receiptUrl, String transactionRef, Integer facilityId) {
        Optional<Payment> paymentOpt = paymentRepository.findById(paymentId);
        if (paymentOpt.isEmpty()) return false;

        Payment p = paymentOpt.get();
        if (p.getInvoiceNumber() == null || !p.getInvoiceNumber().startsWith("REF-")) {
            return false;
        }

        p.setStatus("REFUNDED");
        p.setPaymentStatus("SUCCESS");
        p.setPaidAt(LocalDateTime.now());
        if (receiptUrl != null && !receiptUrl.isBlank()) {
            p.setReceiptUrl(receiptUrl.trim());
        }
        if (transactionRef != null && !transactionRef.isBlank()) {
            p.setTransactionCode(transactionRef.trim());
        }
        paymentRepository.save(p);

        // B2: Nếu hợp đồng đã TERMINATED và không còn phiếu REF / CMP nào chưa xong -> hợp đồng sang COMPLETED
        if (p.getContractId() != null) {
            Optional<Contract> contractOpt = contractRepository.findById(p.getContractId());
            if (contractOpt.isPresent()) {
                Contract contract = contractOpt.get();
                if ("TERMINATED".equalsIgnoreCase(contract.getStatus())) {
                    List<Payment> contractPayments = paymentRepository.findByContractId(contract.getContractId());
                    boolean hasPending = contractPayments.stream().anyMatch(cp -> {
                        String invType = cp.getInvoiceType() != null ? cp.getInvoiceType().toUpperCase() : "";
                        String invNum = cp.getInvoiceNumber() != null ? cp.getInvoiceNumber().toUpperCase() : "";
                        boolean isRef = "REF".equals(invType) || invNum.startsWith("REF-");
                        boolean isCmp = "CMP".equals(invType) || "INSPECTION_DAMAGE".equals(invType) || invNum.startsWith("CMP-");

                        if (isRef) {
                            return "PENDING".equalsIgnoreCase(cp.getStatus());
                        }
                        if (isCmp) {
                            return !"PAID".equalsIgnoreCase(cp.getStatus()) && !"CANCELLED".equalsIgnoreCase(cp.getStatus());
                        }
                        return false;
                    });

                    if (!hasPending) {
                        contract.setStatus("COMPLETED");
                        contractRepository.save(contract);
                    }
                }
            }
        }

        if (activityLogRepository != null) {
            ActivityLog act = new ActivityLog();
            act.setAccountId(staffAccountId != null ? staffAccountId : 1);
            act.setAction("CONFIRM_REFUND_EXECUTED");
            StringBuilder desc = new StringBuilder();
            if (facilityId != null) {
                desc.append("[Cơ sở #").append(facilityId).append("] ");
            }
            desc.append("Đã chi tiền hoàn cọc hóa đơn ").append(p.getInvoiceNumber())
                .append(", số tiền: ").append(p.getAmount()).append(" VNĐ");
            if (transactionRef != null && !transactionRef.isBlank()) {
                desc.append(" (Mã GD: ").append(transactionRef.trim()).append(")");
            }
            if (receiptUrl != null && !receiptUrl.isBlank()) {
                desc.append(" (Đính kèm biên lai: ").append(receiptUrl.trim()).append(")");
            }
            act.setDescription(desc.toString());
            act.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(act);
        }

        // Tự động gửi Email xác nhận hoàn cọc kèm ảnh biên lai (BR-35)
        if (emailService != null && p.getContractId() != null) {
            try {
                contractRepository.findById(p.getContractId()).ifPresent(c -> {
                    if (c.getReservationId() != null) {
                        reservationRepository.findById(c.getReservationId()).ifPresent(r -> {
                            if (r.getAccountId() != null) {
                                accountRepository.findById(Long.valueOf(r.getAccountId())).ifPresent(acc -> {
                                    if (acc.getEmail() != null && !acc.getEmail().isBlank()) {
                                        String contractCode = (r.getReservationCode() != null && !r.getReservationCode().isBlank())
                                                ? r.getReservationCode() : ("CTR-" + c.getContractId());
                                        emailService.sendRefundConfirmationEmail(
                                                acc.getEmail(),
                                                acc.getFullName(),
                                                contractCode,
                                                p.getAmount(),
                                                receiptUrl,
                                                transactionRef
                                        );
                                    }
                                });
                            }
                        });
                    }
                });
            } catch (Exception ex) {
                System.err.println("Lỗi gửi email xác nhận hoàn cọc BR-35: " + ex.getMessage());
            }
        }

        return true;
    }



    /**
     * US-26 & B1: Lấy danh sách các đơn cọc chờ hoàn tiền (REF) cho Staff / Manager
     * Tự động lọc theo X-Facility-Id (cách ly cơ sở theo BR-06), sắp xếp mới nhất lên đầu
     */
    public List<RefundListItemResponse> getRefundList(String status) {
        return getRefundList(null, status);
    }

    public List<RefundListItemResponse> getRefundList(Integer facilityId, String status) {
        List<Payment> allPayments = paymentRepository.findAll();
        List<Payment> refundPayments = allPayments.stream()
                .filter(p -> {
                    String invType = p.getInvoiceType() != null ? p.getInvoiceType().toUpperCase() : "";
                    String invNum = p.getInvoiceNumber() != null ? p.getInvoiceNumber().toUpperCase() : "";
                    return "REF".equals(invType) || invNum.startsWith("REF-");
                })
                .filter(p -> {
                    if (status == null || status.trim().isEmpty() || "ALL".equalsIgnoreCase(status.trim())) {
                        return true;
                    }
                    String filterStatus = status.trim().toUpperCase();
                    String pStatus = p.getStatus() != null ? p.getStatus().toUpperCase() : "";
                    if ("REFUNDED".equals(filterStatus)) {
                        return "REFUNDED".equals(pStatus) || "PAID".equals(pStatus);
                    }
                    return filterStatus.equals(pStatus);
                })
                .sorted((a, b) -> {
                    LocalDateTime t1 = a.getIssuedAt() != null ? a.getIssuedAt() : LocalDateTime.MIN;
                    LocalDateTime t2 = b.getIssuedAt() != null ? b.getIssuedAt() : LocalDateTime.MIN;
                    return t2.compareTo(t1);
                })
                .collect(java.util.stream.Collectors.toList());

        List<RefundListItemResponse> result = new ArrayList<>();
        for (Payment p : refundPayments) {
            Contract c = (p.getContractId() != null) ? contractRepository.findById(p.getContractId()).orElse(null) : null;
            Reservation r = (c != null && c.getReservationId() != null) ? reservationRepository.findById(c.getReservationId()).orElse(null) : null;

            // Kiểm tra lọc theo cơ sở nếu có facilityId (BR-06)
            if (facilityId != null && facilityId > 0 && r != null) {
                StorageUnit unit = (r.getUnitCode() != null) ? storageUnitRepository.findById(r.getUnitCode()).orElse(null) : null;
                Floor floor = (unit != null && unit.getFloorId() != null) ? floorRepository.findById(unit.getFloorId()).orElse(null) : null;
                if (floor == null || !facilityId.equals(floor.getFacilityId())) {
                    continue;
                }
            }

            Account acc = (r != null && r.getAccountId() != null) ? accountRepository.findAccountByAccountId(r.getAccountId()).orElse(null) : null;

            String reservationCode = (r != null) ? r.getReservationCode() : ("CTR-" + p.getContractId());
            String unitCode = (r != null) ? r.getUnitCode() : "N/A";
            String customerName = (acc != null) ? acc.getFullName() : "Khách hàng";
            String customerPhone = (acc != null) ? acc.getPhone() : "";
            String bankName = (c != null) ? c.getRefundBankName() : null;
            String accNumber = (c != null) ? c.getRefundAccountNumber() : null;
            String accName = (c != null) ? c.getRefundAccountName() : null;

            // Fallback lấy từ CustomerProfile nếu hợp đồng chưa lưu thông tin ngân hàng
            if ((bankName == null || accNumber == null || accName == null) && r != null && r.getAccountId() != null && customerProfileRepository != null) {
                CustomerProfile cp = customerProfileRepository.findByAccountId(r.getAccountId()).orElse(null);
                if (cp != null) {
                    if (bankName == null) bankName = cp.getBankName();
                    if (accNumber == null) accNumber = cp.getBankAccountNumber();
                    if (accName == null) accName = cp.getBankAccountName();
                }
            }
            String cancelReason = (c != null) ? c.getCancelReason() : null;

            String refundType = "CHECKOUT_SETTLEMENT";
            if (c != null && "EARLY_TERMINATION".equalsIgnoreCase(c.getCancelReason())) {
                refundType = "EARLY_TERMINATION";
            } else if (c != null && "COUNTER_CANCEL".equalsIgnoreCase(c.getCancelReason())) {
                refundType = "COUNTER_CANCEL";
            } else if (c != null && ("CUSTOMER_REQUEST".equalsIgnoreCase(c.getCancelReason()) || "NO_SHOW".equalsIgnoreCase(c.getCancelReason()))) {
                refundType = "CANCEL_DEPOSIT";
            } else if (c != null && "CANCELLED".equalsIgnoreCase(c.getStatus())) {
                refundType = "CANCEL_DEPOSIT";
            }

            String normStatus = p.getStatus() != null ? p.getStatus().toUpperCase() : "PENDING";
            if ("PAID".equals(normStatus)) {
                normStatus = "REFUNDED";
            }

            RefundListItemResponse item = new RefundListItemResponse(
                    p.getPaymentId(),
                    p.getInvoiceNumber(),
                    p.getContractId(),
                    reservationCode,
                    unitCode,
                    customerName,
                    customerPhone,
                    p.getAmount(),
                    bankName,
                    accNumber,
                    accName,
                    cancelReason,
                    normStatus,
                    p.getIssuedAt()
            );
            item.setContractCode(reservationCode);
            item.setRefundType(refundType);
            item.setRefundedAt(p.getPaidAt());
            item.setTransactionCode(p.getTransactionCode());
            item.setEvidenceUrl(p.getReceiptUrl());

            result.add(item);
        }
        return result;
    }
}
