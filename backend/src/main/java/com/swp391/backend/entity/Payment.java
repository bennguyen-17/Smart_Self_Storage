package com.swp391.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer paymentId;

    @Column(nullable = false)
    private Integer contractId;

    @Column(nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(nullable = false, length = 50)
    private String invoiceType; // DEP, REF, INITIAL_RENTAL (legacy), MONTHLY_RENEWAL, OVERDUE_FEE, INSPECTION_DAMAGE

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    // For DEP, amount is the current invoice total; these track collections and outstanding balance.
    // For non-DEP invoice types, including REF, these values may be null.
    @Column(precision = 12, scale = 2)
    private BigDecimal paidAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal remainingAmount;

    @Column(length = 255)
    private String pdfUrl;

    @Column(nullable = false)
    private LocalDateTime issuedAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime dueAt;

    @Column(nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, PAID, OVERDUE, CANCELLED

    @Column(length = 50)
    private String paymentMethod; // VIETQR, VNPAY, MOMO, BANK_TRANSFER, CASH

    @Column(length = 100)
    private String transactionCode;

    @Column(nullable = false, length = 30)
    private String paymentStatus = "PENDING"; // PENDING, SUCCESS, FAILED

    @Column(length = 100)
    private String gatewayTransactionId;

    private LocalDateTime paidAt;

    public Payment() {
    }

    public Payment(Integer paymentId, Integer contractId, String invoiceNumber, String invoiceType, BigDecimal amount, String pdfUrl, LocalDateTime issuedAt, LocalDateTime dueAt, String status, String paymentMethod, String transactionCode, String paymentStatus, String gatewayTransactionId, LocalDateTime paidAt) {
        this.paymentId = paymentId;
        this.contractId = contractId;
        this.invoiceNumber = invoiceNumber;
        this.invoiceType = invoiceType;
        this.amount = amount;
        this.pdfUrl = pdfUrl;
        this.issuedAt = issuedAt;
        this.dueAt = dueAt;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.transactionCode = transactionCode;
        this.paymentStatus = paymentStatus;
        this.gatewayTransactionId = gatewayTransactionId;
        this.paidAt = paidAt;
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
    }

    public Integer getContractId() {
        return contractId;
    }

    public void setContractId(Integer contractId) {
        this.contractId = contractId;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getInvoiceType() {
        return invoiceType;
    }

    public void setInvoiceType(String invoiceType) {
        this.invoiceType = invoiceType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public BigDecimal getRemainingAmount() {
        return remainingAmount;
    }

    public void setRemainingAmount(BigDecimal remainingAmount) {
        this.remainingAmount = remainingAmount;
    }

    public String getPdfUrl() {
        return pdfUrl;
    }

    public void setPdfUrl(String pdfUrl) {
        this.pdfUrl = pdfUrl;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(LocalDateTime issuedAt) {
        this.issuedAt = issuedAt;
    }

    public LocalDateTime getDueAt() {
        return dueAt;
    }

    public void setDueAt(LocalDateTime dueAt) {
        this.dueAt = dueAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionCode() {
        return transactionCode;
    }

    public void setTransactionCode(String transactionCode) {
        this.transactionCode = transactionCode;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getGatewayTransactionId() {
        return gatewayTransactionId;
    }

    public void setGatewayTransactionId(String gatewayTransactionId) {
        this.gatewayTransactionId = gatewayTransactionId;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }
}
