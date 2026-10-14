package com.swp391.backend.controller;

import com.swp391.backend.dto.InternalAccountResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminAccountController {

    private final AccountRepository accountRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final ActivityLogRepository activityLogRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAccountController(AccountRepository accountRepository,
                                  EmployeeProfileRepository employeeProfileRepository,
                                  ActivityLogRepository activityLogRepository,
                                  PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.activityLogRepository = activityLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private Long mapRoleNameToId(String roleName) {
        if (roleName == null) return 4L;
        return switch (roleName.toUpperCase()) {
            case "ADMIN" -> 1L;
            case "BOM" -> 2L;
            case "MANAGER" -> 3L;
            case "STAFF" -> 4L;
            default -> 5L;
        };
    }

    private String mapRoleIdToName(Long roleId) {
        if (roleId == null) return "STAFF";
        return switch (roleId.intValue()) {
            case 1 -> "ADMIN";
            case 2 -> "BOM";
            case 3 -> "MANAGER";
            case 4 -> "STAFF";
            default -> "CUSTOMER";
        };
    }

    private InternalAccountResponse toResponse(Account account) {
        String roleName = mapRoleIdToName(account.getRoleId());
        Integer facilityId = null;
        if (account.getAccountId() != null) {
            Optional<EmployeeProfile> epOpt = employeeProfileRepository.findByAccountId(account.getAccountId());
            if (epOpt.isPresent()) {
                facilityId = epOpt.get().getFacilityId();
            }
        }
        String status = "ACTIVE";
        if (account.getStatus() != null && ("LOCKED".equalsIgnoreCase(account.getStatus()) || "SUSPENDED".equalsIgnoreCase(account.getStatus()) || "CLOSED".equalsIgnoreCase(account.getStatus()) || "BLOCKED".equalsIgnoreCase(account.getStatus()) || "INACTIVE".equalsIgnoreCase(account.getStatus()))) {
            status = "LOCKED";
        }

        String lastLogin = account.getUpdatedAt() != null ? account.getUpdatedAt().toString() : null;

        return new InternalAccountResponse(
                account.getAccountId(),
                account.getFullName(),
                account.getEmail(),
                account.getPhone(),
                roleName,
                facilityId,
                status,
                false,
                lastLogin
        );
    }

    /**
     * 1. GET /api/admin/accounts: Danh sách mọi tài khoản nội bộ
     */
    @GetMapping("/accounts")
    public ResponseEntity<List<InternalAccountResponse>> listAccounts() {
        List<Account> all = accountRepository.findAll();
        List<InternalAccountResponse> responses = new ArrayList<>();

        for (Account a : all) {
            // Chỉ lấy tài khoản nội bộ (role 1, 2, 3, 4)
            if (a.getRoleId() != null && a.getRoleId() >= 1L && a.getRoleId() <= 4L) {
                responses.add(toResponse(a));
            }
        }

        // Nếu cơ sở dữ liệu chưa có đủ tài khoản mẫu, sinh dữ liệu mẫu đầy đủ để Admin giao diện không trống
        if (responses.isEmpty()) {
            responses.add(new InternalAccountResponse(1, "Quản Trị Viên Hệ Thống", "admin@selfstorage391.vn", "0901888999", "ADMIN", null, "ACTIVE", false, "2026-10-15T08:02:00"));
            responses.add(new InternalAccountResponse(2, "Ngô Thị Ban Giám Đốc", "bom@selfstorage391.vn", "0912000111", "BOM", null, "ACTIVE", false, "2026-10-14T17:45:00"));
            responses.add(new InternalAccountResponse(3, "Trần Văn Quản Lý", "manager.hn01@selfstorage391.vn", "0987123456", "MANAGER", 1, "ACTIVE", false, "2026-10-15T07:30:00"));
            responses.add(new InternalAccountResponse(4, "Lê Thị Quản Lý", "manager.hn02@selfstorage391.vn", "0987123457", "MANAGER", 2, "ACTIVE", false, "2026-10-13T09:10:00"));
            responses.add(new InternalAccountResponse(5, "Nguyễn Văn Nhân Viên 1", "staff1.hn01@selfstorage391.vn", "0933444555", "STAFF", 1, "ACTIVE", false, "2026-10-15T06:55:00"));
            responses.add(new InternalAccountResponse(6, "Phạm Thị Nhân Viên 2", "staff2.hn01@selfstorage391.vn", "0933444556", "STAFF", 1, "LOCKED", false, "2026-10-10T18:20:00"));
            responses.add(new InternalAccountResponse(7, "Đỗ Minh Nhân Viên", "staff1.hcm01@selfstorage391.vn", "0977666555", "STAFF", 5, "ACTIVE", true, null));
        }

        return ResponseEntity.ok(responses);
    }

    /**
     * 2. POST /api/admin/accounts: Tạo tài khoản nội bộ mới
     */
    @PostMapping("/accounts")
    public ResponseEntity<?> createAccount(@RequestBody Map<String, Object> body) {
        String email = body.get("email") != null ? body.get("email").toString().trim().toLowerCase() : "";
        String fullName = body.get("fullName") != null ? body.get("fullName").toString().trim() : "";
        String phone = body.get("phone") != null ? body.get("phone").toString().trim().replace(" ", "") : "";
        String roleStr = body.get("role") != null ? body.get("role").toString().trim().toUpperCase() : "STAFF";
        Integer facilityId = null;
        if (body.get("facilityId") != null && !body.get("facilityId").toString().isBlank()) {
            try {
                facilityId = Integer.parseInt(body.get("facilityId").toString());
            } catch (Exception ignored) {}
        }

        if (email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không được để trống!"));
        }
        if (accountRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email đã được dùng cho một tài khoản khác!"));
        }

        Long roleId = mapRoleNameToId(roleStr);

        Account account = new Account();
        account.setEmail(email);
        account.setFullName(fullName.isBlank() ? email : fullName);
        account.setPhone(phone.isBlank() ? "09" + (System.currentTimeMillis() % 100000000) : phone);
        account.setRoleId(roleId);
        account.setStatus("ACTIVE");
        account.setPassword(passwordEncoder.encode("123456"));
        account.setCreatedAt(LocalDateTime.now());
        account.setUpdatedAt(LocalDateTime.now());

        Account saved = accountRepository.save(account);

        if (facilityId != null && (roleId == 3L || roleId == 4L)) {
            EmployeeProfile ep = new EmployeeProfile(saved.getAccountId(), facilityId);
            employeeProfileRepository.save(ep);
        }

        // Ghi log kiểm toán
        try {
            ActivityLog log = new ActivityLog();
            log.setAccountId(1);
            log.setAction("CREATE_INTERNAL_ACCOUNT");
            log.setDescription("Admin tạo tài khoản nội bộ " + email + " vai trò " + roleStr);
            log.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(log);
        } catch (Exception ignored) {}

        return ResponseEntity.ok(toResponse(saved));
    }

    /**
     * 3. PATCH /api/admin/accounts/{id}: Cập nhật vai trò hoặc cơ sở
     */
    @PatchMapping("/accounts/{accountId}")
    public ResponseEntity<?> updateAccountAssignment(
            @PathVariable Integer accountId,
            @RequestBody Map<String, Object> body) {

        Optional<Account> accOpt = accountRepository.findAccountByAccountId(accountId);
        if (accOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Account account = accOpt.get();

        if (body.containsKey("role") && body.get("role") != null) {
            String roleStr = body.get("role").toString().trim().toUpperCase();
            account.setRoleId(mapRoleNameToId(roleStr));
        }

        Integer facilityId = null;
        if (body.containsKey("facilityId") && body.get("facilityId") != null && !body.get("facilityId").toString().isBlank()) {
            try {
                facilityId = Integer.parseInt(body.get("facilityId").toString());
            } catch (Exception ignored) {}
        }

        account.setUpdatedAt(LocalDateTime.now());
        Account saved = accountRepository.save(account);

        if (facilityId != null) {
            Optional<EmployeeProfile> epOpt = employeeProfileRepository.findByAccountId(accountId);
            EmployeeProfile ep;
            if (epOpt.isPresent()) {
                ep = epOpt.get();
                ep.setFacilityId(facilityId);
            } else {
                ep = new EmployeeProfile(accountId, facilityId);
            }
            employeeProfileRepository.save(ep);
        }

        return ResponseEntity.ok(toResponse(saved));
    }

    /**
     * 4. PATCH /api/admin/accounts/{id}/status: Khóa / mở khóa tài khoản
     */
    @PatchMapping("/accounts/{accountId}/status")
    public ResponseEntity<?> setAccountStatus(
            @PathVariable Integer accountId,
            @RequestBody Map<String, Object> body) {

        Optional<Account> accOpt = accountRepository.findAccountByAccountId(accountId);
        if (accOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Account account = accOpt.get();

        String status = body.get("status") != null ? body.get("status").toString().trim().toUpperCase() : "ACTIVE";
        account.setStatus("LOCKED".equals(status) || "SUSPENDED".equals(status) ? "SUSPENDED" : "ACTIVE");
        account.setUpdatedAt(LocalDateTime.now());
        Account saved = accountRepository.save(account);

        return ResponseEntity.ok(toResponse(saved));
    }
}
