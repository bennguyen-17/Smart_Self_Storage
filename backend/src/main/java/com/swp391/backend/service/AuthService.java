package com.swp391.backend.service;

import com.swp391.backend.dto.auth.LoginRequest;
import com.swp391.backend.dto.auth.LoginResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.repository.AccountRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final AccountRepository accountRepository;

    public AuthService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public Optional<LoginResponse> login(LoginRequest request) {

        Optional<Account> accountResult =
                accountRepository.findByEmail(request.getEmail());

        if (accountResult.isEmpty()) {
            return Optional.empty();
        }

        Account account = accountResult.get();

        // Tạm thời so sánh password trực tiếp
        if (!request.getPassword().equals(account.getPassword())) {
            return Optional.empty();
        }

        return Optional.of(new LoginResponse(
                account.getAccountId(),
                account.getFullName(),
                account.getEmail(),
                account.getRoleId() == null
                        ? null
                        : account.getRoleId().toString()
        ));
    }
}