package com.swp391.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CustomerInvoiceResponse {
    private Integer paymentId;
    private String invoiceNumber;
    private String invoiceType;
    private String typeName;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private String status;
    private String paymentMethod;
    private String transactionCode;
    private LocalDateTime issuedAt;
    private LocalDateTime dueAt;
    private LocalDateTime paidAt;
    private String contractCode;
    private String unitCode;

    public CustomerInvoiceResponse() {}

    public Integer getPaymentId() { return paymentId; }
    public void setPaymentId(Integer paymentId) { this.paymentId = paymentId; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public String getInvoiceType() { return invoiceType; }
    public void setInvoiceType(String invoiceType) { this.invoiceType = invoiceType; }

    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    public BigDecimal getRemainingAmount() { return remainingAmount; }
    public void setRemainingAmount(BigDecimal remainingAmount) { this.remainingAmount = remainingAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionCode() { return transactionCode; }
    public void setTransactionCode(String transactionCode) { this.transactionCode = transactionCode; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }

    public LocalDateTime getDueAt() { return dueAt; }
    public void setDueAt(LocalDateTime dueAt) { this.dueAt = dueAt; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public String getContractCode() { return contractCode; }
    public void setContractCode(String contractCode) { this.contractCode = contractCode; }

    public String getUnitCode() { return unitCode; }
    public void setUnitCode(String unitCode) { this.unitCode = unitCode; }
}
