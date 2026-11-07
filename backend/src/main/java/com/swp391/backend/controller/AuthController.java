package com.swp391.backend.controller;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.RegisterRequest;
import com.swp391.backend.dto.ResendOtpRequest;
import com.swp391.backend.dto.VerifyOtpRequest;
import com.swp391.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Đăng ký tài khoản khách hàng mới và gửi mã OTP qua email
    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody RegisterRequest request) {
        ApiResponse response = authService.register(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // Xác thực mã OTP kích hoạt tài khoản
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        ApiResponse response = authService.verifyOtp(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // Gửi lại mã OTP xác thực tài khoản
    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse> resendOtp(@RequestBody ResendOtpRequest request) {
        ApiResponse response = authService.resendOtp(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // Đăng xuất và vô hiệu hóa JWT token
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest request
    ) {
        ApiResponse response = authService.logout(authHeader, request.getRemoteAddr());
        return ResponseEntity.ok(response);
    }
}
