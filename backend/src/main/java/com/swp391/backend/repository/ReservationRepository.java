package com.swp391.backend.repository;

import com.swp391.backend.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    List<Reservation> findByAccountId(Integer accountId);
    List<Reservation> findByUnitCodeAndStatus(String unitCode, String status);
    Optional<Reservation> findTopByUnitCodeOrderByCreatedAtDesc(String unitCode);
}
