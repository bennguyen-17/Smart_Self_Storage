package com.swp391.backend.dto;

import java.math.BigDecimal;

public class PriceDto {
    private Integer priceId;
    private Integer unitTypeId;
    private String size; // "S", "M", "L", "XL"
    private String name;
    private String description;
    private String dimensions;
    private String area;
    private String height;
    private BigDecimal dailyPrice;
    private BigDecimal monthlyPrice;
    private BigDecimal acPrice;
    private BigDecimal depositAmount;
    private BigDecimal climateSurchargePercent;
    private String status;

    public PriceDto() {
    }

    public Integer getPriceId() {
        return priceId;
    }

    public void setPriceId(Integer priceId) {
        this.priceId = priceId;
    }

    public Integer getUnitTypeId() {
        return unitTypeId;
    }

    public void setUnitTypeId(Integer unitTypeId) {
        this.unitTypeId = unitTypeId;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDimensions() {
        return dimensions;
    }

    public void setDimensions(String dimensions) {
        this.dimensions = dimensions;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public String getHeight() {
        return height;
    }

    public void setHeight(String height) {
        this.height = height;
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

    public BigDecimal getAcPrice() {
        return acPrice;
    }

    public void setAcPrice(BigDecimal acPrice) {
        this.acPrice = acPrice;
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
