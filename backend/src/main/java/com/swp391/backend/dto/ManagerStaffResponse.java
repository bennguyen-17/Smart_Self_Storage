package com.swp391.backend.dto;

public class ManagerStaffResponse {
    private Integer employeeId;
    private String fullName;
    private String phone;
    private Integer facilityId;
    private String status;

    public ManagerStaffResponse() {
    }

    public ManagerStaffResponse(Integer employeeId, String fullName, String phone, Integer facilityId, String status) {
        this.employeeId = employeeId;
        this.fullName = fullName;
        this.phone = phone;
        this.facilityId = facilityId;
        this.status = status;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
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
}
