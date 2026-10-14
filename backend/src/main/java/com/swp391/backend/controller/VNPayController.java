package com.swp391.backend.controller;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment/vnpay")
public class VNPayController {

    private final VNPayService vnPayService;

    public VNPayController(VNPayService vnPayService) {
        this.vnPayService = vnPayService;
    }

    // --- 1. Tạo liên kết chuyển hướng sang cổng VNPay Sandbox ---
    @PostMapping("/create-payment-url")
    public ResponseEntity<?> createPaymentUrl(
            HttpServletRequest request,
            @RequestBody Map<String, Object> payload) {
        try {
            String invoiceNumber = (String) payload.get("invoiceNumber");
            Object amountObj = payload.get("amount");
            String orderInfo = (String) payload.get("orderInfo");

            if (invoiceNumber == null || amountObj == null) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Thiếu mã hóa đơn hoặc số tiền cọc!"));
            }

            BigDecimal amount = new BigDecimal(amountObj.toString());
            String paymentUrl = vnPayService.createPaymentUrl(request, invoiceNumber, amount, orderInfo);

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("paymentUrl", paymentUrl);
            res.put("invoiceNumber", invoiceNumber);

            return ResponseEntity.ok(res);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(new ApiResponse(false, "Lỗi tạo link VNPay: " + ex.getMessage()));
        }
    }

    // --- 2. Tiếp nhận Webhook / Callback tự động từ cổng VNPay ---
    @GetMapping("/callback")
    public RedirectView handleVNPayCallback(@RequestParam Map<String, String> queryParams) {
        ApiResponse result = vnPayService.processCallback(queryParams);
        String redirectUrl = "http://localhost:5173/payment-result?success=" + result.isSuccess()
                + "&message=" + URLEncoder.encode(result.getMessage(), StandardCharsets.UTF_8)
                + "&invoiceNumber=" + queryParams.getOrDefault("vnp_TxnRef", "")
                + "&responseCode=" + queryParams.getOrDefault("vnp_ResponseCode", "");
        return new RedirectView(redirectUrl);
    }

    // --- 3. API cho Frontend gọi xác thực thông số thanh toán trả về ---
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse> verifyPaymentResult(@RequestBody Map<String, String> queryParams) {
        ApiResponse response = vnPayService.processCallback(queryParams);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }
}
