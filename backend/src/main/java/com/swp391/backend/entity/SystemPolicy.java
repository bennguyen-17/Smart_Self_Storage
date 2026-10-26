package com.swp391.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "SystemPolicy")
public class SystemPolicy {

    @Id
    @Column(name = "policyKey", length = 100, nullable = false)
    private String policyKey;

    @Column(name = "policyValue", columnDefinition = "TEXT", nullable = false)
    private String policyValue;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "updatedAt", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "updatedBy")
    private Integer updatedBy;

    public SystemPolicy() {}

    public SystemPolicy(String policyKey, String policyValue, String description, Integer updatedBy) {
        this.policyKey = policyKey;
        this.policyValue = policyValue;
        this.description = description;
        this.updatedAt = LocalDateTime.now();
        this.updatedBy = updatedBy;
    }

    public String getPolicyKey() {
        return policyKey;
    }

    public void setPolicyKey(String policyKey) {
        this.policyKey = policyKey;
    }

    public String getPolicyValue() {
        return policyValue;
    }

    public void setPolicyValue(String policyValue) {
        this.policyValue = policyValue;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Integer getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Integer updatedBy) {
        this.updatedBy = updatedBy;
    }
}
