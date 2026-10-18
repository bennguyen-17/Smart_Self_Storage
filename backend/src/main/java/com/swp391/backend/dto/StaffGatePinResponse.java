package com.swp391.backend.dto;

public class StaffGatePinResponse {
    private boolean success;
    private String pin;
    private String rawPin;
    private int ttlSeconds;
    private Integer facilityId;
    private String facilityName;
    private String facilityCode;
    private String message;

    public StaffGatePinResponse() {}

    public StaffGatePinResponse(boolean success, String pin, String rawPin, int ttlSeconds, Integer facilityId, String facilityName, String facilityCode, String message) {
        this.success = success;
        this.pin = pin;
        this.rawPin = rawPin;
        this.ttlSeconds = ttlSeconds;
        this.facilityId = facilityId;
        this.facilityName = facilityName;
        this.facilityCode = facilityCode;
        this.message = message;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }
    public String getRawPin() { return rawPin; }
    public void setRawPin(String rawPin) { this.rawPin = rawPin; }
    public int getTtlSeconds() { return ttlSeconds; }
    public void setTtlSeconds(int ttlSeconds) { this.ttlSeconds = ttlSeconds; }
    public Integer getFacilityId() { return facilityId; }
    public void setFacilityId(Integer facilityId) { this.facilityId = facilityId; }
    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }
    public String getFacilityCode() { return facilityCode; }
    public void setFacilityCode(String facilityCode) { this.facilityCode = facilityCode; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
