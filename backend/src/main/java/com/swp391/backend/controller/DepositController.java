package com.swp391.backend.controller;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.DepositInitiateRequest;
import com.swp391.backend.dto.DepositInitiateResponse;
import com.swp391.backend.dto.DepositWebhookRequest;
import com.swp391.backend.service.DepositService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deposits")
public class DepositController {

    private final DepositService depositService;

    public DepositController(DepositService depositService) {
        this.depositService = depositService;
    }

    // --- US-05: Khởi tạo Đặt cọc 100% Online, thỏa thuận Clickwrap & Sinh mã VietQR (BR-15, BR-16, BR-18, BR-37) ---
    @PostMapping("/initiate")
    public ResponseEntity<DepositInitiateResponse> initiateDeposit(@RequestBody DepositInitiateRequest request) {
        DepositInitiateResponse response = depositService.initiateDeposit(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // --- US-05: Webhook / Callback nhận thông báo thanh toán tiền cọc thành công ---
    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse> handleDepositWebhook(@RequestBody DepositWebhookRequest request) {
        ApiResponse response = depositService.confirmDepositPayment(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // --- US-05: API Mock Xác nhận nộp cọc nhanh (dành cho Dev / Demo không cần quét QR thật) ---
    @PostMapping("/mock-pay")
    public ResponseEntity<ApiResponse> mockPayDeposit(@RequestParam String invoiceNumber) {
        DepositWebhookRequest req = new DepositWebhookRequest(
                invoiceNumber,
                "MOCK_TXN_" + System.currentTimeMillis(),
                "VIETQR",
                "GATEWAY_MB_" + System.currentTimeMillis()
        );
        ApiResponse response = depositService.confirmDepositPayment(req);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // --- US-05: API Kiểm tra trạng thái nộp cọc theo mã hóa đơn ---
    @GetMapping("/status")
    public ResponseEntity<ApiResponse> checkDepositStatus(@RequestParam String invoiceNumber) {
        ApiResponse response = depositService.checkDepositStatus(invoiceNumber);
        return ResponseEntity.ok(response);
    }
}
