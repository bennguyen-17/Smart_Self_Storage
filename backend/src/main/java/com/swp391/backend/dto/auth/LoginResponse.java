package com.swp391.backend.dto.auth;

public class LoginResponse {
    private final Long accountId;
    private final String fullName;
    private final String email;
    private final String roleId;

    public LoginResponse(Long accountId, String fullName, String email, String roleId) {
        this.accountId = accountId;
        this.fullName = fullName;
        this.email = email;
        this.roleId = roleId;
    }

    public Long getAccountId() {
        return accountId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getRoleId() {
        return roleId;
    }
}
