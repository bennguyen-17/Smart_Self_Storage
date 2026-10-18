package com.swp391.backend.controller;

import com.swp391.backend.dto.ManualGateOpenRequest;
import com.swp391.backend.entity.AuditLog;
import com.swp391.backend.service.AuditLogService;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @PostMapping("/staff/audit-logs/manual-gate-open")
    public ResponseEntity<AuditLog> recordManualGateOpen(
            @AuthenticationPrincipal Integer accountId,
            @Valid @RequestBody ManualGateOpenRequest request) {

        AuditLog auditLog = auditLogService.recordManualGateOpen(
                accountId,
                request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(auditLog);
    }

    @GetMapping({"/manager/audit-logs/manual-gate-open", "/manager/audit-logs/gate-logs"})
    public ResponseEntity<List<AuditLog>> getManualGateOpenLogs(
            @AuthenticationPrincipal Integer authAccountId,
            @RequestHeader(value = "X-Account-Id", required = false) Integer headerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer headerFacilityId,
            @RequestParam(value = "facilityId", required = false) Integer queryFacilityId,
            @RequestParam(value = "method", required = false) String method) {

        Integer effectiveAccountId = (authAccountId != null) ? authAccountId : headerAccountId;
        Integer effectiveFacilityId = (headerFacilityId != null) ? headerFacilityId : queryFacilityId;

        List<AuditLog> logs = auditLogService.getGateLogs(effectiveAccountId, effectiveFacilityId, method);

        return ResponseEntity.ok(logs);
    }
}
