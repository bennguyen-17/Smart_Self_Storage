package com.swp391.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.FeePolicy;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.FeePolicyRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;

@Service
public class OverdueService {

    private static final BigDecimal DAILY_OVERDUE_FEE = new BigDecimal("50000.00");
    private static final int MAX_CHARGEABLE_OVERDUE_DAYS = 30;
    private static final List<Long> REMINDER_MILESTONES = List.of(15L, 25L, 30L);
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final AccountRepository accountRepository;
    private final ActivityLogRepository activityLogRepository;
    private final EmailService emailService;
    private final FeePolicyRepository feePolicyRepository;

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
        return MAX_CHARGEABLE_OVERDUE_DAYS;
    }

    private BigDecimal getContractDailyOverdueFee(Contract contract) {
        if (contract != null && contract.getDailyOverdueFee() != null && contract.getDailyOverdueFee().signum() > 0) {
            return contract.getDailyOverdueFee();
        }
        return getDailyOverdueFee();
    }

    private int getContractLiquidationDays(Contract contract) {
        if (contract != null && contract.getOverdueLiquidationDays() != null && contract.getOverdueLiquidationDays() > 0) {
            return contract.getOverdueLiquidationDays();
        }
        return getOverdueLiquidationDays();
    }

    public OverdueService(ContractRepository contractRepository,
                          ReservationRepository reservationRepository,
                          PaymentRepository paymentRepository,
                          AccountRepository accountRepository,
                          ActivityLogRepository activityLogRepository,
                          EmailService emailService,
                          FeePolicyRepository feePolicyRepository) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.accountRepository = accountRepository;
        this.activityLogRepository = activityLogRepository;
        this.emailService = emailService;
        this.feePolicyRepository = feePolicyRepository;
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

            // Hết số ngày quá hạn cam kết trong hợp đồng (mặc định 30 ngày, sang ngày 31 trở đi) thì chuyển sang FORFEITED
            int liquidationDays = getContractLiquidationDays(contract);
            if (overdueDays > liquidationDays) {
                contract.setStatus("FORFEITED");
                if (contract.getTerminatedAt() == null) {
                    contract.setTerminatedAt(LocalDateTime.now(VIETNAM_ZONE));
                }
                contractRepository.save(contract);
                recordForfeiture(contract, reservation, liquidationDays);
                changed = true;
            }
            if (changed) {
                updatedCount++;
            }
        }

        return updatedCount;
    }

    public Payment createOrUpdateOverdueFine(Contract contract, LocalDate endDate, LocalDate today) {
        int maxChargeableDays = getContractLiquidationDays(contract);
        long overdueDays = Math.min(
                ChronoUnit.DAYS.between(endDate, today), maxChargeableDays);
        BigDecimal totalFine = getContractDailyOverdueFee(contract).multiply(BigDecimal.valueOf(overdueDays));
        String contractCode = "CTR-" + contract.getContractId();
        Optional<Reservation> resOpt = reservationRepository.findById(contract.getReservationId());
        if (resOpt.isPresent() && resOpt.get().getReservationCode() != null && !resOpt.get().getReservationCode().isBlank()) {
            contractCode = resOpt.get().getReservationCode();
        }
        String invoiceNumber = "PEN-" + contractCode;
        LocalDateTime issuedAt = LocalDateTime.now(VIETNAM_ZONE);

        // Tìm khoản phạt quá hạn đã có của hợp đồng (bất kể invoiceNumber cũ hay mới)
        Payment payment = paymentRepository.findByContractId(contract.getContractId()).stream()
                .filter(p -> "OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType())
                        || (p.getInvoiceNumber() != null && (p.getInvoiceNumber().startsWith("PEN-") || p.getInvoiceNumber().startsWith("OVD-"))))
                .findFirst()
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
        payment.setStatus(remainingAmount.signum() == 0 ? "PAID" : (paidAmount.signum() > 0 ? "PARTIALLY_PAID" : "PENDING"));
        if (remainingAmount.signum() > 0 && paidAmount.signum() == 0) {
            payment.setPaymentStatus("PENDING");
        }
        return paymentRepository.save(payment);
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
        int maxChargeableDays = getContractLiquidationDays(contract);
        BigDecimal totalPenalty = getContractDailyOverdueFee(contract).multiply(BigDecimal.valueOf(Math.min(overdueDays, maxChargeableDays)));
        if (emailService.sendOverdueWarningEmail(customer.getEmail(), customer.getFullName(), contractCode, reservation.getUnitCode(), "Smart Self Storage", overdueDays, totalPenalty)) {
            saveSystemLog(customer.getAccountId(), action, eventKey + ";email=" + customer.getEmail());
        }
    }

    private void recordForfeiture(Contract contract, Reservation reservation, int chargeableOverdueDays) {
        List<Payment> penaltyPayments = paymentRepository.findByContractId(contract.getContractId()).stream()
                .filter(p -> "OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType())
                        || (p.getInvoiceNumber() != null && (p.getInvoiceNumber().startsWith("PEN-") || p.getInvoiceNumber().startsWith("OVD-"))))
                .toList();
        for (Payment p : penaltyPayments) {
            if (!"PAID".equalsIgnoreCase(p.getStatus())) {
                p.setStatus("CANCELLED");
                p.setPaymentStatus("FAILED");
                p.setRemainingAmount(BigDecimal.ZERO);
                paymentRepository.save(p);
            }
        }

        BigDecimal forfeitedDeposit = reservation.getDepositAmount() == null
                ? BigDecimal.ZERO
                : reservation.getDepositAmount();
        saveSystemLog(reservation.getAccountId(), "CONTRACT_FORFEITED",
                "contractId=" + contract.getContractId()
                        + ";depositForfeited=" + forfeitedDeposit
                        + ";chargeableOverdueDays=" + chargeableOverdueDays);
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
