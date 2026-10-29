package com.swp391.backend.repository;

import com.swp391.backend.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShiftRepository extends JpaRepository<Shift, Integer> {
    List<Shift> findByStatusOrderByStartTimeAsc(String status);
}
