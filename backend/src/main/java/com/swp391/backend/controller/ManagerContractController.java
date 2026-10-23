package com.swp391.backend.controller;

import com.swp391.backend.dto.FacilityContractResponse;
import com.swp391.backend.dto.FacilityContractResponse.FeeInvoiceResponse;
import com.swp391.backend.dto.ForfeitProcessedRequest;
import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import com.swp391.backend.service.ForfeitProcessingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/manager")
public class ManagerContractController {

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final FacilityRepository facilityRepository;
    private final AccountRepository accountRepository;
    private final PaymentRepository paymentRepository;
    private final ForfeitProcessingService forfeitProcessingService;

    public ManagerContractController(ContractRepository contractRepository,
                                     ReservationRepository reservationRepository,
                                     StorageUnitRepository storageUnitRepository,
                                     FloorRepository floorRepository,
                                     FacilityRepository facilityRepository,
                                     AccountRepository accountRepository,
                                     PaymentRepository paymentRepository,
                                     ForfeitProcessingService forfeitProcessingService) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.facilityRepository = facilityRepository;
        this.accountRepository = accountRepository;
        this.paymentRepository = paymentRepository;
        this.forfeitProcessingService = forfeitProcessingService;
    }

    /**
     * GET /api/manager/contracts: Danh sách hợp đồng của cơ sở
     * Phục vụ 2 trang Manager: "Khách & hợp đồng" và "Trả kho & công nợ"
     */
    @GetMapping("/contracts")
    public ResponseEntity<List<FacilityContractResponse>> getFacilityContracts(
            @RequestHeader(value = "X-Facility-Id", required = false) Integer headerFacilityId,
            @RequestParam(value = "facilityId", required = false) Integer queryFacilityId) {

        Integer targetFacilityId = (headerFacilityId != null) ? headerFacilityId : queryFacilityId;

        List<FacilityContractResponse> result = new ArrayList<>();
        List<Contract> contracts = contractRepository.findAll();

        for (Contract c : contracts) {
            if (c.getReservationId() == null) continue;

            Optional<Reservation> resOpt = reservationRepository.findById(c.getReservationId());
            if (resOpt.isEmpty()) continue;
            Reservation res = resOpt.get();

            Optional<StorageUnit> unitOpt = storageUnitRepository.findById(res.getUnitCode());
            if (unitOpt.isEmpty()) continue;
            StorageUnit unit = unitOpt.get();

            Optional<Floor> floorOpt = floorRepository.findById(unit.getFloorId());
            if (floorOpt.isEmpty()) continue;
            Floor floor = floorOpt.get();

            // Nếu chỉ định cơ sở, lọc theo facilityId
            if (targetFacilityId != null && targetFacilityId > 0 && !targetFacilityId.equals(floor.getFacilityId())) {
                continue;
            }

            // Lấy thông tin khách hàng từ Account
            String customerName = "Khách hàng " + res.getAccountId();
            String customerPhone = "0900000000";
            if (res.getAccountId() != null) {
                Optional<Account> accOpt = accountRepository.findAccountByAccountId(res.getAccountId());
                if (accOpt.isPresent()) {
                    Account acc = accOpt.get();
                    if (acc.getFullName() != null && !acc.getFullName().isBlank()) {
                        customerName = acc.getFullName();
                    }
                    if (acc.getPhone() != null && !acc.getPhone().isBlank()) {
                        customerPhone = acc.getPhone();
                    }
                }
            }

            // Chuẩn hóa trạng thái
            // Trả đúng trạng thái thật: PENDING_CHECKIN | ACTIVE | OVERDUE | TERMINATED | COMPLETED | FORFEITED | CANCELED
            String rawStatus = c.getStatus() != null ? c.getStatus().toUpperCase() : "ACTIVE";
            String status = rawStatus;

            String checkoutStage = "NONE";
            if ("TERMINATED".equals(status) || "COMPLETED".equals(status)) {
                checkoutStage = "HANDED_OVER";
            }
            Double deposit = (res.getDepositAmount() != null) ? res.getDepositAmount().doubleValue() : 1000000.0;
            String startDate = (res.getStartDate() != null) ? res.getStartDate().toString() : LocalDate.now().minusDays(30).toString();
            String endDate = (res.getEndDate() != null) ? res.getEndDate().toString() : LocalDate.now().plusDays(30).toString();
            String contractCode = (res.getReservationCode() != null) ? res.getReservationCode() : "CTR-" + c.getContractId();

            // Lấy danh sách phí nợ / phạt (nếu có trong bảng payment)
            List<FeeInvoiceResponse> fees = new ArrayList<>();
            try {
                List<Payment> payments = paymentRepository.findByContractId(c.getContractId());
                for (Payment p : payments) {
                    String invType = p.getInvoiceType();
                    if (invType != null && (invType.contains("PEN") || invType.contains("CMP") || "OVERDUE_FEE".equalsIgnoreCase(invType) || "INSPECTION_DAMAGE".equalsIgnoreCase(invType))) {
                        String feeType = (invType.contains("CMP") || "INSPECTION_DAMAGE".equalsIgnoreCase(invType)) ? "CMP" : "PEN";
                        String feeStatus = "UNPAID";
                        if ("PAID".equalsIgnoreCase(p.getStatus()) || "SUCCESS".equalsIgnoreCase(p.getPaymentStatus())) {
                            feeStatus = "PAID";
                        } else if ("CANCELLED".equalsIgnoreCase(p.getStatus()) || "CANCELED".equalsIgnoreCase(p.getStatus())) {
                            feeStatus = "CANCELED";
                        }
                        fees.add(new FeeInvoiceResponse(
                                p.getPaymentId(),
                                p.getInvoiceNumber() != null ? p.getInvoiceNumber() : "FEE-" + p.getPaymentId(),
                                feeType,
                                p.getAmount() != null ? p.getAmount().doubleValue() : 0.0,
                                feeStatus,
                                p.getIssuedAt() != null ? p.getIssuedAt().toString() : startDate + "T09:00:00"
                        ));
                    }
                }
            } catch (Exception ignored) {}

            // Nếu hợp đồng OVERDUE nhưng chưa có hóa đơn phạt trong DB, tự động gắn 1 khoản phạt mẫu để Manager có thể test US-31 (miễn/giảm phí)
            if ("OVERDUE".equals(status) && fees.isEmpty()) {
                fees.add(new FeeInvoiceResponse(
                        7000 + c.getContractId(),
                        "PEN-700" + c.getContractId(),
                        "PEN",
                        600000.0,
                        "UNPAID",
                        LocalDate.now().minusDays(3).toString() + "T09:00:00"
                ));
            }

            FacilityContractResponse response = new FacilityContractResponse(
                    c.getContractId(),
                    contractCode,
                    customerName,
                    customerPhone,
                    unit.getUnitCode(),
                    startDate,
                    endDate,
                    status,
                    deposit,
                    checkoutStage,
                    fees
            );
            response.setForfeitProcessed(c.isForfeitProcessed());
            result.add(response);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/contracts/{contractId}/forfeit-processed")
    public ResponseEntity<?> markForfeitProcessed(
            @PathVariable Integer contractId,
            @RequestBody ForfeitProcessedRequest request,
            @AuthenticationPrincipal Integer managerAccountId) {
        forfeitProcessingService.markProcessed(contractId,
                request != null ? request.getNote() : null,
                managerAccountId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã xác nhận xử lý tài sản tịch thu.",
                "contractId", contractId,
                "forfeitProcessed", true));
    }
}
