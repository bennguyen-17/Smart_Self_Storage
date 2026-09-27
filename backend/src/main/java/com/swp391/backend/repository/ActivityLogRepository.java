package com.swp391.backend.repository;

import com.swp391.backend.entity.ActivityLog;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ActivityLogRepository
                extends JpaRepository<ActivityLog, Long> {
        @Query("""
                        SELECT COUNT(a)
                        FROM ActivityLog a
                        WHERE a.accountId = :accountId
                          AND a.ipAddress = :ipAddress
                          AND a.action = 'LOGIN_FAILED'
                          AND a.createdAt > :from
                          AND a.createdAt > :lastSuccess
                        """)
        long countFailedLogs(
                        @Param("accountId") Integer accountId,
                        @Param("ipAddress") String ipAddress,
                        @Param("from") LocalDateTime from,
                        @Param("lastSuccess") LocalDateTime lastSuccess);

        @Query("""
                        SELECT MAX(a.createdAt)
                        FROM ActivityLog a
                        WHERE a.accountId = :accountId
                          AND a.ipAddress = :ipAddress
                          AND a.action = 'LOGIN_SUCCESS'
                        """)
        LocalDateTime findLastLoginSuccess(
                        @Param("accountId") Integer accountId,
                        @Param("ipAddress") String ipAddress);

      List<ActivityLog> findByAccountId(Integer accountId);

}
