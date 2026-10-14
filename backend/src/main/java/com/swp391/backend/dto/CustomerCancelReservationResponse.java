package com.swp391.backend.dto;

import java.math.BigDecimal;

public class CustomerCancelReservationResponse {
    private boolean success;
    private boolean refundEligible;
    private BigDecimal refundRate;
    private BigDecimal refundAmount;
    private BigDecimal forfeitAmount;
    private long daysUntilStart;
    private String refundBankName;
    private String refundAccountNumber;
    private String refundAccountName;
    private String message;

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public boolean isRefundEligible() {
        return refundEligible;
    }

    public void setRefundEligible(boolean refundEligible) {
        this.refundEligible = refundEligible;
    }

    public BigDecimal getRefundRate() {
        return refundRate;
    }

    public void setRefundRate(BigDecimal refundRate) {
        this.refundRate = refundRate;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }

    public BigDecimal getForfeitAmount() {
        return forfeitAmount;
    }

    public void setForfeitAmount(BigDecimal forfeitAmount) {
        this.forfeitAmount = forfeitAmount;
    }

    public long getDaysUntilStart() {
        return daysUntilStart;
    }

    public void setDaysUntilStart(long daysUntilStart) {
        this.daysUntilStart = daysUntilStart;
    }

    public String getRefundBankName() {
        return refundBankName;
    }

    public void setRefundBankName(String refundBankName) {
        this.refundBankName = refundBankName;
    }

    public String getRefundAccountNumber() {
        return refundAccountNumber;
    }

    public void setRefundAccountNumber(String refundAccountNumber) {
        this.refundAccountNumber = refundAccountNumber;
    }

    public String getRefundAccountName() {
        return refundAccountName;
    }

    public void setRefundAccountName(String refundAccountName) {
        this.refundAccountName = refundAccountName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
