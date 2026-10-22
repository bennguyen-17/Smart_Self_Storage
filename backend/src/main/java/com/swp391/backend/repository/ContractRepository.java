package com.swp391.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.swp391.backend.entity.Contract;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Integer> {
    Optional<Contract> findByReservationId(Integer reservationId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select contract from Contract contract where contract.reservationId = :reservationId")
    Optional<Contract> findByReservationIdForUpdate(@Param("reservationId") Integer reservationId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select contract from Contract contract where contract.contractId = :contractId")
    Optional<Contract> findByIdForUpdate(@Param("contractId") Integer contractId);

    List<Contract> findByStatus(String status);

    @Query("""
            select contract
            from Contract contract, Reservation reservation
            where contract.reservationId = reservation.reservationId
              and contract.status in ('ACTIVE', 'OVERDUE')
              and reservation.endDate < :cutoffDate
            """)
    List<Contract> findActiveOrOverdueContractsExpiredBefore(@Param("cutoffDate") LocalDate cutoffDate);
}
