package com.swp391.backend.repository;

import com.swp391.backend.entity.StorageUnit;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StorageUnitRepository extends JpaRepository<StorageUnit, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select unit from StorageUnit unit where unit.unitCode = :unitCode")
    Optional<StorageUnit> findByUnitCodeForUpdate(@Param("unitCode") String unitCode);

    List<StorageUnit> findByFloorId(Integer floorId);
    List<StorageUnit> findByFloorIdAndStatus(Integer floorId, String status);
    List<StorageUnit> findByUnitTypeIdAndStatus(Integer unitTypeId, String status);
    long countByFloorIdAndStatus(Integer floorId, String status);
}
