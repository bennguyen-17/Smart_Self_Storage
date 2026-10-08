package com.swp391.backend.dto;

public class CancelReservationRequest {
    private Integer reservationId;

    public CancelReservationRequest() {
    }

    public Integer getReservationId() {
        return reservationId;
    }

    public void setReservationId(Integer reservationId) {
        this.reservationId = reservationId;
    }
}
