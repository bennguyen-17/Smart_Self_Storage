package com.swp391.backend.service;

import com.swp391.backend.dto.auth.LoginRequest;
import com.swp391.backend.dto.auth.LoginResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ActivityLogRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;
    private static final int ATTEMPT_WINDOW_MINUTES = 10;

    private final AccountRepository accountRepository;
    private final JwtService jwtService;
    private final ActivityLogRepository activityLogRepository;

    public AuthService(
            AccountRepository accountRepository,
            JwtService jwtService,
            ActivityLogRepository activityLogRepository) {

        this.accountRepository = accountRepository;
        this.jwtService = jwtService;
        this.activityLogRepository = activityLogRepository;
    }

    public LoginResult login(LoginRequest request, String ipAddress) {

        LocalDateTime now = LocalDateTime.now();

        // find in db
        Optional<Account> result = accountRepository.findByPhone(request.getPhone());

        if (result.isEmpty()) {
            return LoginResult.failure(
                    "Số điện thoại hoặc mật khẩu không đúng.",
                    401);
        }

        Account account = result.get();

        // account suspended check
        if ("SUSPENDED".equals(account.getStatus())) {

            if (account.getLockUntil() != null
                    && account.getLockUntil().isAfter(now)) {

                return LoginResult.failure(
                        "Tài khoản đang bị khóa. Vui lòng thử lại sau.",
                        423);
            }

            // unlock
            account.setStatus("ACTIVE");
            account.setFailedAttempts(0);
            account.setFirstFailedAt(null);
            account.setLockUntil(null);

            accountRepository.save(account);
        }

        // check password
        boolean passwordCorrect = request.getPassword() != null
                && request.getPassword().equals(account.getPassword());

        if (!passwordCorrect) {

            long failedAttempts = handleFailedLogin(account, now, ipAddress);

            if (failedAttempts >= MAX_FAILED_ATTEMPTS) {

                return LoginResult.failure(
                        "Quá 5 lần đăng nhập sai. Tài khoản bị khóa 15 phút.",
                        423);
            }

            long remaining = MAX_FAILED_ATTEMPTS - failedAttempts;

            return LoginResult.failure(
                    "Số điện thoại hoặc mật khẩu không đúng. Còn "
                            + remaining + " lần thử.",
                    401);
        }

        // login successfully
 
        account.setLockUntil(null);
        account.setStatus("ACTIVE");

        accountRepository.save(account);

        // log
        saveActivityLog(
                account,
                "LOGIN_SUCCESS",
                "Login successful",
                ipAddress);

        // create JWT
        String token = jwtService.generateToken(account);

        return LoginResult.success(
                new LoginResponse(
                        token,
                        new LoginResponse.UserInfo(
                                account.getAccountId(),
                                account.getFullName(),
                                account.getRoleId().toString())));
    }

    private Long handleFailedLogin(
            Account account,
            LocalDateTime now,
            String ipAddress) {

        // Save failed login
        saveActivityLog(
                account,
                "LOGIN_FAILED",
                "Incorrect password",
                ipAddress);

        // Find latest successful login
        LocalDateTime lastSuccess = activityLogRepository.findLastLoginSuccess(
                account.getAccountId(),
                ipAddress);

        // Start of 10-minute window
        LocalDateTime from = now.minusMinutes(ATTEMPT_WINDOW_MINUTES);

        // Count failed login attempts
        long failedAttempts = activityLogRepository.countFailedLogs(
                account.getAccountId(),
                ipAddress,
                from,
                lastSuccess);

        // Lock account after 5 failed attempts
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {

            account.setStatus("SUSPENDED");

            account.setLockUntil(
                    now.plusMinutes(LOCK_MINUTES));

            accountRepository.save(account);
        }

        return failedAttempts;
    }

    private void saveActivityLog(
            Account account,
            String action,
            String description,
            String ipAddress) {

        ActivityLog log = new ActivityLog();

        log.setAccountId(account.getAccountId());
        log.setAction(action);
        log.setDescription(description);
        log.setCreatedAt(LocalDateTime.now());
        log.setIpAddress(ipAddress);

        activityLogRepository.save(log);
    }

    public static class LoginResult {

        private final LoginResponse response;
        private final String message;
        private final int httpStatus;

        private LoginResult(
                LoginResponse response,
                String message,
                int httpStatus) {

            this.response = response;
            this.message = message;
            this.httpStatus = httpStatus;
        }

        public static LoginResult success(LoginResponse response) {
            return new LoginResult(response, null, 200);
        }

        public static LoginResult failure(
                String message,
                int httpStatus) {

            return new LoginResult(null, message, httpStatus);
        }

        public LoginResponse getResponse() {
            return response;
        }

        public String getMessage() {
            return message;
        }

        public int getHttpStatus() {
            return httpStatus;
        }
    }
}
