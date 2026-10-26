package com.swp391.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Contract")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer contractId;

    @Column(nullable = false, unique = true)
    private Integer reservationId;

    private LocalDateTime activatedAt;

    private LocalDateTime terminatedAt;

    @Column(nullable = false, length = 30)
    private String status = "PENDING_CHECKIN"; // States: INITIATED, PENDING_CHECKIN, ACTIVE, OVERDUE, TERMINATED, COMPLETED, FORFEITED, CANCELLED

    @Column(name = "forfeitProcessed", nullable = false)
    private boolean forfeitProcessed = false;

    @Column(length = 50)
    private String cancelReason; // NO_SHOW, CUSTOMER_REQUEST, VIOLATION, EARLY_TERMINATION

    @Column(length = 100)
    private String refundBankName;

    @Column(length = 50)
    private String refundAccountNumber;

    @Column(length = 100)
    private String refundAccountName;

    public Contract() {
    }

    public Contract(Integer contractId, Integer reservationId, LocalDateTime activatedAt, LocalDateTime terminatedAt, String status) {
        this.contractId = contractId;
        this.reservationId = reservationId;
        this.activatedAt = activatedAt;
        this.terminatedAt = terminatedAt;
        this.status = status;
    }

    public Integer getContractId() {
        return contractId;
    }

    public void setContractId(Integer contractId) {
        this.contractId = contractId;
    }

    public Integer getReservationId() {
        return reservationId;
    }

    public void setReservationId(Integer reservationId) {
        this.reservationId = reservationId;
    }



    public LocalDateTime getActivatedAt() {
        return activatedAt;
    }

    public void setActivatedAt(LocalDateTime activatedAt) {
        this.activatedAt = activatedAt;
    }

    public LocalDateTime getTerminatedAt() {
        return terminatedAt;
    }

    public void setTerminatedAt(LocalDateTime terminatedAt) {
        this.terminatedAt = terminatedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isForfeitProcessed() {
        return forfeitProcessed;
    }

    public void setForfeitProcessed(boolean forfeitProcessed) {
        this.forfeitProcessed = forfeitProcessed;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public void setCancelReason(String cancelReason) {
        this.cancelReason = cancelReason;
    }

    public String getRefundBankName() {
        return refundBankName;
    }

    public void setRefundBankName(String refundBankName) {
        this.refundBankName = refundBankName;
    }

    public String getRefundAccountNumber() {
        return refundAccountNumber;
    }

    public void setRefundAccountNumber(String refundAccountNumber) {
        this.refundAccountNumber = refundAccountNumber;
    }

    public String getRefundAccountName() {
        return refundAccountName;
    }

    public void setRefundAccountName(String refundAccountName) {
        this.refundAccountName = refundAccountName;
    }
}
