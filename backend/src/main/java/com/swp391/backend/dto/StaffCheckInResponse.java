package com.swp391.backend.dto;

import java.math.BigDecimal;

public class StaffCheckInResponse {
    private boolean success;
    private String message;
    private Integer reservationId;
    private String reservationCode;
    private String contractStatus;
    private String unitStatus;
    private BigDecimal collectedAmount;
    private String gatePin;
    private String invoicePdfUrl;
    private BigDecimal remainingDue;

    public StaffCheckInResponse() {}

    public StaffCheckInResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getReservationId() { return reservationId; }
    public void setReservationId(Integer reservationId) { this.reservationId = reservationId; }
    public String getReservationCode() { return reservationCode; }
    public void setReservationCode(String reservationCode) { this.reservationCode = reservationCode; }
    public String getContractStatus() { return contractStatus; }
    public void setContractStatus(String contractStatus) { this.contractStatus = contractStatus; }
    public String getUnitStatus() { return unitStatus; }
    public void setUnitStatus(String unitStatus) { this.unitStatus = unitStatus; }
    public BigDecimal getCollectedAmount() { return collectedAmount; }
    public void setCollectedAmount(BigDecimal collectedAmount) { this.collectedAmount = collectedAmount; }
    public String getGatePin() { return gatePin; }
    public void setGatePin(String gatePin) { this.gatePin = gatePin; }
    public BigDecimal getRemainingAmount() { return remainingDue; }
    public void setRemainingAmount(BigDecimal remainingAmount) { this.remainingDue = remainingAmount; }
    public BigDecimal getRemainingDue() { return remainingDue; }
    public void setRemainingDue(BigDecimal remainingDue) { this.remainingDue = remainingDue; }

    public String getInvoicePdfUrl() {
        return invoicePdfUrl;
    }

    public void setInvoicePdfUrl(String invoicePdfUrl) {
        this.invoicePdfUrl = invoicePdfUrl;
    }
    
}
