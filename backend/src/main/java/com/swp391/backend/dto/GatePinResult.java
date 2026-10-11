package com.swp391.backend.dto;

import java.time.LocalDateTime;

public class GatePinResult {

    private String pin;
    private int ttlSeconds;
    private LocalDateTime expiresAt;

    public GatePinResult() {
    }

    public GatePinResult(String pin, int ttlSeconds, LocalDateTime expiresAt) {
        this.pin = pin;
        this.ttlSeconds = ttlSeconds;
        this.expiresAt = expiresAt;
    }

    public String getPin() {
        return pin;
    }

    public void setPin(String pin) {
        this.pin = pin;
    }

    public int getTtlSeconds() {
        return ttlSeconds;
    }

    public void setTtlSeconds(int ttlSeconds) {
        this.ttlSeconds = ttlSeconds;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
