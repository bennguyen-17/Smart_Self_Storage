package com.swp391.backend.dto.checkout;

import java.math.BigDecimal;

public class CheckoutConfirmRequest {
    private BigDecimal damageFee = BigDecimal.ZERO;
    private BigDecimal cleaningFee = BigDecimal.ZERO;
    private String inspectionNotes;
    private Integer ticketId;
    private String refundPaymentMethod = "BANK_TRANSFER";
    private boolean confirmInspection; // Bắt buộc phải tích xác nhận biên bản nghiệm thu
    private boolean collectedCompensation; // Xác nhận nhân viên đã thu đủ tiền bồi thường cọc âm tại quầy

    public CheckoutConfirmRequest() {
    }

    public BigDecimal getDamageFee() {
        return damageFee != null ? damageFee : BigDecimal.ZERO;
    }

    public void setDamageFee(BigDecimal damageFee) {
        this.damageFee = damageFee;
    }

    public BigDecimal getCleaningFee() {
        return cleaningFee != null ? cleaningFee : BigDecimal.ZERO;
    }

    public void setCleaningFee(BigDecimal cleaningFee) {
        this.cleaningFee = cleaningFee;
    }

    public String getInspectionNotes() {
        return inspectionNotes;
    }

    public void setInspectionNotes(String inspectionNotes) {
        this.inspectionNotes = inspectionNotes;
    }

    public Integer getTicketId() {
        return ticketId;
    }

    public void setTicketId(Integer ticketId) {
        this.ticketId = ticketId;
    }

    public String getRefundPaymentMethod() {
        return refundPaymentMethod;
    }

    public void setRefundPaymentMethod(String refundPaymentMethod) {
        this.refundPaymentMethod = refundPaymentMethod;
    }

    public boolean isConfirmInspection() {
        return confirmInspection;
    }

    public void setConfirmInspection(boolean confirmInspection) {
        this.confirmInspection = confirmInspection;
    }

    public boolean isCollectedCompensation() {
        return collectedCompensation;
    }

    public void setCollectedCompensation(boolean collectedCompensation) {
        this.collectedCompensation = collectedCompensation;
    }
}
