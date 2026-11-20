package com.swp391.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.swp391.backend.dto.FeePolicyDto;
import com.swp391.backend.service.FeePolicyService;

@RestController
@RequestMapping("/api/fee-policies")
public class FeePolicyController {

    private final FeePolicyService feePolicyService;

    public FeePolicyController(FeePolicyService feePolicyService) {
        this.feePolicyService = feePolicyService;
    }

    @GetMapping
    public ResponseEntity<List<FeePolicyDto>> getAllFeePolicies() {
        return ResponseEntity.ok(feePolicyService.getAllFeePolicies());
    }

    @PostMapping
    public ResponseEntity<FeePolicyDto> createFeePolicy(@RequestBody FeePolicyDto req) {
        FeePolicyDto created = feePolicyService.createFeePolicy(req);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{policyId}")
    public ResponseEntity<FeePolicyDto> updateFeePolicy(@PathVariable Integer policyId, @RequestBody FeePolicyDto req) {
        FeePolicyDto updated = feePolicyService.updateFeePolicy(policyId, req);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{policyId}")
    public ResponseEntity<Void> deleteFeePolicy(@PathVariable Integer policyId) {
        feePolicyService.deleteFeePolicy(policyId);
        return ResponseEntity.noContent().build();
    }
}
