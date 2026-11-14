package com.swp391.backend.service;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.ResetPasswordRequest;
import com.swp391.backend.entity.Account;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.CustomerProfileRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.FacilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LoginServicePasswordTest {

    private AccountRepository accountRepository;
    private LoginService loginService;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        accountRepository = mock(AccountRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        loginService = new LoginService(
                accountRepository,
                mock(CustomerProfileRepository.class),
                mock(EmployeeProfileRepository.class),
                mock(FacilityRepository.class),
                mock(JwtService.class),
                mock(ActivityLogRepository.class),
                passwordEncoder,
                mock(EmailService.class)
        );
    }

    private Account sampleAccount(String rawPassword) {
        Account account = new Account();
        account.setAccountId(10);
        account.setEmail("user@example.com");
        account.setPhone("0901234567");
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setStatus("ACTIVE");
        account.setMustChangePassword(true);
        return account;
    }

    @Test
    void changePassword_rejectsWeakOrRepeatedPassword() {
        Account acc = sampleAccount("123456@Test");
        when(accountRepository.findAccountByAccountId(10)).thenReturn(Optional.of(acc));

        ApiResponse weak = loginService.changePassword(10, "123456@Test", "simple6");
        assertFalse(weak.isSuccess());
        assertEquals(AuthService.PASSWORD_POLICY_MESSAGE, weak.getMessage());

        ApiResponse same = loginService.changePassword(10, "123456@Test", "123456@Test");
        assertFalse(same.isSuccess());
        assertEquals("Mật khẩu mới phải khác mật khẩu hiện tại!", same.getMessage());

        verify(accountRepository, never()).save(any());
    }

    @Test
    void changePassword_acceptsStrongNewPasswordAndClearsMustChangeFlag() {
        Account acc = sampleAccount("123456@Test");
        when(accountRepository.findAccountByAccountId(10)).thenReturn(Optional.of(acc));

        ApiResponse res = loginService.changePassword(10, "123456@Test", "BaoMat@2026");
        assertTrue(res.isSuccess());
        assertFalse(Boolean.TRUE.equals(acc.getMustChangePassword()));
        assertTrue(passwordEncoder.matches("BaoMat@2026", acc.getPassword()));
        verify(accountRepository).save(acc);
    }

    @Test
    void resetPassword_rejectsWeakPasswordAndAcceptsStrongPassword() {
        Account acc = sampleAccount("OldPass@1");
        acc.setOtpCode("123456");
        acc.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        when(accountRepository.findByEmail("user@example.com")).thenReturn(Optional.of(acc));

        ResetPasswordRequest weakReq = new ResetPasswordRequest();
        weakReq.setPhone("user@example.com");
        weakReq.setOtpCode("123456");
        weakReq.setNewPassword("123456");
        ApiResponse weakRes = loginService.resetPassword(weakReq);
        assertFalse(weakRes.isSuccess());
        assertEquals(AuthService.PASSWORD_POLICY_MESSAGE, weakRes.getMessage());
        verify(accountRepository, never()).save(any());

        ResetPasswordRequest strongReq = new ResetPasswordRequest();
        strongReq.setPhone("user@example.com");
        strongReq.setOtpCode("123456");
        strongReq.setNewPassword("StrongPass@2026");
        ApiResponse strongRes = loginService.resetPassword(strongReq);
        assertTrue(strongRes.isSuccess());
        assertNull(acc.getOtpCode());
        assertTrue(passwordEncoder.matches("StrongPass@2026", acc.getPassword()));
        verify(accountRepository).save(acc);
    }
}
