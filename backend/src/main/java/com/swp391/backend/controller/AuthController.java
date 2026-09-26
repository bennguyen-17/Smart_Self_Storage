package com.swp391.backend.controller;

import com.swp391.backend.dto.auth.LoginRequest;
import com.swp391.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        AuthService.LoginResult result = authService.login(request, httpRequest.getRemoteAddr());

        if (result.getResponse() != null) {
            return ResponseEntity.ok(result.getResponse());
        }

        return ResponseEntity
                .status(HttpStatus.valueOf(result.getHttpStatus()))
                .body(Map.of("message", result.getMessage()));
    }
}
