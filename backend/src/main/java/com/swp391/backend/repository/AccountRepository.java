package com.swp391.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import com.swp391.backend.entity.Account;

public interface AccountRepository extends JpaRepository<Account, Long> {

    @Query("select account from Account account where account.accountId = :accountId")
    Optional<Account> findAccountByAccountId(@Param("accountId") Integer accountId);

    Optional<Account> findByEmail(String email);

    Optional<Account> findByPhone(String phone);
}
