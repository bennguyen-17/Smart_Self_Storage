package com.swp391.backend.repository;

import com.swp391.backend.entity.StaffShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StaffShiftRepository extends JpaRepository<StaffShift, Integer> {
    List<StaffShift> findByFacilityIdAndWorkDateAndStatusNot(Integer facilityId, LocalDate workDate, String status);
    List<StaffShift> findByFacilityIdAndShiftIdAndWorkDate(Integer facilityId, Integer shiftId, LocalDate workDate);
    void deleteByFacilityIdAndShiftIdAndWorkDate(Integer facilityId, Integer shiftId, LocalDate workDate);
}
