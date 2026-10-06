package com.swp391.backend.service;

import com.swp391.backend.dto.auth.LoginRequest;
import com.swp391.backend.dto.auth.LoginResponse;
import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.ResendOtpRequest;
import com.swp391.backend.dto.ResetPasswordRequest;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ActivityLogRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class LoginService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;
    private static final int ATTEMPT_WINDOW_MINUTES = 10;

    private final AccountRepository accountRepository;
    private final com.swp391.backend.repository.CustomerProfileRepository customerProfileRepository;
    private final JwtService jwtService;
    private final ActivityLogRepository activityLogRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginService(
            AccountRepository accountRepository,
            com.swp391.backend.repository.CustomerProfileRepository customerProfileRepository,
            JwtService jwtService,
            ActivityLogRepository activityLogRepository,
            PasswordEncoder passwordEncoder) {

        this.accountRepository = accountRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.jwtService = jwtService;
        this.activityLogRepository = activityLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResult login(LoginRequest request, String ipAddress) {

        LocalDateTime now = LocalDateTime.now();

        // Đăng nhập bằng Email hoặc Số điện thoại
        String identifier = (request.getEmail() != null && !request.getEmail().trim().isEmpty())
                ? request.getEmail().trim()
                : (request.getPhone() != null ? request.getPhone().trim() : null);

        if (identifier == null) {
            return LoginResult.failure("Vui lòng nhập Email hoặc Số điện thoại.", 400);
        }

        Account result = accountRepository.findByEmail(identifier)
                .orElseGet(() -> accountRepository.findByPhone(identifier).orElse(null));

        if (result == null) {
            return LoginResult.failure(
                    "Email / Số điện thoại hoặc mật khẩu không đúng.",
                    401);
        }

        Account account = result;

        // Phân quyền Cổng Đăng nhập theo Role
        // roleId: 1 = ADMIN, 2 = BOM, 3 = MANAGER, 4 = STAFF, 5 = CUSTOMER
        boolean isInternalRole = account.getRoleId() != null && account.getRoleId() >= 1L && account.getRoleId() <= 4L;
        if ("CUSTOMER".equalsIgnoreCase(request.getPortalType()) && isInternalRole) {
            return LoginResult.failure(
                    "Tài khoản Quản trị / Nhân viên không được đăng nhập tại Cổng Khách hàng. Vui lòng sang Cổng Nội Bộ!",
                    403);
        }
        if ("INTERNAL".equalsIgnoreCase(request.getPortalType()) && !isInternalRole) {
            return LoginResult.failure(
                    "Tài khoản Khách hàng không có quyền truy cập Cổng Nội Bộ!",
                    403);
        }

        if ("UNVERIFIED".equalsIgnoreCase(account.getStatus())
                || "INACTIVE".equalsIgnoreCase(account.getStatus())
                || "PENDING_OTP".equalsIgnoreCase(account.getStatus())) {
            return LoginResult.failure(
                    "Tài khoản chưa được kích hoạt OTP. Vui lòng hoàn tất xác thực OTP trước!",
                    401);
        }

        if ("CLOSED".equalsIgnoreCase(account.getStatus())
                || "BANNED".equalsIgnoreCase(account.getStatus())) {
            return LoginResult.failure(
                    "Tài khoản đã bị đóng hoặc vô hiệu hóa vĩnh viễn.",
                    403);
        }

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

        // check password (hỗ trợ BCrypt hash và fallback chuỗi thường cho dữ liệu cũ)
        boolean passwordCorrect = false;
        if (request.getPassword() != null && account.getPassword() != null) {
            try {
                if (passwordEncoder.matches(request.getPassword(), account.getPassword())) {
                    passwordCorrect = true;
                } else if (request.getPassword().equals(account.getPassword())) {
                    passwordCorrect = true;
                }
            } catch (Exception e) {
                if (request.getPassword().equals(account.getPassword())) {
                    passwordCorrect = true;
                }
            }
        }

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

        String identityNumber = customerProfileRepository.findByAccountId(account.getAccountId())
                .map(com.swp391.backend.entity.CustomerProfile::getIdentityNumber)
                .orElse("Chưa cập nhật");

        return LoginResult.success(
                new LoginResponse(
                        token,
                        new LoginResponse.UserInfo(
                                account.getAccountId(),
                                account.getFullName(),
                                account.getRoleId() != null ? account.getRoleId().toString() : "5",
                                account.getPhone(),
                                account.getEmail(),
                                identityNumber,
                                account.getStatus())));
    }

    public ApiResponse forgotPassword(ResendOtpRequest request) {
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            return new ApiResponse(false, "Số điện thoại không được để trống!");
        }

        Optional<Account> accountOptional = accountRepository.findByPhone(request.getPhone());
        if (accountOptional.isEmpty()) {
            return new ApiResponse(false, "Không tìm thấy tài khoản với số điện thoại này!");
        }

        Account account = accountOptional.get();
        String otpCode = String.format("%06d", new Random().nextInt(1_000_000));
        account.setOtpCode(otpCode);
        account.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        accountRepository.save(account);

        System.out.println("==========================================");
        System.out.println(">>> OTP đặt lại mật khẩu cho " + request.getPhone() + " là: " + otpCode + " <<<");
        System.out.println("==========================================");

        return new ApiResponse(true, "Đã tạo OTP. Vui lòng kiểm tra console để thử nghiệm.");
    }

    public ApiResponse resetPassword(ResetPasswordRequest request) {
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            return new ApiResponse(false, "Số điện thoại không được để trống!");
        }

        Optional<Account> accountOptional = accountRepository.findByPhone(request.getPhone());
        if (accountOptional.isEmpty()) {
            return new ApiResponse(false, "Không tìm thấy tài khoản với số điện thoại này!");
        }

        Account account = accountOptional.get();

        if (account.getOtpCode() == null
                || request.getOtpCode() == null
                || !account.getOtpCode().equals(request.getOtpCode())) {
            return new ApiResponse(false, "Mã OTP không chính xác!");
        }

        if (account.getOtpExpiryTime() == null
                || !account.getOtpExpiryTime().isAfter(LocalDateTime.now())) {
            return new ApiResponse(false, "Mã OTP đã hết hạn!");
        }

        if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
            return new ApiResponse(false, "Mật khẩu mới không được để trống!");
        }

        account.setPassword(passwordEncoder.encode(request.getNewPassword()));
        account.setOtpCode(null);
        account.setOtpExpiryTime(null);
        accountRepository.save(account);

        return new ApiResponse(true, "Đặt lại mật khẩu thành công!");
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
