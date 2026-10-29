package com.swp391.backend.repository;

import com.swp391.backend.entity.FeePolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeePolicyRepository extends JpaRepository<FeePolicy, Integer> {
    List<FeePolicy> findByStatus(String status);
    List<FeePolicy> findByCategoryAndStatus(String category, String status);
    Optional<FeePolicy> findByPolicyCode(String policyCode);
    Optional<FeePolicy> findByPolicyCodeAndStatus(String policyCode, String status);
}
