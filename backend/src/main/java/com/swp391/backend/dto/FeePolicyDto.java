package com.swp391.backend.dto;

import java.math.BigDecimal;

public class FeePolicyDto {
    private Integer policyId;
    private String policyCode;
    private String policyName;
    private String category; // SURCHARGE, PENALTY, DISCOUNT, DAMAGE
    private String calcType; // PERCENT, FIXED
    private BigDecimal feeValue;
    private String unitBasis;
    private String description;
    private Boolean isWaiveDeposit;
    private String status;

    public FeePolicyDto() {
    }

    public FeePolicyDto(Integer policyId, String policyCode, String policyName, String category, String calcType, BigDecimal feeValue, String unitBasis, String description, Boolean isWaiveDeposit, String status) {
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
}
