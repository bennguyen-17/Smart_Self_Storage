package com.swp391.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gatepin")
public class GatePin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer gatePinId;

    @Column(nullable = false)
    private Integer contractId;

    @Column(nullable = false, length = 6)
    private String pinCode;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, EXPIRED, REVOKED

    private LocalDateTime generatedAt = LocalDateTime.now();

    private LocalDateTime expiresAt;

    public GatePin() {
    }

    public GatePin(Integer contractId, String pinCode, String status, LocalDateTime generatedAt, LocalDateTime expiresAt) {
        this.contractId = contractId;
        this.pinCode = pinCode;
        this.status = status;
        this.generatedAt = generatedAt;
        this.expiresAt = expiresAt;
    }

    public Integer getGatePinId() {
        return gatePinId;
    }

    public void setGatePinId(Integer gatePinId) {
        this.gatePinId = gatePinId;
    }

    public Integer getContractId() {
        return contractId;
    }

    public void setContractId(Integer contractId) {
        this.contractId = contractId;
    }

    public String getPinCode() {
        return pinCode;
    }

    public void setPinCode(String pinCode) {
        this.pinCode = pinCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
