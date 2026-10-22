package com.swp391.backend.dto;

public record StaffCurrentShiftResponse(
        Integer shiftId,
        String shiftName,
        String startTime,
        String endTime,
        boolean attended) {
}
