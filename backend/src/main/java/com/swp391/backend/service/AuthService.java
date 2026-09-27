package com.swp391.backend.service;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.RegisterRequest;
import com.swp391.backend.dto.ResendOtpRequest;
import com.swp391.backend.dto.VerifyOtpRequest;
import com.swp391.backend.entity.Account;
import com.swp391.backend.repository.AccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class AuthService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AccountRepository accountRepository, PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // --- US-01: Đăng ký & OTP ---
    public ApiResponse register(RegisterRequest request) {
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            return new ApiResponse(false, "Số điện thoại không được để trống!");
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
            account.setFullName(request.getFullName());
            if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
                account.setEmail(request.getEmail().trim());
            }
        } else {
            account = new Account();
            account.setPhone(request.getPhone().trim());
            account.setPassword(passwordEncoder.encode(request.getPassword()));
            account.setFullName(request.getFullName());
            account.setRoleId(5L); // Khách hàng
            account.setStatus("UNVERIFIED");

            String email = (request.getEmail() != null && !request.getEmail().trim().isEmpty())
                    ? request.getEmail().trim()
                    : request.getPhone().trim() + "@smartstorage.vn";
            account.setEmail(email);
        }

        // Sinh mã OTP 6 số ngẫu nhiên mới
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        account.setOtpCode(otpCode);
        account.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));

        accountRepository.save(account);

        // In mã OTP ra Console để dễ test
        System.out.println("==========================================");
        System.out.println(">>> MÃ OTP MỚI DÀNH CHO " + request.getPhone() + " LÀ: " + otpCode + " <<<");
        System.out.println("==========================================");

        return new ApiResponse(true, "Đã gửi mã OTP mới! Vui lòng kiểm tra và xác thực.");
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

        // In mã OTP ra Console để test dev
        System.out.println("==========================================");
        System.out.println(">>> MÃ OTP GỬI LẠI CHO " + request.getPhone() + " LÀ: " + otpCode + " (Hạn 5 phút) <<<");
        System.out.println("==========================================");

        return new ApiResponse(true, "Mã OTP mới đã được gửi lại thành công! Vui lòng kiểm tra.");
    }
}