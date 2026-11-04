package com.swp391.backend.controller;

import com.swp391.backend.dto.dashboard.ChainDashboardResponse;
import com.swp391.backend.dto.dashboard.ManagerDashboardResponse;
import com.swp391.backend.config.SecurityContextHelper;
import com.swp391.backend.service.DashboardService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboardService;
    private final SecurityContextHelper securityContextHelper;

    public DashboardController(DashboardService dashboardService, SecurityContextHelper securityContextHelper) {
        this.dashboardService = dashboardService;
        this.securityContextHelper = securityContextHelper;
    }

    // --- US-33: Dashboard cơ sở cho Facility Manager ---
    @GetMapping("/manager/dashboard/overview")
    public ResponseEntity<?> getManagerDashboardOverview(
            @AuthenticationPrincipal Integer authAccountId,
            @RequestHeader(value = "X-Account-Id", required = false) Integer headerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer managerFacilityId,
            @RequestParam(required = false) Integer facilityId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        Integer effectiveAccountId = (authAccountId != null) ? authAccountId : headerAccountId;
        Integer fallbackFacilityId = managerFacilityId != null ? managerFacilityId : facilityId;
        Integer targetFacilityId;
        try {
            targetFacilityId = securityContextHelper.requireCurrentFacilityId(effectiveAccountId, fallbackFacilityId);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }

        try {
            ManagerDashboardResponse response = dashboardService.getManagerDashboard(targetFacilityId, from, to);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Lỗi tải Dashboard: " + e.getMessage()));
        }
    }

    @GetMapping("/admin/dashboard/chain-overview")
    public ResponseEntity<ChainDashboardResponse> getChainDashboardOverview(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String period) {
        ChainDashboardResponse response = dashboardService.getChainDashboard(from, to, period);
        return ResponseEntity.ok(response);
    }
}
