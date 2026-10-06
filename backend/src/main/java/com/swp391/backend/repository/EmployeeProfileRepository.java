package com.swp391.backend.repository;

import com.swp391.backend.entity.EmployeeProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeProfileRepository extends JpaRepository<EmployeeProfile, Integer> {
    Optional<EmployeeProfile> findByAccountId(Integer accountId);
}
