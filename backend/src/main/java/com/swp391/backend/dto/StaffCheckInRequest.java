package com.swp391.backend.dto;

import java.math.BigDecimal;

public class StaffCheckInRequest {
    private BigDecimal collectedAmount;
    private String paymentMethod;

    public StaffCheckInRequest() {}

    public BigDecimal getCollectedAmount() { return collectedAmount; }
    public void setCollectedAmount(BigDecimal collectedAmount) { this.collectedAmount = collectedAmount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}
