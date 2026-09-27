package com.swp391.backend.dto;

public class ResendOtpRequest {

    private String phone;

    public ResendOtpRequest() {
    }

    public ResendOtpRequest(String phone) {
        this.phone = phone;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
