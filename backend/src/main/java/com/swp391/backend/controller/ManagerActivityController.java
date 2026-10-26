package com.swp391.backend.controller;

import com.swp391.backend.config.SecurityContextHelper;
import com.swp391.backend.dto.AdminActivityLogResponse;
import com.swp391.backend.dto.ManagerStaffActivityResponse;
import com.swp391.backend.service.ManagerActivityService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerActivityController {

    private final ManagerActivityService managerActivityService;
    private final SecurityContextHelper securityContextHelper;

    public ManagerActivityController(ManagerActivityService managerActivityService, SecurityContextHelper securityContextHelper) {
        this.managerActivityService = managerActivityService;
        this.securityContextHelper = securityContextHelper;
    }

    @GetMapping("/staff-activity")
    public ResponseEntity<ManagerStaffActivityResponse> getStaffActivity(
            @AuthenticationPrincipal Integer managerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(managerAccountId, facilityId);
        return ResponseEntity.ok(managerActivityService.getStaffActivity(managerAccountId, effectiveFacilityId, date));
    }

    @GetMapping("/activity-logs")
    public ResponseEntity<List<AdminActivityLogResponse>> getActivityLogs(
            @AuthenticationPrincipal Integer managerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Integer accountId) {
        Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(managerAccountId, facilityId);
        return ResponseEntity.ok(managerActivityService.getActivityLogs(
                managerAccountId, effectiveFacilityId, date, accountId));
    }
}
