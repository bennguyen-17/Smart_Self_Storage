package com.swp391.backend.controller;

import com.swp391.backend.dto.checkout.CheckoutConfirmRequest;
import com.swp391.backend.dto.checkout.CheckoutConfirmResponse;
import com.swp391.backend.dto.checkout.CheckoutPreviewResponse;
import com.swp391.backend.service.CheckoutSettlementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/staff/checkout/{contractId}")
public class CheckoutSettlementController {

    private final CheckoutSettlementService checkoutSettlementService;

    public CheckoutSettlementController(CheckoutSettlementService checkoutSettlementService) {
        this.checkoutSettlementService = checkoutSettlementService;
    }

    // Xem dự thảo quyết toán trả kho và hoàn tiền cọc
    @GetMapping("/preview")
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

    // Xác nhận bàn giao trả kho và chốt quyết toán hoàn cọc hoặc truy thu chi phí
    @PostMapping("/confirm")
    public ResponseEntity<CheckoutConfirmResponse> confirmCheckout(
            @PathVariable Integer contractId,
            @RequestBody CheckoutConfirmRequest request,
            @AuthenticationPrincipal Integer staffAccountId) {

        try {
            CheckoutConfirmResponse response = checkoutSettlementService.confirmCheckout(
                    contractId, request, staffAccountId);
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.badRequest().body(response);
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(403).body(CheckoutConfirmResponse.error(ex.getMessage()));
        }
    }

}
