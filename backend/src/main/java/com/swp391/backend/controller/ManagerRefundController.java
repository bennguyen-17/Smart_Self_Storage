package com.swp391.backend.controller;

import com.swp391.backend.config.SecurityContextHelper;
import com.swp391.backend.dto.checkout.RefundListItemResponse;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.FloorRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import com.swp391.backend.service.CheckoutSettlementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/manager/refunds")
public class ManagerRefundController {

    private final CheckoutSettlementService checkoutSettlementService;
    private final PaymentRepository paymentRepository;
    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final SecurityContextHelper securityContextHelper;

    public ManagerRefundController(CheckoutSettlementService checkoutSettlementService,
                                   PaymentRepository paymentRepository,
                                   ContractRepository contractRepository,
                                   ReservationRepository reservationRepository,
                                   StorageUnitRepository storageUnitRepository,
                                   FloorRepository floorRepository,
                                   SecurityContextHelper securityContextHelper) {
        this.checkoutSettlementService = checkoutSettlementService;
        this.paymentRepository = paymentRepository;
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.securityContextHelper = securityContextHelper;
    }

    /**
     * B1: GET /api/manager/refunds?status=PENDING|REFUNDED|ALL
     * Tự động lấy facilityId từ token/hồ sơ của Manager
     */
    @GetMapping
    public ResponseEntity<List<RefundListItemResponse>> getManagerRefunds(
            @AuthenticationPrincipal Integer authAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer headerFacilityId,
            @RequestParam(value = "facilityId", required = false) Integer queryFacilityId,
            @RequestParam(value = "status", required = false, defaultValue = "PENDING") String status) {

        Integer fallback = headerFacilityId != null ? headerFacilityId : queryFacilityId;
        Integer facilityId = securityContextHelper.requireCurrentFacilityId(authAccountId, fallback);
        List<RefundListItemResponse> list = checkoutSettlementService.getRefundList(facilityId, status);
        return ResponseEntity.ok(list);
    }

    /**
     * B1: POST /api/manager/refunds/{paymentId}/confirm
     * Body: { evidenceUrl, transactionRef? }
     */
    @PostMapping("/{paymentId}/confirm")
    public ResponseEntity<?> confirmRefund(
            @PathVariable Integer paymentId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal Integer authAccountId,
            @RequestHeader(value = "X-Account-Id", required = false) Integer managerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer managerFacilityId) {

        Integer effectiveAccountId = authAccountId != null ? authAccountId : managerAccountId;
        Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(effectiveAccountId, managerFacilityId);

        String evidenceUrl = body != null ? (body.get("evidenceUrl") != null ? body.get("evidenceUrl") : body.get("receiptUrl")) : null;
        String transactionRef = body != null ? body.get("transactionRef") : null;

        if (evidenceUrl == null || evidenceUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Thiếu biên lai chuyển khoản"));
        }

        Optional<Payment> paymentOpt = paymentRepository.findById(paymentId);
        if (paymentOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy hóa đơn hoàn tiền hợp lệ!"));
        }

        Payment payment = paymentOpt.get();
        if ("REFUNDED".equalsIgnoreCase(payment.getStatus()) || "PAID".equalsIgnoreCase(payment.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Phiếu đã được hoàn"));
        }

        // Kiểm tra cơ sở
        if (effectiveFacilityId != null && effectiveFacilityId > 0 && payment.getContractId() != null) {
            Optional<Contract> cOpt = contractRepository.findById(payment.getContractId());
            if (cOpt.isPresent() && cOpt.get().getReservationId() != null) {
                Optional<Reservation> rOpt = reservationRepository.findById(cOpt.get().getReservationId());
                if (rOpt.isPresent() && rOpt.get().getUnitCode() != null) {
                    Optional<StorageUnit> uOpt = storageUnitRepository.findById(rOpt.get().getUnitCode());
                    if (uOpt.isPresent() && uOpt.get().getFloorId() != null) {
                        Optional<Floor> fOpt = floorRepository.findById(uOpt.get().getFloorId());
                        if (fOpt.isPresent() && !effectiveFacilityId.equals(fOpt.get().getFacilityId())) {
                            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Phiếu hoàn không thuộc cơ sở của bạn"));
                        }
                    }
                }
            }
        }

        boolean success = checkoutSettlementService.confirmRefundExecution(paymentId, effectiveAccountId, evidenceUrl, transactionRef, effectiveFacilityId);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã xác nhận giải ngân hoàn tiền thành công!"));
        }
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy hóa đơn hoàn tiền hợp lệ!"));
    }
}
