package com.swp391.backend.repository;

import com.swp391.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findByInvoiceNumber(String invoiceNumber);
    List<Payment> findByContractId(Integer contractId);
}
