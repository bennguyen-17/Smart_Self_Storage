package com.swp391.backend.controller;

import com.swp391.backend.dto.checkout.CheckoutConfirmRequest;
import com.swp391.backend.dto.checkout.CheckoutConfirmResponse;
import com.swp391.backend.dto.checkout.CheckoutPreviewResponse;
import com.swp391.backend.dto.checkout.FeeDiscountRequest;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.service.CheckoutSettlementService;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<CheckoutPreviewResponse> getCheckoutPreview(@PathVariable Integer contractId) {
        CheckoutPreviewResponse response = checkoutSettlementService.calculateCheckoutPreview(contractId);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // --- US-28 & US-29: Xác nhận bàn giao trả kho & chốt quyết toán hoàn cọc / truy thu (Staff) ---
    @PostMapping("/staff/checkout/{contractId}/confirm")
    public ResponseEntity<CheckoutConfirmResponse> confirmCheckout(
            @PathVariable Integer contractId,
            @RequestBody CheckoutConfirmRequest request,
            @RequestHeader(value = "X-Account-Id", required = false) Integer staffAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer staffFacilityId) {

        CheckoutConfirmResponse response = checkoutSettlementService.confirmCheckout(contractId, request, staffAccountId, staffFacilityId);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // --- US-29: Xác nhận đã chi tiền hoàn cọc (REF) cho khách hàng (Staff / Manager) ---
    @PostMapping("/staff/settlements/{paymentId}/confirm-refund")
    public ResponseEntity<?> confirmRefund(
            @PathVariable Integer paymentId,
            @RequestHeader(value = "X-Account-Id", required = false) Integer staffAccountId) {

        boolean success = checkoutSettlementService.confirmRefundExecution(paymentId, staffAccountId);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã xác nhận giải ngân hoàn tiền thành công!"));
        }
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy hóa đơn hoàn tiền hợp lệ!"));
    }

    // --- US-31: Miễn / Giảm phí (Facility Manager / BOM duyệt theo BR-48) ---
    @PostMapping("/manager/payments/{paymentId}/discount")
    public ResponseEntity<?> applyFeeDiscount(
            @PathVariable Integer paymentId,
            @RequestBody FeeDiscountRequest request,
            @RequestHeader(value = "X-Account-Id", required = false) Integer managerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer managerFacilityId) {

        try {
            Payment updated = checkoutSettlementService.applyFeeDiscount(paymentId, request, managerAccountId, managerFacilityId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã duyệt miễn / giảm phí thành công!",
                    "paymentId", updated.getPaymentId(),
                    "invoiceNumber", updated.getInvoiceNumber(),
                    "newAmount", updated.getAmount(),
                    "status", updated.getStatus()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Lỗi xử lý miễn giảm: " + e.getMessage()));
        }
    }
}
