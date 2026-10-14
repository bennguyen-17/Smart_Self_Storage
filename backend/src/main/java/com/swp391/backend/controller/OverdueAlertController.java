package com.swp391.backend.controller;

import com.swp391.backend.dto.OverdueAlertsResponse;
import com.swp391.backend.service.OverdueAlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class OverdueAlertController {

    private final OverdueAlertService overdueAlertService;

    public OverdueAlertController(OverdueAlertService overdueAlertService) {
        this.overdueAlertService = overdueAlertService;
    }

    @GetMapping("/customer/contracts/overdue-alerts")
    public ResponseEntity<OverdueAlertsResponse> getCustomerOverdueAlerts(
            @AuthenticationPrincipal Integer accountId) {
        return ResponseEntity.ok(overdueAlertService.getCustomerAlerts(accountId));
    }

    @GetMapping("/staff/contracts/overdue-alerts")
    public ResponseEntity<OverdueAlertsResponse> getStaffOverdueAlerts(
            @AuthenticationPrincipal Integer accountId) {
        return ResponseEntity.ok(overdueAlertService.getFacilityAlerts(accountId));
    }

    @GetMapping("/manager/contracts/overdue-alerts")
    public ResponseEntity<OverdueAlertsResponse> getManagerOverdueAlerts(
            @AuthenticationPrincipal Integer accountId) {
        return ResponseEntity.ok(overdueAlertService.getFacilityAlerts(accountId));
    }
}
