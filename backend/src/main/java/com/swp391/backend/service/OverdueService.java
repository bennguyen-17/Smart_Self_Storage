package com.swp391.backend.service;

import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class OverdueService {

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;

    public OverdueService(ContractRepository contractRepository,
                          ReservationRepository reservationRepository) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional
    public int markExpiredContracts(LocalDate today) {
        List<Contract> candidates = contractRepository.findActiveOrOverdueContractsExpiredBefore(today);
        int updatedCount = 0;

        for (Contract candidate : candidates) {
            Contract contract = contractRepository
                    .findByReservationIdForUpdate(candidate.getReservationId())
                    .orElse(null);
            if (contract == null || !"ACTIVE".equalsIgnoreCase(contract.getStatus())) {
                continue;
            }

            Reservation reservation = reservationRepository
                    .findByReservationIdForUpdate(contract.getReservationId())
                    .orElse(null);
            if (reservation == null || reservation.getEndDate() == null
                    || !reservation.getEndDate().isBefore(today)) {
                continue;
            }

            contract.setStatus("OVERDUE");
            contractRepository.save(contract);
            updatedCount++;
        }

        return updatedCount;
    }
}
