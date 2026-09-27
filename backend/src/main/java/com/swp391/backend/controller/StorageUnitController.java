package com.swp391.backend.controller;

import com.swp391.backend.dto.CalculatePriceRequest;
import com.swp391.backend.dto.CalculatePriceResponse;
import com.swp391.backend.dto.UnitDetailResponse;
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
}
