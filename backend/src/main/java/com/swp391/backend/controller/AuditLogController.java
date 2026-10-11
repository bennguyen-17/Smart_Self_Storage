package com.swp391.backend.controller;

import com.swp391.backend.dto.ManualGateOpenRequest;
import com.swp391.backend.entity.AuditLog;
import com.swp391.backend.service.AuditLogService;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @PostMapping("/manual-gate-open")
    public ResponseEntity<AuditLog> recordManualGateOpen(
            @AuthenticationPrincipal Integer accountId,
            @RequestBody ManualGateOpenRequest request) {

        AuditLog auditLog = auditLogService.recordManualGateOpen(
                accountId,
                request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(auditLog);
    }

    @GetMapping("/manager/audit-logs/manual-gate-open")
    public ResponseEntity<List<AuditLog>> getManualGateOpenLogs(
            @AuthenticationPrincipal Integer accountId) {

        List<AuditLog> logs = auditLogService.getManualGateOpenLogs(accountId);

        return ResponseEntity.ok(logs);
    }
}
