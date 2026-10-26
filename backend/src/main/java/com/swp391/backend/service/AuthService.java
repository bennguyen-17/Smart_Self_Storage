package com.swp391.backend.service;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.RegisterRequest;
import com.swp391.backend.dto.ResendOtpRequest;
import com.swp391.backend.dto.VerifyOtpRequest;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.CustomerProfile;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.CustomerProfileRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.repository.ActivityLogRepository;
import io.jsonwebtoken.Claims;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class AuthService {

    private final AccountRepository accountRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final TokenBlacklistService tokenBlacklistService;
    private final ActivityLogRepository activityLogRepository;
    private final JwtService jwtService;

    public AuthService(AccountRepository accountRepository,
                       CustomerProfileRepository customerProfileRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       TokenBlacklistService tokenBlacklistService,
                       ActivityLogRepository activityLogRepository,
                       JwtService jwtService) {
        this.accountRepository = accountRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.activityLogRepository = activityLogRepository;
        this.jwtService = jwtService;
    }

    // --- US-01: Đăng ký & OTP ---
    public ApiResponse register(RegisterRequest request) {
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            return new ApiResponse(false, "Họ và tên không được để trống!");
        }
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            return new ApiResponse(false, "Số điện thoại không được để trống!");
        }
        if (!request.getPhone().trim().matches("^0\\d{9}$")) {
            return new ApiResponse(false, "Số điện thoại phải bắt đầu bằng số 0 và gồm đúng 10 chữ số!");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return new ApiResponse(false, "Email không được để trống!");
        }
        if (!request.getEmail().trim().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            return new ApiResponse(false, "Địa chỉ email không hợp lệ!");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return new ApiResponse(false, "Mật khẩu không được để trống!");
        }
        if (request.getCccd() == null || request.getCccd().trim().isEmpty()) {
            return new ApiResponse(false, "Số CCCD không được để trống!");
        }
        if (!request.getCccd().trim().matches("^\\d{12}$")) {
            return new ApiResponse(false, "Số CCCD phải bao gồm đúng 12 chữ số!");
        }

        // Kiểm tra email trùng với tài khoản ACTIVE khác
        Optional<Account> existingEmailOpt = accountRepository.findByEmail(request.getEmail().trim());
        if (existingEmailOpt.isPresent() && !existingEmailOpt.get().getPhone().equals(request.getPhone().trim()) && "ACTIVE".equalsIgnoreCase(existingEmailOpt.get().getStatus())) {
            return new ApiResponse(false, "Địa chỉ Email này đã được đăng ký cho tài khoản khác!");
        }

        Optional<Account> existingAccountOpt = accountRepository.findByPhone(request.getPhone().trim());

        Account account;
        if (existingAccountOpt.isPresent()) {
            account = existingAccountOpt.get();
            // Nếu đã kích hoạt rồi thì báo trùng số điện thoại
            if ("ACTIVE".equalsIgnoreCase(account.getStatus())) {
                return new ApiResponse(false, "Số điện thoại này đã được đăng ký và kích hoạt!");
            }
            // Nếu CHƯA kích hoạt (UNVERIFIED), cho phép cập nhật lại thông tin & cấp OTP mới
            account.setStatus("UNVERIFIED");
            account.setPassword(passwordEncoder.encode(request.getPassword()));
            account.setFullName(request.getFullName().trim());
            account.setEmail(request.getEmail().trim());
        } else {
            account = new Account();
            account.setPhone(request.getPhone().trim());
            account.setPassword(passwordEncoder.encode(request.getPassword()));
            account.setFullName(request.getFullName().trim());
            account.setRoleId(5L); // Khách hàng
            account.setStatus("UNVERIFIED");
            account.setEmail(request.getEmail().trim());
        }

        // Sinh mã OTP 6 số ngẫu nhiên mới
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        account.setOtpCode(otpCode);
        account.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));

        Account savedAccount = accountRepository.save(account);

        // Lưu thông tin khách hàng vào CustomerProfile (CCCD & Tài khoản ngân hàng nếu FE có gửi)
        String cccd = (request.getCccd() != null && !request.getCccd().trim().isEmpty()) ? request.getCccd().trim() : null;
        String bankName = (request.getBankName() != null && !request.getBankName().trim().isEmpty()) ? request.getBankName().trim() : null;
        String bankAccountNumber = (request.getBankAccountNumber() != null && !request.getBankAccountNumber().trim().isEmpty()) ? request.getBankAccountNumber().trim() : null;
        String bankAccountName = (request.getBankAccountName() != null && !request.getBankAccountName().trim().isEmpty()) ? request.getBankAccountName().trim().toUpperCase() : null;

        if (cccd != null || bankName != null || bankAccountNumber != null) {
            Optional<CustomerProfile> profileOpt = customerProfileRepository.findByAccountId(savedAccount.getAccountId());
            CustomerProfile profile = profileOpt.orElseGet(() -> new CustomerProfile(savedAccount.getAccountId(), cccd != null ? cccd : "Chưa cập nhật"));
            if (cccd != null) profile.setIdentityNumber(cccd);
            if (bankName != null) profile.setBankName(bankName);
            if (bankAccountNumber != null) profile.setBankAccountNumber(bankAccountNumber);
            if (bankAccountName != null) profile.setBankAccountName(bankAccountName);
            customerProfileRepository.save(profile);
        }

        if (savedAccount.getEmail() != null && !savedAccount.getEmail().isBlank()) {
            emailService.sendOtpEmail(savedAccount.getEmail(), savedAccount.getFullName(), otpCode, "Đăng ký tài khoản");
        }

        return new ApiResponse(true, "Mã xác thực OTP đã được gửi đến email đăng ký của bạn. Vui lòng kiểm tra hộp thư!");
    }

    // --- US-01: Xác thực mã OTP ---
    public ApiResponse verifyOtp(VerifyOtpRequest request) {
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            return new ApiResponse(false, "Số điện thoại không được để trống!");
        }

        Optional<Account> accountOpt = accountRepository.findByPhone(request.getPhone().trim());

        if (accountOpt.isEmpty()) {
            return new ApiResponse(false, "Số điện thoại không tồn tại!");
        }

        Account account = accountOpt.get();

        if (account.getOtpCode() == null || !account.getOtpCode().equals(request.getOtpCode())) {
            return new ApiResponse(false, "Mã OTP không chính xác!");
        }

        if (account.getOtpExpiryTime() != null && account.getOtpExpiryTime().isBefore(LocalDateTime.now())) {
            return new ApiResponse(false, "Mã OTP đã hết hạn!");
        }

        account.setStatus("ACTIVE");
        account.setOtpCode(null); // Hủy OTP sau khi kích hoạt
        accountRepository.save(account);

        return new ApiResponse(true, "Xác thực OTP thành công! Tài khoản đã được kích hoạt.");
    }

    // --- US-01: Gửi lại mã OTP (Resend OTP) ---
    public ApiResponse resendOtp(ResendOtpRequest request) {
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            return new ApiResponse(false, "Số điện thoại không được để trống!");
        }

        Optional<Account> accountOpt = accountRepository.findByPhone(request.getPhone().trim());

        if (accountOpt.isEmpty()) {
            return new ApiResponse(false, "Số điện thoại chưa được đăng ký trong hệ thống!");
        }

        Account account = accountOpt.get();

        if ("ACTIVE".equalsIgnoreCase(account.getStatus())) {
            return new ApiResponse(false, "Tài khoản đã được kích hoạt trước đó, vui lòng đăng nhập!");
        }

        // Sinh mã OTP 6 số ngẫu nhiên mới & gia hạn 5 phút
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        account.setOtpCode(otpCode);
        account.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        accountRepository.save(account);

        // Gửi mã OTP mới qua Email
        if (account.getEmail() != null && !account.getEmail().isBlank()) {
            emailService.sendOtpEmail(account.getEmail(), account.getFullName(), otpCode, "Gửi lại mã xác thực");
        }

        return new ApiResponse(true, "Mã OTP mới đã được gửi lại vào email của bạn. Vui lòng kiểm tra hộp thư!");
    }

    // --- US-02: Đăng xuất & Thu hồi Token (Logout) ---
    public ApiResponse logout(String authHeader, String ipAddress) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            tokenBlacklistService.blacklistToken(token);

            try {
                Claims claims = jwtService.validateTokenAndGetClaims(token);
                Object userIdObj = claims.get("userId");
                Integer accountId = null;
                if (userIdObj instanceof Number) {
                    accountId = ((Number) userIdObj).intValue();
                } else if (userIdObj != null) {
                    accountId = Integer.parseInt(userIdObj.toString());
                }
                if (accountId != null && activityLogRepository != null) {
                    ActivityLog log = new ActivityLog();
                    log.setAccountId(accountId);
                    log.setAction("LOGOUT");
                    log.setDescription("Người dùng đã đăng xuất khỏi hệ thống.");
                    log.setIpAddress(ipAddress != null ? ipAddress : "127.0.0.1");
                    log.setCreatedAt(LocalDateTime.now());
                    activityLogRepository.save(log);
                }
            } catch (Exception ignored) {}
        }
        return new ApiResponse(true, "Đăng xuất thành công.");
    }
}
