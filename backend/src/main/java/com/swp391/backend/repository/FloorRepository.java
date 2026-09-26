package com.swp391.backend.repository;

import com.swp391.backend.entity.Floor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FloorRepository extends JpaRepository<Floor, Integer> {
    List<Floor> findByFacilityId(Integer facilityId);
    List<Floor> findByFacilityIdAndStatus(Integer facilityId, String status);
}
