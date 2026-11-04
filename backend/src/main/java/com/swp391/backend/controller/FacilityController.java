package com.swp391.backend.controller;

import com.swp391.backend.dto.FacilityRequest;
import com.swp391.backend.dto.FacilityResponse;
import com.swp391.backend.dto.StoredImageResponse;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.StoredImage;
import com.swp391.backend.service.ImageStorageService;
import com.swp391.backend.service.StorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    // --- BOM: Tải/thay một phần hoặc toàn bộ bộ ảnh của cơ sở ---
    @PutMapping(value = "/{facilityId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, StoredImageResponse>> uploadFacilityImages(
            @PathVariable Integer facilityId,
            @RequestParam(value = "cover", required = false) MultipartFile cover,
            @RequestParam(value = "allUnits", required = false) MultipartFile allUnits,
            @RequestParam(value = "normalUnit", required = false) MultipartFile normalUnit,
            @RequestParam(value = "climateUnit", required = false) MultipartFile climateUnit,
            @AuthenticationPrincipal Integer uploaderAccountId) {

        Map<String, MultipartFile> imageFiles = new java.util.LinkedHashMap<>();
        imageFiles.put("COVER", cover);
        imageFiles.put("ALL_UNITS", allUnits);
        imageFiles.put("NORMAL_UNIT", normalUnit);
        imageFiles.put("CLIMATE_UNIT", climateUnit);
        Map<String, StoredImageResponse> uploadedImages = new java.util.LinkedHashMap<>();
        imageFiles.forEach((slot, file) -> {
            if (file != null && !file.isEmpty()) {
                StoredImage storedImage = imageStorageService.storeFacilityImage(
                        facilityId, slot, uploaderAccountId, file);
                uploadedImages.put(slot, new StoredImageResponse(storedImage));
            }
        });

        if (uploadedImages.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(uploadedImages);
    }

    // --- BOM: Xóa mềm cơ sở kho trong Database (status = 'INACTIVE') ---
    @DeleteMapping("/{facilityId}")
    public ResponseEntity<Map<String, Object>> deleteFacility(@PathVariable Integer facilityId) {
        storageService.deleteFacility(facilityId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa mềm cơ sở kho ID: " + facilityId));
    }
}
