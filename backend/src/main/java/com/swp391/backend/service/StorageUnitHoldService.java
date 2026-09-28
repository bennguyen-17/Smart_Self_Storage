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

    private static final long HOLD_DURATION_SECONDS = 60*5;

    private final StorageUnitRepository storageUnitRepository;

    public StorageUnitHoldService(StorageUnitRepository storageUnitRepository) {
        this.storageUnitRepository = storageUnitRepository;
    }

    @Transactional
    public HoldUnitResponse holdUnit(String unitCode, Integer accountId) {
        Optional<StorageUnit> unitOptional = storageUnitRepository.findByUnitCode(unitCode);

        if (unitOptional.isEmpty()) {
            return HoldUnitResponse.error("Không tìm thấy kho lưu trữ.");
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
            return HoldUnitResponse.error("Kho lưu trữ hiện không khả dụng để giữ chỗ.");
        }

        LocalDateTime holdExpiresAt = now.plusSeconds(HOLD_DURATION_SECONDS);

        unit.setStatus("HOLD");
        unit.setHoldByUserId(accountId);
        unit.setHoldExpiresAt(holdExpiresAt);

        HoldUnitResponse response = new HoldUnitResponse();
        response.setSuccess(true);
        response.setHoldId(unit.getUnitCode());
        response.setMessage("Giữ chỗ kho lưu trữ thành công.");
        response.setHoldExpiresAt(holdExpiresAt);

        return response;
    }
}
