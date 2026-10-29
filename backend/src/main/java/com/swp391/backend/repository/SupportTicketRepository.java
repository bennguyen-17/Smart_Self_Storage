package com.swp391.backend.repository;

import com.swp391.backend.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    Optional<SupportTicket> findByTicketCode(String ticketCode);

    List<SupportTicket> findByCustomerIdOrderByCreatedAtDesc(Integer customerId);

    List<SupportTicket> findByFacilityIdOrderByCreatedAtDesc(Integer facilityId);

    List<SupportTicket> findByFacilityIdAndStatusOrderByCreatedAtDesc(Integer facilityId, String status);

    List<SupportTicket> findByStatusAndType(String status, String type);

    List<SupportTicket> findByContractId(Integer contractId);

    List<SupportTicket> findByUnitCode(String unitCode);

    long countByAssignedStaffIdAndStatusIn(Integer assignedStaffId, List<String> statuses);

    @org.springframework.data.jpa.repository.Query(value = """
            SELECT assignedStaffId, AVG(TIMESTAMPDIFF(SECOND, createdAt, acceptedAt)) / 60.0
            FROM SupportTicket
            WHERE facilityId = :facilityId
              AND assignedStaffId IN (:accountIds)
              AND acceptedAt IS NOT NULL
              AND createdAt >= :from
              AND createdAt < :to
            GROUP BY assignedStaffId
            """, nativeQuery = true)
    List<Object[]> findAverageAcceptMinutesByStaffAndShift(
            @org.springframework.data.repository.query.Param("facilityId") Integer facilityId,
            @org.springframework.data.repository.query.Param("accountIds") List<Integer> accountIds,
            @org.springframework.data.repository.query.Param("from") LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") LocalDateTime to);
}
