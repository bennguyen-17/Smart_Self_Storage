package com.swp391.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "Reservation")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer reservationId;

    @Column(nullable = false)
    private Integer accountId;

    @Column(nullable = false, length = 50)
    private String unitCode;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, length = 30)
    private String rentalType; // DAILY, MONTHLY

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal rentalAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal penaltyAmount = BigDecimal.ZERO;

    @Column(nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, CONFIRMED, CANCELLED, EXPIRED

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime holdExpiresAt;

    public Reservation() {
    }

    public Reservation(Integer reservationId, Integer accountId, String unitCode, LocalDate startDate, LocalDate endDate, String rentalType, BigDecimal rentalAmount, BigDecimal depositAmount, String status, LocalDateTime createdAt, LocalDateTime holdExpiresAt) {
        this.reservationId = reservationId;
        this.accountId = accountId;
        this.unitCode = unitCode;
        this.startDate = startDate;
        this.endDate = endDate;
        this.rentalType = rentalType;
        this.rentalAmount = rentalAmount;
        this.depositAmount = depositAmount;
        this.status = status;
        this.createdAt = createdAt;
        this.holdExpiresAt = holdExpiresAt;
    }

    public Integer getReservationId() {
        return reservationId;
    }

    public void setReservationId(Integer reservationId) {
        this.reservationId = reservationId;
    }

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    public String getUnitCode() {
        return unitCode;
    }

    public void setUnitCode(String unitCode) {
        this.unitCode = unitCode;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getRentalType() {
        return rentalType;
    }

    public void setRentalType(String rentalType) {
        this.rentalType = rentalType;
    }

    public BigDecimal getRentalAmount() {
        return rentalAmount;
    }

    public void setRentalAmount(BigDecimal rentalAmount) {
        this.rentalAmount = rentalAmount;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public BigDecimal getPenaltyAmount() {
        return penaltyAmount;
    }

    public void setPenaltyAmount(BigDecimal penaltyAmount) {
        this.penaltyAmount = penaltyAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getHoldExpiresAt() {
        return holdExpiresAt;
    }

    public void setHoldExpiresAt(LocalDateTime holdExpiresAt) {
        this.holdExpiresAt = holdExpiresAt;
    }
}
