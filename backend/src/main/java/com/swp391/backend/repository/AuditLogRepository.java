package com.swp391.backend.repository;

import com.swp391.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

@org.springframework.stereotype.Repository
public interface AuditLogRepository
        extends JpaRepository<AuditLog, Integer> {

    List<AuditLog> findByFacilityIdAndActionOrderByCreatedAtDesc(
            Integer facilityId,
            String action
    );

    List<AuditLog> findByFacilityIdOrderByOpenedAtDesc(Integer facilityId);

    List<AuditLog> findByFacilityIdOrderByCreatedAtDesc(Integer facilityId);

    List<AuditLog> findAllByOrderByOpenedAtDesc();

    List<AuditLog> findAllByOrderByCreatedAtDesc();
}

