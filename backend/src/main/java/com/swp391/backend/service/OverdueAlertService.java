package com.swp391.backend.service;

import com.swp391.backend.dto.OverdueAlertsResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class OverdueAlertService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AccountRepository accountRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final ReservationRepository reservationRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;

    public OverdueAlertService(AccountRepository accountRepository,
                               EmployeeProfileRepository employeeProfileRepository,
                               ReservationRepository reservationRepository,
                               ContractRepository contractRepository,
                               PaymentRepository paymentRepository) {
        this.accountRepository = accountRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.reservationRepository = reservationRepository;
        this.contractRepository = contractRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public OverdueAlertsResponse getCustomerAlerts(Integer accountId) {
        Account account = accountRepository.findAccountByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (account.getRoleId() == null || account.getRoleId() != 5L) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return buildResponse(reservationRepository.findByAccountId(accountId));
    }

    @Transactional(readOnly = true)
    public OverdueAlertsResponse getFacilityAlerts(Integer accountId) {
        if (accountId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        Integer facilityId = employeeProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN))
                .getFacilityId();
        return buildResponse(reservationRepository.findByFacilityId(facilityId));
    }

    private OverdueAlertsResponse buildResponse(List<Reservation> reservations) {
        List<OverdueAlertsResponse.ContractAlert> alerts = new ArrayList<>();
        BigDecimal totalUnpaidOverdueFees = BigDecimal.ZERO;
        LocalDate today = LocalDate.now(VIETNAM_ZONE);

        for (Reservation reservation : reservations) {
            Contract contract = contractRepository.findByReservationId(reservation.getReservationId())
                    .filter(candidate -> "OVERDUE".equalsIgnoreCase(candidate.getStatus()))
                    .orElse(null);
            if (contract == null) {
                continue;
            }

            BigDecimal unpaidOverdueFee = paymentRepository.findByContractId(contract.getContractId()).stream()
                    .filter(this::isOutstandingOverdueFee)
                    .map(Payment::getRemainingAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long daysOverdue = reservation.getEndDate() == null
                    ? 0
                    : Math.max(0, ChronoUnit.DAYS.between(reservation.getEndDate(), today));
            alerts.add(new OverdueAlertsResponse.ContractAlert(
                    contract.getContractId(),
                    reservation.getAccountId(),
                    reservation.getUnitCode(),
                    reservation.getEndDate(),
                    daysOverdue,
                    unpaidOverdueFee));
            totalUnpaidOverdueFees = totalUnpaidOverdueFees.add(unpaidOverdueFee);
        }

        return new OverdueAlertsResponse(true, totalUnpaidOverdueFees, alerts);
    }

    private boolean isOutstandingOverdueFee(Payment payment) {
        if (!"OVERDUE_FEE".equalsIgnoreCase(payment.getInvoiceType())
                || payment.getRemainingAmount() == null
                || payment.getRemainingAmount().signum() <= 0) {
            return false;
        }
        return !"PAID".equalsIgnoreCase(payment.getStatus())
                && !"CANCELLED".equalsIgnoreCase(payment.getStatus());
    }
}
