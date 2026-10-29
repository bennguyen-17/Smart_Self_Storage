package com.swp391.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.swp391.backend.entity.CustomerProfile;

public interface CustomerProfileRepository extends JpaRepository<CustomerProfile, Integer> {
    Optional<CustomerProfile> findByAccountId(Integer accountId);
    Optional<CustomerProfile> findByIdentityNumber(String identityNumber);
}
