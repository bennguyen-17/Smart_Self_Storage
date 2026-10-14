package com.swp391.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record OverdueAlertsResponse(
        boolean success,
        BigDecimal totalUnpaidOverdueFees,
        List<ContractAlert> contracts) {

    public record ContractAlert(
            Integer contractId,
            Integer accountId,
            String unitCode,
            LocalDate endDate,
            long daysOverdue,
            BigDecimal unpaidOverdueFee) {
    }
}
