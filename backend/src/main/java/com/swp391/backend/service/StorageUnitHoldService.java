package com.swp391.backend.service;

import com.swp391.backend.dto.HoldUnitResponse;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.repository.StorageUnitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class StorageUnitHoldService {

    private static final long HOLD_DURATION_SECONDS = 300;

    private final StorageUnitRepository storageUnitRepository;

    public StorageUnitHoldService(StorageUnitRepository storageUnitRepository) {
        this.storageUnitRepository = storageUnitRepository;
    }

    @Transactional
    public HoldUnitResponse holdUnit(Integer unitId, Integer accountId) {
        Optional<StorageUnit> unitOptional = storageUnitRepository.findByUnitId(unitId);

        if (unitOptional.isEmpty()) {
            return HoldUnitResponse.error("Storage unit was not found.");
        }

        StorageUnit unit = unitOptional.get();
        LocalDateTime now = LocalDateTime.now();

        boolean holdHasExpired = "HOLD".equals(unit.getStatus())
                && unit.getHoldExpiresAt() != null
                && unit.getHoldExpiresAt().isBefore(now);

        if (holdHasExpired) {
            unit.setStatus("AVAILABLE");
            unit.setHoldByUserId(null);
            unit.setHoldExpiresAt(null);
        }

        if (!"AVAILABLE".equals(unit.getStatus())) {
            return HoldUnitResponse.error("Storage unit is not available for a hold.");
        }

        LocalDateTime holdExpiresAt = now.plusSeconds(HOLD_DURATION_SECONDS);

        unit.setStatus("HOLD");
        unit.setHoldByUserId(accountId);
        unit.setHoldExpiresAt(holdExpiresAt);

        HoldUnitResponse response = new HoldUnitResponse();
        response.setSuccess(true);
        response.setHoldId(unit.getUnitId());
        response.setMessage("Storage unit held successfully.");
        response.setHoldExpiresAt(holdExpiresAt);

        return response;
    }
}
