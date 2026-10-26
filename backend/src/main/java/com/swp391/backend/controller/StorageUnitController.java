package com.swp391.backend.controller;

import com.swp391.backend.config.SecurityContextHelper;
import com.swp391.backend.dto.CalculatePriceRequest;
import com.swp391.backend.dto.CalculatePriceResponse;
import com.swp391.backend.dto.UnitDetailResponse;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.service.StorageService;
import com.swp391.backend.service.StaffTaskService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class StorageUnitController {

    private final StorageService storageService;
    private final StaffTaskService staffTaskService;
    private final SecurityContextHelper securityContextHelper;

    public StorageUnitController(StorageService storageService, StaffTaskService staffTaskService, SecurityContextHelper securityContextHelper) {
        this.storageService = storageService;
        this.staffTaskService = staffTaskService;
        this.securityContextHelper = securityContextHelper;
    }

    // --- US-03: Lấy danh sách ô kho theo tầng (để vẽ bản đồ 2D) ---
    @GetMapping("/floors/{floorId}/units")
    public ResponseEntity<List<UnitDetailResponse>> getUnitsByFloor(@PathVariable Integer floorId) {
        return ResponseEntity.ok(storageService.getUnitsByFloorId(floorId));
    }

    // --- US-03: Bộ lọc ô kho theo nhiều tiêu chí ---
    @GetMapping("/units/filter")
    public ResponseEntity<List<UnitDetailResponse>> filterUnits(
            @RequestParam(required = false) Integer facilityId,
            @RequestParam(required = false) Integer floorId,
            @RequestParam(required = false) Integer unitTypeId,
            @RequestParam(required = false) String storageCondition,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(storageService.filterUnits(facilityId, floorId, unitTypeId, storageCondition, status));
    }

    // --- US-03: API Tính giá thuê & tiền cọc tự động ---
    @PostMapping("/pricing/calculate")
    public ResponseEntity<CalculatePriceResponse> calculatePrice(@RequestBody CalculatePriceRequest request) {
        CalculatePriceResponse response = storageService.calculateRentalPrice(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // --- US-13: Lấy danh sách ô kho của cơ sở cho Facility Manager ---
    @GetMapping("/manager/units")
    public ResponseEntity<?> getManagerUnits(
            @AuthenticationPrincipal Integer managerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer managerFacilityId,
            @RequestParam(required = false) Integer floorId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String storageCondition
    ) {
        try {
            Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(managerAccountId, managerFacilityId);
            return ResponseEntity.ok(storageService.getManagerUnits(effectiveFacilityId, floorId, status, size, storageCondition));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- US-13: Đổi loại kho (Standard <=> Climate-Controlled) (Facility Manager) ---
    @PatchMapping("/manager/units/{unitCode}/type")
    public ResponseEntity<?> updateUnitType(
            @PathVariable String unitCode,
            @RequestBody java.util.Map<String, Integer> requestBody,
            @AuthenticationPrincipal Integer managerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer managerFacilityId,
            @RequestHeader(value = "X-Account-Id", required = false) Integer accountId
    ) {
        Integer effectiveAccountId = managerAccountId != null ? managerAccountId : accountId;
        Integer newUnitTypeId = requestBody != null ? requestBody.get("unitTypeId") : null;
        if (newUnitTypeId == null) {
            return ResponseEntity.badRequest().body("Vui lòng cung cấp unitTypeId mới!");
        }
        try {
            Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(effectiveAccountId, managerFacilityId);
            StorageUnit updated = storageService.changeUnitType(unitCode, newUnitTypeId, effectiveFacilityId, effectiveAccountId);
            return ResponseEntity.ok(updated);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- US-14: Đưa ô kho vào bảo trì / vệ sinh ---
    @PostMapping("/manager/units/{unitCode}/maintenance")
    public ResponseEntity<?> putUnderMaintenance(
            @PathVariable String unitCode,
            @RequestBody(required = false) java.util.Map<String, String> body,
            @AuthenticationPrincipal Integer managerAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer managerFacilityId,
            @RequestHeader(value = "X-Account-Id", required = false) Integer accountId
    ) {
        Integer effectiveAccountId = managerAccountId != null ? managerAccountId : accountId;
        try {
            Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(effectiveAccountId, managerFacilityId);
            String note = (body != null) ? body.get("note") : null;
            StorageUnit updated = storageService.putUnderMaintenance(unitCode, effectiveFacilityId, effectiveAccountId, note);
            return ResponseEntity.ok(updated);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- US-14: Nghiệm thu dọn dẹp / bảo trì hoàn tất, mở lại AVAILABLE ---
    @PostMapping("/staff/units/{unitCode}/complete-maintenance")
    public ResponseEntity<?> completeMaintenance(
            @PathVariable String unitCode,
            @AuthenticationPrincipal Integer staffAccountId
    ) {
        try {
            StorageUnit updated = staffTaskService.completeMaintenanceForCurrentStaff(unitCode, staffAccountId);
            return ResponseEntity.ok(updated);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- US-14: Lấy danh sách ô kho đang bảo trì tại cơ sở của Staff ---
    @GetMapping("/staff/units/maintenance")
    public ResponseEntity<?> getMaintenanceUnits(
            @AuthenticationPrincipal Integer staffAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer staffFacilityId
    ) {
        try {
            Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(staffAccountId, staffFacilityId);
            return ResponseEntity.ok(storageService.getMaintenanceUnits(effectiveFacilityId));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }
}
