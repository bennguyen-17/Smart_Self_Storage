package com.swp391.backend.service;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.RegisterRequest;
import com.swp391.backend.dto.ResendOtpRequest;
import com.swp391.backend.dto.VerifyOtpRequest;
import com.swp391.backend.entity.User;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository, AccountRepository accountRepository) {
        this.userRepository = userRepository;
    }

    // --- US-01: Đăng ký & OTP ---
    public ApiResponse register(RegisterRequest request) {
        Optional<User> existingUserOpt = userRepository.findByPhone(request.getPhone());

        User user;
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            // Nếu đã kích hoạt rồi thì mới báo trùng số điện thoại
            if (user.isActive()) {
                return new ApiResponse(false, "Số điện thoại này đã được đăng ký và kích hoạt!");
            }
            // Nếu CHƯA kích hoạt (is_active = false), cho phép cập nhật lại thông tin & cấp OTP mới
            user.setPassword(request.getPassword());
            user.setFullName(request.getFullName());
        } else {
            user = new User();
            user.setPhone(request.getPhone());
            user.setPassword(request.getPassword());
            user.setFullName(request.getFullName());
            user.setRole("ROLE_CUSTOMER");
        }

        // Sinh mã OTP 6 số ngẫu nhiên mới
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(otpCode);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        user.setActive(false);

        userRepository.save(user);

        // In mã OTP ra Console để dễ test
        System.out.println("==========================================");
        System.out.println(">>> MÃ OTP MỚI DÀNH CHO " + request.getPhone() + " LÀ: " + otpCode + " <<<");
        System.out.println("==========================================");

        return new ApiResponse(true, "Đã gửi mã OTP mới! Vui lòng kiểm tra và xác thực.");
    }


    public ApiResponse verifyOtp(VerifyOtpRequest request) {
        Optional<User> userOpt = userRepository.findByPhone(request.getPhone());

        if (userOpt.isEmpty()) {
            return new ApiResponse(false, "Số điện thoại không tồn tại!");
        }

        User user = userOpt.get();

        if (user.getOtpCode() == null || !user.getOtpCode().equals(request.getOtpCode())) {
            return new ApiResponse(false, "Mã OTP không chính xác!");
        }

        if (user.getOtpExpiryTime().isBefore(LocalDateTime.now())) {
            return new ApiResponse(false, "Mã OTP đã hết hạn!");
        }

        user.setActive(true);
        user.setOtpCode(null); // Hủy OTP sau khi kích hoạt
        userRepository.save(user);

        return new ApiResponse(true, "Xác thực OTP thành công! Tài khoản đã được kích hoạt.");
    }

    // --- US-01: API Gửi lại mã OTP (Resend OTP) ---
    public ApiResponse resendOtp(ResendOtpRequest request) {
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            return new ApiResponse(false, "Số điện thoại không được để trống!");
        }

        Optional<User> userOpt = userRepository.findByPhone(request.getPhone());

        if (userOpt.isEmpty()) {
            return new ApiResponse(false, "Số điện thoại chưa được đăng ký trong hệ thống!");
        }

        User user = userOpt.get();

        if (user.isActive()) {
            return new ApiResponse(false, "Tài khoản đã được kích hoạt trước đó, vui lòng đăng nhập!");
        }

        // Sinh mã OTP 6 số ngẫu nhiên mới & gia hạn 5 phút
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(otpCode);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // In mã OTP ra Console để test dev
        System.out.println("==========================================");
        System.out.println(">>> MÃ OTP GỬI LẠI CHO " + request.getPhone() + " LÀ: " + otpCode + " (Hạn 5 phút) <<<");
        System.out.println("==========================================");

        return new ApiResponse(true, "Mã OTP mới đã được gửi lại thành công! Vui lòng kiểm tra.");
    }

}
