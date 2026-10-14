package com.swp391.backend.dto;

public class FacilityRequest {
    private String facilityName;
    private String facilityCode; // HN-03, HCM-04, ...
    private String address;
    private String phone;
    private String status;
    private String layoutType;   // "A" hoặc "B"
    private Integer floorCount;  // 2 hoặc 3
    private Boolean isAllClimate;
    private String managerName;
    private String managerPhone;

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

    public String getFacilityCode() {
        return facilityCode;
    }

    public void setFacilityCode(String facilityCode) {
        this.facilityCode = facilityCode;
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

    public String getLayoutType() {
        return layoutType;
    }

    public void setLayoutType(String layoutType) {
        this.layoutType = layoutType;
    }

    public Integer getFloorCount() {
        return floorCount;
    }

    public void setFloorCount(Integer floorCount) {
        this.floorCount = floorCount;
    }

    public Boolean getIsAllClimate() {
        return isAllClimate;
    }

    public void setIsAllClimate(Boolean isAllClimate) {
        this.isAllClimate = isAllClimate;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public String getManagerPhone() {
        return managerPhone;
    }

    public void setManagerPhone(String managerPhone) {
        this.managerPhone = managerPhone;
    }
}
