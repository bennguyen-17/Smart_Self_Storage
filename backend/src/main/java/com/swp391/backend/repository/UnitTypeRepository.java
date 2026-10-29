package com.swp391.backend.repository;

import com.swp391.backend.entity.UnitType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UnitTypeRepository extends JpaRepository<UnitType, Integer> {
    List<UnitType> findByStatus(String status);
}
