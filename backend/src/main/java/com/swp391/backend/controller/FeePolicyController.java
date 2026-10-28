package com.swp391.backend.controller;

import com.swp391.backend.dto.FeePolicyDto;
import com.swp391.backend.service.FeePolicyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/fee-policies", "/api/fee-items"})
public class FeePolicyController {

    private final FeePolicyService feePolicyService;

    public FeePolicyController(FeePolicyService feePolicyService) {
        this.feePolicyService = feePolicyService;
    }

    // --- Lấy danh sách các chính sách biểu phí, phụ thu, phạt, chiết khấu ---
    @GetMapping
    public ResponseEntity<List<FeePolicyDto>> getAllFeePolicies() {
        return ResponseEntity.ok(feePolicyService.getAllFeePolicies());
    }

    // --- BOM: Tạo mới biểu phí ---
    @PostMapping
    public ResponseEntity<FeePolicyDto> createFeePolicy(@RequestBody FeePolicyDto req) {
        FeePolicyDto created = feePolicyService.createFeePolicy(req);
        return ResponseEntity.ok(created);
    }

    // --- BOM: Cập nhật biểu phí ---
    @PutMapping("/{policyId}")
    public ResponseEntity<FeePolicyDto> updateFeePolicy(@PathVariable Integer policyId, @RequestBody FeePolicyDto req) {
        FeePolicyDto updated = feePolicyService.updateFeePolicy(policyId, req);
        return ResponseEntity.ok(updated);
    }

    // --- BOM: Xóa mềm biểu phí (status = INACTIVE) ---
    @DeleteMapping("/{policyId}")
    public ResponseEntity<Void> deleteFeePolicy(@PathVariable Integer policyId) {
        feePolicyService.deleteFeePolicy(policyId);
        return ResponseEntity.noContent().build();
    }
}
