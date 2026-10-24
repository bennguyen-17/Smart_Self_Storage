package com.swp391.backend.repository;

import com.swp391.backend.entity.ActivityLog;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ActivityLogRepository
                extends JpaRepository<ActivityLog, Integer> {
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

        @Query("""
                        SELECT MAX(a.createdAt)
                        FROM ActivityLog a
                        WHERE a.accountId = :accountId
                          AND a.action = 'LOGIN_SUCCESS'
                        """)
        LocalDateTime findLatestLoginSuccess(
                        @Param("accountId") Integer accountId);

      List<ActivityLog> findByAccountId(Integer accountId);
      boolean existsByActionAndDescriptionStartingWith(String action, String descriptionPrefix);
      List<ActivityLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);
      List<ActivityLog> findAllByOrderByCreatedAtDesc();

      List<ActivityLog> findByFacilityIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
              Integer facilityId, LocalDateTime from, LocalDateTime to);

      List<ActivityLog> findByFacilityIdAndAccountIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
              Integer facilityId, Integer accountId, LocalDateTime from, LocalDateTime to);

      @Query("""
              SELECT log.accountId, log.action, COUNT(log)
              FROM ActivityLog log
              WHERE log.facilityId = :facilityId
                AND log.accountId IN :accountIds
                AND log.action IN :actions
                AND log.createdAt >= :from
                AND log.createdAt < :to
              GROUP BY log.accountId, log.action
              """)
      List<Object[]> countActionsByStaffAndShift(
              @Param("facilityId") Integer facilityId,
              @Param("accountIds") Collection<Integer> accountIds,
              @Param("actions") Collection<String> actions,
              @Param("from") LocalDateTime from,
              @Param("to") LocalDateTime to);
}
