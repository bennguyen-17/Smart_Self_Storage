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

    public static final String PASSWORD_REGEX =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$";
    public static final String PASSWORD_POLICY_MESSAGE =
            "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt!";

    // Dùng chung cho đăng ký, đổi mật khẩu và đặt lại mật khẩu
    public static String validatePasswordStrength(String password, boolean trimInput) {
        if (password == null || password.trim().isEmpty()) {
            return "Mật khẩu không được để trống!";
        }
        String candidate = trimInput ? password.trim() : password;
        if (!candidate.matches(PASSWORD_REGEX)) {
            return PASSWORD_POLICY_MESSAGE;
        }
        return null;
    }

    public ApiResponse register(RegisterRequest request) {
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            return new ApiResponse(false, "Họ và tên không được để trống!");
        }
        if (request.getFullName().trim().matches(".*\\d.*") || !request.getFullName().trim().matches("^[\\p{L}\\s]+$")) {
            return new ApiResponse(false, "Họ và tên chỉ được chứa chữ cái, không được chứa số hoặc ký tự đặc biệt!");
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
        String passwordError = validatePasswordStrength(request.getPassword(), false);
        if (passwordError != null) {
            return new ApiResponse(false, passwordError);
        }
        if (request.getCccd() == null || request.getCccd().trim().isEmpty()) {
            return new ApiResponse(false, "Số CCCD không được để trống!");
        }
        if (!request.getCccd().trim().matches("^\\d{12}$")) {
            return new ApiResponse(false, "Số CCCD phải bao gồm đúng 12 chữ số!");
        }

        // Yêu cầu nhập sẵn tài khoản ngân hàng khi đăng ký để dùng cho hoàn cọc
        if (request.getBankName() == null || request.getBankName().trim().isEmpty()) {
            return new ApiResponse(false, "Vui lòng chọn hoặc nhập tên ngân hàng nhận hoàn cọc!");
        }
        if (request.getBankAccountNumber() == null || request.getBankAccountNumber().trim().isEmpty()) {
            return new ApiResponse(false, "Số tài khoản ngân hàng không được để trống!");
        }
        if (!request.getBankAccountNumber().trim().matches("^\\d{6,20}$")) {
            return new ApiResponse(false, "Số tài khoản ngân hàng phải gồm từ 6 đến 20 chữ số!");
        }
        if (request.getBankAccountName() == null || request.getBankAccountName().trim().isEmpty()) {
            return new ApiResponse(false, "Tên chủ tài khoản ngân hàng không được để trống!");
        }
        if (!request.getBankAccountName().trim().matches("^[A-Z\\s]+$")) {
            return new ApiResponse(false, "Tên chủ tài khoản ngân hàng phải viết in hoa không dấu, không chứa số!");
        }

        Optional<CustomerProfile> existingCccdProfileOpt = customerProfileRepository.findByIdentityNumber(request.getCccd().trim());
        if (existingCccdProfileOpt.isPresent()) {
            Optional<Account> cccdAccountOpt = accountRepository.findById(Long.valueOf(existingCccdProfileOpt.get().getAccountId()));
            if (cccdAccountOpt.isPresent() && !cccdAccountOpt.get().getPhone().equals(request.getPhone().trim())) {
                return new ApiResponse(false, "Số CCCD này đã được đăng ký cho tài khoản khác!");
            }
        }

        Optional<Account> existingEmailOpt = accountRepository.findByEmail(request.getEmail().trim());
        if (existingEmailOpt.isPresent() && !existingEmailOpt.get().getPhone().equals(request.getPhone().trim()) && "ACTIVE".equalsIgnoreCase(existingEmailOpt.get().getStatus())) {
            return new ApiResponse(false, "Địa chỉ Email này đã được đăng ký cho tài khoản khác!");
        }

        Optional<Account> existingAccountOpt = accountRepository.findByPhone(request.getPhone().trim());

        Account account;
        if (existingAccountOpt.isPresent()) {
            account = existingAccountOpt.get();
            if ("ACTIVE".equalsIgnoreCase(account.getStatus())) {
                return new ApiResponse(false, "Số điện thoại này đã được đăng ký và kích hoạt!");
            }
            // Tài khoản UNVERIFIED đăng ký lại sẽ ghi đè thông tin và cấp OTP mới
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

        String otpCode = String.format("%06d", new Random().nextInt(999999));
        account.setOtpCode(otpCode);
        account.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));

        Account savedAccount = accountRepository.save(account);

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
        account.setOtpCode(null);
        accountRepository.save(account);

        return new ApiResponse(true, "Xác thực OTP thành công! Tài khoản đã được kích hoạt.");
    }

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

        String otpCode = String.format("%06d", new Random().nextInt(999999));
        account.setOtpCode(otpCode);
        account.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        accountRepository.save(account);

        if (account.getEmail() != null && !account.getEmail().isBlank()) {
            emailService.sendOtpEmail(account.getEmail(), account.getFullName(), otpCode, "Gửi lại mã xác thực");
        }

        return new ApiResponse(true, "Mã OTP mới đã được gửi lại vào email của bạn. Vui lòng kiểm tra hộp thư!");
    }

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
