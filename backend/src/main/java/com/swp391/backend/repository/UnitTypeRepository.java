package com.swp391.backend.repository;

import com.swp391.backend.entity.UnitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UnitTypeRepository extends JpaRepository<UnitType, Integer> {
    List<UnitType> findByStatus(String status);
}
