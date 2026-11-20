package com.swp391.backend.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Lưu JWT đã đăng xuất trong bộ nhớ để chặn tái sử dụng
@Service
public class TokenBlacklistService {

    private final Map<String, LocalDateTime> blacklistedTokens = new ConcurrentHashMap<>();

    // Giữ token trong blacklist 24 giờ rồi tự dọn
    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) return;
        cleanExpiredTokens();
        blacklistedTokens.put(token.trim(), LocalDateTime.now().plusHours(24));
    }

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
