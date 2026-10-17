package com.swp391.backend.dto;

import java.math.BigDecimal;

public class RenewAtCounterResponse {
    private boolean success;
    private String message;
    private Integer reservationId;
    private String reservationCode;
    private String contractStatus;
    private String unitStatus;
    private String invoiceNumber;
    private BigDecimal amount;
    private Integer discountPercent;
    private String newExpiryDate;
    private String gatePin;

    public RenewAtCounterResponse() {}

    public RenewAtCounterResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
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

    public Integer getReservationId() {
        return reservationId;
    }

    public void setReservationId(Integer reservationId) {
        this.reservationId = reservationId;
    }

    public String getReservationCode() {
        return reservationCode;
    }

    public void setReservationCode(String reservationCode) {
        this.reservationCode = reservationCode;
    }

    public String getContractStatus() {
        return contractStatus;
    }

    public void setContractStatus(String contractStatus) {
        this.contractStatus = contractStatus;
    }

    public String getUnitStatus() {
        return unitStatus;
    }

    public void setUnitStatus(String unitStatus) {
        this.unitStatus = unitStatus;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Integer getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(Integer discountPercent) {
        this.discountPercent = discountPercent;
    }

    public String getNewExpiryDate() {
        return newExpiryDate;
    }

    public void setNewExpiryDate(String newExpiryDate) {
        this.newExpiryDate = newExpiryDate;
    }

    public String getGatePin() {
        return gatePin;
    }

    public void setGatePin(String gatePin) {
        this.gatePin = gatePin;
    }
}
