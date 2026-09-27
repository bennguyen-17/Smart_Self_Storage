package com.swp391.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "Floor")
public class Floor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer floorId;

    @Column(nullable = false)
    private Integer facilityId;

    @Column(nullable = false, length = 50)
    private String floorName;

    @Column(precision = 10, scale = 2)
    private BigDecimal maxLoadPerM2;

    @Column(nullable = false, length = 30)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, MAINTENANCE

    public Floor() {
    }

    public Floor(Integer floorId, Integer facilityId, String floorName, BigDecimal maxLoadPerM2, String status) {
        this.floorId = floorId;
        this.facilityId = facilityId;
        this.floorName = floorName;
        this.maxLoadPerM2 = maxLoadPerM2;
        this.status = status;
    }

    public Integer getFloorId() {
        return floorId;
    }

    public void setFloorId(Integer floorId) {
        this.floorId = floorId;
    }

    public Integer getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Integer facilityId) {
        this.facilityId = facilityId;
    }

    public String getFloorName() {
        return floorName;
    }

    public void setFloorName(String floorName) {
        this.floorName = floorName;
    }

    public BigDecimal getMaxLoadPerM2() {
        return maxLoadPerM2;
    }

    public void setMaxLoadPerM2(BigDecimal maxLoadPerM2) {
        this.maxLoadPerM2 = maxLoadPerM2;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
