package com.swp391.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Price")
public class Price {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer priceId;

    @Column(nullable = false)
    private Integer unitTypeId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal dailyPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount;

    @Column(precision = 5, scale = 2)
    private BigDecimal climateSurchargePercent = BigDecimal.ZERO;

    @Column(nullable = false)
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;

    @Column(nullable = false, length = 30)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    public Price() {
    }

    public Price(Integer priceId, Integer unitTypeId, BigDecimal dailyPrice, BigDecimal monthlyPrice, BigDecimal depositAmount, BigDecimal climateSurchargePercent, LocalDate effectiveFrom, LocalDate effectiveTo, String status) {
        this.priceId = priceId;
        this.unitTypeId = unitTypeId;
        this.dailyPrice = dailyPrice;
        this.monthlyPrice = monthlyPrice;
        this.depositAmount = depositAmount;
        this.climateSurchargePercent = climateSurchargePercent;
        this.effectiveFrom = effectiveFrom;
        this.effectiveTo = effectiveTo;
        this.status = status;
    }

    public Integer getPriceId() {
        return priceId;
    }

    public void setPriceId(Integer priceId) {
        this.priceId = priceId;
    }

    public Integer getUnitTypeId() {
        return unitTypeId;
    }

    public void setUnitTypeId(Integer unitTypeId) {
        this.unitTypeId = unitTypeId;
    }

    public BigDecimal getDailyPrice() {
        return dailyPrice;
    }

    public void setDailyPrice(BigDecimal dailyPrice) {
        this.dailyPrice = dailyPrice;
    }

    public BigDecimal getMonthlyPrice() {
        return monthlyPrice;
    }

    public void setMonthlyPrice(BigDecimal monthlyPrice) {
        this.monthlyPrice = monthlyPrice;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public BigDecimal getClimateSurchargePercent() {
        return climateSurchargePercent;
    }

    public void setClimateSurchargePercent(BigDecimal climateSurchargePercent) {
        this.climateSurchargePercent = climateSurchargePercent;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
