package com.swp391.backend.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.RegisterRequest;
import com.swp391.backend.dto.VerifyOtpRequest;
import com.swp391.backend.entity.User;
import com.swp391.backend.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public ApiResponse register(RegisterRequest request) {
        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            return new ApiResponse("Số điện thoại đã tồn tại!", false);
        }

        User user = new User();
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole("ROLE_CUSTOMER");
        user.setActive(false);

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));

        userRepository.save(user);

        // TODO: Call SMS Gateway API here to send OTP to user's phone.
        System.out.println("MÃ OTP CỦA SĐT " + request.getPhone() + " LÀ: " + otp);

        return new ApiResponse("Đăng ký thành công. Vui lòng kiểm tra mã OTP!", true);
    }

    public ApiResponse verifyOtp(VerifyOtpRequest request) {
        Optional<User> userOpt = userRepository.findByPhone(request.getPhone());
        if (userOpt.isEmpty()) {
            return new ApiResponse("Không tìm thấy tài khoản!", false);
        }

        User user = userOpt.get();
        if (user.isActive()) {
            return new ApiResponse("Tài khoản đã được kích hoạt trước đó!", false);
        }

        if (!user.getOtpCode().equals(request.getOtpCode())) {
            return new ApiResponse("Mã OTP không chính xác!", false);
        }

        if (user.getOtpExpiryTime().isBefore(LocalDateTime.now())) {
            return new ApiResponse("Mã OTP đã hết hạn!", false);
        }

        user.setActive(true);
        user.setOtpCode(null);
        user.setOtpExpiryTime(null);
        userRepository.save(user);

        return new ApiResponse("Xác thực OTP thành công! Có thể đăng nhập.", true);
    }
}
