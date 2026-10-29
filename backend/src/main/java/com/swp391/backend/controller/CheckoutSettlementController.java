package com.swp391.backend.controller;

import com.swp391.backend.dto.checkout.CheckoutConfirmRequest;
import com.swp391.backend.dto.checkout.CheckoutConfirmResponse;
import com.swp391.backend.dto.checkout.CheckoutPreviewResponse;
import com.swp391.backend.service.CheckoutSettlementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class CheckoutSettlementController {

    private final CheckoutSettlementService checkoutSettlementService;

    public CheckoutSettlementController(CheckoutSettlementService checkoutSettlementService) {
        this.checkoutSettlementService = checkoutSettlementService;
    }

    // --- US-28: Xem dự thảo quyết toán trả kho (Staff) ---
    @GetMapping("/staff/checkout/{contractId}/preview")
    public ResponseEntity<CheckoutPreviewResponse> getCheckoutPreview(
            @PathVariable Integer contractId,
            @AuthenticationPrincipal Integer staffAccountId) {
        try {
            CheckoutPreviewResponse response = checkoutSettlementService.calculateCheckoutPreview(contractId, staffAccountId);
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.badRequest().body(response);
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(403).body(CheckoutPreviewResponse.error(ex.getMessage()));
        }
    }

    // --- US-28 & US-29: Xác nhận bàn giao trả kho & chốt quyết toán hoàn cọc / truy thu (Staff) ---
    @PostMapping("/staff/checkout/{contractId}/confirm")
    public ResponseEntity<CheckoutConfirmResponse> confirmCheckout(
            @PathVariable Integer contractId,
            @RequestBody CheckoutConfirmRequest request,
            @AuthenticationPrincipal Integer staffAccountId) {

        try {
            CheckoutConfirmResponse response = checkoutSettlementService.confirmCheckout(contractId, request, staffAccountId);
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.badRequest().body(response);
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(403).body(CheckoutConfirmResponse.error(ex.getMessage()));
        }
    }

    // --- US-29: Xác nhận đã chi tiền hoàn cọc (REF) cho khách hàng (Staff / Manager) ---
    @PostMapping("/staff/settlements/{paymentId}/confirm-refund")
    public ResponseEntity<?> confirmRefund(
            @PathVariable Integer paymentId,
            @RequestBody(required = false) Map<String, String> body,
            @RequestParam(required = false) String receiptUrl,
            @RequestHeader(value = "X-Account-Id", required = false) Integer staffAccountId) {

        String evidence = receiptUrl;
        String transactionRef = null;
        if (body != null) {
            if (body.containsKey("receiptUrl") && body.get("receiptUrl") != null && !body.get("receiptUrl").isBlank()) {
                evidence = body.get("receiptUrl");
            } else if (body.containsKey("evidenceUrl") && body.get("evidenceUrl") != null && !body.get("evidenceUrl").isBlank()) {
                evidence = body.get("evidenceUrl");
            }
            if (body.containsKey("transactionRef") && body.get("transactionRef") != null && !body.get("transactionRef").isBlank()) {
                transactionRef = body.get("transactionRef");
            }
        }

        boolean success = checkoutSettlementService.confirmRefundExecution(paymentId, staffAccountId, evidence, transactionRef);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã xác nhận giải ngân hoàn tiền thành công!"));
        }
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy hóa đơn hoàn tiền hợp lệ!"));
    }

    // --- US-26: Danh sách đơn cọc chờ hoàn tiền (REF) cho Staff (Q-18) ---
    @GetMapping({"/staff/refunds", "/staff/settlements/refunds"})
    public ResponseEntity<java.util.List<com.swp391.backend.dto.checkout.RefundListItemResponse>> getRefundList(
            @RequestParam(value = "status", required = false, defaultValue = "PENDING") String status
    ) {
        return ResponseEntity.ok(checkoutSettlementService.getRefundList(status));
    }
}
