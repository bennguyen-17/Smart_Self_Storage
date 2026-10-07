package com.swp391.backend.repository;

import com.swp391.backend.entity.Payment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findByInvoiceNumber(String invoiceNumber);
    List<Payment> findByContractId(Integer contractId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select payment from Payment payment
            where payment.contractId = :contractId
              and payment.invoiceType = 'DEP'
              and payment.status = 'PARTIALLY_PAID'
            order by payment.paymentId
            """)
    List<Payment> findPartiallyPaidDepByContractIdForUpdate(@Param("contractId") Integer contractId);
}
