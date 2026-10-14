package com.swp391.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "Facility")
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer facilityId;

    @Column(nullable = false, length = 100)
    private String facilityName;

    @Column(length = 20)
    private String facilityCode;

    @Column(length = 10)
    private String layoutType = "A";

    @Column(nullable = false, length = 255)
    private String address;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(nullable = false, length = 30)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, MAINTENANCE

    public Facility() {
    }

    public Facility(Integer facilityId, String facilityName, String facilityCode, String layoutType, String address, String phone, String status) {
        this.facilityId = facilityId;
        this.facilityName = facilityName;
        this.facilityCode = facilityCode;
        this.layoutType = layoutType;
        this.address = address;
        this.phone = phone;
        this.status = status;
    }

    public Facility(Integer facilityId, String facilityName, String address, String phone, String status) {
        this.facilityId = facilityId;
        this.facilityName = facilityName;
        this.address = address;
        this.phone = phone;
        this.status = status;
    }

    public Integer getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Integer facilityId) {
        this.facilityId = facilityId;
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

    public String getLayoutType() {
        return layoutType;
    }

    public void setLayoutType(String layoutType) {
        this.layoutType = layoutType;
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
