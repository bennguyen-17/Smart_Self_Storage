package com.swp391.backend.dto;

public class RenewAtCounterRequest {
    private Integer months;
    private Integer days;
    private String paymentMethod;

    public RenewAtCounterRequest() {}

    public Integer getMonths() {
        return months;
    }

    public void setMonths(Integer months) {
        this.months = months;
    }

    public Integer getDays() {
        return days;
    }

    public void setDays(Integer days) {
        this.days = days;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
