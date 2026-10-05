package com.swp391.backend.controller;

import com.swp391.backend.dto.CalculatePriceRequest;
import com.swp391.backend.dto.CalculatePriceResponse;
import com.swp391.backend.dto.UnitDetailResponse;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class StorageUnitController {

    private final StorageService storageService;

    public StorageUnitController(StorageService storageService) {
        this.storageService = storageService;
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

    // --- US-03: API Tính giá thuê & tiền cọc tự động (BR-08 & BR-13) ---
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
            @RequestHeader(value = "X-Facility-Id", required = false) Integer managerFacilityId,
            @RequestParam(required = false) Integer floorId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String storageCondition
    ) {
        if (managerFacilityId == null) {
            return ResponseEntity.status(403).body("Vui lòng cung cấp Header X-Facility-Id của Quản lý!");
        }
        try {
            return ResponseEntity.ok(storageService.getManagerUnits(managerFacilityId, floorId, status, size, storageCondition));
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
            @RequestHeader(value = "X-Facility-Id", required = false) Integer managerFacilityId,
            @RequestHeader(value = "X-Account-Id", required = false) Integer accountId
    ) {
        Integer newUnitTypeId = requestBody != null ? requestBody.get("unitTypeId") : null;
        if (newUnitTypeId == null) {
            return ResponseEntity.badRequest().body("Vui lòng cung cấp unitTypeId mới!");
        }
        try {
            StorageUnit updated = storageService.changeUnitType(unitCode, newUnitTypeId, managerFacilityId, accountId);
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
            @RequestHeader(value = "X-Facility-Id", required = false) Integer managerFacilityId,
            @RequestHeader(value = "X-Account-Id", required = false) Integer accountId
    ) {
        try {
            StorageUnit updated = storageService.putUnderMaintenance(unitCode, managerFacilityId, accountId);
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
            @RequestHeader(value = "X-Facility-Id", required = false) Integer staffFacilityId,
            @RequestHeader(value = "X-Account-Id", required = false) Integer accountId
    ) {
        try {
            StorageUnit updated = storageService.completeMaintenance(unitCode, staffFacilityId, accountId);
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
            @RequestHeader(value = "X-Facility-Id", required = false) Integer staffFacilityId
    ) {
        if (staffFacilityId == null) {
            return ResponseEntity.status(403).body("Vui lòng cung cấp Header X-Facility-Id của Nhân viên!");
        }
        return ResponseEntity.ok(storageService.getMaintenanceUnits(staffFacilityId));
    }
}
