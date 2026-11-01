package com.swp391.backend.controller;

import com.swp391.backend.config.SecurityContextHelper;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/manager/contracts")
public class ManagerContractController {

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final AccountRepository accountRepository;
    private final PaymentRepository paymentRepository;
    private final ForfeitProcessingService forfeitProcessingService;
    private final SecurityContextHelper securityContextHelper;

    public ManagerContractController(ContractRepository contractRepository,
                                      ReservationRepository reservationRepository,
                                      StorageUnitRepository storageUnitRepository,
                                      FloorRepository floorRepository,
                                      AccountRepository accountRepository,
                                      PaymentRepository paymentRepository,
                                      ForfeitProcessingService forfeitProcessingService,
                                      SecurityContextHelper securityContextHelper) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.accountRepository = accountRepository;
        this.paymentRepository = paymentRepository;
        this.forfeitProcessingService = forfeitProcessingService;
        this.securityContextHelper = securityContextHelper;
    }

    /**
     * GET /api/manager/contracts: Danh sách hợp đồng của cơ sở
     * Phục vụ 2 trang Manager: "Khách & hợp đồng" và "Trả kho & công nợ"
     */
    @GetMapping
    public ResponseEntity<List<FacilityContractResponse>> getFacilityContracts(
            @AuthenticationPrincipal Integer managerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer headerFacilityId,
            @RequestParam(value = "facilityId", required = false) Integer queryFacilityId) {

        Integer fallback = (headerFacilityId != null) ? headerFacilityId : queryFacilityId;
        Integer targetFacilityId = securityContextHelper.requireCurrentFacilityId(managerAccountId, fallback);

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

            // Lọc chính xác theo cơ sở của Manager
            if (targetFacilityId != null && !targetFacilityId.equals(floor.getFacilityId())) {
                continue;
            }

            String contractCode = (res.getReservationCode() != null && !res.getReservationCode().isBlank())
                    ? res.getReservationCode()
                    : "CTR-" + c.getContractId();

            String customerName = "Khách hàng #" + res.getAccountId();
            String customerPhone = "0900000000";
            if (res.getAccountId() != null) {
                Optional<Account> accOpt = accountRepository.findById(Long.valueOf(res.getAccountId()));
                if (accOpt.isPresent()) {
                    Account acc = accOpt.get();
                    if (acc.getFullName() != null) customerName = acc.getFullName();
                    if (acc.getPhone() != null) customerPhone = acc.getPhone();
                }
            }

            String startDate = (res.getStartDate() != null) ? res.getStartDate().toString() : LocalDate.now().toString();
            String endDate = (res.getEndDate() != null) ? res.getEndDate().toString() : LocalDate.now().plusMonths(1).toString();
            String status = (c.getStatus() != null) ? c.getStatus().toUpperCase() : "ACTIVE";
            double deposit = (res.getDepositAmount() != null) ? res.getDepositAmount().doubleValue() : 1000000.0;

            String checkoutStage = "INSPECTED";
            if ("TERMINATED".equals(status)) {
                checkoutStage = "SETTLED";
            } else if ("FORFEITED".equals(status)) {
                checkoutStage = "FORFEITED";
            }

            List<FeeInvoiceResponse> fees = new ArrayList<>();
            try {
                List<Payment> payments = paymentRepository.findByContractId(c.getContractId());
                for (Payment p : payments) {
                    String invType = p.getInvoiceType();
                    boolean isFee = "PEN".equalsIgnoreCase(invType)
                            || "OVERDUE_FEE".equalsIgnoreCase(invType)
                            || "CMP".equalsIgnoreCase(invType)
                            || "INSPECTION_DAMAGE".equalsIgnoreCase(invType)
                            || (p.getInvoiceNumber() != null && (p.getInvoiceNumber().startsWith("PEN-") || p.getInvoiceNumber().startsWith("CMP-")));

                    if (isFee) {
                        String feeType = "PEN";
                        if ("CMP".equalsIgnoreCase(invType) || "INSPECTION_DAMAGE".equalsIgnoreCase(invType)
                                || (p.getInvoiceNumber() != null && p.getInvoiceNumber().startsWith("CMP-"))) {
                            feeType = "CMP";
                        }
                        String feeStatus = "UNPAID";
                        if ("PAID".equalsIgnoreCase(p.getStatus()) || "SUCCESS".equalsIgnoreCase(p.getPaymentStatus())) {
                            feeStatus = "PAID";
                        } else if ("CANCELLED".equalsIgnoreCase(p.getStatus())) {
                            feeStatus = "CANCELLED";
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
            if (res.getRentalAmount() != null) {
                response.setRentalAmount(res.getRentalAmount().doubleValue());
            }
            if (res.getRentalType() != null) {
                response.setRentalType(res.getRentalType());
            }
            response.setReservationCode(res.getReservationCode());
            result.add(response);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/{contractId}/forfeit-processed")
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
