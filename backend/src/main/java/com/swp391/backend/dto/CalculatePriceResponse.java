package com.swp391.backend.dto;

import java.math.BigDecimal;

public class CalculatePriceResponse {
    private boolean success;
    private String message;
    private Integer unitTypeId;
    private String rentalType;
    private Integer duration;
    private BigDecimal baseUnitPrice;
    private BigDecimal baseTotalAmount;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal climateSurchargeAmount;
    private BigDecimal finalRentalAmount;
    private BigDecimal depositAmount;
    private BigDecimal totalInitialPayment; // Tiền cọc + Tiền thuê (hoặc chỉ tiền cọc tùy quy trình)

    public CalculatePriceResponse() {
    }

    public static CalculatePriceResponse error(String message) {
        CalculatePriceResponse response = new CalculatePriceResponse();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getUnitTypeId() {
        return unitTypeId;
    }

    public void setUnitTypeId(Integer unitTypeId) {
        this.unitTypeId = unitTypeId;
    }

    public String getRentalType() {
        return rentalType;
    }

    public void setRentalType(String rentalType) {
        this.rentalType = rentalType;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public BigDecimal getBaseUnitPrice() {
        return baseUnitPrice;
    }

    public void setBaseUnitPrice(BigDecimal baseUnitPrice) {
        this.baseUnitPrice = baseUnitPrice;
    }

    public BigDecimal getBaseTotalAmount() {
        return baseTotalAmount;
    }

    public void setBaseTotalAmount(BigDecimal baseTotalAmount) {
        this.baseTotalAmount = baseTotalAmount;
    }

    public BigDecimal getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(BigDecimal discountPercent) {
        this.discountPercent = discountPercent;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getClimateSurchargeAmount() {
        return climateSurchargeAmount;
    }

    public void setClimateSurchargeAmount(BigDecimal climateSurchargeAmount) {
        this.climateSurchargeAmount = climateSurchargeAmount;
    }

    public BigDecimal getFinalRentalAmount() {
        return finalRentalAmount;
    }

    public void setFinalRentalAmount(BigDecimal finalRentalAmount) {
        this.finalRentalAmount = finalRentalAmount;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public BigDecimal getTotalInitialPayment() {
        return totalInitialPayment;
    }

    public void setTotalInitialPayment(BigDecimal totalInitialPayment) {
        this.totalInitialPayment = totalInitialPayment;
    }
}
