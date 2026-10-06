package com.swp391.backend.service;

import com.swp391.backend.dto.checkout.CheckoutConfirmRequest;
import com.swp391.backend.dto.checkout.CheckoutConfirmResponse;
import com.swp391.backend.dto.checkout.CheckoutPreviewResponse;
import com.swp391.backend.dto.checkout.FeeDiscountRequest;
import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

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

    public CheckoutSettlementService(ContractRepository contractRepository,
                                   ReservationRepository reservationRepository,
                                   StorageUnitRepository storageUnitRepository,
                                   FloorRepository floorRepository,
                                   FacilityRepository facilityRepository,
                                   PaymentRepository paymentRepository,
                                   GatePinRepository gatePinRepository,
                                   SupportTicketRepository supportTicketRepository,
                                   ActivityLogRepository activityLogRepository,
                                   StorageService storageService) {
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
    }

    /**
     * US-28 & US-29: Tính toán dự thảo quyết toán trả kho & hoàn cọc (BR-30, BR-33, BR-34, BR-36)
     */
    public CheckoutPreviewResponse calculateCheckoutPreview(Integer contractId) {
        Optional<Contract> contractOpt = contractRepository.findById(contractId);
        if (contractOpt.isEmpty()) {
            return CheckoutPreviewResponse.error("Không tìm thấy hợp đồng #" + contractId);
        }

        Contract contract = contractOpt.get();
        // [BR-21, BR-36]: Cho phép trả kho khi hợp đồng ACTIVE hoặc OVERDUE
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

        // [BR-36]: Tiền thuê chưa dùng = Tiền thuê đã trả ÷ Tổng số ngày × Số ngày còn lại
        BigDecimal unusedRental = BigDecimal.ZERO;
        BigDecimal unusedRentalRefund = BigDecimal.ZERO;
        if (daysRemaining > 0 && totalDays > 0) {
            BigDecimal dailyRate = rentalPaid.divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP);
            unusedRental = dailyRate.multiply(BigDecimal.valueOf(daysRemaining));
            // Hoàn 50% tiền thuê chưa dùng (50% còn lại là phí vi phạm hợp đồng trả sớm theo BR-36)
            unusedRentalRefund = unusedRental.multiply(BigDecimal.valueOf(0.5)).setScale(0, RoundingMode.HALF_UP);
        }

        // [BR-30, BR-34]: Quét các khoản phạt còn nợ (UNPAID) của hợp đồng này
        List<Payment> payments = paymentRepository.findByContractId(contractId);
        BigDecimal unpaidPenalties = BigDecimal.ZERO;
        for (Payment p : payments) {
            if ("OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType()) && ("PENDING".equalsIgnoreCase(p.getStatus()) || "OVERDUE".equalsIgnoreCase(p.getStatus()))) {
                unpaidPenalties = unpaidPenalties.add(p.getAmount());
            }
        }

        BigDecimal damageAndCleaningFee = BigDecimal.ZERO; // Mặc định preview là 0, Staff sẽ nhập khi xác nhận

        // Tổng khấu trừ theo thứ tự BR-34: Phạt UNPAID + Phí hư hại/vệ sinh
        BigDecimal totalDeductions = unpaidPenalties.add(damageAndCleaningFee);
        // Tổng tiền có: (Tiền thuê chưa dùng × 50%) + Tiền cọc gốc
        BigDecimal totalCredits = unusedRentalRefund.add(depositAmount);
        // Số tiền quyết toán cuối cùng = Tổng tiền có - Tổng khấu trừ
        BigDecimal netAmount = totalCredits.subtract(totalDeductions);

        boolean isRefund = netAmount.compareTo(BigDecimal.ZERO) >= 0;

        String branchCode = "HN-01";
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
        resp.setSuccess(true);
        resp.setMessage("Tính toán dự thảo quyết toán trả kho thành công!");
        resp.setContractId(contract.getContractId());
        resp.setContractCode("#HD-" + contract.getContractId());
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
     * US-28 & US-29: Xác nhận nhận bàn giao trả kho & chốt quyết toán (BR-11, BR-12, BR-21, BR-24, BR-34, BR-35, BR-36, BR-37)
     */
    @Transactional
    public CheckoutConfirmResponse confirmCheckout(Integer contractId, CheckoutConfirmRequest request, Integer staffAccountId, Integer staffFacilityId) {
        if (request == null || !request.isConfirmInspection()) {
            return CheckoutConfirmResponse.error("Bắt buộc phải tích xác nhận biên bản kiểm tra thực tế theo quy định [BR-33] trước khi hoàn tất!");
        }

        Optional<Contract> contractOpt = contractRepository.findById(contractId);
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
            return CheckoutConfirmResponse.error("Bạn không có quyền tiếp nhận trả kho của cơ sở khác [BR-06]!");
        }

        // 2. Tính toán tài chính quyết toán
        LocalDate startDate = res.getStartDate() != null ? res.getStartDate() : LocalDate.now();
        LocalDate originalEndDate = res.getEndDate() != null ? res.getEndDate() : startDate.plusDays(30);
        LocalDate returnDate = LocalDate.now();

        long totalDays = ChronoUnit.DAYS.between(startDate, originalEndDate);
        if (totalDays <= 0) totalDays = 1;
        long daysRemaining = ChronoUnit.DAYS.between(returnDate, originalEndDate);
        if (daysRemaining < 0) daysRemaining = 0;

        BigDecimal rentalPaid = res.getRentalAmount() != null ? res.getRentalAmount() : BigDecimal.ZERO;
        BigDecimal depositAmount = res.getDepositAmount() != null ? res.getDepositAmount() : BigDecimal.ZERO;

        BigDecimal unusedRentalRefund = BigDecimal.ZERO;
        if (daysRemaining > 0 && totalDays > 0) {
            BigDecimal dailyRate = rentalPaid.divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP);
            BigDecimal unusedRental = dailyRate.multiply(BigDecimal.valueOf(daysRemaining));
            unusedRentalRefund = unusedRental.multiply(BigDecimal.valueOf(0.5)).setScale(0, RoundingMode.HALF_UP);
        }

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

        String branchCode = "HN-01";
        Optional<Facility> facOpt = facilityRepository.findById(unitFacilityId);
        if (facOpt.isPresent()) {
            branchCode = storageService.mapFacilityToResponse(facOpt.get()).getFacilityCode();
        }

        String dateStr = LocalDate.now().toString().replace("-", "");
        int randomSuffix = (int) (1000 + (Math.random() * 9000));

        // [BR-34]: Nếu tiền cọc + hoàn < tổng khấu trừ -> Bị âm tiền (Khách phải nộp thêm truy thu CMP)
        if (netAmount.compareTo(BigDecimal.ZERO) < 0) {
            BigDecimal compensationDue = netAmount.abs();
            String cmpInvoice = String.format("CMP-%s-%s-%d", branchCode, dateStr, randomSuffix);

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

            // [BR-34]: "chỉ khi CMP = PAID mới cho chuyển TERMINATED"
            CheckoutConfirmResponse resp = new CheckoutConfirmResponse();
            resp.setSuccess(false);
            resp.setMessage(String.format("Khách hàng còn thiếu khoản truy thu hư hại/vệ sinh %s VNĐ (Hóa đơn %s). Khách cần thanh toán hóa đơn này trước khi chuyển hợp đồng sang TERMINATED theo BR-34!",
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

        // [BR-21, BR-36]: Tiền cọc đủ bù -> Hoàn tất chuyển TERMINATED hợp đồng
        contract.setStatus("TERMINATED");
        contract.setTerminatedAt(LocalDateTime.now());
        contractRepository.save(contract);

        // [BR-12]: Ô kho chuyển ngay sang UNDER_MAINTENANCE để Staff dọn dẹp
        unit.setStatus("UNDER_MAINTENANCE");
        storageUnitRepository.save(unit);

        // [BR-24, BR-36]: Vô hiệu hóa toàn bộ mã PIN của khách tại cơ sở này ngay lập tức
        List<GatePin> pins = gatePinRepository.findByContractId(contract.getContractId());
        for (GatePin p : pins) {
            p.setStatus("EXPIRED");
            gatePinRepository.save(p);
        }

        // [BR-35, BR-37]: Sinh lệnh hoàn tiền REF trạng thái PENDING (chờ giải ngân trong 24-48h)
        String refInvoice = null;
        if (netAmount.compareTo(BigDecimal.ZERO) > 0) {
            refInvoice = String.format("REF-%s-%s-%d", branchCode, dateStr, randomSuffix);
            Payment refPayment = new Payment();
            refPayment.setContractId(contract.getContractId());
            refPayment.setInvoiceNumber(refInvoice);
            refPayment.setInvoiceType("INSPECTION_DAMAGE");
            refPayment.setAmount(netAmount);
            refPayment.setIssuedAt(LocalDateTime.now());
            refPayment.setDueAt(LocalDateTime.now().plusDays(2)); // 24-48h theo BR-35
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

        // [BR-46]: Ghi nhật ký kiểm toán
        if (activityLogRepository != null) {
            ActivityLog act = new ActivityLog();
            act.setAccountId(staffAccountId != null ? staffAccountId : res.getAccountId());
            act.setAction("CONFIRM_CHECKOUT_TERMINATED");
            act.setDescription(String.format("Xác nhận bàn giao trả kho #%d (ô %s). HĐ -> TERMINATED, ô -> UNDER_MAINTENANCE, PIN vô hiệu hóa. Quyết toán: %s (Hóa đơn hoàn: %s).",
                    contract.getContractId(), unit.getUnitCode(), netAmount, refInvoice != null ? refInvoice : "0 VNĐ"));
            act.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(act);
        }

        CheckoutConfirmResponse resp = new CheckoutConfirmResponse();
        resp.setSuccess(true);
        resp.setMessage(String.format("Nhận bàn giao thành công! Hợp đồng đã chuyển TERMINATED, ô kho chuyển UNDER_MAINTENANCE, mã PIN bị vô hiệu. Lệnh hoàn cọc: %s.",
                refInvoice != null ? refInvoice + " (" + netAmount + " VNĐ)" : "0 VNĐ"));
        resp.setContractId(contract.getContractId());
        resp.setContractStatus("TERMINATED");
        resp.setUnitCode(unit.getUnitCode());
        resp.setUnitStatus("UNDER_MAINTENANCE");
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
    public boolean confirmRefundExecution(Integer paymentId, Integer staffAccountId) {
        Optional<Payment> paymentOpt = paymentRepository.findById(paymentId);
        if (paymentOpt.isEmpty()) return false;

        Payment p = paymentOpt.get();
        if (p.getInvoiceNumber() == null || !p.getInvoiceNumber().startsWith("REF-")) {
            return false;
        }

        p.setStatus("PAID");
        p.setPaymentStatus("SUCCESS");
        p.setPaidAt(LocalDateTime.now());
        paymentRepository.save(p);

        if (activityLogRepository != null) {
            ActivityLog act = new ActivityLog();
            act.setAccountId(staffAccountId != null ? staffAccountId : 1);
            act.setAction("CONFIRM_REFUND_EXECUTED");
            act.setDescription("Đã chi tiền hoàn cọc hóa đơn " + p.getInvoiceNumber() + ", số tiền: " + p.getAmount() + " VNĐ");
            act.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(act);
        }

        return true;
    }

    /**
     * US-31: Miễn / Giảm phí (Facility Manager duyệt theo BR-48)
     */
    @Transactional
    public Payment applyFeeDiscount(Integer paymentId, FeeDiscountRequest request, Integer managerAccountId, Integer managerFacilityId) {
        if (request == null || request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Bắt buộc phải nhập lý do miễn / giảm phí theo quy định [BR-48]!");
        }

        Optional<Payment> paymentOpt = paymentRepository.findById(paymentId);
        if (paymentOpt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy hóa đơn phí #" + paymentId);
        }

        Payment p = paymentOpt.get();
        // Chỉ miễn giảm các khoản phí phạt OVERDUE_FEE hoặc phí bồi thường hư hại INSPECTION_DAMAGE
        if (!"OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType()) && !"INSPECTION_DAMAGE".equalsIgnoreCase(p.getInvoiceType())) {
            throw new IllegalArgumentException("Chỉ được miễn giảm các khoản phí phạt trễ hạn hoặc phí hư hại theo chính sách!");
        }

        if ("PAID".equalsIgnoreCase(p.getStatus())) {
            throw new IllegalArgumentException("Hóa đơn đã thanh toán xong, không thể miễn giảm!");
        }

        BigDecimal originalAmount = p.getAmount();
        BigDecimal newAmount = originalAmount;

        if (request.getDiscountPercent() != null && request.getDiscountPercent() >= 100) {
            // [BR-48]: Miễn 100% -> Khoản phí chuyển sang CANCELLED
            p.setStatus("CANCELLED");
            p.setPaymentStatus("FAILED");
            p.setAmount(BigDecimal.ZERO);
        } else if (request.getDiscountPercent() != null && request.getDiscountPercent() > 0) {
            BigDecimal factor = BigDecimal.valueOf(100 - request.getDiscountPercent()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            newAmount = originalAmount.multiply(factor).setScale(0, RoundingMode.HALF_UP);
            p.setAmount(newAmount);
        } else if (request.getDiscountAmount() != null && request.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            newAmount = originalAmount.subtract(request.getDiscountAmount());
            if (newAmount.compareTo(BigDecimal.ZERO) <= 0) {
                p.setStatus("CANCELLED");
                p.setPaymentStatus("FAILED");
                p.setAmount(BigDecimal.ZERO);
            } else {
                p.setAmount(newAmount);
            }
        }

        paymentRepository.save(p);

        // Ghi nhật ký kiểm toán [BR-46]
        if (activityLogRepository != null) {
            ActivityLog act = new ActivityLog();
            act.setAccountId(managerAccountId != null ? managerAccountId : 1);
            act.setAction("APPROVE_FEE_DISCOUNT");
            act.setDescription(String.format("Quản lý duyệt miễn giảm hóa đơn %s từ %s xuống %s VNĐ. Lý do: %s",
                    p.getInvoiceNumber(), originalAmount, p.getAmount(), request.getReason().trim()));
            act.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(act);
        }

        return p;
    }
}
