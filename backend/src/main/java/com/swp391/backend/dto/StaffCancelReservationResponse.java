package com.swp391.backend.dto;

import java.math.BigDecimal;

public class StaffCancelReservationResponse {
    private boolean success;
    private String message;
    private Integer reservationId;
    private String reservationCode;
    private BigDecimal refundAmount;
    private BigDecimal penaltyAmount;

    public StaffCancelReservationResponse() {
    }

    public StaffCancelReservationResponse(boolean success, String message, Integer reservationId,
                                          String reservationCode, BigDecimal refundAmount,
                                          BigDecimal penaltyAmount) {
        this.success = success;
        this.message = message;
        this.reservationId = reservationId;
        this.reservationCode = reservationCode;
        this.refundAmount = refundAmount;
        this.penaltyAmount = penaltyAmount;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getReservationId() { return reservationId; }
    public void setReservationId(Integer reservationId) { this.reservationId = reservationId; }
    public String getReservationCode() { return reservationCode; }
    public void setReservationCode(String reservationCode) { this.reservationCode = reservationCode; }
    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }
    public BigDecimal getPenaltyAmount() { return penaltyAmount; }
    public void setPenaltyAmount(BigDecimal penaltyAmount) { this.penaltyAmount = penaltyAmount; }
}
