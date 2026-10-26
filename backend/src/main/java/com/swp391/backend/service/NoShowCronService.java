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
import java.time.ZoneId;
import java.util.List;

@Service
public class NoShowCronService {

    private static final Logger log = LoggerFactory.getLogger(NoShowCronService.class);

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final PaymentRepository paymentRepository;
    private final ActivityLogRepository activityLogRepository;
    private final OverdueService overdueService;

    public NoShowCronService(ContractRepository contractRepository,
                             ReservationRepository reservationRepository,
                             StorageUnitRepository storageUnitRepository,
                             PaymentRepository paymentRepository,
                             ActivityLogRepository activityLogRepository,
                             OverdueService overdueService) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.paymentRepository = paymentRepository;
        this.activityLogRepository = activityLogRepository;
        this.overdueService = overdueService;
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

            // Nếu đến 00:00 ngày hôm sau mà khách vẫn chưa đến Check-in (startDate < today)
            if (reservation.getStartDate() != null && reservation.getStartDate().isBefore(today)) {
                // 1. Chuyển hợp đồng sang CANCELLED
                contract.setStatus("CANCELLED");
                contract.setCancelReason("NO_SHOW");
                contractRepository.save(contract);

                // 2. Chuyển Reservation sang CANCELLED
                reservation.setStatus("CANCELLED");
                reservationRepository.save(reservation);

                // 3. Giải phóng ô kho về AVAILABLE
                if (reservation.getUnitCode() != null) {
                    StorageUnit unit = storageUnitRepository.findById(reservation.getUnitCode()).orElse(null);
                    if (unit != null && !"RENTED".equalsIgnoreCase(unit.getStatus())) {
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
                    activityLog.setAction("NO_SHOW_CANCELLED");
                    activityLog.setDescription(String.format("Tự động hủy do No-Show hợp đồng #%d, ô %s (ngày hẹn: %s). Tịch thu 100%% tiền cọc do quá hạn check-in.",
                            contract.getContractId(), reservation.getUnitCode(), reservation.getStartDate()));
                    activityLog.setCreatedAt(LocalDateTime.now());
                    activityLogRepository.save(activityLog);
                }

                count++;
            }
        }

        return count;
    }

    // --- US-27: Cập nhật hợp đồng quá hạn hằng ngày lúc 00:00 giờ Việt Nam ---
    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Ho_Chi_Minh")
    public void scheduledOverdueContractJob() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        int updatedCount = overdueService.markExpiredContracts(today);
        log.info("Overdue contract job completed. Updated {} contracts for {}.", updatedCount, today);
    }

    // --- US-21: Cron Job nhắc hạn thuê lúc 08:00:00 hằng ngày ---
    @Scheduled(cron = "0 0 8 * * ?")
    public void scheduledContractExpiryReminderJob() {
        log.info("Starting Daily Contract Expiry Reminder Cron Job at 08:00:00...");
        int count = processContractExpiryReminders();
        log.info("Daily Expiry Reminder completed. Sent reminders for {} contracts.", count);
    }

    @Transactional
    public int processContractExpiryReminders() {
        LocalDate today = LocalDate.now();
        List<Contract> activeContracts = contractRepository.findByStatus("ACTIVE");
        int count = 0;

        for (Contract contract : activeContracts) {
            Reservation reservation = reservationRepository.findById(contract.getReservationId()).orElse(null);
            if (reservation == null || reservation.getEndDate() == null) continue;

            long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, reservation.getEndDate());
            // Gửi nhắc nhở ở các mốc T-7, T-3, T-1 ngày trước khi hết hạn
            if (daysLeft == 7 || daysLeft == 3 || daysLeft == 1) {
                if (activityLogRepository != null) {
                    ActivityLog activityLog = new ActivityLog();
                    activityLog.setAccountId(reservation.getAccountId());
                    activityLog.setAction("EXPIRY_REMINDER_T" + daysLeft);
                    activityLog.setDescription(String.format("Hệ thống tự động gửi nhắc hạn hợp đồng #%d (ô %s) sắp hết hạn sau %d ngày (hạn: %s) qua Email/Portal.",
                            contract.getContractId(), reservation.getUnitCode(), daysLeft, reservation.getEndDate()));
                    activityLog.setCreatedAt(LocalDateTime.now());
                    activityLogRepository.save(activityLog);
                }
                log.info("Sent expiry reminder for contract #{} (unit {}, daysLeft={})", contract.getContractId(), reservation.getUnitCode(), daysLeft);
                count++;
            }
        }
        return count;
    }

    // --- BR-14: Quét và giải phóng các ô kho HOLD quá 5 phút chưa thanh toán ---
    @Scheduled(fixedRate = 60000)
    @Transactional
    public int processExpiredHolds() {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> expiredHolds = reservationRepository.findAll().stream()
                .filter(r -> "PENDING".equalsIgnoreCase(r.getStatus())
                        && r.getHoldExpiresAt() != null
                        && r.getHoldExpiresAt().isBefore(now))
                .toList();

        int count = 0;
        for (Reservation reservation : expiredHolds) {
            reservation.setStatus("CANCELLED");
            reservationRepository.save(reservation);

            if (reservation.getUnitCode() != null) {
                storageUnitRepository.findById(reservation.getUnitCode()).ifPresent(unit -> {
                    if ("HOLD".equalsIgnoreCase(unit.getStatus())) {
                        unit.setStatus("AVAILABLE");
                        storageUnitRepository.save(unit);
                    }
                });
            }

            contractRepository.findByReservationId(reservation.getReservationId()).ifPresent(contract -> {
                if ("INITIATED".equalsIgnoreCase(contract.getStatus()) || "PENDING".equalsIgnoreCase(contract.getStatus())) {
                    contract.setStatus("CANCELLED");
                    contract.setCancelReason("HOLD_EXPIRED");
                    contractRepository.save(contract);
                }
            });

            if (activityLogRepository != null) {
                ActivityLog log = new ActivityLog();
                log.setAccountId(reservation.getAccountId());
                log.setAction("HOLD_EXPIRED");
                log.setDescription("Hết thời gian giữ chỗ (5 phút). Đơn đặt " + reservation.getReservationCode() + " đã tự động hủy và giải phóng ô kho " + reservation.getUnitCode() + ".");
                log.setCreatedAt(now);
                activityLogRepository.save(log);
            }
            count++;
        }
        return count;
    }
}
