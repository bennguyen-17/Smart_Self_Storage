package com.swp391.backend.service;

import com.swp391.backend.dto.GatePinResult;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.GatePin;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.FloorRepository;
import com.swp391.backend.repository.GatePinRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.repository.ActivityLogRepository;
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
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final ActivityLogRepository activityLogRepository;
    private final SecureRandom random = new SecureRandom();

    public GatePinService(GatePinRepository gatePinRepository,
                          ReservationRepository reservationRepository,
                          StorageUnitRepository storageUnitRepository,
                          FloorRepository floorRepository,
                          ActivityLogRepository activityLogRepository) {
        this.gatePinRepository = gatePinRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.activityLogRepository = activityLogRepository;
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

        Reservation reservation = reservationRepository.findById(contract.getReservationId()).orElse(null);
        if (reservation != null && reservation.getAccountId() != null) {
            Integer facilityId = storageUnitRepository.findById(reservation.getUnitCode()).map(StorageUnit::getFloorId)
                    .flatMap(floorRepository::findById).map(Floor::getFacilityId).orElse(null);
            ActivityLog log = new ActivityLog();
            log.setAccountId(reservation.getAccountId());
            log.setFacilityId(facilityId);
            log.setAction("CUSTOMER_GATE_PIN_ISSUED");
            log.setDescription("Cấp mã PIN truy cập cho hợp đồng " + contract.getContractId());
            log.setCreatedAt(now);
            activityLogRepository.save(log);
        }

        return new GatePinResult(pin, TTL_SECONDS, expiresAt);
    }
}
