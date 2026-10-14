package com.swp391.backend.controller;

import com.swp391.backend.dto.FacilityRequest;
import com.swp391.backend.dto.FacilityResponse;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.service.StorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final StorageService storageService;

    public FacilityController(StorageService storageService) {
        this.storageService = storageService;
    }

    // --- US-03: Lấy danh sách toàn bộ cơ sở (kèm mã code, shortCode, layout) ---
    @GetMapping
    public ResponseEntity<List<FacilityResponse>> getAllFacilities() {
        return ResponseEntity.ok(storageService.getAllActiveFacilities());
    }

    // --- US-03: Lấy thông tin chi tiết 1 cơ sở ---
    @GetMapping("/{facilityId}")
    public ResponseEntity<FacilityResponse> getFacilityById(@PathVariable Integer facilityId) {
        return storageService.getFacilityById(facilityId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- US-03: Lấy danh sách tầng của cơ sở ---
    @GetMapping("/{facilityId}/floors")
    public ResponseEntity<List<Floor>> getFloorsByFacilityId(@PathVariable Integer facilityId) {
        return ResponseEntity.ok(storageService.getFloorsByFacilityId(facilityId));
    }

    // --- BOM: Thêm cơ sở kho mới vào Database ---
    @PostMapping
    public ResponseEntity<FacilityResponse> createFacility(@RequestBody FacilityRequest req) {
        FacilityResponse created = storageService.createFacility(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // --- BOM: Cập nhật thông tin cơ sở kho vào Database ---
    @PutMapping("/{facilityId}")
    public ResponseEntity<FacilityResponse> updateFacility(@PathVariable Integer facilityId, @RequestBody FacilityRequest req) {
        FacilityResponse updated = storageService.updateFacility(facilityId, req);
        return ResponseEntity.ok(updated);
    }

    // --- BOM: Xóa mềm cơ sở kho trong Database (status = 'INACTIVE') ---
    @DeleteMapping("/{facilityId}")
    public ResponseEntity<Map<String, Object>> deleteFacility(@PathVariable Integer facilityId) {
        storageService.deleteFacility(facilityId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa mềm cơ sở kho ID: " + facilityId));
    }
}
