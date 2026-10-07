package com.swp391.backend.repository;

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

    List<Contract> findByStatus(String status);
}
