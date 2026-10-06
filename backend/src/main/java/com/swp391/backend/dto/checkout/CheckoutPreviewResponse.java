package com.swp391.backend.dto.checkout;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CheckoutPreviewResponse {
    private boolean success;
    private String message;
    private Integer contractId;
    private String contractCode;
    private String unitCode;
    private String branchCode;
    private String contractStatus;

    private LocalDate startDate;
    private LocalDate originalEndDate;
    private LocalDate returnDate;
    private long totalRentalDays;
    private long daysUsed;
    private long daysRemaining;

    private BigDecimal rentalAmountPaid;
    private BigDecimal unusedRentalAmount;
    private BigDecimal unusedRentalRefundAmount; // 50% theo BR-36
    private BigDecimal depositAmount;
    private BigDecimal unpaidPenalties; // Phạt quá hạn chưa nộp theo BR-30
    private BigDecimal damageAndCleaningFee; // Hư hại/vệ sinh theo BR-33

    private BigDecimal totalDeductions;
    private BigDecimal netSettlementAmount; // Số tiền quyết toán cuối cùng
    private boolean isRefund; // true = Hoàn tiền cho khách (REF), false = Khách phải nộp thêm truy thu (CMP)
    private String settlementAction; // "REFUND_PENDING" hoặc "COMPENSATION_REQUIRED"

    public CheckoutPreviewResponse() {
    }

    public static CheckoutPreviewResponse error(String message) {
        CheckoutPreviewResponse resp = new CheckoutPreviewResponse();
        resp.setSuccess(false);
        resp.setMessage(message);
        return resp;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getContractId() {
        return contractId;
    }

    public void setContractId(Integer contractId) {
        this.contractId = contractId;
    }

    public String getContractCode() {
        return contractCode;
    }

    public void setContractCode(String contractCode) {
        this.contractCode = contractCode;
    }

    public String getUnitCode() {
        return unitCode;
    }

    public void setUnitCode(String unitCode) {
        this.unitCode = unitCode;
    }

    public String getBranchCode() {
        return branchCode;
    }

    public void setBranchCode(String branchCode) {
        this.branchCode = branchCode;
    }

    public String getContractStatus() {
        return contractStatus;
    }

    public void setContractStatus(String contractStatus) {
        this.contractStatus = contractStatus;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getOriginalEndDate() {
        return originalEndDate;
    }

    public void setOriginalEndDate(LocalDate originalEndDate) {
        this.originalEndDate = originalEndDate;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public long getTotalRentalDays() {
        return totalRentalDays;
    }

    public void setTotalRentalDays(long totalRentalDays) {
        this.totalRentalDays = totalRentalDays;
    }

    public long getDaysUsed() {
        return daysUsed;
    }

    public void setDaysUsed(long daysUsed) {
        this.daysUsed = daysUsed;
    }

    public long getDaysRemaining() {
        return daysRemaining;
    }

    public void setDaysRemaining(long daysRemaining) {
        this.daysRemaining = daysRemaining;
    }

    public BigDecimal getRentalAmountPaid() {
        return rentalAmountPaid;
    }

    public void setRentalAmountPaid(BigDecimal rentalAmountPaid) {
        this.rentalAmountPaid = rentalAmountPaid;
    }

    public BigDecimal getUnusedRentalAmount() {
        return unusedRentalAmount;
    }

    public void setUnusedRentalAmount(BigDecimal unusedRentalAmount) {
        this.unusedRentalAmount = unusedRentalAmount;
    }

    public BigDecimal getUnusedRentalRefundAmount() {
        return unusedRentalRefundAmount;
    }

    public void setUnusedRentalRefundAmount(BigDecimal unusedRentalRefundAmount) {
        this.unusedRentalRefundAmount = unusedRentalRefundAmount;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public BigDecimal getUnpaidPenalties() {
        return unpaidPenalties;
    }

    public void setUnpaidPenalties(BigDecimal unpaidPenalties) {
        this.unpaidPenalties = unpaidPenalties;
    }

    public BigDecimal getDamageAndCleaningFee() {
        return damageAndCleaningFee;
    }

    public void setDamageAndCleaningFee(BigDecimal damageAndCleaningFee) {
        this.damageAndCleaningFee = damageAndCleaningFee;
    }

    public BigDecimal getTotalDeductions() {
        return totalDeductions;
    }

    public void setTotalDeductions(BigDecimal totalDeductions) {
        this.totalDeductions = totalDeductions;
    }

    public BigDecimal getNetSettlementAmount() {
        return netSettlementAmount;
    }

    public void setNetSettlementAmount(BigDecimal netSettlementAmount) {
        this.netSettlementAmount = netSettlementAmount;
    }

    public boolean isRefund() {
        return isRefund;
    }

    public void setRefund(boolean refund) {
        isRefund = refund;
    }

    public String getSettlementAction() {
        return settlementAction;
    }

    public void setSettlementAction(String settlementAction) {
        this.settlementAction = settlementAction;
    }
}
