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
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class OverdueService {

    private static final BigDecimal DAILY_OVERDUE_FEE = new BigDecimal("50000.00");
    private static final DateTimeFormatter INVOICE_DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;

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
                createMissingDailyFines(contract, reservation.getEndDate(), today);
            }
        }

        return updatedCount;
    }

    private void createMissingDailyFines(Contract contract, LocalDate endDate, LocalDate today) {
        LocalDateTime issuedAt = LocalDateTime.now();
        for (LocalDate fineDate = endDate.plusDays(1);
             !fineDate.isAfter(today);
             fineDate = fineDate.plusDays(1)) {
            String invoiceNumber = "OVD-" + contract.getContractId() + "-"
                    + fineDate.format(INVOICE_DATE_FORMAT);
            if (paymentRepository.findByInvoiceNumber(invoiceNumber).isPresent()) {
                continue;
            }

            Payment payment = new Payment();
            payment.setContractId(contract.getContractId());
            payment.setInvoiceNumber(invoiceNumber);
            payment.setInvoiceType("OVERDUE_FEE");
            payment.setAmount(DAILY_OVERDUE_FEE);
            payment.setPaidAmount(BigDecimal.ZERO);
            payment.setRemainingAmount(DAILY_OVERDUE_FEE);
            payment.setIssuedAt(issuedAt);
            payment.setDueAt(issuedAt.plusDays(1));
            payment.setStatus("PENDING");
            payment.setPaymentStatus("PENDING");
            paymentRepository.save(payment);
        }
    }
}
