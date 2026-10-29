package com.swp391.backend.repository;

import com.swp391.backend.entity.Floor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FloorRepository extends JpaRepository<Floor, Integer> {
    List<Floor> findByFacilityId(Integer facilityId);
    List<Floor> findByFacilityIdOrderByFloorIdAsc(Integer facilityId);
    List<Floor> findByFacilityIdAndStatus(Integer facilityId, String status);
}
