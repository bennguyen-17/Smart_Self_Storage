package com.swp391.backend.service;

import com.swp391.backend.dto.GatePinResult;
import com.swp391.backend.entity.AuditLog;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.GatePin;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.repository.AuditLogRepository;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.CustomerProfileRepository;
import com.swp391.backend.repository.FloorRepository;
import com.swp391.backend.repository.GatePinRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class GatePinService {

    private static final String ACTIVE = "ACTIVE";
    private static final int TTL_SECONDS = 15;

    private final GatePinRepository gatePinRepository;
    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final AuditLogRepository auditLogRepository;
    private final SecureRandom random = new SecureRandom();

    public GatePinService(GatePinRepository gatePinRepository,
                          ContractRepository contractRepository,
                          ReservationRepository reservationRepository,
                          StorageUnitRepository storageUnitRepository,
                          FloorRepository floorRepository,
                          CustomerProfileRepository customerProfileRepository,
                          AuditLogRepository auditLogRepository) {
        this.gatePinRepository = gatePinRepository;
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public GatePinResult generatePin(Contract contract) {
        if (contract == null || !ACTIVE.equalsIgnoreCase(contract.getStatus())) {
            throw new IllegalStateException(
                    "Chỉ hợp đồng ACTIVE mới được cấp mã PIN."
            );
        }

        int pinNumber = 100000 + random.nextInt(900000);
        String pin = String.valueOf(pinNumber);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(TTL_SECONDS);

        Optional<GatePin> existingPin = gatePinRepository
                .findTopByContractIdAndStatusOrderByGeneratedAtDesc(
                        contract.getContractId(), ACTIVE);

        GatePin gatePin;
        if (existingPin.isPresent()) {
            gatePin = existingPin.get();
            gatePin.setPinCode(pin);
            gatePin.setGeneratedAt(now);
            gatePin.setExpiresAt(expiresAt);
        } else {
            gatePin = new GatePin(
                    contract.getContractId(),
                    pin,
                    ACTIVE,
                    now,
                    expiresAt
            );
        }

        gatePinRepository.save(gatePin);

        return new GatePinResult(pin, TTL_SECONDS, expiresAt);
    }

    @Transactional
    public boolean verifyPin(String submittedPin) {
        if (submittedPin == null) {
            return false;
        }

        String pinCode = submittedPin.replaceAll("\\s", "");
        if (!pinCode.matches("\\d{6}")) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        for (GatePin pin : gatePinRepository.findByPinCodeAndStatus(pinCode, ACTIVE)) {
            if (pin.getGeneratedAt() == null || pin.getExpiresAt() == null
                    || !now.isBefore(pin.getGeneratedAt().plusSeconds(TTL_SECONDS))
                    || !now.isBefore(pin.getExpiresAt())) {
                continue;
            }

            Contract contract = contractRepository.findById(pin.getContractId()).orElse(null);
            if (contract == null || !ACTIVE.equalsIgnoreCase(contract.getStatus())) {
                continue;
            }

            Reservation reservation = reservationRepository.findById(contract.getReservationId()).orElse(null);
            if (reservation == null || reservation.getAccountId() == null) {
                continue;
            }

            Integer facilityId = storageUnitRepository.findById(reservation.getUnitCode())
                    .map(StorageUnit::getFloorId)
                    .flatMap(floorRepository::findById)
                    .map(Floor::getFacilityId)
                    .orElse(null);
            Integer customerId = customerProfileRepository.findByAccountId(reservation.getAccountId())
                    .map(customer -> customer.getCustomerId())
                    .orElse(null);

            AuditLog auditLog = new AuditLog();
            auditLog.setAccountId(reservation.getAccountId());
            auditLog.setCustomerId(customerId);
            auditLog.setFacilityId(facilityId);
            auditLog.setAction("GATE_ACCESS_GRANTED");
            auditLog.setOpenedAt(now);
            auditLog.setReason("Mã PIN động hợp lệ");
            auditLog.setCreatedAt(now);
            auditLogRepository.save(auditLog);
            return true;
        }
        return false;
    }
}
