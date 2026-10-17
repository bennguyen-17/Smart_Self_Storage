package com.swp391.backend.service;

import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.dto.CustomerCancelReservationRequest;
import com.swp391.backend.dto.CustomerCancelReservationResponse;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class CustomerReservationService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AccountRepository accountRepository;
    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final PaymentRepository paymentRepository;

    public CustomerReservationService(AccountRepository accountRepository,
                                      ContractRepository contractRepository,
                                      ReservationRepository reservationRepository,
                                      StorageUnitRepository storageUnitRepository,
                                      PaymentRepository paymentRepository) {
        this.accountRepository = accountRepository;
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public CustomerCancelReservationResponse cancelDeposit(Integer contractId, Integer accountId,
                                                            CustomerCancelReservationRequest body) {
        if (accountId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Yêu cầu đăng nhập.");
        }
        Account account = accountRepository.findAccountByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không hợp lệ."));
        if (!Long.valueOf(5L).equals(account.getRoleId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Customer được hủy đặt chỗ.");
        }

        Contract initialContract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng."));
        Integer reservationId = initialContract.getReservationId();
        Reservation reservation = reservationRepository.findByReservationIdForUpdate(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đặt chỗ."));
        if (!accountId.equals(reservation.getAccountId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền hủy đặt chỗ này.");
        }

        Contract contract = contractRepository.findByReservationIdForUpdate(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng."));
        if (!contractId.equals(contract.getContractId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng.");
        }
        if (!"PENDING_CHECKIN".equalsIgnoreCase(contract.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ có thể hủy hợp đồng đang chờ check-in.");
        }
        if (paymentRepository.findByContractId(contractId).stream()
                .anyMatch(payment -> "REF".equalsIgnoreCase(payment.getInvoiceType()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hợp đồng đã có hóa đơn hoàn tiền.");
        }

        StorageUnit unit = storageUnitRepository.findByUnitCodeForUpdate(reservation.getUnitCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Không tìm thấy kho của đặt chỗ."));
        if (!"RESERVED".equalsIgnoreCase(unit.getStatus()) && !"HOLD".equalsIgnoreCase(unit.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Trạng thái kho không cho phép hủy đặt chỗ.");
        }

        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        long daysUntilStart = ChronoUnit.DAYS.between(LocalDate.now(VIETNAM_ZONE), reservation.getStartDate());
        BigDecimal rate = daysUntilStart >= 4 ? BigDecimal.ONE : new BigDecimal("0.50");
        BigDecimal paidDeposit = paymentRepository.findByContractId(contractId).stream()
                .filter(payment -> "DEP".equalsIgnoreCase(payment.getInvoiceType()))
                .filter(payment -> "SUCCESS".equalsIgnoreCase(payment.getPaymentStatus()))
                .map(this::collectedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal refundAmount = paidDeposit.multiply(rate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal forfeitedAmount = paidDeposit.subtract(refundAmount);

        String bankName = value(body != null ? body.getBankName() : null);
        String bankAccountNumber = value(body != null ? body.getBankAccountNumber() : null);
        String bankAccountName = value(body != null ? body.getBankAccountName() : null);
        if (refundAmount.signum() > 0
                && (bankName == null || bankAccountNumber == null || bankAccountName == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần cung cấp đầy đủ thông tin ngân hàng để nhận hoàn tiền.");
        }

        contract.setStatus("CANCELED");
        contract.setCancelReason("CUSTOMER_REQUEST");
        contract.setTerminatedAt(now);
        if (bankName != null) contract.setRefundBankName(bankName);
        if (bankAccountNumber != null) contract.setRefundAccountNumber(bankAccountNumber);
        if (bankAccountName != null) contract.setRefundAccountName(bankAccountName.toUpperCase());
        reservation.setStatus("CANCELLED");
        unit.setStatus("AVAILABLE");
        contractRepository.save(contract);
        reservationRepository.save(reservation);
        storageUnitRepository.save(unit);

        if (refundAmount.signum() > 0) {
            String contractCode = (reservation.getReservationCode() != null && !reservation.getReservationCode().isBlank())
                    ? reservation.getReservationCode()
                    : ("CTR-" + contractId);
            Payment refund = new Payment();
            refund.setContractId(contractId);
            refund.setInvoiceNumber("REF-" + contractCode);
            refund.setInvoiceType("REF");
            refund.setAmount(refundAmount);
            refund.setPaidAmount(BigDecimal.ZERO.setScale(2));
            refund.setRemainingAmount(refundAmount);
            refund.setIssuedAt(now);
            refund.setDueAt(now.plusDays(2));
            refund.setStatus("PENDING");
            refund.setPaymentStatus("PENDING");
            refund.setPaymentMethod("BANK_TRANSFER");
            paymentRepository.save(refund);
        }

        CustomerCancelReservationResponse response = new CustomerCancelReservationResponse();
        response.setSuccess(true);
        response.setRefundEligible(refundAmount.signum() > 0);
        response.setRefundRate(rate);
        response.setRefundAmount(refundAmount);
        response.setForfeitAmount(forfeitedAmount);
        response.setDaysUntilStart(daysUntilStart);
        response.setRefundBankName(bankName != null ? bankName : "");
        response.setRefundAccountNumber(bankAccountNumber != null ? bankAccountNumber : "");
        response.setRefundAccountName(bankAccountName != null ? bankAccountName.toUpperCase() : "");
        response.setMessage(refundAmount.signum() > 0
                ? "Hủy đặt chỗ thành công. Yêu cầu hoàn tiền đang chờ xử lý."
                : "Hủy đặt chỗ thành công. Không ghi nhận tiền cọc DEP đã thu để hoàn.");
        return response;
    }

    private BigDecimal collectedAmount(Payment payment) {
        if (payment.getPaidAmount() != null) {
            return payment.getPaidAmount().max(BigDecimal.ZERO);
        }
        if ("PAID".equalsIgnoreCase(payment.getStatus()) && payment.getAmount() != null) {
            return payment.getAmount().max(BigDecimal.ZERO);
        }
        return BigDecimal.ZERO;
    }

    private String value(String input) {
        if (input == null) return null;
        String value = input.trim();
        return value.isEmpty() ? null : value;
    }
}
