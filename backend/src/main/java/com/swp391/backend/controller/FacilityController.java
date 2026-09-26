package com.swp391.backend.controller;

import com.swp391.backend.entity.Facility;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final StorageService storageService;

    public FacilityController(StorageService storageService) {
        this.storageService = storageService;
    }

    // --- US-03: Lấy danh sách toàn bộ 7 cơ sở ---
    @GetMapping
    public ResponseEntity<List<Facility>> getAllFacilities() {
        return ResponseEntity.ok(storageService.getAllActiveFacilities());
    }

    // --- US-03: Lấy thông tin chi tiết 1 cơ sở ---
    @GetMapping("/{facilityId}")
    public ResponseEntity<Facility> getFacilityById(@PathVariable Integer facilityId) {
        return storageService.getFacilityById(facilityId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- US-03: Lấy danh sách tầng của cơ sở ---
    @GetMapping("/{facilityId}/floors")
    public ResponseEntity<List<Floor>> getFloorsByFacilityId(@PathVariable Integer facilityId) {
        return ResponseEntity.ok(storageService.getFloorsByFacilityId(facilityId));
    }
}
