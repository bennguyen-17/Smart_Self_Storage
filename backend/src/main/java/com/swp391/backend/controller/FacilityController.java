package com.swp391.backend.controller;

import com.swp391.backend.dto.FacilityRequest;
import com.swp391.backend.dto.FacilityResponse;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.service.ImageStorageService;
import com.swp391.backend.service.StorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final StorageService storageService;
    private final ImageStorageService imageStorageService;

    public FacilityController(StorageService storageService, ImageStorageService imageStorageService) {
        this.storageService = storageService;
        this.imageStorageService = imageStorageService;
    }

    @GetMapping
    public ResponseEntity<List<FacilityResponse>> getAllFacilities() {
        List<FacilityResponse> facilities = storageService.getAllActiveFacilities();
        facilities.forEach(facility -> facility.setImages(
                imageStorageService.getFacilityImageUrls(facility.getFacilityId())));
        return ResponseEntity.ok(facilities);
    }

    @GetMapping("/{facilityId}")
    public ResponseEntity<FacilityResponse> getFacilityById(@PathVariable Integer facilityId) {
        return storageService.getFacilityById(facilityId)
                .map(facility -> {
                    facility.setImages(imageStorageService.getFacilityImageUrls(facilityId));
                    return ResponseEntity.ok(facility);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{facilityId}/floors")
    public ResponseEntity<List<Floor>> getFloorsByFacilityId(@PathVariable Integer facilityId) {
        return ResponseEntity.ok(storageService.getFloorsByFacilityId(facilityId));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<FacilityResponse> createFacility(
            @RequestBody FacilityRequest req,
            @AuthenticationPrincipal Integer uploaderAccountId) {
        FacilityResponse created = storageService.createFacility(req);
        imageStorageService.attachFacilityImages(created.getFacilityId(), req.getImages(), uploaderAccountId);
        created.setImages(imageStorageService.getFacilityImageUrls(created.getFacilityId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{facilityId}")
    @Transactional
    public ResponseEntity<FacilityResponse> updateFacility(
            @PathVariable Integer facilityId,
            @RequestBody FacilityRequest req,
            @AuthenticationPrincipal Integer uploaderAccountId) {
        FacilityResponse updated = storageService.updateFacility(facilityId, req);
        imageStorageService.attachFacilityImages(facilityId, req.getImages(), uploaderAccountId);
        updated.setImages(imageStorageService.getFacilityImageUrls(facilityId));
        return ResponseEntity.ok(updated);
    }

    // Xóa mềm cơ sở bằng cách chuyển status sang INACTIVE
    @DeleteMapping("/{facilityId}")
    public ResponseEntity<Map<String, Object>> deleteFacility(@PathVariable Integer facilityId) {
        storageService.deleteFacility(facilityId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa mềm cơ sở kho ID: " + facilityId));
    }
}
