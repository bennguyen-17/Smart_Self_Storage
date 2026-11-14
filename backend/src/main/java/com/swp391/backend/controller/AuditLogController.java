package com.swp391.backend.controller;

import com.swp391.backend.entity.AuditLog;
import com.swp391.backend.config.SecurityContextHelper;
import com.swp391.backend.service.AuditLogService;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final SecurityContextHelper securityContextHelper;

    public AuditLogController(AuditLogService auditLogService, SecurityContextHelper securityContextHelper) {
        this.auditLogService = auditLogService;
        this.securityContextHelper = securityContextHelper;
    }

    @GetMapping("/manager/gate-logs")
    public ResponseEntity<List<AuditLog>> getManualGateOpenLogs(
            @AuthenticationPrincipal Integer authAccountId,
            @RequestHeader(value = "X-Account-Id", required = false) Integer headerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer headerFacilityId,
            @RequestParam(value = "facilityId", required = false) Integer queryFacilityId,
            @RequestParam(value = "method", required = false) String method) {

        Integer effectiveAccountId = (authAccountId != null) ? authAccountId : headerAccountId;
        if (authAccountId != null && headerAccountId != null && !authAccountId.equals(headerAccountId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(List.of());
        }
        Integer fallbackFacilityId = null;
        Integer effectiveFacilityId;
        try {
            effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(effectiveAccountId, fallbackFacilityId);
            if ((headerFacilityId != null && (headerFacilityId <= 0 || !headerFacilityId.equals(effectiveFacilityId)))
                    || (queryFacilityId != null && (queryFacilityId <= 0 || !queryFacilityId.equals(effectiveFacilityId)))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(List.of());
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(List.of());
        }

        List<AuditLog> logs = auditLogService.getGateLogs(effectiveAccountId, effectiveFacilityId, method);

        return ResponseEntity.ok(logs);
    }
}
