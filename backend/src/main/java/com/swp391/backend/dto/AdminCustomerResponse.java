package com.swp391.backend.dto;

import java.time.LocalDateTime;

public class AdminCustomerResponse {
    private Integer accountId;
    private String fullName;
    private String phone;
    private String email;
    private String status;
    private LocalDateTime lockUntil;

    public AdminCustomerResponse() {}

    public AdminCustomerResponse(Integer accountId, String fullName, String phone, String email,
                                 String status, LocalDateTime lockUntil) {
        this.accountId = accountId;
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
        this.status = status;
        this.lockUntil = lockUntil;
    }

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getLockUntil() { return lockUntil; }
    public void setLockUntil(LocalDateTime lockUntil) { this.lockUntil = lockUntil; }
}
