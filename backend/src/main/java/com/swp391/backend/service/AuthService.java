package com.swp391.backend.service;

import com.swp391.backend.dto.auth.LoginRequest;
import com.swp391.backend.dto.auth.LoginResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.LoginAttempt;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.LoginAttemptRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class AuthService {
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration ATTEMPT_WINDOW = Duration.ofMinutes(10);
    private static final Duration ACCOUNT_LOCK_DURATION = Duration.ofMinutes(15);

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptRepository loginAttemptRepository;

    public AuthService(AccountRepository accountRepository, 
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        LoginAttemptRepository loginAttemptRepository) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginAttemptRepository = loginAttemptRepository;
    }

    public LoginResult login(LoginRequest request, String ipAddress) {
        String loginIdentifier = request.getEmail();
        LocalDateTime now = LocalDateTime.now();

        Optional<Account> accountResult =
                accountRepository.findByEmail(loginIdentifier);

        if (accountResult.isPresent()) {
            Account account = accountResult.get();
            if ("SUSPENDED".equalsIgnoreCase(account.getStatus())) {
                if (account.getLockUntil() != null && account.getLockUntil().isAfter(now)) {
                    long remainingMinutes = Math.max(1,
                            (Duration.between(now, account.getLockUntil()).toSeconds() + 59) / 60);
                    return LoginResult.failure(
                            "Tài khoản bị khóa. Vui lòng thử lại sau " + remainingMinutes + " phút.",
                            423
                    );
                }

                if (account.getLockUntil() == null) {
                    return LoginResult.failure("Tài khoản đang bị tạm ngưng.", 423);
                }

                account.setStatus("ACTIVE");
                account.setLockUntil(null);
                accountRepository.save(account);
            }
        }

        Account account = accountResult.orElse(null);
        if (account == null || !passwordEncoder.matches(request.getPassword(), account.getPassword())) {
            int attemptCount = recordFailedAttempt(loginIdentifier, ipAddress, now);

            if (attemptCount >= MAX_FAILED_ATTEMPTS && account != null) {
                account.setStatus("SUSPENDED");
                account.setLockUntil(now.plus(ACCOUNT_LOCK_DURATION));
                accountRepository.save(account);
                return LoginResult.failure("Quá 5 lần đăng nhập sai. Tài khoản bị khóa trong 15 phút.", 423);
            }

            int remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - attemptCount);
            return LoginResult.failure(
                    "Mật khẩu không đúng. Bạn còn " + remainingAttempts + " lần thử",
                    401
            );
        }

        loginAttemptRepository.deleteByLoginIdentifierAndIpAddress(loginIdentifier, ipAddress);
        String role = account.getRoleId() == null
                ? null
                : account.getRoleId().toString();
        String token = jwtService.generateToken(account);

        return LoginResult.success(new LoginResponse(
                token,
                new LoginResponse.UserInfo(
                        account.getAccountId(),
                        account.getFullName(),
                        role
                )
        ));
    }

    private int recordFailedAttempt(String loginIdentifier, String ipAddress, LocalDateTime now) {
        LoginAttempt attempt = loginAttemptRepository
                .findByLoginIdentifierAndIpAddress(loginIdentifier, ipAddress)
                .orElseGet(() -> {
                    LoginAttempt newAttempt = new LoginAttempt();
                    newAttempt.setLoginIdentifier(loginIdentifier);
                    newAttempt.setIpAddress(ipAddress);
                    newAttempt.setFirstFailedAt(now);
                    newAttempt.setAttemptCount(0);
                    return newAttempt;
                });

        if (attempt.getFirstFailedAt() == null
                || attempt.getFirstFailedAt().isBefore(now.minus(ATTEMPT_WINDOW))) {
            attempt.setAttemptCount(0);
            attempt.setFirstFailedAt(now);
        }

        attempt.setAttemptCount(attempt.getAttemptCount() + 1);
        attempt.setLastFailedAt(now);
        loginAttemptRepository.save(attempt);
        return attempt.getAttemptCount();
    }

    public static class LoginResult {
        private final LoginResponse response;
        private final String message;
        private final int httpStatus;

        private LoginResult(LoginResponse response, String message, int httpStatus) {
            this.response = response;
            this.message = message;
            this.httpStatus = httpStatus;
        }

        public static LoginResult success(LoginResponse response) {
            return new LoginResult(response, null, 200);
        }

        public static LoginResult failure(String message, int httpStatus) {
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
