package com.swp391.backend.dto;

import java.time.LocalDateTime;

public class AdminActivityLogResponse {
    private Integer activityLogId;
    private Integer accountId;
    private String actorName;
    private String actorRole;
    private String action;
    private String description;
    private LocalDateTime createdAt;
    private String ipAddress;

    public AdminActivityLogResponse() {
    }

    public AdminActivityLogResponse(Integer activityLogId, Integer accountId, String actorName, String actorRole, String action, String description, LocalDateTime createdAt, String ipAddress) {
        this.activityLogId = activityLogId;
        this.accountId = accountId;
        this.actorName = actorName;
        this.actorRole = actorRole;
        this.action = action;
        this.description = description;
        this.createdAt = createdAt;
        this.ipAddress = ipAddress;
    }

    public Integer getActivityLogId() {
        return activityLogId;
    }

    public void setActivityLogId(Integer activityLogId) {
        this.activityLogId = activityLogId;
    }

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
}
