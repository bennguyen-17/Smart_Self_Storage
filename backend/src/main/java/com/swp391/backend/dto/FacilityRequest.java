package com.swp391.backend.dto;

public class FacilityRequest {
    private String facilityName;
    private String address;
    private String phone;
    private String status;

    public FacilityRequest() {
    }

    public FacilityRequest(String facilityName, String address, String phone, String status) {
        this.facilityName = facilityName;
        this.address = address;
        this.phone = phone;
        this.status = status;
    }

    public String getFacilityName() {
        return facilityName;
    }

    public void setFacilityName(String facilityName) {
        this.facilityName = facilityName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
