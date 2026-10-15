package com.swp391.backend.dto;

public class InternalAccountResponse {
    private Integer accountId;
    private String fullName;
    private String email;
    private String phone;
    private String role; // ADMIN, BOM, MANAGER, STAFF
    private Integer facilityId;
    private String status; // ACTIVE, LOCKED
    private boolean mustChangePassword;
    private String lastLoginAt;

    public InternalAccountResponse() {
    }

    public InternalAccountResponse(Integer accountId, String fullName, String email, String phone,
                                   String role, Integer facilityId, String status,
                                   boolean mustChangePassword, String lastLoginAt) {
        this.accountId = accountId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.facilityId = facilityId;
        this.status = status;
        this.mustChangePassword = mustChangePassword;
        this.lastLoginAt = lastLoginAt;
    }

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Integer getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Integer facilityId) {
        this.facilityId = facilityId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }

    public String getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(String lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }
}
