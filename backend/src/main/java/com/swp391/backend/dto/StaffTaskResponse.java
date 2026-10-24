package com.swp391.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record StaffTaskResponse(
        Integer taskId,
        Integer facilityId,
        Integer assignedEmployeeId,
        String employeeName,
        Integer assignedByAccountId,
        String taskType,
        String unitCode,
        Integer contractId,
        String note,
        String status,
        LocalDate workDate,
        Integer shiftId,
        String shiftName,
        LocalDateTime createdAt,
        LocalDateTime doneAt) {
}
