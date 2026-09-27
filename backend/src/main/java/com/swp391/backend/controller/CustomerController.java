package com.swp391.backend.controller;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.repository.AccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final AccountRepository accountRepository;

    public CustomerController(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestParam(required = false) Long accountId) {
        Long targetId = accountId != null ? accountId : 7L; // Mặc định Khách hàng mẫu 7 (0912345678)
        Optional<Account> accountOpt = accountRepository.findById(targetId);
        if (accountOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Account account = accountOpt.get();

        Map<String, Object> data = new HashMap<>();
        data.put("customerId", account.getAccountId());
        data.put("accountId", account.getAccountId());
        data.put("fullName", account.getFullName());
        data.put("phone", account.getPhone());
        data.put("email", account.getEmail() != null ? account.getEmail() : account.getPhone() + "@smartstorage.vn");
        data.put("status", account.getStatus());
        data.put("identityNumber", "001201012345");
        data.put("isVerified", true);
        data.put("verificationBadge", "ĐÃ XÁC THỰC THÔNG TIN TẠI HỆ THỐNG");

        return ResponseEntity.ok(data);
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse> updateProfile(@RequestBody Map<String, Object> updateData) {
        return ResponseEntity.ok(new ApiResponse(true, "Cập nhật hồ sơ thành công!"));
    }
}
