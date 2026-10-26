package com.swp391.backend.dto;

public class StaffReservationLookupResponse extends StaffReservationListItemResponse {
    private boolean success;
    private String message;
    private String unitStatus;

    public StaffReservationLookupResponse() {}

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getUnitStatus() { return unitStatus; }
    public void setUnitStatus(String unitStatus) { this.unitStatus = unitStatus; }
}
