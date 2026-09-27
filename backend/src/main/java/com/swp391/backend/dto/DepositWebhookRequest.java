package com.swp391.backend.dto;

public class DepositWebhookRequest {
    private String invoiceNumber;
    private String transactionCode;
    private String paymentMethod; // VIETQR, VNPAY, MOMO
    private String gatewayTransactionId;

    public DepositWebhookRequest() {
    }

    public DepositWebhookRequest(String invoiceNumber, String transactionCode, String paymentMethod, String gatewayTransactionId) {
        this.invoiceNumber = invoiceNumber;
        this.transactionCode = transactionCode;
        this.paymentMethod = paymentMethod;
        this.gatewayTransactionId = gatewayTransactionId;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getTransactionCode() {
        return transactionCode;
    }

    public void setTransactionCode(String transactionCode) {
        this.transactionCode = transactionCode;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getGatewayTransactionId() {
        return gatewayTransactionId;
    }

    public void setGatewayTransactionId(String gatewayTransactionId) {
        this.gatewayTransactionId = gatewayTransactionId;
    }
}
