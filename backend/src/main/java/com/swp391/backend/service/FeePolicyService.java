package com.swp391.backend.service;

import com.swp391.backend.dto.FeePolicyDto;
import com.swp391.backend.entity.FeePolicy;
import com.swp391.backend.repository.FeePolicyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FeePolicyService {

    private final FeePolicyRepository feePolicyRepository;

    public FeePolicyService(FeePolicyRepository feePolicyRepository) {
        this.feePolicyRepository = feePolicyRepository;
    }

    public List<FeePolicyDto> getAllFeePolicies() {
        return feePolicyRepository.findByStatus("ACTIVE")
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public FeePolicyDto createFeePolicy(FeePolicyDto req) {
        FeePolicy policy = new FeePolicy();
        String code = req.getPolicyCode();
        if (code == null || code.trim().isEmpty()) {
            code = "FP_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        policy.setPolicyCode(code);
        policy.setPolicyName(req.getPolicyName() != null ? req.getPolicyName() : "Khoản phí");
        policy.setCategory(req.getCategory() != null ? req.getCategory().toUpperCase() : "SURCHARGE");
        policy.setCalcType(req.getCalcType() != null ? req.getCalcType().toUpperCase() : "FIXED");
        policy.setFeeValue(req.getFeeValue() != null ? req.getFeeValue() : BigDecimal.ZERO);
        policy.setUnitBasis(req.getUnitBasis() != null ? req.getUnitBasis() : "TOTAL_BILL");
        policy.setDescription(req.getDescription());
        policy.setIsWaiveDeposit(Boolean.TRUE.equals(req.getIsWaiveDeposit()));
        policy.setStatus("ACTIVE");

        FeePolicy saved = feePolicyRepository.save(policy);
        return mapToDto(saved);
    }

    @Transactional
    public FeePolicyDto updateFeePolicy(Integer policyId, FeePolicyDto req) {
        FeePolicy policy = feePolicyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy biểu phí có ID: " + policyId));

        if (req.getPolicyName() != null && !req.getPolicyName().trim().isEmpty()) {
            policy.setPolicyName(req.getPolicyName().trim());
        }
        if (req.getCategory() != null) {
            policy.setCategory(req.getCategory().toUpperCase());
        }
        if (req.getCalcType() != null) {
            policy.setCalcType(req.getCalcType().toUpperCase());
        }
        if (req.getFeeValue() != null) {
            policy.setFeeValue(req.getFeeValue());
        }
        if (req.getUnitBasis() != null) {
            policy.setUnitBasis(req.getUnitBasis());
        }
        if (req.getDescription() != null) {
            policy.setDescription(req.getDescription());
        }
        if (req.getIsWaiveDeposit() != null) {
            policy.setIsWaiveDeposit(req.getIsWaiveDeposit());
        }
        if (req.getStatus() != null) {
            policy.setStatus(req.getStatus().toUpperCase());
        }

        FeePolicy updated = feePolicyRepository.save(policy);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteFeePolicy(Integer policyId) {
        FeePolicy policy = feePolicyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy biểu phí có ID: " + policyId));
        // Soft delete: status = INACTIVE
        policy.setStatus("INACTIVE");
        feePolicyRepository.save(policy);
    }

    private FeePolicyDto mapToDto(FeePolicy entity) {
        return new FeePolicyDto(
                entity.getPolicyId(),
                entity.getPolicyCode(),
                entity.getPolicyName(),
                entity.getCategory(),
                entity.getCalcType(),
                entity.getFeeValue(),
                entity.getUnitBasis(),
                entity.getDescription(),
                entity.getIsWaiveDeposit(),
                entity.getStatus()
        );
    }
}
