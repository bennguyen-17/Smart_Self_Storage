package com.swp391.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Account")
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountId;

    @Column(nullable = false)
    private Long roleId;

    @Column(nullable = false, unique = true, columnDefinition = "NVARCHAR(255)")
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false, columnDefinition = "NVARCHAR(255)")
    private String fullName;

    @Column(nullable = false, columnDefinition = "NVARCHAR(255)")
    private String password;

    @Column(nullable = false, columnDefinition = "NVARCHAR(30)")
    private String status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private Integer failedAttempts = 0;

    private LocalDateTime firstFailedAt;

    private LocalDateTime lockUntil;

    public Account() {
    }

    public Account(Long accountId, Long roleId, String email, String phone, String fullName, String password, String status, LocalDateTime createdAt, LocalDateTime updatedAt, Integer failedAttempts, LocalDateTime firstFailedAt, LocalDateTime lockUntil) {
        this.accountId = accountId;
        this.roleId = roleId;
        this.email = email;
        this.phone = phone;
        this.fullName = fullName;
        this.password = password;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.failedAttempts = failedAttempts;
        this.firstFailedAt = firstFailedAt;
        this.lockUntil = lockUntil;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public Long getRoleId() {
        return roleId;
    }

    public void setRoleId(Long roleId) {
        this.roleId = roleId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Integer getFailedAttempts() {
        return failedAttempts;
    }

    public void setFailedAttempts(Integer failedAttempts) {
        this.failedAttempts = failedAttempts;
    }

    public LocalDateTime getFirstFailedAt() {
        return firstFailedAt;
    }

    public void setFirstFailedAt(LocalDateTime firstFailedAt) {
        this.firstFailedAt = firstFailedAt;
    }

    public LocalDateTime getLockUntil() {
        return lockUntil;
    }

    public void setLockUntil(LocalDateTime lockUntil) {
        this.lockUntil = lockUntil;
    }
}
