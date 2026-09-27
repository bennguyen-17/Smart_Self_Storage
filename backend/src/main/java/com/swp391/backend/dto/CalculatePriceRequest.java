package com.swp391.backend.dto;

public class CalculatePriceRequest {
    private Integer unitTypeId;
    private String rentalType; // "DAILY" hoặc "MONTHLY"
    private Integer duration; // Số ngày (>=7) hoặc số tháng (>=1)

    public CalculatePriceRequest() {
    }

    public CalculatePriceRequest(Integer unitTypeId, String rentalType, Integer duration) {
        this.unitTypeId = unitTypeId;
        this.rentalType = rentalType;
        this.duration = duration;
    }

    public Integer getUnitTypeId() {
        return unitTypeId;
    }

    public void setUnitTypeId(Integer unitTypeId) {
        this.unitTypeId = unitTypeId;
    }

    public String getRentalType() {
        return rentalType;
    }

    public void setRentalType(String rentalType) {
        this.rentalType = rentalType;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }
}
