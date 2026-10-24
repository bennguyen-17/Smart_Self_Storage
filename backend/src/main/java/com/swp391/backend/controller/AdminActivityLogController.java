package com.swp391.backend.controller;

import com.swp391.backend.dto.AdminActivityLogResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.FacilityRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminActivityLogController {

    private final ActivityLogRepository activityLogRepository;
    private final AccountRepository accountRepository;
    private final FacilityRepository facilityRepository;

    public AdminActivityLogController(ActivityLogRepository activityLogRepository, AccountRepository accountRepository, FacilityRepository facilityRepository) {
        this.activityLogRepository = activityLogRepository;
        this.accountRepository = accountRepository;
        this.facilityRepository = facilityRepository;
    }

    // --- 4. GET /api/admin/activity-logs: Nhật ký hoạt động hệ thống cho Admin ---
    @GetMapping("/activity-logs")
    public ResponseEntity<List<AdminActivityLogResponse>> getActivityLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        List<ActivityLog> logs;
        if (from != null && to != null) {
            LocalDateTime start = from.atStartOfDay();
            LocalDateTime end = to.atTime(LocalTime.MAX);
            logs = activityLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
        } else if (from != null) {
            LocalDateTime start = from.atStartOfDay();
            LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);
            logs = activityLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
        } else if (to != null) {
            LocalDateTime start = LocalDate.of(2020, 1, 1).atStartOfDay();
            LocalDateTime end = to.atTime(LocalTime.MAX);
            logs = activityLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
        } else {
            logs = activityLogRepository.findAllByOrderByCreatedAtDesc();
        }

        List<AdminActivityLogResponse> response = new ArrayList<>();
        for (ActivityLog log : logs) {
            String actorName = "Hệ thống";
            String actorRole = "SYSTEM";

            if (log.getAccountId() != null) {
                Optional<Account> accOpt = accountRepository.findById(Long.valueOf(log.getAccountId()));
                if (accOpt.isPresent()) {
                    Account acc = accOpt.get();
                    actorName = acc.getFullName();
                    actorRole = mapRoleIdToName(acc.getRoleId());
                }
            }

            response.add(new AdminActivityLogResponse(
                    log.getActivityLogId(),
                    log.getAccountId(),
                    log.getFacilityId(),
                    log.getFacilityId() == null ? null : facilityRepository.findById(log.getFacilityId()).map(f -> f.getFacilityCode()).orElse(null),
                    actorName,
                    actorRole,
                    log.getAction(),
                    log.getDescription(),
                    log.getCreatedAt(),
                    log.getIpAddress()
            ));
        }

        return ResponseEntity.ok(response);
    }

    private String mapRoleIdToName(Long roleId) {
        if (roleId == null) return "UNKNOWN";
        return switch (roleId.intValue()) {
            case 1 -> "ADMIN";
            case 2 -> "BOM";
            case 3 -> "MANAGER";
            case 4 -> "STAFF";
            case 5 -> "CUSTOMER";
            default -> "USER";
        };
    }
}
