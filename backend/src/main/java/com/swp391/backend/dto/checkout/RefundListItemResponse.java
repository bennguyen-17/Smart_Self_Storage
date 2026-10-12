package com.swp391.backend.dto.checkout;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RefundListItemResponse {

    private Integer paymentId;
    private String invoiceNumber;
    private Integer contractId;
    private String reservationCode;
    private String unitCode;
    private String customerName;
    private String customerPhone;
    private BigDecimal refundAmount;
    private String refundBankName;
    private String refundAccountNumber;
    private String refundAccountName;
    private String cancelReason;
    private String status;
    private LocalDateTime issuedAt;

    public RefundListItemResponse() {
    }

    public RefundListItemResponse(Integer paymentId, String invoiceNumber, Integer contractId, String reservationCode,
                                  String unitCode, String customerName, String customerPhone, BigDecimal refundAmount,
                                  String refundBankName, String refundAccountNumber, String refundAccountName,
                                  String cancelReason, String status, LocalDateTime issuedAt) {
        this.paymentId = paymentId;
        this.invoiceNumber = invoiceNumber;
        this.contractId = contractId;
        this.reservationCode = reservationCode;
        this.unitCode = unitCode;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.refundAmount = refundAmount;
        this.refundBankName = refundBankName;
        this.refundAccountNumber = refundAccountNumber;
        this.refundAccountName = refundAccountName;
        this.cancelReason = cancelReason;
        this.status = status;
        this.issuedAt = issuedAt;
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public Integer getContractId() {
        return contractId;
    }

    public void setContractId(Integer contractId) {
        this.contractId = contractId;
    }

    public String getReservationCode() {
        return reservationCode;
    }

    public void setReservationCode(String reservationCode) {
        this.reservationCode = reservationCode;
    }

    public String getUnitCode() {
        return unitCode;
    }

    public void setUnitCode(String unitCode) {
        this.unitCode = unitCode;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
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

    public String getCancelReason() {
        return cancelReason;
    }

    public void setCancelReason(String cancelReason) {
        this.cancelReason = cancelReason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(LocalDateTime issuedAt) {
        this.issuedAt = issuedAt;
    }
}
