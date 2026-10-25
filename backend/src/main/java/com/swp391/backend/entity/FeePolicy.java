package com.swp391.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "FeePolicy")
public class FeePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer policyId;

    @Column(nullable = false, length = 50, unique = true)
    private String policyCode;

    @Column(nullable = false, length = 150)
    private String policyName;

    @Column(nullable = false, length = 50)
    private String category; // SURCHARGE, PENALTY, DISCOUNT

    @Column(nullable = false, length = 20)
    private String calcType; // PERCENT, FIXED

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal feeValue;

    @Column(nullable = false, length = 50)
    private String unitBasis = "TOTAL_BILL";

    @Column(length = 255)
    private String description;

    @Column(name = "isWaiveDeposit")
    private Boolean isWaiveDeposit = false;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = "ACTIVE";
        if (this.isWaiveDeposit == null) this.isWaiveDeposit = false;
        if (this.unitBasis == null) this.unitBasis = "TOTAL_BILL";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public FeePolicy() {
    }

    public FeePolicy(Integer policyId, String policyCode, String policyName, String category, String calcType, BigDecimal feeValue, String unitBasis, String description, Boolean isWaiveDeposit, String status) {
        this.policyId = policyId;
        this.policyCode = policyCode;
        this.policyName = policyName;
        this.category = category;
        this.calcType = calcType;
        this.feeValue = feeValue;
        this.unitBasis = unitBasis;
        this.description = description;
        this.isWaiveDeposit = isWaiveDeposit;
        this.status = status;
    }

    public Integer getPolicyId() {
        return policyId;
    }

    public void setPolicyId(Integer policyId) {
        this.policyId = policyId;
    }

    public String getPolicyCode() {
        return policyCode;
    }

    public void setPolicyCode(String policyCode) {
        this.policyCode = policyCode;
    }

    public String getPolicyName() {
        return policyName;
    }

    public void setPolicyName(String policyName) {
        this.policyName = policyName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getCalcType() {
        return calcType;
    }

    public void setCalcType(String calcType) {
        this.calcType = calcType;
    }

    public BigDecimal getFeeValue() {
        return feeValue;
    }

    public void setFeeValue(BigDecimal feeValue) {
        this.feeValue = feeValue;
    }

    public String getUnitBasis() {
        return unitBasis;
    }

    public void setUnitBasis(String unitBasis) {
        this.unitBasis = unitBasis;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsWaiveDeposit() {
        return isWaiveDeposit;
    }

    public void setIsWaiveDeposit(Boolean isWaiveDeposit) {
        this.isWaiveDeposit = isWaiveDeposit;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
