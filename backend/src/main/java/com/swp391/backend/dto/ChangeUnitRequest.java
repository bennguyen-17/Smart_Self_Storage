package com.swp391.backend.dto;

public class ChangeUnitRequest {
    private Integer reservationId;
    private String newUnitCode;

    public ChangeUnitRequest() {
    }

    public Integer getReservationId() {
        return reservationId;
    }

    public void setReservationId(Integer reservationId) {
        this.reservationId = reservationId;
    }

    public String getNewUnitCode() {
        return newUnitCode;
    }

    public void setNewUnitCode(String newUnitCode) {
        this.newUnitCode = newUnitCode;
    }
}
