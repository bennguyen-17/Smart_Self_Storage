package com.swp391.backend.repository;

import com.swp391.backend.entity.StorageUnit;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StorageUnitRepository extends JpaRepository<StorageUnit, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<StorageUnit> findByUnitCode(String unitCode);

    @Modifying
    @Query("UPDATE StorageUnit unit "
            + "SET unit.status = 'AVAILABLE', "
            + "unit.holdByUserId = null, "
            + "unit.holdExpiresAt = null "
            + "WHERE unit.status = 'HOLD' "
            + "AND unit.holdExpiresAt < :now")
    int releaseExpiredHolds(@Param("now") LocalDateTime now);

    List<StorageUnit> findByFloorId(Integer floorId);
    List<StorageUnit> findByFloorIdAndStatus(Integer floorId, String status);
    List<StorageUnit> findByUnitTypeIdAndStatus(Integer unitTypeId, String status);
    long countByFloorIdAndStatus(Integer floorId, String status);
}
