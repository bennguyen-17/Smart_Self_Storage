package com.swp391.backend.dto;

import java.math.BigDecimal;

public class UnitDetailResponse {
    private Integer unitId;
    private Integer floorId;
    private Integer unitTypeId;
    private String typeName;
    private String size;
    private String storageCondition;
    private BigDecimal dailyPrice;
    private BigDecimal monthlyPrice;
    private BigDecimal depositAmount;
    private BigDecimal climateSurchargePercent;
    private String status;

    public UnitDetailResponse() {
    }

    public UnitDetailResponse(Integer unitId, Integer floorId, Integer unitTypeId, String typeName, String size, String storageCondition, BigDecimal dailyPrice, BigDecimal monthlyPrice, BigDecimal depositAmount, BigDecimal climateSurchargePercent, String status) {
        this.unitId = unitId;
        this.floorId = floorId;
        this.unitTypeId = unitTypeId;
        this.typeName = typeName;
        this.size = size;
        this.storageCondition = storageCondition;
        this.dailyPrice = dailyPrice;
        this.monthlyPrice = monthlyPrice;
        this.depositAmount = depositAmount;
        this.climateSurchargePercent = climateSurchargePercent;
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

    public BigDecimal getDailyPrice() {
        return dailyPrice;
    }

    public void setDailyPrice(BigDecimal dailyPrice) {
        this.dailyPrice = dailyPrice;
    }

    public BigDecimal getMonthlyPrice() {
        return monthlyPrice;
    }

    public void setMonthlyPrice(BigDecimal monthlyPrice) {
        this.monthlyPrice = monthlyPrice;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public BigDecimal getClimateSurchargePercent() {
        return climateSurchargePercent;
    }

    public void setClimateSurchargePercent(BigDecimal climateSurchargePercent) {
        this.climateSurchargePercent = climateSurchargePercent;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
