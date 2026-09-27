package com.swp391.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class UnitDetailResponse {
    private Integer unitId;
    private String unitCode; // Biển số ô kho: e.g. "HN01-G-XL05" hoặc "XL05"
    private Integer floorId;
    private String floorName;
    private Integer unitTypeId;
    private String typeName; // Size S, Size M, Size L, Size XL
    private String size; // "2.5m x 4.0m"
    private Double lengthM;
    private Double widthM;
    private Double heightM;
    private Double areaM2;
    private BigDecimal maxLoadKgM2; // Tải trọng tối đa kg/m2
    private String storageCondition;
    private Boolean isClimate; // true nếu là kho mát điều hòa
    private BigDecimal dailyPrice;
    private BigDecimal monthlyPrice;
    private BigDecimal depositAmount;
    private BigDecimal climateSurchargePercent;
    private String status;
    private LocalDateTime holdExpiresAt;

    public UnitDetailResponse() {
    }

    public Integer getUnitId() {
        return unitId;
    }

    public void setUnitId(Integer unitId) {
        this.unitId = unitId;
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

    public String getFloorName() {
        return floorName;
    }

    public void setFloorName(String floorName) {
        this.floorName = floorName;
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

    public Double getLengthM() {
        return lengthM;
    }

    public void setLengthM(Double lengthM) {
        this.lengthM = lengthM;
    }

    public Double getWidthM() {
        return widthM;
    }

    public void setWidthM(Double widthM) {
        this.widthM = widthM;
    }

    public Double getHeightM() {
        return heightM;
    }

    public void setHeightM(Double heightM) {
        this.heightM = heightM;
    }

    public Double getAreaM2() {
        return areaM2;
    }

    public void setAreaM2(Double areaM2) {
        this.areaM2 = areaM2;
    }

    public BigDecimal getMaxLoadKgM2() {
        return maxLoadKgM2;
    }

    public void setMaxLoadKgM2(BigDecimal maxLoadKgM2) {
        this.maxLoadKgM2 = maxLoadKgM2;
    }

    public String getStorageCondition() {
        return storageCondition;
    }

    public void setStorageCondition(String storageCondition) {
        this.storageCondition = storageCondition;
    }

    public Boolean getIsClimate() {
        return isClimate;
    }

    public void setIsClimate(Boolean climate) {
        isClimate = climate;
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

    public LocalDateTime getHoldExpiresAt() {
        return holdExpiresAt;
    }

    public void setHoldExpiresAt(LocalDateTime holdExpiresAt) {
        this.holdExpiresAt = holdExpiresAt;
    }
}
