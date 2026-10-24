package com.swp391.backend.dto;

import java.time.LocalDate;

public record StaffTaskCreateRequest(
        String taskType,
        String unitCode,
        Integer contractId,
        Integer employeeId,
        LocalDate date,
        Integer shiftId,
        String note) {
}
