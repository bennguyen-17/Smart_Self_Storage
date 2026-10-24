package com.swp391.backend.service;

import com.swp391.backend.dto.AdminCustomerResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ActivityLogRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class AdminCustomerService {

    private final AccountRepository accountRepository;
    private final ActivityLogRepository activityLogRepository;

    public AdminCustomerService(AccountRepository accountRepository,
                                ActivityLogRepository activityLogRepository) {
        this.accountRepository = accountRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminCustomerResponse> searchCustomers(String query) {
        String normalized = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String pattern = normalized.isEmpty() ? null : "%" + normalized + "%";
        boolean searchLocked = "locked".equals(normalized);

        return accountRepository.searchCustomers(pattern, searchLocked).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminCustomerResponse unlockCustomer(Integer accountId, Integer adminAccountId) {
        if (adminAccountId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Không xác định được tài khoản Admin.");
        }
        Account account = accountRepository.findAccountByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng."));
        if (!Long.valueOf(5L).equals(account.getRoleId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng.");
        }
        if (!"SUSPENDED".equalsIgnoreCase(account.getStatus()) || account.getLockUntil() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Tài khoản không ở trạng thái khóa do đăng nhập sai mật khẩu.");
        }

        LocalDateTime now = LocalDateTime.now();
        account.setStatus("ACTIVE");
        account.setLockUntil(null);
        account.setFailedAttempts(0);
        account.setFirstFailedAt(null);
        account.setUpdatedAt(now);
        Account saved = accountRepository.save(account);

        ActivityLog log = new ActivityLog();
        log.setAccountId(adminAccountId);
        log.setAction("ADMIN_CUSTOMER_UNLOCKED");
        log.setDescription("Admin mở khóa đăng nhập cho tài khoản khách hàng #" + accountId);
        log.setCreatedAt(now);
        activityLogRepository.save(log);

        return toResponse(saved);
    }

    private AdminCustomerResponse toResponse(Account account) {
        boolean passwordLocked = "SUSPENDED".equalsIgnoreCase(account.getStatus())
                && account.getLockUntil() != null;
        return new AdminCustomerResponse(
                account.getAccountId(), account.getFullName(), account.getPhone(), account.getEmail(),
                passwordLocked ? "LOCKED" : account.getStatus(),
                passwordLocked ? account.getLockUntil() : null);
    }
}
