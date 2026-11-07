package com.swp391.backend.controller;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.DepositInitiateRequest;
import com.swp391.backend.dto.DepositInitiateResponse;
import com.swp391.backend.dto.DepositWebhookRequest;
import com.swp391.backend.service.DepositService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deposits")
public class DepositController {

    private final DepositService depositService;

    public DepositController(DepositService depositService) {
        this.depositService = depositService;
    }

    // Khởi tạo đặt cọc trực tuyến, thỏa thuận hợp đồng điện tử và tạo mã thanh toán VietQR
    @PostMapping("/initiate")
    public ResponseEntity<DepositInitiateResponse> initiateDeposit(
            @RequestBody DepositInitiateRequest request,
            @AuthenticationPrincipal Integer authAccountId) {
        if (authAccountId != null) {
            if (request.getAccountId() != null && !request.getAccountId().equals(authAccountId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(DepositInitiateResponse.error("Bạn không có quyền đặt chỗ đứng tên tài khoản của người khác!"));
            }
            request.setAccountId(authAccountId);
        }
        DepositInitiateResponse response = depositService.initiateDeposit(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // Webhook nhận thông báo thanh toán tiền cọc từ cổng thanh toán
    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse> handleDepositWebhook(@RequestBody DepositWebhookRequest request) {
        ApiResponse response = depositService.confirmDepositPayment(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // Xác nhận nộp cọc nhanh trong môi trường thử nghiệm
    @PostMapping("/mock-pay")
    public ResponseEntity<ApiResponse> mockPayDeposit(@RequestParam String invoiceNumber) {
        DepositWebhookRequest req = new DepositWebhookRequest(
                invoiceNumber,
                "MOCK_TXN_" + System.currentTimeMillis(),
                "BANK_TRANSFER",
                "GATEWAY_MB_" + System.currentTimeMillis()
        );
        ApiResponse response = depositService.confirmDepositPayment(req);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // Kiểm tra trạng thái thanh toán đặt cọc theo mã hóa đơn
    @GetMapping("/status")
    public ResponseEntity<ApiResponse> checkDepositStatus(@RequestParam String invoiceNumber) {
        ApiResponse response = depositService.checkDepositStatus(invoiceNumber);
        return ResponseEntity.ok(response);
    }
}
