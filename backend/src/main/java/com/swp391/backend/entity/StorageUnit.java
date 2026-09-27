package com.swp391.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "StorageUnit")
public class StorageUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer unitId;

    @Column(nullable = false)
    private Integer floorId;

    @Column(nullable = false)
    private Integer unitTypeId;

    @Column(nullable = false, length = 30)
    private String status = "AVAILABLE"; // AVAILABLE, HOLD, RENTED, MAINTENANCE, OVERDUE

    public StorageUnit() {
    }

    public StorageUnit(Integer unitId, Integer floorId, Integer unitTypeId, String status) {
        this.unitId = unitId;
        this.floorId = floorId;
        this.unitTypeId = unitTypeId;
        this.status = status;
    }

    public Integer getUnitId() {
        return unitId;
    }

    public void setUnitId(Integer unitId) {
        this.unitId = unitId;
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
