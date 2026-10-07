package com.swp391.backend.repository;

import com.swp391.backend.entity.Reservation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    Optional<Reservation> findByReservationCode(String reservationCode);
    boolean existsByReservationCode(String reservationCode);

    @Query("""
            select reservation
            from Reservation reservation, StorageUnit unit, Floor floor
            where reservation.unitCode = unit.unitCode
              and unit.floorId = floor.floorId
              and floor.facilityId = :facilityId
            order by reservation.startDate asc
            """)
    List<Reservation> findByFacilityId(@Param("facilityId") Integer facilityId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select reservation from Reservation reservation where reservation.reservationId = :reservationId")
    Optional<Reservation> findByReservationIdForUpdate(@Param("reservationId") Integer reservationId);

    List<Reservation> findByAccountId(Integer accountId);
    List<Reservation> findByUnitCodeAndStatus(String unitCode, String status);
    Optional<Reservation> findTopByUnitCodeOrderByCreatedAtDesc(String unitCode);
}
