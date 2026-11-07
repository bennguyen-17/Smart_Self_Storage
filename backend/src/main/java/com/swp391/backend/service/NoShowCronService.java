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
    private final SupportTicketRepository supportTicketRepository;
    private final AccountRepository accountRepository;
    private final EmailService emailService;

    public NoShowCronService(ContractRepository contractRepository,
                             ReservationRepository reservationRepository,
                             StorageUnitRepository storageUnitRepository,
                             PaymentRepository paymentRepository,
                             ActivityLogRepository activityLogRepository,
                             OverdueService overdueService,
                             SupportTicketRepository supportTicketRepository,
                             AccountRepository accountRepository,
                             EmailService emailService) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.paymentRepository = paymentRepository;
        this.activityLogRepository = activityLogRepository;
        this.overdueService = overdueService;
        this.supportTicketRepository = supportTicketRepository;
        this.accountRepository = accountRepository;
        this.emailService = emailService;
    }

    // Tự động kiểm tra khách không đến nhận kho đúng hẹn lúc 00:00 hằng ngày
    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Ho_Chi_Minh")
    public void scheduledNoShowJob() {
        log.info("Starting Daily No-Show Cron Job at 00:00:00 (Asia/Ho_Chi_Minh)...");
        int processedCount = processNoShowContracts();
        log.info("Daily No-Show Check-in Cron Job completed. Processed {} no-show contracts.", processedCount);

        int cancelledTickets = processExpiredEarlyTerminationTickets();
        log.info("Daily Early Termination No-Show Cron Job completed. Processed {} expired tickets.", cancelledTickets);
    }

    // Tự động đóng các yêu cầu trả kho lỡ hẹn khi qua 00:00 ngày hôm sau
    @Transactional
    public int processExpiredEarlyTerminationTickets() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        List<SupportTicket> openEarlyTickets = supportTicketRepository.findAll().stream()
                .filter(t -> "EARLY_TERMINATION".equalsIgnoreCase(t.getType())
                        && !"RESOLVED".equalsIgnoreCase(t.getStatus())
                        && !"CANCELLED".equalsIgnoreCase(t.getStatus())
                        && t.getDesiredDate() != null
                        && t.getDesiredDate().isBefore(today))
                .toList();

        int count = 0;
        java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
        for (SupportTicket ticket : openEarlyTickets) {
            ticket.setStatus("CANCELLED");
            ticket.setResolvedAt(LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
            String formattedDate = ticket.getDesiredDate().format(dtf);
            ticket.setResolutionNote(String.format("Khách hàng không đến cơ sở nghiệm thu vào ngày hẹn %s. Lịch hẹn trả kho đã tự động đóng. Hợp đồng tiếp tục duy trì.", formattedDate));
            supportTicketRepository.save(ticket);

            // Giữ hợp đồng ACTIVE và reset cancelReason nếu có
            if (ticket.getContractId() != null) {
                contractRepository.findById(ticket.getContractId()).ifPresent(contract -> {
                    if ("ACTIVE".equalsIgnoreCase(contract.getStatus()) && "EARLY_TERMINATION".equalsIgnoreCase(contract.getCancelReason())) {
                        contract.setCancelReason(null);
                        contractRepository.save(contract);
                    }
                });
            }

            // Ghi nhận ActivityLog
            if (activityLogRepository != null) {
                ActivityLog activityLog = new ActivityLog();
                Integer customerAccountId = null;
                if (ticket.getContractId() != null) {
                    customerAccountId = contractRepository.findById(ticket.getContractId())
                            .map(Contract::getReservationId)
                            .flatMap(reservationRepository::findById)
                            .map(Reservation::getAccountId)
                            .orElse(null);
                }
                if (customerAccountId == null) {
                    customerAccountId = ticket.getCustomerId();
                }
                activityLog.setAccountId(customerAccountId);
                activityLog.setFacilityId(ticket.getFacilityId());
                activityLog.setAction("EARLY_TERMINATION_NO_SHOW");
                activityLog.setDescription(String.format("Hệ thống tự động hủy lịch hẹn trả kho #%s (ô %s) do khách hàng không đến nghiệm thu ngày %s. Hợp đồng #%d vẫn tiếp tục ACTIVE.",
                        ticket.getTicketCode(), ticket.getUnitCode() != null ? ticket.getUnitCode() : "", formattedDate, ticket.getContractId()));
                activityLog.setCreatedAt(LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
                activityLogRepository.save(activityLog);
            }

            count++;
        }
        return count;
    }

    // --- Logic cốt lõi: Quét và hủy các đơn No-Show quá hạn ---
    @Transactional
    public int processNoShowContracts() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
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
                contract.setTerminatedAt(LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
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
                    if ("PENDING".equalsIgnoreCase(payment.getStatus()) || "PARTIALLY_PAID".equalsIgnoreCase(payment.getStatus()) || "CANCELLED".equalsIgnoreCase(payment.getStatus())) {
                        payment.setStatus("CANCELLED");
                        payment.setRemainingAmount(java.math.BigDecimal.ZERO);
                        if ("PENDING".equalsIgnoreCase(payment.getPaymentStatus())) {
                            payment.setPaymentStatus("FAILED");
                        }
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

    // Tự động cập nhật trạng thái hợp đồng quá hạn lúc 00:00 hằng ngày
    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Ho_Chi_Minh")
    public void scheduledOverdueContractJob() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        int updatedCount = overdueService.markExpiredContracts(today);
        log.info("Overdue contract job completed. Updated {} contracts for {}.", updatedCount, today);
    }

    // Tự động gửi thông báo nhắc hạn thuê sắp hết lúc 08:00 hằng ngày
    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Ho_Chi_Minh")
    public void scheduledContractExpiryReminderJob() {
        log.info("Starting Daily Contract Expiry Reminder Cron Job at 00:00:00 (Asia/Ho_Chi_Minh)...");
        int count = processContractExpiryReminders();
        log.info("Daily Expiry Reminder completed. Sent reminders for {} contracts.", count);
    }

    @Transactional
    public int processContractExpiryReminders() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        List<Contract> activeContracts = contractRepository.findByStatus("ACTIVE");
        int count = 0;

        for (Contract contract : activeContracts) {
            Reservation reservation = reservationRepository.findById(contract.getReservationId()).orElse(null);
            if (reservation == null || reservation.getEndDate() == null) continue;

            long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, reservation.getEndDate());
            // Nhắc hạn trước đúng 3 ngày và trước 1 ngày (đồng bộ quét 00:00 giờ Việt Nam)
            if (daysLeft == 3 || daysLeft == 1) {
                String contractCode = reservation.getReservationCode() != null
                        ? reservation.getReservationCode()
                        : "CTR-" + contract.getContractId();

                if (accountRepository != null && emailService != null) {
                    Account customer = accountRepository.findAccountByAccountId(reservation.getAccountId()).orElse(null);
                    if (customer != null && customer.getEmail() != null && !customer.getEmail().isBlank()) {
                        emailService.sendExpiryReminderEmail(
                                customer.getEmail(),
                                customer.getFullName(),
                                contractCode,
                                reservation.getUnitCode(),
                                "Smart Self Storage",
                                reservation.getEndDate(),
                                daysLeft
                        );
                    }
                }

                if (activityLogRepository != null) {
                    ActivityLog activityLog = new ActivityLog();
                    activityLog.setAccountId(reservation.getAccountId());
                    activityLog.setAction("EXPIRY_REMINDER_T" + daysLeft);
                    activityLog.setDescription(String.format("Hệ thống tự động gửi email nhắc hạn hợp đồng %s (ô %s) sắp hết hạn sau %d ngày (hạn: %s).",
                            contractCode, reservation.getUnitCode(), daysLeft, reservation.getEndDate()));
                    activityLog.setCreatedAt(LocalDateTime.now());
                    activityLogRepository.save(activityLog);
                }
                log.info("Sent {}-day expiry reminder email for contract #{} (unit {}, daysLeft={})", daysLeft, contract.getContractId(), reservation.getUnitCode(), daysLeft);
                count++;
            }
        }
        return count;
    }

    // Tự động giải phóng các ô kho giữ chỗ quá 5 phút chưa hoàn tất thanh toán
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
                ActivityLog activityLog = new ActivityLog();
                activityLog.setAccountId(reservation.getAccountId());
                activityLog.setAction("HOLD_EXPIRED");
                activityLog.setDescription("Hết thời gian giữ chỗ (5 phút). Đơn đặt " + reservation.getReservationCode() + " đã tự động hủy và giải phóng ô kho " + reservation.getUnitCode() + ".");
                activityLog.setCreatedAt(now);
                activityLogRepository.save(activityLog);
            }
            count++;
        }
        return count;
    }
}
