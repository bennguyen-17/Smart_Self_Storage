package com.swp391.backend.dto;

public class RenewAtCounterRequest {
    private Integer months;
    private String paymentMethod;

    public RenewAtCounterRequest() {}

    public Integer getMonths() {
        return months;
    }

    public void setMonths(Integer months) {
        this.months = months;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
