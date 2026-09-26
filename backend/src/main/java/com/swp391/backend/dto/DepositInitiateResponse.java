package com.swp391.backend.dto;

import java.math.BigDecimal;

public class DepositInitiateResponse {
    private boolean success;
    private String message;
    private Integer reservationId;
    private String reservationCode; // BR-15: RES-HN01-3456-X9K2
    private Integer contractId;
    private String contractDraftUrl; // BR-18: Hợp đồng dự thảo
    private Integer paymentId;
    private String invoiceNumber; // BR-37: DEP-HN01-20260927-4719
    private BigDecimal depositAmount; // BR-16: 100% tiền cọc
    private BigDecimal rentalAmount;
    private String vietQrUrl; // Link ảnh QR thanh toán VietQR
    private String bankAccount;
    private String bankName;
    private String accountHolder;
    private String transferContent;

    public DepositInitiateResponse() {
    }

    public static DepositInitiateResponse error(String message) {
        DepositInitiateResponse res = new DepositInitiateResponse();
        res.setSuccess(false);
        res.setMessage(message);
        return res;
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

    public Integer getReservationId() {
        return reservationId;
    }

    public void setReservationId(Integer reservationId) {
        this.reservationId = reservationId;
    }

    public String getReservationCode() {
        return reservationCode;
    }

    public void setReservationCode(String reservationCode) {
        this.reservationCode = reservationCode;
    }

    public Integer getContractId() {
        return contractId;
    }

    public void setContractId(Integer contractId) {
        this.contractId = contractId;
    }

    public String getContractDraftUrl() {
        return contractDraftUrl;
    }

    public void setContractDraftUrl(String contractDraftUrl) {
        this.contractDraftUrl = contractDraftUrl;
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

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public BigDecimal getRentalAmount() {
        return rentalAmount;
    }

    public void setRentalAmount(BigDecimal rentalAmount) {
        this.rentalAmount = rentalAmount;
    }

    public String getVietQrUrl() {
        return vietQrUrl;
    }

    public void setVietQrUrl(String vietQrUrl) {
        this.vietQrUrl = vietQrUrl;
    }

    public String getBankAccount() {
        return bankAccount;
    }

    public void setBankAccount(String bankAccount) {
        this.bankAccount = bankAccount;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getAccountHolder() {
        return accountHolder;
    }

    public void setAccountHolder(String accountHolder) {
        this.accountHolder = accountHolder;
    }

    public String getTransferContent() {
        return transferContent;
    }

    public void setTransferContent(String transferContent) {
        this.transferContent = transferContent;
    }
}
