package com.swp391.backend.repository;

import com.swp391.backend.entity.Payment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findByInvoiceNumber(String invoiceNumber);
    List<Payment> findByContractId(Integer contractId);
    List<Payment> findByContractIdIn(List<Integer> contractIds);
    List<Payment> findByInvoiceType(String invoiceType);
    List<Payment> findByInvoiceTypeAndStatus(String invoiceType, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select payment from Payment payment
            where payment.contractId = :contractId
              and payment.invoiceType = 'DEP'
              and payment.status = 'PARTIALLY_PAID'
            order by payment.paymentId
            """)
    List<Payment> findPartiallyPaidDepByContractIdForUpdate(@Param("contractId") Integer contractId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select payment from Payment payment
            where payment.contractId = :contractId
              and (payment.invoiceType = 'DEP' or payment.invoiceType = 'INITIAL_RENTAL')
            order by payment.paymentId desc
            """)
    List<Payment> findDepositInvoicesForUpdate(@Param("contractId") Integer contractId);
}
