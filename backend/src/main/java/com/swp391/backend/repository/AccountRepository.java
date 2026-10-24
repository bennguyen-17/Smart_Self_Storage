package com.swp391.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import com.swp391.backend.entity.Account;

import java.util.List;

public interface AccountRepository extends JpaRepository<Account, Long> {

    @Query("select account from Account account where account.accountId = :accountId")
    Optional<Account> findAccountByAccountId(@Param("accountId") Integer accountId);

    Optional<Account> findByEmail(String email);

    Optional<Account> findByPhone(String phone);

    @Query("""
            SELECT account FROM Account account
            WHERE account.roleId = 5
              AND (
                :pattern IS NULL
                OR LOWER(COALESCE(account.fullName, '')) LIKE :pattern
                OR LOWER(COALESCE(account.phone, '')) LIKE :pattern
                OR LOWER(COALESCE(account.email, '')) LIKE :pattern
                OR LOWER(COALESCE(account.status, '')) LIKE :pattern
                OR (:searchLocked = true AND account.status = 'SUSPENDED' AND account.lockUntil IS NOT NULL)
              )
            ORDER BY account.fullName ASC
            """)
    List<Account> searchCustomers(@Param("pattern") String pattern,
                                  @Param("searchLocked") boolean searchLocked);
}
