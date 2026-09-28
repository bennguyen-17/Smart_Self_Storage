package com.swp391.backend.dto.auth;

public class LoginResponse {
    private String token;
    private UserInfo user;

    public LoginResponse() {
    }

    public LoginResponse(String token, UserInfo user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UserInfo getUser() {
        return user;
    }

    public void setUser(UserInfo user) {
        this.user = user;
    }

    public static class UserInfo {
        private Integer id;
        private String fullName;
        private String role;
        private String phone;
        private String email;
        private String identityNumber;
        private String status;

        public UserInfo() {
        }

        public UserInfo(Integer id, String fullName, String role) {
            this.id = id;
            this.fullName = fullName;
            this.role = role;
        }

        public UserInfo(Integer id, String fullName, String role, String phone, String email, String identityNumber, String status) {
            this.id = id;
            this.fullName = fullName;
            this.role = role;
            this.phone = phone;
            this.email = email;
            this.identityNumber = identityNumber;
            this.status = status;
        }

        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getIdentityNumber() {
            return identityNumber;
        }

        public void setIdentityNumber(String identityNumber) {
            this.identityNumber = identityNumber;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}
