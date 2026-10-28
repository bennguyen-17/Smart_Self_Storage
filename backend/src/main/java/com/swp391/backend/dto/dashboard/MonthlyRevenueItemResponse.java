package com.swp391.backend.dto.dashboard;

import java.math.BigDecimal;

public class MonthlyRevenueItemResponse {
    private String month;
    private String label;
    private BigDecimal revenue;

    private BigDecimal rentalRevenue = BigDecimal.ZERO;
    private BigDecimal penaltyRevenue = BigDecimal.ZERO;

    public MonthlyRevenueItemResponse() {
    }

    public MonthlyRevenueItemResponse(String month, String label, BigDecimal revenue) {
        this.month = month;
        this.label = label;
        this.revenue = revenue;
    }

    public MonthlyRevenueItemResponse(String month, String label, BigDecimal revenue, BigDecimal rentalRevenue, BigDecimal penaltyRevenue) {
        this.month = month;
        this.label = label;
        this.revenue = revenue;
        this.rentalRevenue = rentalRevenue;
        this.penaltyRevenue = penaltyRevenue;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }

    public BigDecimal getRentalRevenue() {
        return rentalRevenue;
    }

    public void setRentalRevenue(BigDecimal rentalRevenue) {
        this.rentalRevenue = rentalRevenue;
    }

    public BigDecimal getPenaltyRevenue() {
        return penaltyRevenue;
    }

    public void setPenaltyRevenue(BigDecimal penaltyRevenue) {
        this.penaltyRevenue = penaltyRevenue;
    }
}
