package com.swp391.backend.controller;

import com.swp391.backend.config.SecurityContextHelper;
import com.swp391.backend.dto.StaffTaskCreateRequest;
import com.swp391.backend.dto.StaffTaskResponse;
import com.swp391.backend.service.StaffTaskService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager/tasks")
public class ManagerStaffTaskController {

    private final StaffTaskService staffTaskService;
    private final SecurityContextHelper securityContextHelper;

    public ManagerStaffTaskController(StaffTaskService staffTaskService, SecurityContextHelper securityContextHelper) {
        this.staffTaskService = staffTaskService;
        this.securityContextHelper = securityContextHelper;
    }

    @PostMapping
    public ResponseEntity<StaffTaskResponse> createTask(
            @RequestBody StaffTaskCreateRequest request,
            @AuthenticationPrincipal Integer managerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId) {
        Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(managerAccountId, facilityId);
        return ResponseEntity.ok(staffTaskService.createTask(managerAccountId, effectiveFacilityId, request));
    }

    @GetMapping
    public ResponseEntity<List<StaffTaskResponse>> getTasks(
            @AuthenticationPrincipal Integer managerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(managerAccountId, facilityId);
        return ResponseEntity.ok(staffTaskService.getFacilityTasks(managerAccountId, effectiveFacilityId, date));
    }

    @PatchMapping("/{taskId}/cancel")
    public ResponseEntity<StaffTaskResponse> cancelTask(
            @PathVariable Integer taskId,
            @AuthenticationPrincipal Integer managerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId) {
        Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(managerAccountId, facilityId);
        return ResponseEntity.ok(staffTaskService.cancelTask(managerAccountId, effectiveFacilityId, taskId));
    }
}
