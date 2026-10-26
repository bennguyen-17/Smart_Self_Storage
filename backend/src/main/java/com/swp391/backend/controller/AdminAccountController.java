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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

        LocalDateTime lastLoginLdt = null;
        if (account.getAccountId() != null && activityLogRepository != null) {
            try {
                lastLoginLdt = activityLogRepository.findLatestLoginSuccess(account.getAccountId());
            } catch (Exception ignored) {}
        }
        String lastLogin = lastLoginLdt != null ? lastLoginLdt.toString() : null;

        return new InternalAccountResponse(
                account.getAccountId(),
                account.getFullName(),
                account.getEmail(),
                account.getPhone(),
                roleName,
                facilityId,
                status,
                Boolean.TRUE.equals(account.getMustChangePassword()),
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
        account.setMustChangePassword(true);
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
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Integer adminAccountId) {

        Optional<Account> accOpt = accountRepository.findAccountByAccountId(accountId);
        if (accOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Account account = accOpt.get();
        Long oldRoleId = account.getRoleId();
        Integer oldFacilityId = employeeProfileRepository.findByAccountId(accountId)
                .map(EmployeeProfile::getFacilityId).orElse(null);

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

        Integer loggedFacilityId = facilityId != null ? facilityId : oldFacilityId;
        if (!Objects.equals(oldRoleId, saved.getRoleId()) || !Objects.equals(oldFacilityId, facilityId != null ? facilityId : oldFacilityId)) {
            ActivityLog log = new ActivityLog();
            log.setAccountId(adminAccountId != null ? adminAccountId : 1);
            log.setFacilityId(loggedFacilityId);
            log.setAction("ADMIN_ACCOUNT_ASSIGNMENT_CHANGED");
            log.setDescription("Admin thay đổi tài khoản " + accountId + ": vai trò " + mapRoleIdToName(oldRoleId) + " → " + mapRoleIdToName(saved.getRoleId())
                    + ", cơ sở " + oldFacilityId + " → " + (facilityId != null ? facilityId : oldFacilityId));
            log.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(log);
        }

        return ResponseEntity.ok(toResponse(saved));
    }

    /**
     * 4. PATCH /api/admin/accounts/{id}/status: Khóa / mở khóa tài khoản
     */
    @PatchMapping("/accounts/{accountId}/status")
    public ResponseEntity<?> setAccountStatus(
            @PathVariable Integer accountId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Integer adminAccountId) {

        Optional<Account> accOpt = accountRepository.findAccountByAccountId(accountId);
        if (accOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Account account = accOpt.get();
        String oldStatus = account.getStatus();

        String status = body.get("status") != null ? body.get("status").toString().trim().toUpperCase() : "ACTIVE";
        account.setStatus("LOCKED".equals(status) || "SUSPENDED".equals(status) ? "SUSPENDED" : "ACTIVE");
        account.setUpdatedAt(LocalDateTime.now());
        Account saved = accountRepository.save(account);

        if (!Objects.equals(oldStatus, saved.getStatus())) {
            ActivityLog log = new ActivityLog();
            log.setAccountId(adminAccountId != null ? adminAccountId : 1);
            log.setFacilityId(employeeProfileRepository.findByAccountId(accountId).map(EmployeeProfile::getFacilityId).orElse(null));
            log.setAction("LOCKED".equalsIgnoreCase(saved.getStatus()) || "SUSPENDED".equalsIgnoreCase(saved.getStatus())
                    ? "ADMIN_ACCOUNT_LOCKED" : "ADMIN_ACCOUNT_UNLOCKED");
            log.setDescription("Admin đổi trạng thái tài khoản " + accountId + " từ " + oldStatus + " thành " + saved.getStatus());
            log.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(log);
        }

        return ResponseEntity.ok(toResponse(saved));
    }
}
