package com.swp391.backend.repository;

import com.swp391.backend.entity.StaffShift;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffShiftRepository extends JpaRepository<StaffShift, Integer> {
    List<StaffShift> findByFacilityIdAndWorkDateAndStatusNot(Integer facilityId, LocalDate workDate, String status);
    List<StaffShift> findByFacilityIdAndShiftIdAndWorkDate(Integer facilityId, Integer shiftId, LocalDate workDate);
    List<StaffShift> findByEmployeeIdAndWorkDate(Integer employeeId, LocalDate workDate);
    List<StaffShift> findByEmployeeIdAndWorkDateAndStatusNot(Integer employeeId, LocalDate workDate, String status);
    Optional<StaffShift> findByEmployeeIdAndFacilityIdAndShiftIdAndWorkDate(
            Integer employeeId, Integer facilityId, Integer shiftId, LocalDate workDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select staffShift from StaffShift staffShift where staffShift.employeeId = :employeeId and staffShift.workDate in :workDates and staffShift.status <> 'CANCELLED'")
    List<StaffShift> findAssignedShiftsForUpdate(
            @Param("employeeId") Integer employeeId,
            @Param("workDates") List<LocalDate> workDates);

    void deleteByFacilityIdAndShiftIdAndWorkDate(Integer facilityId, Integer shiftId, LocalDate workDate);
}
