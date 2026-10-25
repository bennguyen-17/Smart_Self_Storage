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

    // --- BOM: Lấy danh sách bảng giá & mức cọc từ Database ---
    @GetMapping
    public ResponseEntity<List<PriceDto>> getAllPrices() {
        return ResponseEntity.ok(storageService.getAllPrices());
    }

    // --- BOM: Cập nhật bảng giá & mức cọc theo loại ô kho vào Database ---
    @PutMapping("/{unitTypeId}")
    public ResponseEntity<PriceDto> updatePrice(@PathVariable Integer unitTypeId, @RequestBody PriceDto req) {
        PriceDto updated = storageService.updatePrice(unitTypeId, req);
        return ResponseEntity.ok(updated);
    }

    // --- BOM: Thêm loại ô kho mới kèm bảng giá & mức cọc vào Database ---
    @PostMapping
    public ResponseEntity<PriceDto> createPrice(@RequestBody PriceDto req) {
        PriceDto created = storageService.createPrice(req);
        return ResponseEntity.ok(created);
    }

    // --- BOM: Xóa mềm loại ô kho khỏi Database ---
    @DeleteMapping("/{unitTypeId}")
    public ResponseEntity<Void> deletePrice(@PathVariable Integer unitTypeId) {
        storageService.deletePrice(unitTypeId);
        return ResponseEntity.noContent().build();
    }
}
