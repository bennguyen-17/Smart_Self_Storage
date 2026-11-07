package com.swp391.backend.controller;

import com.swp391.backend.config.SecurityContextHelper;
import com.swp391.backend.dto.CalculatePriceRequest;
import com.swp391.backend.dto.CalculatePriceResponse;
import com.swp391.backend.dto.UnitDetailResponse;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.service.StorageService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class StorageUnitController {

    private final StorageService storageService;
    private final SecurityContextHelper securityContextHelper;

    public StorageUnitController(StorageService storageService, SecurityContextHelper securityContextHelper) {
        this.storageService = storageService;
        this.securityContextHelper = securityContextHelper;
    }

    // Lấy danh sách ô kho theo tầng phục vụ hiển thị sơ đồ 2D
    @GetMapping("/floors/{floorId}/units")
    public ResponseEntity<List<UnitDetailResponse>> getUnitsByFloor(@PathVariable Integer floorId) {
        return ResponseEntity.ok(storageService.getUnitsByFloorId(floorId));
    }

    // Tra cứu và lọc ô kho theo nhiều tiêu chí
    @GetMapping("/units/filter")
    public ResponseEntity<List<UnitDetailResponse>> filterUnits(
            @RequestParam(required = false) Integer facilityId,
            @RequestParam(required = false) Integer floorId,
            @RequestParam(required = false) Integer unitTypeId,
            @RequestParam(required = false) String storageCondition,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(storageService.filterUnits(facilityId, floorId, unitTypeId, storageCondition, status));
    }

    // Tính toán tự động giá thuê và tiền cọc theo bảng giá
    @PostMapping({"/pricing/calculate", "/units/pricing/calculate"})
    public ResponseEntity<CalculatePriceResponse> calculatePrice(@RequestBody CalculatePriceRequest request) {
        CalculatePriceResponse response = storageService.calculateRentalPrice(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    // Lấy danh sách ô kho thuộc quyền quản lý của cơ sở
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

    // Chuyển đổi loại kho giữa kho thường và kho điều hòa nhiệt độ
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

    // Đưa ô kho vào trạng thái bảo trì hoặc vệ sinh
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

    // Nghiệm thu dọn dẹp và bảo trì hoàn tất, mở lại ô kho cho thuê
    @PostMapping("/staff/units/{unitCode}/complete-maintenance")
    public ResponseEntity<?> completeMaintenance(
            @PathVariable String unitCode,
            @AuthenticationPrincipal Integer staffAccountId
    ) {
        try {
            Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(staffAccountId, null);
            StorageUnit updated = storageService.completeMaintenance(unitCode, effectiveFacilityId, staffAccountId);
            return ResponseEntity.ok(updated);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Lấy danh sách các ô kho đang trong quá trình bảo trì tại cơ sở
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
