package com.swp391.backend.service;

import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;
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
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;

    public OverdueService(ContractRepository contractRepository,
                          ReservationRepository reservationRepository,
                          PaymentRepository paymentRepository) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
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

            if ("ACTIVE".equalsIgnoreCase(contract.getStatus())) {
                contract.setStatus("OVERDUE");
                contractRepository.save(contract);
                updatedCount++;
            }

            if ("OVERDUE".equalsIgnoreCase(contract.getStatus())) {
                createOrUpdateOverdueFine(contract, reservation.getEndDate(), today);
            }
        }

        return updatedCount;
    }

    private void createOrUpdateOverdueFine(Contract contract, LocalDate endDate, LocalDate today) {
        long overdueDays = ChronoUnit.DAYS.between(endDate, today);
        BigDecimal totalFine = DAILY_OVERDUE_FEE.multiply(BigDecimal.valueOf(overdueDays));
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
}
