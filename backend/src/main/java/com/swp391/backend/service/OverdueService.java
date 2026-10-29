package com.swp391.backend.service;

import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import com.swp391.backend.entity.FeePolicy;
import com.swp391.backend.repository.FeePolicyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class OverdueService {

    private static final BigDecimal DAILY_OVERDUE_FEE = new BigDecimal("50000.00");
    private static final int MAX_CHARGEABLE_OVERDUE_DAYS = 29;
    private static final List<Long> REMINDER_MILESTONES = List.of(15L, 25L, 30L);
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final AccountRepository accountRepository;
    private final ActivityLogRepository activityLogRepository;
    private final EmailService emailService;

    @Autowired(required = false)
    private FeePolicyRepository feePolicyRepository;

    private BigDecimal getDailyOverdueFee() {
        try {
            if (feePolicyRepository != null) {
                Optional<FeePolicy> fp = feePolicyRepository.findByPolicyCode("OVERDUE_DAILY_RATE");
                if (fp.isPresent() && fp.get().getFeeValue() != null) {
                    return fp.get().getFeeValue();
                }
            }
        } catch (Exception ignored) {}
        return DAILY_OVERDUE_FEE;
    }

    private int getOverdueLiquidationDays() {
        try {
            if (feePolicyRepository != null) {
                Optional<FeePolicy> fp = feePolicyRepository.findByPolicyCode("OVERDUE_LIQUIDATION_DAYS");
                if (fp.isPresent() && fp.get().getFeeValue() != null) {
                    return fp.get().getFeeValue().intValue();
                }
            }
        } catch (Exception ignored) {}
        return 30;
    }

    public OverdueService(ContractRepository contractRepository,
                          ReservationRepository reservationRepository,
                          PaymentRepository paymentRepository,
                          AccountRepository accountRepository,
                          ActivityLogRepository activityLogRepository,
                          EmailService emailService) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.accountRepository = accountRepository;
        this.activityLogRepository = activityLogRepository;
        this.emailService = emailService;
    }

    @Transactional
    public int markExpiredContracts(LocalDate today) {
        List<Contract> candidates = contractRepository.findActiveOrOverdueContractsExpiredBefore(today);
        int updatedCount = 0;

        for (Contract candidate : candidates) {
            Contract contract = contractRepository
                    .findByReservationIdForUpdate(candidate.getReservationId())
                    .orElse(null);
            if (contract == null
                    || (!"ACTIVE".equalsIgnoreCase(contract.getStatus())
                    && !"OVERDUE".equalsIgnoreCase(contract.getStatus()))) {
                continue;
            }

            Reservation reservation = reservationRepository
                    .findByReservationIdForUpdate(contract.getReservationId())
                    .orElse(null);
            if (reservation == null || reservation.getEndDate() == null
                    || !reservation.getEndDate().isBefore(today)) {
                continue;
            }

            boolean changed = false;
            if ("ACTIVE".equalsIgnoreCase(contract.getStatus())) {
                contract.setStatus("OVERDUE");
                contractRepository.save(contract);
                changed = true;
            }

            if (!"OVERDUE".equalsIgnoreCase(contract.getStatus())) {
                continue;
            }

            long overdueDays = ChronoUnit.DAYS.between(reservation.getEndDate(), today);
            sendMilestoneReminder(contract, reservation, overdueDays);
            createOrUpdateOverdueFine(contract, reservation.getEndDate(), today);

            if (overdueDays >= getOverdueLiquidationDays()) {
                contract.setStatus("FORFEITED");
                contractRepository.save(contract);
                recordForfeiture(contract, reservation);
                changed = true;
            }
            if (changed) {
                updatedCount++;
            }
        }

        return updatedCount;
    }

    private void createOrUpdateOverdueFine(Contract contract, LocalDate endDate, LocalDate today) {
        long overdueDays = Math.min(
                ChronoUnit.DAYS.between(endDate, today), MAX_CHARGEABLE_OVERDUE_DAYS);
        BigDecimal totalFine = getDailyOverdueFee().multiply(BigDecimal.valueOf(overdueDays));
        String contractCode = "CTR-" + contract.getContractId();
        Optional<Reservation> resOpt = reservationRepository.findById(contract.getReservationId());
        if (resOpt.isPresent() && resOpt.get().getReservationCode() != null && !resOpt.get().getReservationCode().isBlank()) {
            contractCode = resOpt.get().getReservationCode();
        }
        String invoiceNumber = "PEN-" + contractCode;
        LocalDateTime issuedAt = LocalDateTime.now(VIETNAM_ZONE);

        Payment payment = paymentRepository.findByInvoiceNumber(invoiceNumber)
                .orElseGet(Payment::new);
        if (payment.getPaymentId() == null) {
            payment.setContractId(contract.getContractId());
            payment.setInvoiceNumber(invoiceNumber);
            payment.setInvoiceType("OVERDUE_FEE");
            payment.setPaidAmount(BigDecimal.ZERO);
            payment.setIssuedAt(issuedAt);
            payment.setDueAt(issuedAt.plusDays(1));
            payment.setStatus("PENDING");
            payment.setPaymentStatus("PENDING");
        }

        BigDecimal paidAmount = payment.getPaidAmount() == null
                ? BigDecimal.ZERO
                : payment.getPaidAmount();
        BigDecimal remainingAmount = totalFine.subtract(paidAmount).max(BigDecimal.ZERO);
        payment.setAmount(totalFine);
        payment.setRemainingAmount(remainingAmount);
        payment.setStatus(remainingAmount.signum() == 0 ? "PAID" : "PENDING");
        if (remainingAmount.signum() > 0) {
            payment.setPaymentStatus("PENDING");
        }
        paymentRepository.save(payment);
    }

    private void sendMilestoneReminder(Contract contract, Reservation reservation, long overdueDays) {
        if (!REMINDER_MILESTONES.contains(overdueDays)) {
            return;
        }

        String action = "OVERDUE_REMINDER_DAY_" + overdueDays;
        String eventKey = "contractId=" + contract.getContractId() + ";day=" + overdueDays;
        if (activityLogRepository.existsByActionAndDescriptionStartingWith(action, eventKey)) {
            return;
        }

        Account customer = accountRepository.findAccountByAccountId(reservation.getAccountId()).orElse(null);
        if (customer == null || customer.getEmail() == null || customer.getEmail().isBlank()) {
            return;
        }

        String contractCode = reservation.getReservationCode() != null
                ? reservation.getReservationCode()
                : "CTR-" + contract.getContractId();
        String subject = "Cảnh báo hợp đồng lưu kho quá hạn ngày thứ " + overdueDays;
        String content = "Xin chào " + (customer.getFullName() == null ? "Quý khách" : customer.getFullName())
                + ",\n\nHợp đồng " + contractCode + " cho ô kho " + reservation.getUnitCode()
                + " đã quá hạn " + overdueDays + " ngày. Phí quá hạn hiện tính 50.000 VNĐ/ngày,"
                + " tối đa đến hết ngày thứ 29. Khi đủ 30 ngày, hợp đồng sẽ chuyển sang FORFEITED"
                + " và toàn bộ tiền cọc sẽ bị tịch thu. Vui lòng liên hệ cơ sở để xử lý tài sản.\n\n"
                + "Smart Self Storage";

        if (emailService.sendTextEmail(customer.getEmail(), subject, content)) {
            saveSystemLog(customer.getAccountId(), action, eventKey + ";email=" + customer.getEmail());
        }
    }

    private void recordForfeiture(Contract contract, Reservation reservation) {
        BigDecimal forfeitedDeposit = reservation.getDepositAmount() == null
                ? BigDecimal.ZERO
                : reservation.getDepositAmount();
        saveSystemLog(reservation.getAccountId(), "CONTRACT_FORFEITED",
                "contractId=" + contract.getContractId()
                        + ";depositForfeited=" + forfeitedDeposit
                        + ";chargeableOverdueDays=" + MAX_CHARGEABLE_OVERDUE_DAYS);
    }

    private void saveSystemLog(Integer accountId, String action, String description) {
        ActivityLog log = new ActivityLog();
        log.setAccountId(accountId);
        log.setAction(action);
        log.setDescription(description);
        log.setCreatedAt(LocalDateTime.now(VIETNAM_ZONE));
        activityLogRepository.save(log);
    }
}
