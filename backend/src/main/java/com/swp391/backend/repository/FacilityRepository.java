package com.swp391.backend.repository;

import com.swp391.backend.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FacilityRepository extends JpaRepository<Facility, Integer> {
    List<Facility> findByStatus(String status);
}
