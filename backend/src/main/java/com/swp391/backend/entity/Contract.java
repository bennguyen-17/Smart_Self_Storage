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

    @Column(length = 255)
    private String pdfUrl;

    private LocalDateTime activatedAt;

    private LocalDateTime terminatedAt;

    @Column(nullable = false, length = 30)
    private String status = "PENDING_CHECKIN"; // BR-21 States: INITIATED, PENDING_CHECKIN, ACTIVE, OVERDUE, TERMINATED, FORFEITED, CANCELED

    public Contract() {
    }

    public Contract(Integer contractId, Integer reservationId, String pdfUrl, LocalDateTime activatedAt, LocalDateTime terminatedAt, String status) {
        this.contractId = contractId;
        this.reservationId = reservationId;
        this.pdfUrl = pdfUrl;
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

    public String getPdfUrl() {
        return pdfUrl;
    }

    public void setPdfUrl(String pdfUrl) {
        this.pdfUrl = pdfUrl;
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
}
