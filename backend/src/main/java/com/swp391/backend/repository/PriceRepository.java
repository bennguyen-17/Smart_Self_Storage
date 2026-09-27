package com.swp391.backend.repository;

import com.swp391.backend.entity.Price;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PriceRepository extends JpaRepository<Price, Integer> {
    Optional<Price> findByUnitTypeIdAndStatus(Integer unitTypeId, String status);
    List<Price> findByStatus(String status);
}
