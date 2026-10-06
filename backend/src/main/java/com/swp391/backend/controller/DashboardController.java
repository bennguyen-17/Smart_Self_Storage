package com.swp391.backend.controller;

import com.swp391.backend.dto.dashboard.ChainDashboardResponse;
import com.swp391.backend.dto.dashboard.ManagerDashboardResponse;
import com.swp391.backend.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    // --- US-33: Dashboard cơ sở cho Facility Manager (BR-06, BR-45, BR-51) ---
    @GetMapping("/manager/dashboard/overview")
    public ResponseEntity<?> getManagerDashboardOverview(
            @RequestHeader(value = "X-Facility-Id", required = false) Integer managerFacilityId,
            @RequestParam(required = false) Integer facilityId) {

        Integer targetFacilityId = managerFacilityId != null ? managerFacilityId : facilityId;
        if (targetFacilityId == null) {
            targetFacilityId = 1; // Mặc định cơ sở 1 (HN-01 Cầu Giấy) nếu chưa truyền header
        }

        try {
            ManagerDashboardResponse response = dashboardService.getManagerDashboard(targetFacilityId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Lỗi tải Dashboard: " + e.getMessage()));
        }
    }

    // --- US-33: Dashboard toàn chuỗi 7 cơ sở cho Ban Giám Đốc (BOM / Admin theo BR-45) ---
    @GetMapping("/admin/dashboard/chain-overview")
    public ResponseEntity<ChainDashboardResponse> getChainDashboardOverview() {
        ChainDashboardResponse response = dashboardService.getChainDashboard();
        return ResponseEntity.ok(response);
    }
}
