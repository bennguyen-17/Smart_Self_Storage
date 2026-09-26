package com.swp391.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity 
@Table (name = "ActivityLog")
public class ActivityLog {

    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long activityLogId;

    @Column (nullable = false)
    private Long accountId;

    @Column(nullable = false, columnDefinition = "NVARCHAR(50)")
    private String action;

    @Column(columnDefinition = "NVARCHAR(500)")
    private String description;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(columnDefinition = "NVARCHAR(50)")
    private String ipAddress;

    public ActivityLog() {
    }

    public ActivityLog(Long activityLogId, Long accountId, String action, String description, LocalDateTime createdAt,
            String ipAddress) {
        this.activityLogId = activityLogId;
        this.accountId = accountId;
        this.action = action;
        this.description = description;
        this.createdAt = createdAt;
        this.ipAddress = ipAddress;
    }

    public Long getActivityLogId() {
        return activityLogId;
    }

    public void setActivityLogId(Long activityLogId) {
        this.activityLogId = activityLogId;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
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