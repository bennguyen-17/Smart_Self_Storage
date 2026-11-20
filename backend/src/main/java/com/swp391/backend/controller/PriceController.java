package com.swp391.backend.controller;

import com.swp391.backend.dto.PriceDto;
import com.swp391.backend.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prices")
public class PriceController {

    private final StorageService storageService;

    public PriceController(StorageService storageService) {
        this.storageService = storageService;
    }

    @GetMapping
    public ResponseEntity<List<PriceDto>> getAllPrices() {
        return ResponseEntity.ok(storageService.getAllPrices());
    }

    @PutMapping("/{unitTypeId}")
    public ResponseEntity<PriceDto> updatePrice(@PathVariable Integer unitTypeId, @RequestBody PriceDto req) {
        PriceDto updated = storageService.updatePrice(unitTypeId, req);
        return ResponseEntity.ok(updated);
    }

    @PostMapping
    public ResponseEntity<PriceDto> createPrice(@RequestBody PriceDto req) {
        PriceDto created = storageService.createPrice(req);
        return ResponseEntity.ok(created);
    }

    // Xóa mềm loại ô kho
    @DeleteMapping("/{unitTypeId}")
    public ResponseEntity<Void> deletePrice(@PathVariable Integer unitTypeId) {
        storageService.deletePrice(unitTypeId);
        return ResponseEntity.noContent().build();
    }
}
