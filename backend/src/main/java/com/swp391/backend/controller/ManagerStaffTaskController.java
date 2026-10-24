package com.swp391.backend.controller;

import com.swp391.backend.dto.StaffTaskCreateRequest;
import com.swp391.backend.dto.StaffTaskResponse;
import com.swp391.backend.service.StaffTaskService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager/tasks")
public class ManagerStaffTaskController {

    private final StaffTaskService staffTaskService;

    public ManagerStaffTaskController(StaffTaskService staffTaskService) {
        this.staffTaskService = staffTaskService;
    }

    @PostMapping
    public ResponseEntity<StaffTaskResponse> createTask(
            @RequestBody StaffTaskCreateRequest request,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @AuthenticationPrincipal Integer managerAccountId) {
        return ResponseEntity.ok(staffTaskService.createTask(managerAccountId, facilityId, request));
    }

    @GetMapping
    public ResponseEntity<List<StaffTaskResponse>> getTasks(
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Integer managerAccountId) {
        return ResponseEntity.ok(staffTaskService.getFacilityTasks(managerAccountId, facilityId, date));
    }

    @PatchMapping("/{taskId}/cancel")
    public ResponseEntity<StaffTaskResponse> cancelTask(
            @PathVariable Integer taskId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @AuthenticationPrincipal Integer managerAccountId) {
        return ResponseEntity.ok(staffTaskService.cancelTask(managerAccountId, facilityId, taskId));
    }
}
