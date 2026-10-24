package com.swp391.backend.controller;

import com.swp391.backend.dto.StaffTaskResponse;
import com.swp391.backend.service.StaffTaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/tasks")
public class StaffTaskController {

    private final StaffTaskService staffTaskService;

    public StaffTaskController(StaffTaskService staffTaskService) {
        this.staffTaskService = staffTaskService;
    }

    @GetMapping("/mine")
    public ResponseEntity<List<StaffTaskResponse>> getMyTasks(
            @AuthenticationPrincipal Integer staffAccountId) {
        return ResponseEntity.ok(staffTaskService.getMyTasks(staffAccountId));
    }

    @PatchMapping("/{taskId}/done")
    public ResponseEntity<StaffTaskResponse> markDone(
            @PathVariable Integer taskId,
            @AuthenticationPrincipal Integer staffAccountId) {
        return ResponseEntity.ok(staffTaskService.markDone(staffAccountId, taskId));
    }
}
