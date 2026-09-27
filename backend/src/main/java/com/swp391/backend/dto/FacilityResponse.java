package com.swp391.backend.dto;

public class FacilityResponse {
    private Integer facilityId;
    private String facilityCode; // HN-01, HN-02, HCM-01, ...
    private String shortCode;    // CG, TX, Q1, Q7, TD, HC, NK
    private String facilityName;
    private String address;
    private String phone;
    private Integer floorCount;  // 2 hoặc 3
    private String layoutType;   // "A" (Urban) hoặc "B" (Logistics)
    private Boolean isAllClimate;// true nếu HCM-01
    private String status;

    public FacilityResponse() {
    }

    public FacilityResponse(Integer facilityId, String facilityCode, String shortCode, String facilityName, String address, String phone, Integer floorCount, String layoutType, Boolean isAllClimate, String status) {
        this.facilityId = facilityId;
        this.facilityCode = facilityCode;
        this.shortCode = shortCode;
        this.facilityName = facilityName;
        this.address = address;
        this.phone = phone;
        this.floorCount = floorCount;
        this.layoutType = layoutType;
        this.isAllClimate = isAllClimate;
        this.status = status;
    }

    public Integer getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Integer facilityId) {
        this.facilityId = facilityId;
    }

    public String getFacilityCode() {
        return facilityCode;
    }

    public void setFacilityCode(String facilityCode) {
        this.facilityCode = facilityCode;
    }

    public String getShortCode() {
        return shortCode;
    }

    public void setShortCode(String shortCode) {
        this.shortCode = shortCode;
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

    public Integer getFloorCount() {
        return floorCount;
    }

    public void setFloorCount(Integer floorCount) {
        this.floorCount = floorCount;
    }

    public String getLayoutType() {
        return layoutType;
    }

    public void setLayoutType(String layoutType) {
        this.layoutType = layoutType;
    }

    public Boolean getIsAllClimate() {
        return isAllClimate;
    }

    public void setIsAllClimate(Boolean allClimate) {
        isAllClimate = allClimate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
