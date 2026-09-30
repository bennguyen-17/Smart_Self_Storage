package com.swp391.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.swp391.backend.entity.Contract;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Integer> {
    Optional<Contract> findByReservationId(Integer reservationId);
}
