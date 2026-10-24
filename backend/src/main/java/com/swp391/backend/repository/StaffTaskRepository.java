package com.swp391.backend.repository;

import com.swp391.backend.entity.StaffTask;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Collection;

public interface StaffTaskRepository extends JpaRepository<StaffTask, Integer> {
    List<StaffTask> findByFacilityIdAndWorkDateOrderByCreatedAtDesc(Integer facilityId, LocalDate workDate);

    List<StaffTask> findByAssignedEmployeeIdAndWorkDateAndShiftIdOrderByCreatedAtDesc(
            Integer assignedEmployeeId, LocalDate workDate, Integer shiftId);

    List<StaffTask> findByContractIdAndTaskTypeAndStatus(Integer contractId, String taskType, String status);

    List<StaffTask> findByFacilityIdAndWorkDateAndShiftIdAndTaskTypeAndUnitCodeAndStatus(
            Integer facilityId, LocalDate workDate, Integer shiftId, String taskType, String unitCode, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select task from StaffTask task where task.taskId = :taskId")
    Optional<StaffTask> findByIdForUpdate(@Param("taskId") Integer taskId);

    @Query("""
            SELECT task.assignedEmployeeId, COUNT(task)
            FROM StaffTask task
            WHERE task.facilityId = :facilityId
              AND task.workDate = :workDate
              AND task.shiftId = :shiftId
              AND task.status = 'DONE'
              AND task.assignedEmployeeId IN :employeeIds
            GROUP BY task.assignedEmployeeId
            """)
    List<Object[]> countDoneTasksByEmployeeAndShift(
            @Param("facilityId") Integer facilityId,
            @Param("workDate") LocalDate workDate,
            @Param("shiftId") Integer shiftId,
            @Param("employeeIds") Collection<Integer> employeeIds);
}
