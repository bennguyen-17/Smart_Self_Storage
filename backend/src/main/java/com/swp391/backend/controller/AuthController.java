package com.swp391.backend.controller;

import com.swp391.backend.dto.auth.LoginRequest;
import com.swp391.backend.dto.auth.LoginResponse;
import com.swp391.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private static final String INVALID_CREDENTIALS_MESSAGE = "Email hoặc mật khẩu không đúng";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<LoginResponse> result = authService.login(request);

    if (result.isPresent()) {
        return ResponseEntity.ok(result.get());
    }

    return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("message", INVALID_CREDENTIALS_MESSAGE));
    }
}
