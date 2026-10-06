package com.swp391.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "StorageUnit")
public class StorageUnit {

    @Id
    @Column(name = "unitCode", nullable = false, length = 50)
    private String unitCode;

    @Column(nullable = false)
    private Integer floorId;

    @Column(nullable = false)
    private Integer unitTypeId;

    @Column(nullable = false, length = 30)
    private String status = "AVAILABLE"; // AVAILABLE, HOLD, OCCUPIED, UNDER_MAINTENANCE; legacy RENTED, MAINTENANCE, OVERDUE remain supported

    public StorageUnit() {
    }

    public StorageUnit(String unitCode, Integer floorId, Integer unitTypeId, String status) {
        this.unitCode = unitCode;
        this.floorId = floorId;
        this.unitTypeId = unitTypeId;
        this.status = status;
    }

    public String getUnitCode() {
        return unitCode;
    }

    public void setUnitCode(String unitCode) {
        this.unitCode = unitCode;
    }

    public Integer getFloorId() {
        return floorId;
    }

    public void setFloorId(Integer floorId) {
        this.floorId = floorId;
    }

    public Integer getUnitTypeId() {
        return unitTypeId;
    }

    public void setUnitTypeId(Integer unitTypeId) {
        this.unitTypeId = unitTypeId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
