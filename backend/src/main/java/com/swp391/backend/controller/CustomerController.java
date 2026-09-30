package com.swp391.backend.controller;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.CustomerProfile;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.CustomerProfileRepository;
import com.swp391.backend.service.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final AccountRepository accountRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final JwtService jwtService;

    public CustomerController(AccountRepository accountRepository, 
                              CustomerProfileRepository customerProfileRepository, 
                              JwtService jwtService) {
        this.accountRepository = accountRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.jwtService = jwtService;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) Long accountId) {
        
        Long targetId = accountId;

        if (targetId == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Claims claims = jwtService.validateTokenAndGetClaims(token);
                Object userIdObj = claims.get("userId");
                if (userIdObj instanceof Number) {
                    targetId = ((Number) userIdObj).longValue();
                } else if (userIdObj != null) {
                    targetId = Long.parseLong(userIdObj.toString());
                }
            } catch (Exception e) {
                // Token parse error
            }
        }

        Account account = null;
        if (targetId != null) {
            account = accountRepository.findById(targetId).orElse(null);
        }

        if (account == null) {
            // Find first active customer account if not specified
            account = accountRepository.findAll().stream()
                    .filter(a -> a.getRoleId() != null && a.getRoleId() == 5L)
                    .findFirst()
                    .orElse(null);
        }

        if (account == null) {
            return ResponseEntity.notFound().build();
        }

        // Fetch CustomerProfile from Database
        Optional<CustomerProfile> profileOpt = customerProfileRepository.findByAccountId(account.getAccountId());
        String identityNumber = profileOpt.map(CustomerProfile::getIdentityNumber).orElse(null);

        if (identityNumber == null || identityNumber.trim().isEmpty()) {
            identityNumber = "Chưa cập nhật";
        }

        Map<String, Object> data = new HashMap<>();
        data.put("customerId", account.getAccountId());
        data.put("accountId", account.getAccountId());
        data.put("fullName", account.getFullName());
        data.put("phone", account.getPhone());
        data.put("email", account.getEmail() != null ? account.getEmail() : account.getPhone() + "@smartstorage.vn");
        boolean isActive = "ACTIVE".equalsIgnoreCase(account.getStatus());
        data.put("status", account.getStatus());
        data.put("identityNumber", identityNumber);
        data.put("isVerified", isActive);
        data.put("verificationBadge", isActive ? "ĐÃ XÁC THỰC THÔNG TIN" : "CHƯA XÁC THỰC THÔNG TIN");

        return ResponseEntity.ok(data);
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse> updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> updateData) {
        
        Long targetId = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Claims claims = jwtService.validateTokenAndGetClaims(token);
                Object userIdObj = claims.get("userId");
                if (userIdObj instanceof Number) {
                    targetId = ((Number) userIdObj).longValue();
                } else if (userIdObj != null) {
                    targetId = Long.parseLong(userIdObj.toString());
                }
            } catch (Exception e) {}
        }

        if (targetId != null) {
            Account account = accountRepository.findById(targetId).orElse(null);
            if (account != null) {
                if (updateData.containsKey("fullName") && updateData.get("fullName") != null) {
                    account.setFullName(updateData.get("fullName").toString());
                }
                if (updateData.containsKey("email") && updateData.get("email") != null) {
                    account.setEmail(updateData.get("email").toString());
                }
                accountRepository.save(account);

                if (updateData.containsKey("identityNumber") && updateData.get("identityNumber") != null) {
                    String cccd = updateData.get("identityNumber").toString();
                    CustomerProfile cp = customerProfileRepository.findByAccountId(account.getAccountId())
                            .orElseGet(() -> new CustomerProfile(account.getAccountId(), cccd));
                    cp.setIdentityNumber(cccd);
                    customerProfileRepository.save(cp);
                }
            }
        }

        return ResponseEntity.ok(new ApiResponse(true, "Cập nhật hồ sơ thành công!"));
    }
}
