package com.swp391.backend.controller;

import com.swp391.backend.dto.DepositInitiateRequest;
import com.swp391.backend.dto.DepositInitiateResponse;
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

    // Khởi tạo đặt cọc trực tuyến, thỏa thuận hợp đồng điện tử và tạo đơn thanh toán đặt cọc
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
}
