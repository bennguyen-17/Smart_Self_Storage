package com.swp391.backend.dto;

import java.util.List;

public class StaffReservationListResponse {
    private boolean success;
    private String message;
    private List<StaffReservationListItemResponse> data;

    public StaffReservationListResponse() {}

    public StaffReservationListResponse(boolean success, String message, List<StaffReservationListItemResponse> data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public List<StaffReservationListItemResponse> getData() { return data; }
    public void setData(List<StaffReservationListItemResponse> data) { this.data = data; }
}
