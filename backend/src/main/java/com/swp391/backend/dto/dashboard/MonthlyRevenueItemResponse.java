package com.swp391.backend.dto.dashboard;

import java.math.BigDecimal;

public class MonthlyRevenueItemResponse {
    private String month;
    private String label;
    private BigDecimal revenue;

    public MonthlyRevenueItemResponse() {
    }

    public MonthlyRevenueItemResponse(String month, String label, BigDecimal revenue) {
        this.month = month;
        this.label = label;
        this.revenue = revenue;
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
}
