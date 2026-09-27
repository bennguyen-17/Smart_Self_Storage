package com.swp391.backend.service;

import com.swp391.backend.repository.StorageUnitRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class StorageUnitHoldCleanupService {

    private final StorageUnitRepository storageUnitRepository;

    public StorageUnitHoldCleanupService(StorageUnitRepository storageUnitRepository) {
        this.storageUnitRepository = storageUnitRepository;
    }

    @Scheduled(fixedRate = 10_000)
    @Transactional
    public void releaseExpiredHolds() {
        LocalDateTime now = LocalDateTime.now();
        storageUnitRepository.releaseExpiredHolds(now);
    }
}
