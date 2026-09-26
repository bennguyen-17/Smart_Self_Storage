package com.swp391.backend.dto;

import java.time.LocalDate;

public class DepositInitiateRequest {
    private Integer accountId;
    private Integer unitId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String rentalType; // "DAILY", "MONTHLY"
    private Boolean agreedClickwrap; // Bắt buộc true theo BR-18
    private String ipAddress;

    public DepositInitiateRequest() {
    }

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    public Integer getUnitId() {
        return unitId;
    }

    public void setUnitId(Integer unitId) {
        this.unitId = unitId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getRentalType() {
        return rentalType;
    }

    public void setRentalType(String rentalType) {
        this.rentalType = rentalType;
    }

    public Boolean getAgreedClickwrap() {
        return agreedClickwrap;
    }

    public void setAgreedClickwrap(Boolean agreedClickwrap) {
        this.agreedClickwrap = agreedClickwrap;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
}
