package com.swp391.backend.service;

import com.swp391.backend.dto.GatePinVerificationRequest;
import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GatePinServiceTest {

    @Mock
    private GatePinRepository gatePinRepository;
    @Mock
    private ContractRepository contractRepository;
    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private StorageUnitRepository storageUnitRepository;
    @Mock
    private FloorRepository floorRepository;
    @Mock
    private CustomerProfileRepository customerProfileRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private ActivityLogRepository activityLogRepository;

    @InjectMocks
    private GatePinService gatePinService;

    @Test
    void verifyPin_nullOrInvalidFormat_returnsFalse() {
        assertFalse(gatePinService.verifyPin(null));
        assertFalse(gatePinService.verifyPin(""));
        assertFalse(gatePinService.verifyPin("123"));
        assertFalse(gatePinService.verifyPin("abcdef"));
    }

    @Test
    void verifyPin_expiredPin_returnsFalse() {
        LocalDateTime past = LocalDateTime.now().minusSeconds(30);
        GatePin expiredPin = new GatePin(1, "123456", "ACTIVE", past, past.plusSeconds(15));
        when(gatePinRepository.findByPinCodeAndStatus("123456", "ACTIVE"))
                .thenReturn(List.of(expiredPin));

        assertFalse(gatePinService.verifyPin("123456"));
    }

    @Test
    void verifyPin_validPinAndActiveContract_returnsTrueAndSavesAuditLog() {
        LocalDateTime now = LocalDateTime.now();
        GatePin validPin = new GatePin(10, "654321", "ACTIVE", now, now.plusSeconds(15));

        Contract contract = new Contract();
        contract.setContractId(10);
        contract.setStatus("ACTIVE");
        contract.setReservationId(20);

        Reservation reservation = new Reservation();
        reservation.setReservationId(20);
        reservation.setAccountId(100);
        reservation.setUnitCode("U-101");

        StorageUnit unit = new StorageUnit();
        unit.setUnitCode("U-101");
        unit.setFloorId(1);

        Floor floor = new Floor();
        floor.setFloorId(1);
        floor.setFacilityId(2);

        CustomerProfile customer = new CustomerProfile();
        customer.setCustomerId(50);
        customer.setAccountId(100);

        when(gatePinRepository.findByPinCodeAndStatus("654321", "ACTIVE")).thenReturn(List.of(validPin));
        when(contractRepository.findById(10)).thenReturn(Optional.of(contract));
        when(reservationRepository.findById(20)).thenReturn(Optional.of(reservation));
        when(storageUnitRepository.findById("U-101")).thenReturn(Optional.of(unit));
        when(floorRepository.findById(1)).thenReturn(Optional.of(floor));
        when(customerProfileRepository.findByAccountId(100)).thenReturn(Optional.of(customer));

        boolean result = gatePinService.verifyPin("654 321");

        assertTrue(result);
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
        verify(activityLogRepository, times(1)).save(any(ActivityLog.class));
    }
}
