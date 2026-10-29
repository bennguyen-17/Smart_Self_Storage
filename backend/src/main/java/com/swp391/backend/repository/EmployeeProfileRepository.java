package com.swp391.backend.repository;

import com.swp391.backend.entity.EmployeeProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeProfileRepository extends JpaRepository<EmployeeProfile, Integer> {
    Optional<EmployeeProfile> findByAccountId(Integer accountId);
    List<EmployeeProfile> findByFacilityId(Integer facilityId);
}
