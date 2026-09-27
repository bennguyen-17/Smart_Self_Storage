package com.swp391.backend.dto;

import java.time.LocalDateTime;

public class HoldUnitResponse {
    private boolean success;
    private Integer holdId;
    private String message;
    private LocalDateTime holdExpiresAt;

    public HoldUnitResponse() {
    }

    public static HoldUnitResponse error(String message) {
        HoldUnitResponse response = new HoldUnitResponse();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public Integer getHoldId() {
        return holdId;
    }

    public void setHoldId(Integer holdId) {
        this.holdId = holdId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getHoldExpiresAt() {
        return holdExpiresAt;
    }

    public void setHoldExpiresAt(LocalDateTime holdExpiresAt) {
        this.holdExpiresAt = holdExpiresAt;
    }
}
