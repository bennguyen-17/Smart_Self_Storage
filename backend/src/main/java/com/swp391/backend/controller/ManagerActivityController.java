package com.swp391.backend.controller;

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

    public ManagerActivityController(ManagerActivityService managerActivityService) {
        this.managerActivityService = managerActivityService;
    }

    @GetMapping("/staff-activity")
    public ResponseEntity<ManagerStaffActivityResponse> getStaffActivity(
            @RequestHeader("X-Facility-Id") Integer facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Integer managerAccountId) {
        return ResponseEntity.ok(managerActivityService.getStaffActivity(managerAccountId, facilityId, date));
    }

    @GetMapping("/activity-logs")
    public ResponseEntity<List<AdminActivityLogResponse>> getActivityLogs(
            @RequestHeader("X-Facility-Id") Integer facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Integer accountId,
            @AuthenticationPrincipal Integer managerAccountId) {
        return ResponseEntity.ok(managerActivityService.getActivityLogs(
                managerAccountId, facilityId, date, accountId));
    }
}
