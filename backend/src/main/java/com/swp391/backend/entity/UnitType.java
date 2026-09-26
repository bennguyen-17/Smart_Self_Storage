package com.swp391.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "UnitType")
public class UnitType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer unitTypeId;

    @Column(nullable = false, length = 50)
    private String typeName; // Size S, Size M, Size L, Size XL

    @Column(nullable = false, length = 50)
    private String size; // 1m x 1m x 1.2m

    @Column(nullable = false, length = 30)
    private String storageCondition = "NORMAL"; // NORMAL, CLIMATE_CONTROLLED

    @Column(nullable = false, length = 30)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    public UnitType() {
    }

    public UnitType(Integer unitTypeId, String typeName, String size, String storageCondition, String status) {
        this.unitTypeId = unitTypeId;
        this.typeName = typeName;
        this.size = size;
        this.storageCondition = storageCondition;
        this.status = status;
    }

    public Integer getUnitTypeId() {
        return unitTypeId;
    }

    public void setUnitTypeId(Integer unitTypeId) {
        this.unitTypeId = unitTypeId;
    }

    public String getTypeName() {
        return typeName;
    }

    public void setTypeName(String typeName) {
        this.typeName = typeName;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getStorageCondition() {
        return storageCondition;
    }

    public void setStorageCondition(String storageCondition) {
        this.storageCondition = storageCondition;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
