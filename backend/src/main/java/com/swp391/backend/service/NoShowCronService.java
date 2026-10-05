package com.swp391.backend.service;

import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NoShowCronService {

    private static final Logger log = LoggerFactory.getLogger(NoShowCronService.class);

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final PaymentRepository paymentRepository;
    private final ActivityLogRepository activityLogRepository;

    public NoShowCronService(ContractRepository contractRepository,
                             ReservationRepository reservationRepository,
                             StorageUnitRepository storageUnitRepository,
                             PaymentRepository paymentRepository,
                             ActivityLogRepository activityLogRepository) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.paymentRepository = paymentRepository;
        this.activityLogRepository = activityLogRepository;
    }

    // --- US-15: Cron Job chạy tự động lúc 00:00:00 hằng ngày ---
    @Scheduled(cron = "0 0 0 * * ?")
    public void scheduledNoShowJob() {
        log.info("Starting Daily No-Show Cron Job at 00:00:00...");
        int processedCount = processNoShowContracts();
        log.info("Daily No-Show Cron Job completed. Processed {} no-show contracts.", processedCount);
    }

    // --- Logic cốt lõi: Quét và hủy các đơn No-Show quá hạn ---
    @Transactional
    public int processNoShowContracts() {
        LocalDate today = LocalDate.now();
        List<Contract> pendingContracts = contractRepository.findByStatus("PENDING_CHECKIN");
        int count = 0;

        for (Contract contract : pendingContracts) {
            Reservation reservation = reservationRepository.findById(contract.getReservationId()).orElse(null);
            if (reservation == null) {
                continue;
            }

            // [BR-17]: Nếu đến 00:00 ngày hôm sau mà khách vẫn chưa đến Check-in (startDate < today)
            if (reservation.getStartDate() != null && reservation.getStartDate().isBefore(today)) {
                // 1. Chuyển hợp đồng sang CANCELED
                contract.setStatus("CANCELED");
                contractRepository.save(contract);

                // 2. Chuyển Reservation sang CANCELLED
                reservation.setStatus("CANCELLED");
                reservationRepository.save(reservation);

                // 3. Giải phóng ô kho về AVAILABLE
                if (reservation.getUnitCode() != null) {
                    StorageUnit unit = storageUnitRepository.findById(reservation.getUnitCode()).orElse(null);
                    if (unit != null && !"OCCUPIED".equalsIgnoreCase(unit.getStatus())) {
                        unit.setStatus("AVAILABLE");
                        storageUnitRepository.save(unit);
                    }
                }

                // 4. Hủy hóa đơn cọc DEP (Tịch thu 100% tiền cọc, KHÔNG sinh REF)
                List<Payment> payments = paymentRepository.findByContractId(contract.getContractId());
                for (Payment payment : payments) {
                    if ("PENDING".equalsIgnoreCase(payment.getStatus()) || "PARTIALLY_PAID".equalsIgnoreCase(payment.getStatus())) {
                        payment.setStatus("CANCELLED");
                        paymentRepository.save(payment);
                    }
                }

                // 5. Ghi nhận ActivityLog
                if (activityLogRepository != null) {
                    ActivityLog activityLog = new ActivityLog();
                    activityLog.setAccountId(reservation.getAccountId());
                    activityLog.setAction("NO_SHOW_CANCELED");
                    activityLog.setDescription(String.format("Tự động hủy do No-Show hợp đồng #%d, ô %s (ngày hẹn: %s). Tịch thu 100%% tiền cọc theo BR-17.",
                            contract.getContractId(), reservation.getUnitCode(), reservation.getStartDate()));
                    activityLog.setCreatedAt(LocalDateTime.now());
                    activityLogRepository.save(activityLog);
                }

                count++;
            }
        }

        return count;
    }
}
