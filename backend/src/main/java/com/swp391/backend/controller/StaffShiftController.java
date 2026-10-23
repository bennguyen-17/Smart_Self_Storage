package com.swp391.backend.controller;

import com.swp391.backend.dto.StaffCurrentShiftResponse;
import com.swp391.backend.service.StaffShiftService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/shifts/current")
public class StaffShiftController {

    private final StaffShiftService staffShiftService;

    public StaffShiftController(StaffShiftService staffShiftService) {
        this.staffShiftService = staffShiftService;
    }

    @GetMapping
    public ResponseEntity<StaffCurrentShiftResponse> getCurrentShift(
            @AuthenticationPrincipal Integer accountId) {
        return ResponseEntity.ok(staffShiftService.getCurrentShift(accountId));
    }

    @PostMapping("/start")
    public ResponseEntity<StaffCurrentShiftResponse> startCurrentShift(
            @AuthenticationPrincipal Integer accountId) {
        return ResponseEntity.ok(staffShiftService.startCurrentShift(accountId));
    }
}
