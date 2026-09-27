package com.swp391.backend.repository;

import com.swp391.backend.entity.StorageUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StorageUnitRepository extends JpaRepository<StorageUnit, String> {
    List<StorageUnit> findByFloorId(Integer floorId);
    List<StorageUnit> findByFloorIdAndStatus(Integer floorId, String status);
    List<StorageUnit> findByUnitTypeIdAndStatus(Integer unitTypeId, String status);
    long countByFloorIdAndStatus(Integer floorId, String status);
}
