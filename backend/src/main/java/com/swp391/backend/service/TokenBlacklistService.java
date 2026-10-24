package com.swp391.backend.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service quản lý danh sách Token JWT đã đăng xuất (Blacklist).
 * Ngăn chặn token cũ tiếp tục gọi API sau khi người dùng bấm Đăng xuất.
 */
@Service
public class TokenBlacklistService {

    private final Map<String, LocalDateTime> blacklistedTokens = new ConcurrentHashMap<>();

    /**
     * Thêm token vào danh sách đen. Mặc định giữ trong 24 giờ để tự động dọn dẹp.
     */
    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) return;
        cleanExpiredTokens();
        blacklistedTokens.put(token.trim(), LocalDateTime.now().plusHours(24));
    }

    /**
     * Kiểm tra xem token có nằm trong blacklist hay không.
     */
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) return false;
        LocalDateTime expiresAt = blacklistedTokens.get(token.trim());
        if (expiresAt == null) return false;
        if (expiresAt.isBefore(LocalDateTime.now())) {
            blacklistedTokens.remove(token.trim());
            return false;
        }
        return true;
    }

    private void cleanExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
    }
}
