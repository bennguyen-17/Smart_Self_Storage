package com.swp391.backend.dto;

public class CollectPenaltyRequest {
    private String paymentMethod;

    public CollectPenaltyRequest() {}

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
