package com.swp391.backend.dto;

import java.math.BigDecimal;

public class StaffChangeUnitResponse {
    private boolean success;
    private String message;
    private Integer reservationId;
    private String newUnitCode;
    private BigDecimal remainingDue;
    private BigDecimal refundAmount;

    public StaffChangeUnitResponse() {
    }

    public StaffChangeUnitResponse(boolean success, String message, Integer reservationId,
                                   String newUnitCode, BigDecimal remainingDue, BigDecimal refundAmount) {
        this.success = success;
        this.message = message;
        this.reservationId = reservationId;
        this.newUnitCode = newUnitCode;
        this.remainingDue = remainingDue;
        this.refundAmount = refundAmount;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getReservationId() { return reservationId; }
    public void setReservationId(Integer reservationId) { this.reservationId = reservationId; }
    public String getNewUnitCode() { return newUnitCode; }
    public void setNewUnitCode(String newUnitCode) { this.newUnitCode = newUnitCode; }
    public BigDecimal getRemainingDue() { return remainingDue; }
    public void setRemainingDue(BigDecimal remainingDue) { this.remainingDue = remainingDue; }
    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }
}
