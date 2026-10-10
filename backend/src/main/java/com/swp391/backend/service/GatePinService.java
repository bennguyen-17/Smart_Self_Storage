package com.swp391.backend.service;

import com.swp391.backend.dto.GatePinResult;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.GatePin;
import com.swp391.backend.repository.GatePinRepository;
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
    private final SecureRandom random = new SecureRandom();

    public GatePinService(GatePinRepository gatePinRepository) {
        this.gatePinRepository = gatePinRepository;
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
}
